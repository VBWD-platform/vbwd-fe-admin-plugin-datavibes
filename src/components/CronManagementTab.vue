<template>
  <div class="datavibes-cron">
    <p
      v-if="store.error"
      class="datavibes-cron__error"
      data-testid="cron-tab-error"
    >
      {{ store.error }}
    </p>

    <p
      v-if="statusMessage"
      class="datavibes-cron__status"
      data-testid="cron-tab-status"
    >
      {{ statusMessage }}
    </p>

    <p
      v-if="store.loading && !store.schedules.length"
      class="datavibes-cron__empty"
    >
      {{ $t('datavibes.cron.loading') }}
    </p>
    <p
      v-else-if="!store.schedules.length"
      class="datavibes-cron__empty"
    >
      {{ $t('datavibes.cron.empty') }}
    </p>

    <table
      v-else
      class="datavibes-table"
    >
      <thead>
        <tr>
          <th>{{ $t('datavibes.cron.columns.slug') }}</th>
          <th>{{ $t('datavibes.cron.columns.cron') }}</th>
          <th>{{ $t('datavibes.cron.columns.enabled') }}</th>
          <th>{{ $t('datavibes.cron.columns.lastRun') }}</th>
          <th>{{ $t('datavibes.cron.columns.status') }}</th>
          <th>{{ $t('datavibes.cron.columns.nextRun') }}</th>
          <th>{{ $t('datavibes.cron.columns.actions') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="schedule in store.schedules"
          :key="schedule.dataset_slug"
          class="datavibes-row"
          data-testid="schedule-row"
        >
          <td>{{ schedule.dataset_slug }}</td>
          <td>
            <input
              :value="editFor(schedule.dataset_slug).cron_expr"
              type="text"
              class="datavibes-input"
              :data-testid="`cron-${schedule.dataset_slug}`"
              @input="onCronInput(schedule.dataset_slug, $event)"
            >
            <span
              v-if="!isValidCron(editFor(schedule.dataset_slug).cron_expr)"
              class="datavibes-input__error"
              :data-testid="`cron-error-${schedule.dataset_slug}`"
            >
              {{ $t('datavibes.cron.invalid') }}
            </span>
            <ul
              v-else
              class="datavibes-preview"
              :data-testid="`cron-preview-${schedule.dataset_slug}`"
            >
              <li
                v-for="fire in previewFor(schedule.dataset_slug)"
                :key="fire"
              >
                {{ fire }}
              </li>
            </ul>
          </td>
          <td>
            <input
              :checked="editFor(schedule.dataset_slug).enabled"
              type="checkbox"
              :data-testid="`enabled-${schedule.dataset_slug}`"
              @change="onEnabledChange(schedule.dataset_slug, $event)"
            >
          </td>
          <td>{{ formatTimestamp(schedule.last_run_at) }}</td>
          <td>
            <span
              class="datavibes-badge"
              :class="`datavibes-badge--${schedule.last_status ?? 'none'}`"
              :data-testid="`status-${schedule.dataset_slug}`"
            >
              {{ statusLabel(schedule.last_status) }}
            </span>
          </td>
          <td>{{ formatTimestamp(schedule.next_run_at) }}</td>
          <td>
            <button
              type="button"
              class="datavibes-btn"
              :data-testid="`save-${schedule.dataset_slug}`"
              @click="save(schedule.dataset_slug)"
            >
              {{ $t('datavibes.cron.save') }}
            </button>
            <button
              type="button"
              class="datavibes-btn"
              :data-testid="`run-${schedule.dataset_slug}`"
              @click="runNow(schedule.dataset_slug)"
            >
              {{ $t('datavibes.cron.runNow') }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDatavibesStore } from '../stores/datavibes';
import { isValidCron, nextFireTimes } from '../utils/cron';
import type { DatavibesScheduleStatus } from '../api/datavibes';

const PREVIEW_COUNT = 5;

interface ScheduleEdit {
  cron_expr: string;
  enabled: boolean;
}

const store = useDatavibesStore();
const { t } = useI18n();

const edits = reactive<Record<string, ScheduleEdit>>({});
const statusMessage = ref<string>('');

function seedEdits(): void {
  for (const schedule of store.schedules) {
    if (!edits[schedule.dataset_slug]) {
      edits[schedule.dataset_slug] = {
        cron_expr: schedule.cron_expr,
        enabled: schedule.enabled,
      };
    }
  }
}

function editFor(slug: string): ScheduleEdit {
  if (!edits[slug]) edits[slug] = { cron_expr: '', enabled: false };
  return edits[slug];
}

function onCronInput(slug: string, event: Event): void {
  editFor(slug).cron_expr = (event.target as HTMLInputElement).value;
}

function onEnabledChange(slug: string, event: Event): void {
  editFor(slug).enabled = (event.target as HTMLInputElement).checked;
}

function previewFor(slug: string): string[] {
  return nextFireTimes(editFor(slug).cron_expr, PREVIEW_COUNT).map((fire) => fire.toUTCString());
}

function formatTimestamp(value: string | null): string {
  if (!value) return t('datavibes.status.never');
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

function statusLabel(status: DatavibesScheduleStatus | null): string {
  if (status === 'ok') return t('datavibes.status.ok');
  if (status === 'failed') return t('datavibes.status.failed');
  if (status === 'running') return t('datavibes.status.running');
  return t('datavibes.status.never');
}

async function save(slug: string): Promise<void> {
  const edit = editFor(slug);
  if (!isValidCron(edit.cron_expr)) return;
  statusMessage.value = '';
  await store.saveSchedule(slug, { cron_expr: edit.cron_expr, enabled: edit.enabled });
  statusMessage.value = t('datavibes.cron.saved', { slug });
}

async function runNow(slug: string): Promise<void> {
  await store.runSchedule(slug);
  await store.fetchSchedules();
}

watch(() => store.schedules, seedEdits, { deep: true });

onMounted(async () => {
  await store.fetchSchedules();
  seedEdits();
});
</script>

<style scoped>
.datavibes-table {
  width: 100%;
  border-collapse: collapse;
}

.datavibes-table th,
.datavibes-table td {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--vbwd-border-color, #e5e7eb);
  text-align: left;
  vertical-align: top;
}

.datavibes-input {
  padding: 0.35rem 0.5rem;
  border: 1px solid var(--vbwd-border-color, #d1d5db);
  border-radius: 4px;
  font-family: var(--vbwd-font-mono, monospace);
}

.datavibes-input__error {
  display: block;
  color: #991b1b;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.datavibes-preview {
  margin: 0.25rem 0 0;
  padding-left: 1rem;
  font-size: 0.8rem;
  color: var(--vbwd-muted-color, #6b7280);
}

.datavibes-btn {
  padding: 0.35rem 0.75rem;
  margin-right: 0.35rem;
  border: 1px solid var(--vbwd-border-color, #d1d5db);
  border-radius: 4px;
  background: var(--vbwd-surface-color, #ffffff);
  cursor: pointer;
}

.datavibes-badge {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
}

.datavibes-badge--ok {
  background: #ecfdf5;
  color: #065f46;
}

.datavibes-badge--failed {
  background: #fee2e2;
  color: #991b1b;
}

.datavibes-badge--running {
  background: #eff6ff;
  color: #1e40af;
}

.datavibes-badge--none {
  background: #f3f4f6;
  color: #6b7280;
}

.datavibes-cron__error {
  background: #fee2e2;
  color: #991b1b;
  padding: 0.6rem 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.datavibes-cron__status {
  background: #ecfdf5;
  color: #065f46;
  padding: 0.6rem 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}
</style>
