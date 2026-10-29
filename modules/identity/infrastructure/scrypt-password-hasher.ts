import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import type { PasswordHasher } from "../domain/password-hasher";

const KEY_LENGTH = 64;
const COST = 131_072;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 1;
const MAX_MEMORY = 256 * 1024 * 1024;

function derive(password: string, salt: Buffer, length: number, options: { N: number; r: number; p: number; maxmem: number }) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(password, salt, length, options, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

export class ScryptPasswordHasher implements PasswordHasher {
  async hash(password: string) {
    const salt = randomBytes(16);
    const derived = await derive(password, salt, KEY_LENGTH, { N: COST, r: BLOCK_SIZE, p: PARALLELIZATION, maxmem: MAX_MEMORY });
    return `scrypt$${COST}$${BLOCK_SIZE}$${PARALLELIZATION}$${salt.toString("base64url")}$${derived.toString("base64url")}`;
  }

  async verify(password: string, encodedHash: string) {
    const [algorithm, cost, blockSize, parallelization, saltValue, hashValue] = encodedHash.split("$");
    if (algorithm !== "scrypt" || !saltValue || !hashValue) return false;
    const expected = Buffer.from(hashValue, "base64url");
    const derived = await derive(password, Buffer.from(saltValue, "base64url"), expected.length, {
      N: Number(cost), r: Number(blockSize), p: Number(parallelization), maxmem: MAX_MEMORY,
    });
    return derived.length === expected.length && timingSafeEqual(derived, expected);
  }
}
