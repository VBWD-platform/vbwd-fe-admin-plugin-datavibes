import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { api } from '@/api';
import { useDatavibesStore } from '../../src/stores/datavibes';

vi.mock('@/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

describe('useDatavibesStore — endpoints (S125 §3.5)', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('fetchProfiles GETs the profiles endpoint and stores the list', async () => {
    const profiles = [
      { slug: 'air-quality', title: 'Air Quality', category: 'environment', latest_snapshot_at: '2026-07-01T00:00:00Z', row_count: 120, reports: [] },
    ];
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({ profiles });
    const store = useDatavibesStore();

    await store.fetchProfiles();

    expect(api.get).toHaveBeenCalledWith('/admin/datavibes/profiles');
    expect(store.profiles.map((profile) => profile.slug)).toEqual(['air-quality']);
  });

  it('fetchProfile GETs the single-profile endpoint and stores the detail', async () => {
    const detail = { slug: 'air-quality', title: 'Air Quality', category: 'environment', latest_snapshot_at: null, row_count: null, reports: [], config_summary: {} };
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({ profile: detail });
    const store = useDatavibesStore();

    const result = await store.fetchProfile('air-quality');

    expect(api.get).toHaveBeenCalledWith('/admin/datavibes/profiles/air-quality');
    expect(result.slug).toBe('air-quality');
    expect(store.currentProfile?.slug).toBe('air-quality');
  });

  it('runProfile POSTs to the profile run endpoint and returns the snapshot ref', async () => {
    const ref = { snapshot_id: 'snap-9', taken_at: '2026-07-09T00:00:00Z' };
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue(ref);
    const store = useDatavibesStore();

    const result = await store.runProfile('air-quality');

    expect(api.post).toHaveBeenCalledWith('/admin/datavibes/profiles/air-quality/run');
    expect(result).toEqual(ref);
  });

  it('fetchSchedules GETs the schedules endpoint and stores the list', async () => {
    const schedules = [
      { dataset_slug: 'air-quality', cron_expr: '0 3 * * *', enabled: true, last_run_at: null, last_status: null, last_row_count: null, next_run_at: null },
    ];
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({ schedules });
    const store = useDatavibesStore();

    await store.fetchSchedules();

    expect(api.get).toHaveBeenCalledWith('/admin/datavibes/schedules');
    expect(store.schedules.map((schedule) => schedule.dataset_slug)).toEqual(['air-quality']);
  });

  it('saveSchedule PUTs the cron_expr + enabled body to the schedule endpoint', async () => {
    const saved = { dataset_slug: 'air-quality', cron_expr: '0 6 * * *', enabled: false, last_run_at: null, last_status: null, last_row_count: null, next_run_at: null };
    (api.put as ReturnType<typeof vi.fn>).mockResolvedValue(saved);
    const store = useDatavibesStore();

    const result = await store.saveSchedule('air-quality', { cron_expr: '0 6 * * *', enabled: false });

    expect(api.put).toHaveBeenCalledWith('/admin/datavibes/schedules/air-quality', {
      cron_expr: '0 6 * * *',
      enabled: false,
    });
    expect(result.cron_expr).toBe('0 6 * * *');
  });

  it('runSchedule POSTs to the schedule run endpoint', async () => {
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({ snapshot_id: 'snap-1' });
    const store = useDatavibesStore();

    await store.runSchedule('air-quality');

    expect(api.post).toHaveBeenCalledWith('/admin/datavibes/schedules/air-quality/run');
  });
});
