import assert from "node:assert/strict";
import { test } from "node:test";
import { FollowService } from "@/modules/tracking/application/follow-service";
import { createTestDatabase, seedOpportunityFixture } from "../helpers/database";

class SequentialIds {
  private value = 0;
  next() { return `audit-${++this.value}`; }
}

test("follow toggle is unique and idempotent by user/opportunity relation", () => {
  const database = createTestDatabase();
  seedOpportunityFixture(database);
  database.prepare(`INSERT INTO users(id, email, password_hash, display_name) VALUES ('user-1', 'user@example.com', 'hash', 'User')`).run();
  const service = new FollowService(database, new SequentialIds());

  assert.equal(service.toggle("user-1", "opp-1"), true);
  assert.equal(service.toggle("user-1", "opp-1"), false);
  const count = database.prepare("SELECT COUNT(*) AS count FROM follows").get() as { count: number };
  assert.equal(Number(count.count), 0);
  database.close();
});
