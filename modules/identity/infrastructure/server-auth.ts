import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDatabase } from "@/modules/shared/infrastructure/database/server-database";
import { UuidIdentifierGenerator } from "@/modules/shared/domain/identifier";
import { AuthenticationService } from "../application/authentication-service";
import { ScryptPasswordHasher } from "./scrypt-password-hasher";
import { SqliteSessionRepository, SqliteUserRepository } from "./sqlite-user-repository";

export const SESSION_COOKIE = "conference_radar_session";

export function getAuthenticationService() {
  const database = getDatabase();
  return new AuthenticationService(
    database,
    new SqliteUserRepository(database),
    new SqliteSessionRepository(database),
    new ScryptPasswordHasher(),
    new UuidIdentifierGenerator(),
  );
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  return getAuthenticationService().resolveUser(cookieStore.get(SESSION_COOKIE)?.value);
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!new Set(["curator", "admin", "owner"]).has(user.role)) redirect("/");
  return user;
}

export async function requireUserAdministrator() {
  const user = await requireUser();
  if (!new Set(["admin", "owner"]).has(user.role)) redirect("/admin");
  return user;
}

export async function requestUserAgent() {
  return (await headers()).get("user-agent");
}
