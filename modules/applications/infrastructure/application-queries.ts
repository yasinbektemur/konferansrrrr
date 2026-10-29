import type { RelationalDatabase } from "@/modules/shared/infrastructure/database/sqlite-database";

export type ApplicationBoardItem = { id: string; opportunityId: string; title: string; acronym: string | null; stage: string; internalDeadline: string | null; nearestDeadline: string | null; taskCount: number; completedTaskCount: number; version: number };

export class ApplicationQueries {
  constructor(private readonly database: RelationalDatabase) {}
  boardForUser(userId: string,trash=false): ApplicationBoardItem[] {
    return this.database.prepare(`SELECT aw.id, aw.opportunity_id, o.title, o.acronym, aw.stage, aw.internal_deadline, (SELECT MIN(d.due_at) FROM deadlines d WHERE d.opportunity_id = o.id AND date(d.due_at) >= date('now')) AS nearest_deadline, COUNT(t.id) AS task_count, SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) AS completed_task_count, aw.version FROM application_workspaces aw JOIN opportunities o ON o.id = aw.opportunity_id JOIN application_members am ON am.application_id = aw.id AND am.user_id = ? LEFT JOIN application_tasks t ON t.application_id = aw.id AND t.deleted_at IS NULL WHERE aw.deleted_at IS ${trash?'NOT NULL':'NULL'} GROUP BY aw.id ORDER BY aw.updated_at DESC`).all(userId).map((row) => {
      const item = row as Record<string, unknown>;
      return { id: String(item.id), opportunityId: String(item.opportunity_id), title: String(item.title), acronym: item.acronym ? String(item.acronym) : null, stage: String(item.stage), internalDeadline: item.internal_deadline ? String(item.internal_deadline) : null, nearestDeadline: item.nearest_deadline ? String(item.nearest_deadline) : null, taskCount: Number(item.task_count), completedTaskCount: Number(item.completed_task_count ?? 0), version: Number(item.version) };
    });
  }
}
