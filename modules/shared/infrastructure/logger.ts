type LogLevel = "info" | "warn" | "error";

const secretKeys = new Set(["password", "passwordHash", "token", "tokenHash", "cookie", "authorization", "apiKey"]);

function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, secretKeys.has(key) ? "[REDACTED]" : sanitize(item)]),
  );
}

export class StructuredLogger {
  constructor(private readonly context: string) {}

  info(event: string, metadata: Record<string, unknown> = {}) {
    this.write("info", event, metadata);
  }

  warn(event: string, metadata: Record<string, unknown> = {}) {
    this.write("warn", event, metadata);
  }

  error(event: string, error: unknown, metadata: Record<string, unknown> = {}) {
    this.write("error", event, {
      ...metadata,
      error: error instanceof Error ? { name: error.name, message: error.message } : String(error),
    });
  }

  private write(level: LogLevel, event: string, metadata: Record<string, unknown>) {
    const safeMetadata = sanitize(metadata) as Record<string, unknown>;
    const line = JSON.stringify({ timestamp: new Date().toISOString(), level, context: this.context, event, ...safeMetadata });
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.info(line);
  }
}
