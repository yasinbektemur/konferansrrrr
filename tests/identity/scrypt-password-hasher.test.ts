import assert from "node:assert/strict";
import { test } from "node:test";
import { ScryptPasswordHasher } from "@/modules/identity/infrastructure/scrypt-password-hasher";

test("passwords are salted and verified with timing-safe comparison", async () => {
  const hasher = new ScryptPasswordHasher();
  const first = await hasher.hash("uzun-ve-guvenli-parola");
  const second = await hasher.hash("uzun-ve-guvenli-parola");

  assert.notEqual(first, second);
  assert.equal(await hasher.verify("uzun-ve-guvenli-parola", first), true);
  assert.equal(await hasher.verify("yanlis-parola", first), false);
});
