import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { createI18n } from 'vue-i18n';
import { api } from '@/api';
import ProfilesTab from '../../src/components/ProfilesTab.vue';
import datavibesEn from '../../locales/en.json';

vi.mock('@/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: { en: datavibesEn },
});

function primeApi(): void {
  (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({ profiles: [] });
  (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({
    profile: { slug: 'air', title: 'Air', category: 'environment', latest_snapshot_at: null, row_count: null, reports: [] },
  });
}

async function mountTab(): Promise<VueWrapper> {
  primeApi();
  const wrapper = mount(ProfilesTab, { global: { plugins: [i18n] } });
  await flushPromises();
  return wrapper;
}

describe('ProfilesTab.vue — create + import', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('shows the create form when "New profile" is clicked', async () => {
    const wrapper = await mountTab();
    expect(wrapper.find('[data-testid="profile-create-form"]').exists()).toBe(false);
    await wrapper.find('[data-testid="new-profile-button"]').trigger('click');
    expect(wrapper.find('[data-testid="profile-create-form"]').exists()).toBe(true);
  });

  it('submits the create form to the create route via the store', async () => {
    const wrapper = await mountTab();
    await wrapper.find('[data-testid="new-profile-button"]').trigger('click');

    await wrapper.find('[data-testid="create-slug"]').setValue('air');
    await wrapper.find('[data-testid="create-title"]').setValue('Air');
    await wrapper.find('[data-testid="create-category"]').setValue('environment');
    await wrapper.find('[data-testid="create-definition"]').setValue('metadata:\n  slug: air\n');
    await wrapper.find('[data-testid="profile-create-form"]').trigger('submit');
    await flushPromises();

    expect(api.post).toHaveBeenCalledWith('/admin/datavibes/profiles', {
      slug: 'air',
      title: 'Air',
      category: 'environment',
      definition: 'metadata:\n  slug: air\n',
    });
  });

  it('imports an uploaded envelope file to the shared data-exchange route', async () => {
    const wrapper = await mountTab();
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      entity: 'datavibes_profile', mode: 'upsert', dry_run: false, created: 1, updated: 0, skipped: 0, errors: [],
    });

    const envelope = { vbwd_export: 'datavibes_profile', version: 1, datavibes_profile: [{ slug: 'air', definition: {} }] };
    const file = new File([JSON.stringify(envelope)], 'profiles.json', { type: 'application/json' });
    const input = wrapper.find('[data-testid="import-file"]');
    Object.defineProperty(input.element, 'files', { value: [file], configurable: true });
    await input.trigger('change');
    await flushPromises();

    expect(api.post).toHaveBeenCalledWith('/admin/data-exchange/datavibes_profile/import', {
      payload: envelope,
      mode: 'upsert',
      dry_run: false,
    });
  });
});
