import { z } from "zod";
import {AuthorizationError,ConflictError} from '@/modules/shared/domain/errors';
import type { IdentifierGenerator } from "@/modules/shared/domain/identifier";
import type { RelationalDatabase } from "@/modules/shared/infrastructure/database/sqlite-database";
import { SqliteJsonCache } from "@/modules/shared/infrastructure/cache/sqlite-json-cache";

const inputSchema = z.object({
  title: z.string().trim().min(5).max(240),
  type: z.enum(["conference", "workshop", "grant", "fellowship", "competition", "fair", "special_issue", "award"]),
  summary: z.string().trim().min(10).max(600),
  description: z.string().trim().min(10),
  officialUrl: z.url(),
  deadline: z.string().min(8),
  deadlineLabel: z.string().trim().min(2),
  confidenceScore: z.coerce.number().int().min(0).max(100),
});
export type AdminOpportunityInput = z.input<typeof inputSchema>;

export class OpportunityAdminService {
  constructor(private readonly database: RelationalDatabase, private readonly ids: IdentifierGenerator) {}

  create(input: AdminOpportunityInput, actorUserId: string, idempotencyKey: string) {
    const parsed = inputSchema.parse(input);
    return this.database.transaction(() => {
      const prior = this.database.prepare("SELECT response_json FROM idempotency_keys WHERE key = ? AND scope = 'admin.opportunity.create'").get(idempotencyKey) as { response_json: string } | undefined;
      if (prior?.response_json) return JSON.parse(prior.response_json) as { id: string; created: boolean };

      const id = this.ids.next();
      this.database.prepare(`
        INSERT INTO opportunities(id, slug, source_id, type, title, summary, description, status, attendance_mode, official_url, trust_level, confidence_score, published_at)
        VALUES (?, ?, 'source-demo', ?, ?, ?, ?, 'published', 'not_applicable', ?, 'verified', ?, CURRENT_TIMESTAMP)
      `).run(id, this.uniqueSlug(parsed.title), parsed.type, parsed.title, parsed.summary, parsed.description, parsed.officialUrl, parsed.confidenceScore);
      this.database.prepare("INSERT INTO deadlines(id, opportunity_id, kind, label, due_at, source_url) VALUES (?, ?, 'application', ?, ?, ?)").run(this.ids.next(), id, parsed.deadlineLabel, parsed.deadline, parsed.officialUrl);
      this.database.prepare("INSERT INTO audit_logs(id, actor_user_id, action, entity_type, entity_id, metadata_json) VALUES (?, ?, 'opportunity.create', 'opportunity', ?, ?)").run(this.ids.next(), actorUserId, id, JSON.stringify({ after: parsed }));
      this.database.prepare("INSERT INTO outbox_events(id, aggregate_type, aggregate_id, event_type, payload_json) VALUES (?, 'opportunity', ?, 'opportunity.published', ?)").run(this.ids.next(), id, JSON.stringify({ id }));
      const response = { id, created: true };
      this.database.prepare("INSERT INTO idempotency_keys(key, scope, request_hash, response_json, status, expires_at) VALUES (?, 'admin.opportunity.create', 'form-v1', ?, 'completed', datetime('now', '+1 day'))").run(idempotencyKey, JSON.stringify(response));
      new SqliteJsonCache(this.database).invalidate("opportunity-facets");
      return response;
    });
  }

  update(id:string,input:unknown,actorId:string,version:number){
    const parsed=inputSchema.extend({deadline:z.iso.date(),officialUrl:z.url().refine(v=>['http:','https:'].includes(new URL(v).protocol))}).parse(input);
    return this.database.transaction(()=>{
      const actor=this.database.prepare("SELECT role FROM users WHERE id=? AND status='active'").get(actorId) as {role:string}|undefined;
      if(!actor||!['owner','admin','curator'].includes(actor.role))throw new AuthorizationError();
      if(this.database.prepare('SELECT 1 FROM institutional_listings WHERE opportunity_id=?').get(id))throw new ConflictError('Kurum ilanlarını kurum çalışma alanından düzenleyin.');
      const result=this.database.prepare('UPDATE opportunities SET title=?,type=?,summary=?,description=?,official_url=?,confidence_score=?,version=version+1,updated_at=CURRENT_TIMESTAMP WHERE id=? AND version=? AND deleted_at IS NULL').run(parsed.title,parsed.type,parsed.summary,parsed.description,parsed.officialUrl,parsed.confidenceScore,id,version);
      if(!result.changes)throw new ConflictError('İlan değişti veya çöp kutusunda. Sayfayı yenileyin.');
      const deadline=this.database.prepare("SELECT id FROM deadlines WHERE opportunity_id=? AND kind='application' ORDER BY due_at LIMIT 1").get(id) as {id:string}|undefined;
      if(deadline)this.database.prepare('UPDATE deadlines SET due_at=?,label=?,source_url=? WHERE id=?').run(parsed.deadline,parsed.deadlineLabel,parsed.officialUrl,deadline.id);
      else this.database.prepare("INSERT INTO deadlines(id,opportunity_id,kind,label,due_at,source_url) VALUES(?,?,'application',?,?,?)").run(this.ids.next(),id,parsed.deadlineLabel,parsed.deadline,parsed.officialUrl);
      this.database.prepare("INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id) VALUES(?,?,'opportunity.update','opportunity',?)").run(this.ids.next(),actorId,id);
      new SqliteJsonCache(this.database).invalidate('opportunity-facets');return version+1;
    });
  }

  private uniqueSlug(title: string) {
    const base = title.toLocaleLowerCase("tr").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 70) || "firsat";
    let slug = base, suffix = 2;
    while (this.database.prepare("SELECT 1 FROM opportunities WHERE slug = ?").get(slug)) slug = `${base}-${suffix++}`;
    return slug;
  }
}
