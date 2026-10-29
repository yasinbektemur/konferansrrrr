import { DatabaseSync, type StatementSync } from "node:sqlite";
import { mkdirSync,openSync,closeSync,unlinkSync,writeFileSync,appendFileSync } from "node:fs";
import { dirname,resolve } from "node:path";
import { backupConnection } from './sqlite-backup';
import { migrations, type Migration } from "./migrations";

export type SqlValue = string | number | bigint | null | Uint8Array;

export interface RelationalDatabase {
  exec(sql: string): void;
  prepare(sql: string): StatementSync;
  transaction<T>(operation: () => T): T;
  close(): void;
}

export class SqliteDatabase implements RelationalDatabase {
  readonly connection: DatabaseSync;
  readonly path:string;
  private depth=0;

  constructor(path: string = process.env.DATABASE_PATH ?? "data/app.db") {
    this.path=path===':memory:'?path:resolve(path);
    if (path !== ":memory:") {
      mkdirSync(dirname(path), { recursive: true });
    }

    this.connection = new DatabaseSync(path, {
      timeout: 5_000,
      enableForeignKeyConstraints: true,
    });

    this.connection.exec("PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL; PRAGMA busy_timeout = 5000;");
  }

  exec(sql: string) {
    this.connection.exec(sql);
  }

  prepare(sql: string) {
    return this.connection.prepare(sql);
  }

  transaction<T>(operation: () => T): T {
    const level=this.depth++,savepoint=`nested_${level}`;
    try{this.connection.exec(level?`SAVEPOINT ${savepoint}`:'BEGIN IMMEDIATE');}catch(error){this.depth--;throw error;}
    try {
      const result = operation();
      this.connection.exec(level?`RELEASE ${savepoint}`:'COMMIT');
      return result;
    } catch (error) {
      this.connection.exec(level?`ROLLBACK TO ${savepoint}; RELEASE ${savepoint}`:'ROLLBACK');
      throw error;
    }finally{this.depth--;}
  }

  migrate(availableMigrations: Migration[] = migrations) {
    let lock:number|undefined;const lockPath=`${this.path}.migration.lock`;
    if(this.path!==':memory:'){try{lock=openSync(lockPath,'wx',0o600);writeFileSync(lock,JSON.stringify({pid:process.pid,startedAt:new Date().toISOString()}));}catch(error){if(lock!==undefined){closeSync(lock);unlinkSync(lockPath);}throw new Error(`Migration kilidi alınamadı: ${lockPath}. Başka kurulumun bitmesini bekleyin; eski kilit için KURULUM.md dosyasına bakın.`,{cause:error});}}
    try{
    this.connection.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const appliedRows = this.connection.prepare("SELECT version FROM schema_migrations").all() as Array<{ version: number }>;
    const applied = new Set(appliedRows.map((row) => Number(row.version)));
    const pending=availableMigrations.filter(m=>!applied.has(m.version));
    if(pending.length&&applied.size&&this.path!==':memory:')backupConnection(this.connection,this.path,'migration');
    const insertMigration = this.connection.prepare("INSERT INTO schema_migrations(version, name) VALUES (?, ?)");

    for (const migration of [...availableMigrations].sort((left, right) => left.version - right.version)) {
      if (applied.has(migration.version)) {
        continue;
      }

      try{this.transaction(() => {
        this.connection.exec(migration.sql);
        insertMigration.run(migration.version, migration.name);
      });}catch(error){if(this.path!==':memory:')appendFileSync(`${this.path}.migration-failures.log`,JSON.stringify({at:new Date().toISOString(),version:migration.version,name:migration.name})+'\n',{mode:0o600});throw error;}
    }
    }finally{if(lock!==undefined){closeSync(lock);unlinkSync(lockPath);}}
  }

  integrityCheck(): boolean {
    const row = this.connection.prepare("PRAGMA integrity_check").get() as Record<string, string> | undefined;
    return Boolean(row&&Object.values(row)[0]==='ok'&&this.connection.prepare('PRAGMA foreign_key_check').all().length===0);
  }

  close() {
    this.connection.close();
  }
}
