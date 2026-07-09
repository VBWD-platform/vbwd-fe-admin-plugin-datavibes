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

function asArray<T>(res: unknown, key: string): T[] {
  if (Array.isArray(res)) return res as T[];
  const obj = res as Record<string, unknown> | null;
  const list = obj?.[key] ?? obj?.items;
  return Array.isArray(list) ? (list as T[]) : [];
}

function unwrapEntity<T>(res: unknown, key: string): T {
  const obj = res as Record<string, unknown> | null;
  return (obj && key in obj ? obj[key] : res) as T;
}

export const datavibesApi = {
  async listProfiles(): Promise<DatavibesProfile[]> {
    const res = await api.get<unknown>('/admin/datavibes/profiles');
    return asArray<DatavibesProfile>(res, 'profiles');
  },

  async getProfile(slug: string): Promise<DatavibesProfileDetail> {
    const res = await api.get<unknown>(`/admin/datavibes/profiles/${slug}`);
    return unwrapEntity<DatavibesProfileDetail>(res, 'profile');
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
