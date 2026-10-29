import { randomUUID } from "node:crypto";

export interface IdentifierGenerator {
  next(): string;
}

export class UuidIdentifierGenerator implements IdentifierGenerator {
  next() {
    return randomUUID();
  }
}
