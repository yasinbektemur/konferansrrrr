import type { RelationalDatabase } from "@/modules/shared/infrastructure/database/sqlite-database";

export class AdminQueries {
  constructor(private readonly database: RelationalDatabase) {}
  overview() {
    const scalar = (sql: string) => Number((this.database.prepare(sql).get() as { count: number }).count);
    return { users: scalar("SELECT COUNT(*) AS count FROM users"), published: scalar("SELECT COUNT(*) AS count FROM opportunities WHERE status = 'published'"), pending: scalar("SELECT COUNT(*) AS count FROM moderation_items WHERE status = 'pending'"), applications: scalar("SELECT COUNT(*) AS count FROM application_workspaces"), failingSources: scalar("SELECT COUNT(*) AS count FROM data_sources WHERE status = 'failing'"), unreadNotifications: scalar("SELECT COUNT(*) AS count FROM notifications WHERE read_at IS NULL") };
  }
  sources() { return this.database.prepare("SELECT ds.*, COUNT(DISTINCT o.id) AS opportunity_count, COUNT(DISTINCT CASE WHEN mi.status = 'pending' THEN mi.id END) AS pending_count FROM data_sources ds LEFT JOIN opportunities o ON o.source_id = ds.id LEFT JOIN moderation_items mi ON mi.source_id = ds.id GROUP BY ds.id ORDER BY ds.name").all() as Array<Record<string, unknown>>; }
  recentAudit() { return this.database.prepare("SELECT a.id, a.action, a.entity_type, a.entity_id, a.created_at, u.display_name FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_user_id ORDER BY a.created_at DESC LIMIT 12").all() as Array<Record<string, unknown>>; }
}
