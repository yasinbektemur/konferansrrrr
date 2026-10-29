import "server-only";
import { SqliteDatabase } from "./sqlite-database";
import { seedDatabase } from "./seed";
import { StructuredLogger } from "../logger";

const logger = new StructuredLogger("database");

declare global {
  var __conferenceRadarDatabase: SqliteDatabase | undefined;
}

export function getDatabase() {
  if (!globalThis.__conferenceRadarDatabase) {
    const database = new SqliteDatabase();
    database.migrate();
    seedDatabase(database);
    globalThis.__conferenceRadarDatabase = database;
    logger.info("database.ready", { path: process.env.DATABASE_PATH ?? "data/app.db" });
  }
  return globalThis.__conferenceRadarDatabase;
}
