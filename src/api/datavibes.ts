/**
 * Datavibes admin API client (S125 §3.5).
 *
 * Thin wrappers over the shared admin `api` singleton so the store stays free
 * of endpoint string literals. All routes are admin-gated on the backend
 * (`admin` RBAC); this module only knows their shapes.
 */
import { api } from '@/api';

/** One report companion available for a profile's latest snapshot. */
export interface DatavibesReportLink {
  /** Display name, e.g. "analytics.md" / "statistics.md" / "report.pdf". */
  name: string;
  /** Download URL (served by the existing dataset download route). */
  url: string;
}

/** A datavibes dataset profile as the list endpoint projects it. */
export interface DatavibesProfile {
  slug: string;
  title: string;
  category: string | null;
  latest_snapshot_at: string | null;
  row_count: number | null;
  reports: DatavibesReportLink[];
}

/** Profile detail — the list row plus a resolved config summary. */
export interface DatavibesProfileDetail extends DatavibesProfile {
  config_summary: Record<string, unknown>;
}

/** A profile whose dataset.yaml the backend could not load, and why. */
export interface DatavibesProfileLoadFailure {
  slug: string;
  error: string;
}

/** The profiles listing: the healthy rows plus the ones that failed to load. */
export interface DatavibesProfileListing {
  profiles: DatavibesProfile[];
  failed: DatavibesProfileLoadFailure[];
}

/** The snapshot reference returned by a run. */
export interface DatavibesRunResult {
  snapshot_id: string;
  taken_at?: string;
  row_count?: number;
}

/** Status a scheduled run last finished in. */
export type DatavibesScheduleStatus = 'ok' | 'failed' | 'running';

/** A per-profile cron schedule row. */
export interface DatavibesSchedule {
  dataset_slug: string;
  cron_expr: string;
  enabled: boolean;
  last_run_at: string | null;
  last_status: DatavibesScheduleStatus | null;
  last_row_count: number | null;
  next_run_at: string | null;
}

/** The mutable subset of a schedule the operator can save. */
export interface DatavibesScheduleInput {
  cron_expr: string;
  enabled: boolean;
}

/** The body of a create/update-profile request (definition is raw YAML). */
export interface DatavibesProfileInput {
  slug: string;
  title?: string;
  category?: string;
  definition?: string;
}

/** Uniform data-exchange import outcome (mirrors the backend ImportResult). */
export interface DatavibesImportResult {
  entity: string;
  mode: string;
  dry_run: boolean;
  created: number;
  updated: number;
  skipped: number;
  errors: Array<Record<string, unknown>>;
}

/** Options for a profile import (mode + dry-run flags). */
export interface DatavibesImportOptions {
  mode?: 'upsert' | 'replace_all';
  dryRun?: boolean;
}

function asArray<T>(res: unknown, key: string): T[] {
  if (Array.isArray(res)) return res as T[];
  const obj = res as Record<string, unknown> | null;
  const list = obj?.[key] ?? obj?.items;
  return Array.isArray(list) ? (list as T[]) : [];
}

/** Read `key` as an array, with NO `items` fallback (unlike `asArray`). */
function asListOf<T>(res: unknown, key: string): T[] {
  const list = (res as Record<string, unknown> | null)?.[key];
  return Array.isArray(list) ? (list as T[]) : [];
}

function unwrapEntity<T>(res: unknown, key: string): T {
  const obj = res as Record<string, unknown> | null;
  return (obj && key in obj ? obj[key] : res) as T;
}

export const datavibesApi = {
  async listProfiles(): Promise<DatavibesProfileListing> {
    const res = await api.get<unknown>('/admin/datavibes/profiles');
    return {
      profiles: asArray<DatavibesProfile>(res, 'profiles'),
      // A malformed dataset.yaml is reported here instead of 500-ing the list.
      failed: asListOf<DatavibesProfileLoadFailure>(res, 'failed'),
    };
  },

  async getProfile(slug: string): Promise<DatavibesProfileDetail> {
    const res = await api.get<unknown>(`/admin/datavibes/profiles/${slug}`);
    return unwrapEntity<DatavibesProfileDetail>(res, 'profile');
  },

  async createProfile(input: DatavibesProfileInput): Promise<DatavibesProfile> {
    const res = await api.post<unknown>('/admin/datavibes/profiles', {
      slug: input.slug,
      title: input.title,
      category: input.category,
      definition: input.definition,
    });
    return unwrapEntity<DatavibesProfile>(res, 'profile');
  },

  async importProfiles(
    envelope: unknown,
    options: DatavibesImportOptions = {},
  ): Promise<DatavibesImportResult> {
    return api.post<DatavibesImportResult>('/admin/data-exchange/datavibes_profile/import', {
      payload: envelope,
      mode: options.mode ?? 'upsert',
      dry_run: options.dryRun ?? false,
    });
  },

  async runProfile(slug: string): Promise<DatavibesRunResult> {
    return api.post<DatavibesRunResult>(`/admin/datavibes/profiles/${slug}/run`);
  },

  async listSchedules(): Promise<DatavibesSchedule[]> {
    const res = await api.get<unknown>('/admin/datavibes/schedules');
    return asArray<DatavibesSchedule>(res, 'schedules');
  },

  async saveSchedule(slug: string, input: DatavibesScheduleInput): Promise<DatavibesSchedule> {
    const res = await api.put<unknown>(`/admin/datavibes/schedules/${slug}`, {
      cron_expr: input.cron_expr,
      enabled: input.enabled,
    });
    return unwrapEntity<DatavibesSchedule>(res, 'schedule');
  },

  async runSchedule(slug: string): Promise<DatavibesRunResult> {
    return api.post<DatavibesRunResult>(`/admin/datavibes/schedules/${slug}/run`);
  },
};
