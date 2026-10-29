import { ValidationError } from "@/modules/shared/domain/errors";

export type UserRole = "user" | "curator" | "admin" | "owner";
export type UserStatus = "pending" | "active" | "suspended";

export type User = {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
};

export function normalizeEmail(email: string) {
  return email.trim().toLocaleLowerCase("en-US");
}

export function assertValidPassword(password: string) {
  if (password.length < 12) throw new ValidationError("Parola en az 12 karakter olmalıdır.");
  if (password.length > 128) throw new ValidationError("Parola en fazla 128 karakter olabilir.");
}
