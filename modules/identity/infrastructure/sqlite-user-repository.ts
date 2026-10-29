import type { RelationalDatabase } from "@/modules/shared/infrastructure/database/sqlite-database";
import type { SessionRepository, UserRepository } from "../application/user-repository";
import type { User, UserRole } from "../domain/user";

type UserRow = {
  id: string; email: string; display_name: string; password_hash: string; role: UserRole; status: User["status"]; created_at: string;
};

function mapUser(row: UserRow): User {
  return { id: row.id, email: row.email, displayName: row.display_name, passwordHash: row.password_hash, role: row.role, status: row.status, createdAt: row.created_at };
}

export class SqliteUserRepository implements UserRepository {
  constructor(private readonly database: RelationalDatabase) {}

  count() {
    const row = this.database.prepare("SELECT COUNT(*) AS count FROM users").get() as { count: number };
    return Number(row.count);
  }

  findByEmail(email: string) {
    const row = this.database.prepare("SELECT * FROM users WHERE email = ?").get(email) as UserRow | undefined;
    return row ? mapUser(row) : null;
  }

  findById(id: string) {
    const row = this.database.prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;
    return row ? mapUser(row) : null;
  }

  create(input: { id: string; email: string; displayName: string; passwordHash: string; role: UserRole }) {
    this.database.prepare(`
      INSERT INTO users(id, email, display_name, password_hash, role, status, email_verified_at)
      VALUES (?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP)
    `).run(input.id, input.email, input.displayName, input.passwordHash, input.role);
    return this.findById(input.id)!;
  }

  list(page: number, pageSize: number) {
    const safePage = Math.max(1, page);
    const safeSize = Math.min(100, Math.max(1, pageSize));
    const rows = this.database.prepare("SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?")
      .all(safeSize, (safePage - 1) * safeSize) as UserRow[];
    const count = this.database.prepare("SELECT COUNT(*) AS count FROM users").get() as { count: number };
    return { items: rows.map(mapUser), total: Number(count.count) };
  }
}

export class SqliteSessionRepository implements SessionRepository {
  constructor(private readonly database: RelationalDatabase) {}

  create(input: { id: string; userId: string; tokenHash: string; expiresAt: string; userAgent?: string | null }) {
    this.database.prepare(`
      INSERT INTO sessions(id, user_id, token_hash, expires_at, user_agent) VALUES (?, ?, ?, ?, ?)
    `).run(input.id, input.userId, input.tokenHash, input.expiresAt, input.userAgent ?? null);
  }

  findUserByTokenHash(tokenHash: string) {
    const row = this.database.prepare(`
      SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.revoked_at IS NULL AND s.expires_at > CURRENT_TIMESTAMP AND u.status = 'active'
    `).get(tokenHash) as UserRow | undefined;
    return row ? mapUser(row) : null;
  }

  revokeByTokenHash(tokenHash: string) {
    this.database.prepare("UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP WHERE token_hash = ?").run(tokenHash);
  }

  deleteExpired(now: string) {
    const result = this.database.prepare("DELETE FROM sessions WHERE expires_at <= ? OR revoked_at IS NOT NULL").run(now);
    return Number(result.changes);
  }
}
