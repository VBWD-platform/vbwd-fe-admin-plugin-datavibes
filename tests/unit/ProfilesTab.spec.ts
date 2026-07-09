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

const PROFILES = [
  {
    slug: 'air-quality',
    title: 'Air Quality',
    category: 'environment',
    latest_snapshot_at: '2026-07-01T00:00:00Z',
    row_count: 120,
    reports: [
      { name: 'analytics.md', url: '/api/v1/dataset/air-quality/download?file=analytics.md' },
      { name: 'report.pdf', url: '/api/v1/dataset/air-quality/download?file=report.pdf' },
    ],
  },
  {
    slug: 'traffic',
    title: 'Traffic',
    category: 'mobility',
    latest_snapshot_at: null,
    row_count: null,
    reports: [],
  },
];

function primeApi(): void {
  (api.get as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
    if (url === '/admin/datavibes/profiles') return Promise.resolve({ profiles: PROFILES });
    return Promise.resolve({});
  });
  (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({ snapshot_id: 'snap-1' });
}

async function mountTab(): Promise<VueWrapper> {
  primeApi();
  const wrapper = mount(ProfilesTab, { global: { plugins: [i18n] } });
  await flushPromises();
  return wrapper;
}

describe('ProfilesTab.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('fetches the profiles on mount', async () => {
    await mountTab();
    expect(api.get).toHaveBeenCalledWith('/admin/datavibes/profiles');
  });

  it('renders one row per profile with slug, title, category and row count', async () => {
    const wrapper = await mountTab();
    expect(wrapper.findAll('[data-testid="profile-row"]')).toHaveLength(2);
    expect(wrapper.text()).toContain('Air Quality');
    expect(wrapper.text()).toContain('environment');
    expect(wrapper.text()).toContain('120');
  });

  it('renders report links for a profile that has reports', async () => {
    const wrapper = await mountTab();
    const links = wrapper.findAll('[data-testid="report-link-air-quality"]');
    expect(links.length).toBe(2);
    expect(links[0].attributes('href')).toContain('analytics.md');
  });

  it('dispatches Run now for a profile via the run endpoint', async () => {
    const wrapper = await mountTab();
    await wrapper.find('[data-testid="run-air-quality"]').trigger('click');
    await flushPromises();
    expect(api.post).toHaveBeenCalledWith('/admin/datavibes/profiles/air-quality/run');
  });

  it('opens the detail drawer when a profile row is clicked', async () => {
    const wrapper = await mountTab();
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({
      profile: { ...PROFILES[0], config_summary: { rows: 1000 } },
    });
    await wrapper.find('[data-testid="profile-row"]').trigger('click');
    await flushPromises();
    expect(wrapper.find('[data-testid="profile-drawer"]').exists()).toBe(true);
    expect(api.get).toHaveBeenCalledWith('/admin/datavibes/profiles/air-quality');
  });
});
