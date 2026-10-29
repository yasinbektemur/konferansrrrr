import { createHash, randomBytes } from "node:crypto";
import { ConflictError, ValidationError } from "@/modules/shared/domain/errors";
import type { IdentifierGenerator } from "@/modules/shared/domain/identifier";
import type { RelationalDatabase } from "@/modules/shared/infrastructure/database/sqlite-database";
import type { PasswordHasher } from "../domain/password-hasher";
import { assertValidPassword, normalizeEmail } from "../domain/user";
import type { SessionRepository, UserRepository } from "./user-repository";

export type PublicUser = { id: string; email: string; displayName: string; role: string };

export class AuthenticationService {
  constructor(
    private readonly database: RelationalDatabase,
    private readonly users: UserRepository,
    private readonly sessions: SessionRepository,
    private readonly hasher: PasswordHasher,
    private readonly identifiers: IdentifierGenerator,
  ) {}

  async register(input: { email: string; displayName: string; password: string; userAgent?: string | null }) {
    const email = normalizeEmail(input.email);
    const displayName = input.displayName.trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new ValidationError("Geçerli bir e-posta adresi girin.");
    if (displayName.length < 2 || displayName.length > 80) throw new ValidationError("Ad 2–80 karakter arasında olmalıdır.");
    assertValidPassword(input.password);
    if (this.users.findByEmail(email)) throw new ConflictError("Bu e-posta adresi zaten kayıtlı.");

    const passwordHash = await this.hasher.hash(input.password);
    return this.database.transaction(() => {
      const role = this.users.count() === 0 ? "owner" as const : "user" as const;
      const user = this.users.create({ id: this.identifiers.next(), email, displayName, passwordHash, role });
      const session = this.createSession(user.id, input.userAgent);
      this.audit(user.id, "auth.register", "user", user.id);
      return { user: this.publicUser(user), ...session };
    });
  }

  async login(input: { email: string; password: string; userAgent?: string | null }) {
    const user = this.users.findByEmail(normalizeEmail(input.email));
    if (!user || user.status !== "active" || !(await this.hasher.verify(input.password, user.passwordHash))) {
      throw new ValidationError("E-posta veya parola hatalı.");
    }
    return this.database.transaction(() => {
      const session = this.createSession(user.id, input.userAgent);
      this.audit(user.id, "auth.login", "session", session.sessionId);
      return { user: this.publicUser(user), ...session };
    });
  }

  logout(rawToken: string) {
    const tokenHash = this.hashToken(rawToken);
    this.sessions.revokeByTokenHash(tokenHash);
  }

  resolveUser(rawToken?: string | null): PublicUser | null {
    if (!rawToken) return null;
    const user = this.sessions.findUserByTokenHash(this.hashToken(rawToken));
    return user ? this.publicUser(user) : null;
  }

  private createSession(userId: string, userAgent?: string | null) {
    const token = randomBytes(32).toString("base64url");
    const sessionId = this.identifiers.next();
    const expiresAt = new Date(Date.now() + 30 * 86_400_000).toISOString();
    this.sessions.create({ id: sessionId, userId, tokenHash: this.hashToken(token), expiresAt, userAgent });
    return { token, sessionId, expiresAt };
  }

  private hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }

  private publicUser(user: { id: string; email: string; displayName: string; role: string }): PublicUser {
    return { id: user.id, email: user.email, displayName: user.displayName, role: user.role };
  }

  private audit(actorUserId: string, action: string, entityType: string, entityId: string) {
    this.database.prepare(`
      INSERT INTO audit_logs(id, actor_user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?, ?)
    `).run(this.identifiers.next(), actorUserId, action, entityType, entityId);
  }
}
