import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { createI18n } from 'vue-i18n';
import { api } from '@/api';
import CronManagementTab from '../../src/components/CronManagementTab.vue';
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

const SCHEDULES = [
  {
    dataset_slug: 'air-quality',
    cron_expr: '0 3 * * *',
    enabled: true,
    last_run_at: '2026-07-08T03:00:00Z',
    last_status: 'ok',
    last_row_count: 120,
    next_run_at: '2026-07-09T03:00:00Z',
  },
];

function primeApi(): void {
  (api.get as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
    if (url === '/admin/datavibes/schedules') return Promise.resolve({ schedules: SCHEDULES });
    return Promise.resolve({});
  });
  (api.put as ReturnType<typeof vi.fn>).mockResolvedValue(SCHEDULES[0]);
  (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({ snapshot_id: 'snap-1' });
}

async function mountTab(): Promise<VueWrapper> {
  primeApi();
  const wrapper = mount(CronManagementTab, { global: { plugins: [i18n] } });
  await flushPromises();
  return wrapper;
}

describe('CronManagementTab.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('fetches the schedules on mount and renders a row per schedule', async () => {
    const wrapper = await mountTab();
    expect(api.get).toHaveBeenCalledWith('/admin/datavibes/schedules');
    expect(wrapper.findAll('[data-testid="schedule-row"]')).toHaveLength(1);
    expect(wrapper.text()).toContain('air-quality');
  });

  it('shows the last-run status badge', async () => {
    const wrapper = await mountTab();
    expect(wrapper.find('[data-testid="status-air-quality"]').text().toLowerCase()).toContain('ok');
  });

  it('flags an invalid cron expression and blocks save', async () => {
    const wrapper = await mountTab();
    await wrapper.find('[data-testid="cron-air-quality"]').setValue('not valid');
    await flushPromises();
    expect(wrapper.find('[data-testid="cron-error-air-quality"]').exists()).toBe(true);

    await wrapper.find('[data-testid="save-air-quality"]').trigger('click');
    await flushPromises();
    expect(api.put).not.toHaveBeenCalled();
  });

  it('saves a valid cron expression + enabled flag via PUT', async () => {
    const wrapper = await mountTab();
    await wrapper.find('[data-testid="cron-air-quality"]').setValue('0 6 * * *');
    await flushPromises();
    await wrapper.find('[data-testid="save-air-quality"]').trigger('click');
    await flushPromises();
    expect(api.put).toHaveBeenCalledWith('/admin/datavibes/schedules/air-quality', {
      cron_expr: '0 6 * * *',
      enabled: true,
    });
  });

  it('runs a scheduled profile now via the schedule run endpoint', async () => {
    const wrapper = await mountTab();
    await wrapper.find('[data-testid="run-air-quality"]').trigger('click');
    await flushPromises();
    expect(api.post).toHaveBeenCalledWith('/admin/datavibes/schedules/air-quality/run');
  });

  it('previews the next fire times for a valid cron expression', async () => {
    const wrapper = await mountTab();
    await wrapper.find('[data-testid="cron-air-quality"]').setValue('0 6 * * *');
    await flushPromises();
    expect(wrapper.find('[data-testid="cron-preview-air-quality"]').exists()).toBe(true);
  });
});
