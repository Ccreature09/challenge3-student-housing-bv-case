import { UserError } from "@/lib/action-result";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

export function requireUuid(value: unknown, what: string): string {
  if (!isUuid(value)) throw new UserError(`Invalid ${what}.`);
  return value;
}

/** Trimmed text of 1..max characters (or 0..max when optional; empty becomes null). */
export function text(
  value: unknown,
  label: string,
  max: number,
  options: { optional: true },
): string | null;
export function text(value: unknown, label: string, max: number): string;
export function text(
  value: unknown,
  label: string,
  max: number,
  options?: { optional: true },
): string | null {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!trimmed) {
    if (options?.optional) return null;
    throw new UserError(`${label} is required.`);
  }
  if (trimmed.length > max) {
    throw new UserError(`${label} must be ${max} characters or fewer.`);
  }
  return trimmed;
}

export function isoDate(value: unknown, label: string): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new UserError(`${label} must be a valid date.`);
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new UserError(`${label} must be a valid date.`);
  }
  return value;
}

export function oneOf<T extends string>(value: unknown, allowed: readonly T[], label: string): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new UserError(`Choose a valid ${label}.`);
  }
  return value as T;
}
