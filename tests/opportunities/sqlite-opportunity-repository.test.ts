import assert from "node:assert/strict";
import { test } from "node:test";
import { SqliteOpportunityRepository } from "@/modules/opportunities/infrastructure/sqlite-opportunity-repository";
import { createTestDatabase, seedOpportunityFixture } from "../helpers/database";

test("repository filters relational topic data and paginates", () => {
  const database = createTestDatabase();
  seedOpportunityFixture(database);
  const repository = new SqliteOpportunityRepository(database);

  const result = repository.search({ topics: ["tibbi-goruntuleme"], page: 1, pageSize: 1 });
  assert.equal(result.total, 1);
  assert.equal(result.totalPages, 1);
  assert.equal(result.items[0]?.props.title, "Biyomedikal Yapay Zekâ Kongresi");
  assert.deepEqual(result.items[0]?.props.topics, ["Yapay zekâ", "Tıbbi görüntüleme"]);
  assert.equal(result.items[0]?.props.deadlines.length, 2);
  database.close();
});
