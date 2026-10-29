import { ConflictError, NotFoundError } from "@/modules/shared/domain/errors";
import type { IdentifierGenerator } from "@/modules/shared/domain/identifier";
import type { RelationalDatabase } from "@/modules/shared/infrastructure/database/sqlite-database";
import {z} from 'zod';

export type ApplicationStage = "considering" | "planning" | "writing" | "review" | "submitted" | "accepted" | "rejected" | "withdrawn";

export class ApplicationService {
  constructor(private readonly database: RelationalDatabase, private readonly identifiers: IdentifierGenerator) {}

  start(input: { userId: string; opportunityId: string; workspaceId?: string | null; internalDeadline?: string | null }) {
    return this.database.transaction(() => {
      if (!this.database.prepare("SELECT id FROM opportunities WHERE id = ? AND status = 'published'").get(input.opportunityId)) throw new NotFoundError("Fırsat");
      if (input.workspaceId && !this.database.prepare("SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?").get(input.workspaceId, input.userId)) throw new ConflictError("Bu çalışma alanında başvuru oluşturamazsınız.");
      const existing = input.workspaceId
        ? this.database.prepare("SELECT id,version,deleted_at FROM application_workspaces WHERE workspace_id = ? AND opportunity_id = ?").get(input.workspaceId, input.opportunityId) as { id: string;version:number;deleted_at:string|null } | undefined
        : this.database.prepare("SELECT id,version,deleted_at FROM application_workspaces WHERE workspace_id IS NULL AND owner_user_id = ? AND opportunity_id = ?").get(input.userId, input.opportunityId) as { id: string;version:number;deleted_at:string|null } | undefined;
      if (existing){if(existing.deleted_at)this.change(input.userId,existing.id,existing.version,'restore');return { id: existing.id, created: false };}
      const id = this.identifiers.next();
      this.database.prepare("INSERT INTO application_workspaces(id, opportunity_id, workspace_id, owner_user_id, internal_deadline) VALUES (?, ?, ?, ?, ?)").run(id, input.opportunityId, input.workspaceId ?? null, input.userId, input.internalDeadline ?? null);
      this.database.prepare("INSERT INTO application_members(application_id, user_id, role) VALUES (?, ?, 'lead')").run(id, input.userId);
      this.database.prepare("INSERT INTO outbox_events(id, aggregate_type, aggregate_id, event_type, payload_json) VALUES (?, 'application', ?, 'application.started', ?)").run(this.identifiers.next(), id, JSON.stringify({ applicationId: id, opportunityId: input.opportunityId, userId: input.userId }));
      this.database.prepare("INSERT INTO audit_logs(id, actor_user_id, action, entity_type, entity_id) VALUES (?, ?, 'application.start', 'application', ?)").run(this.identifiers.next(), input.userId, id);
      return { id, created: true };
    });
  }

  move(input: { applicationId: string; userId: string; stage: ApplicationStage; expectedVersion: number }) {
    const result = this.database.prepare(`UPDATE application_workspaces SET stage = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND version = ? AND EXISTS (SELECT 1 FROM application_members am WHERE am.application_id = application_workspaces.id AND am.user_id = ?)`).run(input.stage, input.applicationId, input.expectedVersion, input.userId);
    if (Number(result.changes) === 0) throw new ConflictError("Başvuru başka bir işlem tarafından güncellendi. Sayfayı yenileyin.");
  }
  change(userId:string,id:string,version:number,command:'trash'|'restore'|'deadline',deadline=''){
    return this.database.transaction(()=>{
      if(!this.database.prepare("SELECT 1 FROM application_members WHERE application_id=? AND user_id=? AND role='lead'").get(id,userId))throw new ConflictError('Bu hazırlık alanını yalnızca sorumlusu değiştirebilir.');
      const date=command==='deadline'?(deadline?z.iso.date().parse(deadline):null):null;
      const result=command==='deadline'?this.database.prepare('UPDATE application_workspaces SET internal_deadline=?,version=version+1,updated_at=CURRENT_TIMESTAMP WHERE id=? AND version=? AND deleted_at IS NULL').run(date,id,version):this.database.prepare('UPDATE application_workspaces SET deleted_at=?,version=version+1,updated_at=CURRENT_TIMESTAMP WHERE id=? AND version=?').run(command==='trash'?new Date().toISOString():null,id,version);
      if(!result.changes)throw new ConflictError('Hazırlık alanı değişti. Sayfayı yenileyin.');
      this.database.prepare("INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id) VALUES(?,?,?,'application',?)").run(this.identifiers.next(),userId,'application.'+command,id);
    });
  }
}
