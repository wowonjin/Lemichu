export function toIso(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? new Date(parsed).toISOString() : value;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }
  if (typeof value !== "object") return null;

  const timestamp = value as {
    toDate?: () => Date;
    toMillis?: () => number;
    seconds?: number;
    _seconds?: number;
  };

  if (typeof timestamp.toDate === "function") {
    try {
      return timestamp.toDate().toISOString();
    } catch {
      // Admin Timestamp can throw if detached.
    }
  }

  if (typeof timestamp.toMillis === "function") {
    try {
      return new Date(timestamp.toMillis()).toISOString();
    } catch {
      // ignore
    }
  }

  const seconds = timestamp.seconds ?? timestamp._seconds;
  return typeof seconds === "number" ? new Date(seconds * 1000).toISOString() : null;
}

export function toDateValue(value: unknown): Date | null {
  const iso = toIso(value);
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function createdAtMs(value: unknown) {
  const date = toDateValue(value);
  return date ? date.getTime() : 0;
}

function isTimestampLike(value: unknown) {
  if (!value || typeof value !== "object") return false;
  const timestamp = value as {
    toDate?: unknown;
    toMillis?: unknown;
    seconds?: unknown;
    _seconds?: unknown;
    nanoseconds?: unknown;
    _nanoseconds?: unknown;
  };
  return (
    typeof timestamp.toDate === "function" ||
    typeof timestamp.toMillis === "function" ||
    ((typeof timestamp.seconds === "number" || typeof timestamp._seconds === "number") &&
      (typeof timestamp.nanoseconds === "number" || typeof timestamp._nanoseconds === "number"))
  );
}

export function toPlain(value: unknown): unknown {
  if (value == null) return value;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (value instanceof Date) return value.toISOString();
  if (isTimestampLike(value)) return toIso(value);
  if (Array.isArray(value)) return value.map(toPlain);
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [key, toPlain(nested)])
    );
  }
  return null;
}
