import type { RelationalDatabase, SqlValue } from "@/modules/shared/infrastructure/database/sqlite-database";

export class UserAdminQueries {
  constructor(private readonly database: RelationalDatabase) {}

  list(input: { search?: string; role?: string; status?: string; page?: number; pageSize?: number }) {
    const page = Math.max(1, input.page ?? 1), pageSize = Math.min(50, Math.max(1, input.pageSize ?? 20));
    const where = ["1 = 1"], params: SqlValue[] = [];
    if (input.search?.trim()) { where.push("(u.display_name LIKE ? OR u.email LIKE ?)"); const q = `%${input.search.trim()}%`; params.push(q, q); }
    if (input.role) { where.push("u.role = ?"); params.push(input.role); }
    if (input.status) { where.push("u.status = ?"); params.push(input.status); }
    const clause = where.join(" AND ");
    const total = Number((this.database.prepare(`SELECT COUNT(*) count FROM users u WHERE ${clause}`).get(...params) as { count: number }).count);
    const items = this.database.prepare(`
      SELECT u.id, u.email, u.display_name, u.role, u.status, u.created_at,
        (SELECT MAX(s.created_at) FROM sessions s WHERE s.user_id = u.id) last_login_at,
        (SELECT COUNT(*) FROM follows f WHERE f.user_id = u.id) follow_count,
        (SELECT COUNT(*) FROM application_members am WHERE am.user_id = u.id) application_count,
        (SELECT COUNT(*) FROM sessions s WHERE s.user_id = u.id AND s.revoked_at IS NULL AND s.expires_at > CURRENT_TIMESTAMP) active_session_count
      FROM users u WHERE ${clause} ORDER BY u.created_at DESC LIMIT ? OFFSET ?
    `).all(...params, pageSize, (page - 1) * pageSize) as Array<Record<string, unknown>>;
    return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  }

  detail(userId: string) {
    const user = this.database.prepare(`
      SELECT u.id,u.email,u.display_name,u.role,u.status,u.created_at,u.updated_at,
        (SELECT MAX(s.created_at) FROM sessions s WHERE s.user_id=u.id) last_login_at,
        (SELECT COUNT(*) FROM sessions s WHERE s.user_id=u.id AND s.revoked_at IS NULL AND s.expires_at>CURRENT_TIMESTAMP) active_sessions,
        (SELECT COUNT(*) FROM follows f WHERE f.user_id=u.id) follow_count,
        (SELECT COUNT(*) FROM application_members am WHERE am.user_id=u.id) application_count
      FROM users u WHERE u.id=?
    `).get(userId) as Record<string, unknown> | undefined;
    if (!user) return null;
    const applications = this.database.prepare(`SELECT aw.id,aw.stage,aw.internal_deadline,aw.updated_at,o.id opportunity_id,o.title,o.type FROM application_members am JOIN application_workspaces aw ON aw.id=am.application_id JOIN opportunities o ON o.id=aw.opportunity_id WHERE am.user_id=? ORDER BY aw.updated_at DESC`).all(userId) as Array<Record<string, unknown>>;
    const follows = this.database.prepare(`SELECT o.id,o.title,o.type,f.created_at FROM follows f JOIN opportunities o ON o.id=f.opportunity_id WHERE f.user_id=? ORDER BY f.created_at DESC LIMIT 25`).all(userId) as Array<Record<string, unknown>>;
    const activity = this.database.prepare(`SELECT a.id,a.action,a.entity_type,a.entity_id,a.metadata_json,a.created_at FROM audit_logs a WHERE a.actor_user_id=? OR (a.entity_type='user' AND a.entity_id=?) ORDER BY a.created_at DESC LIMIT 50`).all(userId,userId) as Array<Record<string, unknown>>;
    const sessions = this.database.prepare(`SELECT id,user_agent,created_at,expires_at,revoked_at FROM sessions WHERE user_id=? ORDER BY created_at DESC LIMIT 20`).all(userId) as Array<Record<string, unknown>>;
    const notes = this.database.prepare(`SELECT n.id,n.body,n.created_at,u.display_name author_name FROM user_admin_notes n LEFT JOIN users u ON u.id=n.author_user_id WHERE n.user_id=? ORDER BY n.created_at DESC`).all(userId) as Array<Record<string, unknown>>;
    return { user, applications, follows, activity, sessions, notes };
  }

  audit(input: { action?: string; actor?: string; page?: number }) {
    const page=Math.max(1,input.page??1),where=["1=1"],params:SqlValue[]=[];
    if(input.action?.trim()){where.push("a.action LIKE ?");params.push(`%${input.action.trim()}%`)}
    if(input.actor?.trim()){where.push("(u.display_name LIKE ? OR u.email LIKE ?)");const q=`%${input.actor.trim()}%`;params.push(q,q)}
    const clause=where.join(" AND "),pageSize=30,total=Number((this.database.prepare(`SELECT COUNT(*) count FROM audit_logs a LEFT JOIN users u ON u.id=a.actor_user_id WHERE ${clause}`).get(...params) as {count:number}).count);
    const items=this.database.prepare(`SELECT a.*,u.display_name,u.email FROM audit_logs a LEFT JOIN users u ON u.id=a.actor_user_id WHERE ${clause} ORDER BY a.created_at DESC LIMIT ? OFFSET ?`).all(...params,pageSize,(page-1)*pageSize) as Array<Record<string,unknown>>;
    return {items,total,page,totalPages:Math.max(1,Math.ceil(total/pageSize))};
  }
}
