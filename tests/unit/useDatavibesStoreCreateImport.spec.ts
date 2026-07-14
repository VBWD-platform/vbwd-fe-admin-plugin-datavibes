import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { api } from '@/api';
import { useDatavibesStore } from '../../src/stores/datavibes';

vi.mock('@/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

describe('useDatavibesStore — create + import profiles', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('createProfile POSTs the body to the profiles endpoint and refreshes the list', async () => {
    const created = { slug: 'air', title: 'Air', category: 'environment', latest_snapshot_at: null, row_count: null, reports: [] };
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({ profile: created });
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({ profiles: [created] });
    const store = useDatavibesStore();

    const result = await store.createProfile({ slug: 'air', title: 'Air', category: 'environment', definition: 'metadata:\n  slug: air\n' });

    expect(api.post).toHaveBeenCalledWith('/admin/datavibes/profiles', {
      slug: 'air',
      title: 'Air',
      category: 'environment',
      definition: 'metadata:\n  slug: air\n',
    });
    expect(result.slug).toBe('air');
    // Refreshes the list after a successful create.
    expect(api.get).toHaveBeenCalledWith('/admin/datavibes/profiles');
    expect(store.profiles.map((profile) => profile.slug)).toEqual(['air']);
  });

  it('importProfiles POSTs the envelope to the shared data-exchange import route', async () => {
    const importResult = { entity: 'datavibes_profile', mode: 'upsert', dry_run: false, created: 2, updated: 0, skipped: 0, errors: [] };
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue(importResult);
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({ profiles: [] });
    const store = useDatavibesStore();

    const envelope = { vbwd_export: 'datavibes_profile', version: 1, datavibes_profile: [{ slug: 'air', definition: {} }] };
    const result = await store.importProfiles(envelope);

    expect(api.post).toHaveBeenCalledWith('/admin/data-exchange/datavibes_profile/import', {
      payload: envelope,
      mode: 'upsert',
      dry_run: false,
    });
    expect(result.created).toBe(2);
    // Refreshes the profile list after an import.
    expect(api.get).toHaveBeenCalledWith('/admin/datavibes/profiles');
  });
});
