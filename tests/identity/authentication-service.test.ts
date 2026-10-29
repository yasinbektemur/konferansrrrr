import assert from "node:assert/strict";
import { test } from "node:test";
import { AuthenticationService } from "@/modules/identity/application/authentication-service";
import { ScryptPasswordHasher } from "@/modules/identity/infrastructure/scrypt-password-hasher";
import { SqliteSessionRepository, SqliteUserRepository } from "@/modules/identity/infrastructure/sqlite-user-repository";
import { createTestDatabase } from "../helpers/database";

class SequentialIds {
  private value = 0;
  next() { return `id-${++this.value}`; }
}

test("first registered user becomes owner and session resolves server-side", async () => {
  const database = createTestDatabase();
  const service = new AuthenticationService(database, new SqliteUserRepository(database), new SqliteSessionRepository(database), new ScryptPasswordHasher(), new SequentialIds());
  const registered = await service.register({ email: "Owner@Example.com", displayName: "Araştırma Yöneticisi", password: "cok-guvenli-bir-parola" });

  assert.equal(registered.user.role, "owner");
  assert.equal(registered.user.email, "owner@example.com");
  assert.equal(service.resolveUser(registered.token)?.id, registered.user.id);

  service.logout(registered.token);
  assert.equal(service.resolveUser(registered.token), null);
  database.close();
});
