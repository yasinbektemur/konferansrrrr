import type { IdentifierGenerator } from "@/modules/shared/domain/identifier";
import { NotFoundError } from "@/modules/shared/domain/errors";
import type { RelationalDatabase } from "@/modules/shared/infrastructure/database/sqlite-database";

export class FollowService {
  constructor(
    private readonly database: RelationalDatabase,
    private readonly identifiers: IdentifierGenerator,
  ) {}

  toggle(userId: string, opportunityId: string) {
    const opportunity = this.database.prepare("SELECT id FROM opportunities WHERE id = ? AND status = 'published'").get(opportunityId);

    return this.database.transaction(() => {
      const existing = this.database.prepare("SELECT 1 FROM follows WHERE user_id = ? AND opportunity_id = ?").get(userId, opportunityId);
      if (existing) {
        this.database.prepare("DELETE FROM follows WHERE user_id = ? AND opportunity_id = ?").run(userId, opportunityId);
      } else {
        if (!opportunity) throw new NotFoundError("Fırsat");
        this.database.prepare("INSERT INTO follows(user_id, opportunity_id) VALUES (?, ?)").run(userId, opportunityId);
      }
      const followed = !existing;
      this.database.prepare(`INSERT INTO audit_logs(id, actor_user_id, action, entity_type, entity_id, metadata_json) VALUES (?, ?, ?, 'opportunity', ?, ?)`)
        .run(this.identifiers.next(), userId, followed ? "opportunity.follow" : "opportunity.unfollow", opportunityId, JSON.stringify({ followed }));
      return followed;
    });
  }
}
