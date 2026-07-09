import { describe, it, expect } from 'vitest';
import { isValidCron, nextFireTimes } from '../../src/utils/cron';

describe('cron utility — validation', () => {
  it('accepts a standard 5-field expression', () => {
    expect(isValidCron('0 3 * * *')).toBe(true);
  });

  it('accepts lists, ranges and steps', () => {
    expect(isValidCron('*/15 0-6 1,15 * 1-5')).toBe(true);
  });

  it('rejects an expression with the wrong field count', () => {
    expect(isValidCron('0 3 * *')).toBe(false);
    expect(isValidCron('0 3 * * * *')).toBe(false);
  });

  it('rejects out-of-range values', () => {
    expect(isValidCron('99 3 * * *')).toBe(false);
    expect(isValidCron('0 25 * * *')).toBe(false);
    expect(isValidCron('0 3 32 * *')).toBe(false);
    expect(isValidCron('0 3 * 13 *')).toBe(false);
  });

  it('rejects garbage and empty input', () => {
    expect(isValidCron('')).toBe(false);
    expect(isValidCron('not a cron')).toBe(false);
    expect(isValidCron('0 3 * * abc')).toBe(false);
  });
});

describe('cron utility — next fire times preview', () => {
  it('computes the next N fire times for a daily schedule', () => {
    const from = new Date('2026-07-09T10:00:00Z');
    const times = nextFireTimes('0 3 * * *', 3, from);

    expect(times).toHaveLength(3);
    // First fire is 03:00 UTC the following day (10:00 is already past 03:00).
    expect(times[0].toISOString()).toBe('2026-07-10T03:00:00.000Z');
    expect(times[1].toISOString()).toBe('2026-07-11T03:00:00.000Z');
    expect(times[2].toISOString()).toBe('2026-07-12T03:00:00.000Z');
  });

  it('returns an empty list for an invalid expression', () => {
    expect(nextFireTimes('nope', 5)).toEqual([]);
  });
});
