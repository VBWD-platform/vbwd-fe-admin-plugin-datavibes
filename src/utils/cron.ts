/**
 * Minimal standard 5-field cron support for the Cron Management tab.
 *
 * Fields (in order): minute hour day-of-month month day-of-week.
 * Supports `*`, lists (`a,b`), ranges (`a-b`) and steps (`* /n`, `a-b/n`).
 * Evaluation is done in **UTC** so the "next fire times" preview is
 * deterministic regardless of the operator's machine timezone.
 *
 * This is a preview/validation helper only — the backend `croniter` remains
 * the single source of truth for when a schedule actually fires.
 */

interface CronFieldSpec {
  min: number;
  max: number;
}

const FIELD_SPECS: CronFieldSpec[] = [
  { min: 0, max: 59 }, // minute
  { min: 0, max: 23 }, // hour
  { min: 1, max: 31 }, // day of month
  { min: 1, max: 12 }, // month
  { min: 0, max: 6 }, // day of week (0 = Sunday; 7 is normalised to 0)
];

const CRON_FIELD_COUNT = FIELD_SPECS.length;
const DAY_OF_WEEK_INDEX = 4;
const MAX_PREVIEW_MINUTES = 366 * 24 * 60; // one-year search horizon

/**
 * Parse a single cron field into the concrete set of allowed integer values,
 * or return `null` when the field is malformed / out of range.
 */
function parseField(field: string, spec: CronFieldSpec, isDayOfWeek: boolean): Set<number> | null {
  const allowed = new Set<number>();

  for (const part of field.split(',')) {
    if (part === '') return null;

    const [rangePart, stepPart] = part.split('/');
    let step = 1;
    if (stepPart !== undefined) {
      if (!/^\d+$/.test(stepPart)) return null;
      step = Number(stepPart);
      if (step === 0) return null;
    }

    let rangeStart = spec.min;
    let rangeEnd = spec.max;

    if (rangePart !== '*') {
      const bounds = rangePart.split('-');
      if (bounds.length > 2) return null;
      if (!bounds.every((bound) => /^\d+$/.test(bound))) return null;

      rangeStart = Number(bounds[0]);
      rangeEnd = bounds.length === 2 ? Number(bounds[1]) : rangeStart;
    }

    for (let value = rangeStart; value <= rangeEnd; value += step) {
      let normalised = value;
      if (isDayOfWeek && normalised === 7) normalised = 0;
      if (normalised < spec.min || normalised > spec.max) return null;
      allowed.add(normalised);
    }
  }

  return allowed.size > 0 ? allowed : null;
}

interface ParsedCron {
  minute: Set<number>;
  hour: Set<number>;
  dayOfMonth: Set<number>;
  month: Set<number>;
  dayOfWeek: Set<number>;
}

function parseCron(expression: string): ParsedCron | null {
  if (typeof expression !== 'string') return null;

  const fields = expression.trim().split(/\s+/);
  if (fields.length !== CRON_FIELD_COUNT) return null;

  const parsed: Set<number>[] = [];
  for (let index = 0; index < CRON_FIELD_COUNT; index += 1) {
    const values = parseField(fields[index], FIELD_SPECS[index], index === DAY_OF_WEEK_INDEX);
    if (values === null) return null;
    parsed.push(values);
  }

  return {
    minute: parsed[0],
    hour: parsed[1],
    dayOfMonth: parsed[2],
    month: parsed[3],
    dayOfWeek: parsed[4],
  };
}

/** True when `expression` is a well-formed standard 5-field cron string. */
export function isValidCron(expression: string): boolean {
  return parseCron(expression) !== null;
}

function matches(parsed: ParsedCron, moment: Date): boolean {
  return (
    parsed.minute.has(moment.getUTCMinutes()) &&
    parsed.hour.has(moment.getUTCHours()) &&
    parsed.dayOfMonth.has(moment.getUTCDate()) &&
    parsed.month.has(moment.getUTCMonth() + 1) &&
    parsed.dayOfWeek.has(moment.getUTCDay())
  );
}

/**
 * The next `count` UTC instants at which `expression` fires, starting strictly
 * after `from`. Returns an empty list for an invalid expression.
 */
export function nextFireTimes(expression: string, count: number, from: Date = new Date()): Date[] {
  const parsed = parseCron(expression);
  if (parsed === null || count <= 0) return [];

  const results: Date[] = [];
  const cursor = new Date(from.getTime());
  cursor.setUTCSeconds(0, 0);
  cursor.setUTCMinutes(cursor.getUTCMinutes() + 1);

  for (let step = 0; step < MAX_PREVIEW_MINUTES && results.length < count; step += 1) {
    if (matches(parsed, cursor)) {
      results.push(new Date(cursor.getTime()));
    }
    cursor.setUTCMinutes(cursor.getUTCMinutes() + 1);
  }

  return results;
}
