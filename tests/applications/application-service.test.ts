import assert from "node:assert/strict";
import { test } from "node:test";
import { ApplicationService } from "@/modules/applications/application/application-service";
import { createTestDatabase, seedOpportunityFixture } from "../helpers/database";
class SequentialIds { private value = 0; next() { return `id-${++this.value}`; } }
test("starting the same personal application twice is idempotent", () => { const database = createTestDatabase(); seedOpportunityFixture(database); database.prepare("INSERT INTO users(id, email, password_hash, display_name) VALUES ('user-1', 'user@example.com', 'hash', 'User')").run(); const service = new ApplicationService(database, new SequentialIds()); const first = service.start({ userId: "user-1", opportunityId: "opp-1" }); const replay = service.start({ userId: "user-1", opportunityId: "opp-1" }); assert.equal(first.created, true); assert.equal(replay.created, false); assert.equal(replay.id, first.id); const events = database.prepare("SELECT COUNT(*) AS count FROM outbox_events").get() as { count: number }; assert.equal(Number(events.count), 1); database.close(); });
