import type { RelationalDatabase } from "../database/sqlite-database";

export class SqliteJsonCache {
  constructor(private readonly database: RelationalDatabase) {}
  remember<T>(namespace: string, key: string, ttlSeconds: number, producer: () => T): T {
    const composite = `${namespace}:${key}`;
    const cached = this.database.prepare("SELECT value_json FROM cache_entries WHERE key = ? AND datetime(expires_at) > datetime('now')").get(composite) as { value_json: string } | undefined;
    if (cached) return JSON.parse(cached.value_json) as T;
    const value = producer();
    this.database.prepare(`INSERT INTO cache_entries(key,namespace,value_json,expires_at) VALUES (?,?,?,datetime('now',?)) ON CONFLICT(key) DO UPDATE SET value_json=excluded.value_json,expires_at=excluded.expires_at,updated_at=CURRENT_TIMESTAMP`).run(composite, namespace, JSON.stringify(value), `+${ttlSeconds} seconds`);
    return value;
  }
  invalidate(namespace: string) { this.database.prepare("DELETE FROM cache_entries WHERE namespace = ?").run(namespace); }
}
