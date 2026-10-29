import type { User, UserRole } from "../domain/user";

export interface UserRepository {
  count(): number;
  findByEmail(email: string): User | null;
  findById(id: string): User | null;
  create(input: { id: string; email: string; displayName: string; passwordHash: string; role: UserRole }): User;
  list(page: number, pageSize: number): { items: User[]; total: number };
}

export interface SessionRepository {
  create(input: { id: string; userId: string; tokenHash: string; expiresAt: string; userAgent?: string | null }): void;
  findUserByTokenHash(tokenHash: string): User | null;
  revokeByTokenHash(tokenHash: string): void;
  deleteExpired(now: string): number;
}
