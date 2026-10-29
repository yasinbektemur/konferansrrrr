import { AuthorizationError, ConflictError, NotFoundError, ValidationError } from "@/modules/shared/domain/errors";
import type { IdentifierGenerator } from "@/modules/shared/domain/identifier";
import type { RelationalDatabase } from "@/modules/shared/infrastructure/database/sqlite-database";
import type { UserRole, UserStatus } from "@/modules/identity/domain/user";

export class UserAdministrationService {
  constructor(private readonly database: RelationalDatabase, private readonly ids: IdentifierGenerator) {}

  changeStatus(input: { actorId: string; targetId: string; status: UserStatus; reason?: string }) {
    this.authorize(input.actorId);
    if (!new Set<UserStatus>(["active", "suspended"]).has(input.status)) throw new ValidationError("Geçersiz hesap durumu.");
    this.database.transaction(() => {
      const target = this.user(input.targetId);
      if (target.role === "owner" && input.status === "suspended") throw new AuthorizationError("Sistem sahibi askıya alınamaz.");
      if (input.actorId === input.targetId && input.status === "suspended") throw new ConflictError("Kendi hesabınızı askıya alamazsınız.");
      this.database.prepare("UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(input.status, input.targetId);
      if (input.status === "suspended") this.database.prepare("UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = ? AND revoked_at IS NULL").run(input.targetId);
      this.audit(input.actorId, `user.${input.status}`, input.targetId, { reason: input.reason?.trim() || null });
    });
  }

  changeRole(input: { actorId: string; targetId: string; role: UserRole }) {
    this.authorize(input.actorId);
    if (!new Set<UserRole>(["user", "curator", "admin"]).has(input.role)) throw new ValidationError("Bu rol arayüzden atanamaz.");
    this.database.transaction(() => {
      const target = this.user(input.targetId);
      if (target.role === "owner") throw new AuthorizationError("Sistem sahibi rolü değiştirilemez.");
      this.database.prepare("UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(input.role, input.targetId);
      this.audit(input.actorId, "user.role_changed", input.targetId, { previousRole: target.role, nextRole: input.role });
    });
  }

  revokeSessions(actorId: string, targetId: string) {
    this.authorize(actorId);
    this.user(targetId);
    const result = this.database.prepare("UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = ? AND revoked_at IS NULL").run(targetId);
    this.audit(actorId, "user.sessions_revoked", targetId, { sessionCount: Number(result.changes) });
  }

  addNote(input: { actorId: string; targetId: string; body: string }) {
    this.authorize(input.actorId);
    const body = input.body.trim();
    if (!body || body.length > 2000) throw new ValidationError("Yönetici notu 1–2000 karakter olmalıdır.");
    this.user(input.targetId);
    this.database.transaction(() => {
      this.database.prepare("INSERT INTO user_admin_notes(id, user_id, author_user_id, body) VALUES (?, ?, ?, ?)").run(this.ids.next(), input.targetId, input.actorId, body);
      this.audit(input.actorId, "user.note_added", input.targetId, { length: body.length });
    });
  }

  private user(id: string) {
    const row = this.database.prepare("SELECT id, role, status FROM users WHERE id = ?").get(id) as { id: string; role: UserRole; status: UserStatus } | undefined;
    if (!row) throw new NotFoundError("Kullanıcı");
    return row;
  }

  private authorize(actorId:string) {
    const actor=this.user(actorId);
    if(actor.status!=="active"||!["admin","owner"].includes(actor.role))throw new AuthorizationError();
  }

  private audit(actorId: string, action: string, targetId: string, metadata: Record<string, unknown>) {
    this.database.prepare("INSERT INTO audit_logs(id, actor_user_id, action, entity_type, entity_id, metadata_json) VALUES (?, ?, ?, 'user', ?, ?)").run(this.ids.next(), actorId, action, targetId, JSON.stringify(metadata));
  }
}
