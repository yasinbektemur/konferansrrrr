import assert from "node:assert/strict";
import { test } from "node:test";
import { createTestDatabase, seedOpportunityFixture } from "../helpers/database";

test("migrations are idempotent and foreign keys are enabled", () => {
  const database = createTestDatabase();
  database.migrate();
  seedOpportunityFixture(database);

  const migrationCount = database.prepare("SELECT COUNT(*) AS count FROM schema_migrations").get() as { count: number };
  assert.equal(Number(migrationCount.count), 9);
  assert.equal(database.integrityCheck(), true);

  assert.throws(() => {
    database.prepare("DELETE FROM data_sources WHERE id = ?").run("source-official");
  }, /FOREIGN KEY/);

  database.prepare("DELETE FROM opportunities WHERE id = ?").run("opp-1");
  const deadlines = database.prepare("SELECT COUNT(*) AS count FROM deadlines WHERE opportunity_id = ?").get("opp-1") as { count: number };
  assert.equal(Number(deadlines.count), 0);
  database.close();
});
