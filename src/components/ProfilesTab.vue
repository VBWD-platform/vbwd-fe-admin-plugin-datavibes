<template>
  <div class="datavibes-profiles">
    <p
      v-if="store.error"
      class="datavibes-profiles__error"
      data-testid="profiles-error"
    >
      {{ store.error }}
    </p>

    <p
      v-if="statusMessage"
      class="datavibes-profiles__status"
      data-testid="profiles-status"
    >
      {{ statusMessage }}
    </p>

    <p
      v-if="store.loading && !store.profiles.length"
      class="datavibes-profiles__empty"
    >
      {{ $t('datavibes.profiles.loading') }}
    </p>
    <p
      v-else-if="!store.profiles.length"
      class="datavibes-profiles__empty"
    >
      {{ $t('datavibes.profiles.empty') }}
    </p>

    <table
      v-else
      class="datavibes-table"
    >
      <thead>
        <tr>
          <th>{{ $t('datavibes.profiles.columns.slug') }}</th>
          <th>{{ $t('datavibes.profiles.columns.title') }}</th>
          <th>{{ $t('datavibes.profiles.columns.category') }}</th>
          <th>{{ $t('datavibes.profiles.columns.latestSnapshot') }}</th>
          <th>{{ $t('datavibes.profiles.columns.rowCount') }}</th>
          <th>{{ $t('datavibes.profiles.columns.reports') }}</th>
          <th>{{ $t('datavibes.profiles.columns.actions') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="profile in store.profiles"
          :key="profile.slug"
          class="datavibes-row"
          data-testid="profile-row"
          @click="openDrawer(profile.slug)"
        >
          <td>{{ profile.slug }}</td>
          <td>{{ profile.title }}</td>
          <td>{{ profile.category ?? '—' }}</td>
          <td>{{ formatTimestamp(profile.latest_snapshot_at) }}</td>
          <td>{{ profile.row_count ?? '—' }}</td>
          <td @click.stop>
            <a
              v-for="report in profile.reports"
              :key="report.name"
              :href="report.url"
              class="datavibes-report-link"
              :data-testid="`report-link-${profile.slug}`"
              target="_blank"
              rel="noopener"
            >{{ report.name }}</a>
          </td>
          <td @click.stop>
            <button
              type="button"
              class="datavibes-btn"
              :data-testid="`run-${profile.slug}`"
              :disabled="runningSlug === profile.slug"
              @click="runNow(profile.slug)"
            >
              {{ runningSlug === profile.slug ? $t('datavibes.profiles.running') : $t('datavibes.profiles.runNow') }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <aside
      v-if="drawerProfile"
      class="datavibes-drawer"
      data-testid="profile-drawer"
    >
      <header class="datavibes-drawer__header">
        <h3>{{ drawerProfile.title }}</h3>
        <button
          type="button"
          class="datavibes-btn"
          data-testid="drawer-close"
          @click="drawerProfile = null"
        >
          {{ $t('datavibes.drawer.close') }}
        </button>
      </header>

      <h4>{{ $t('datavibes.drawer.config') }}</h4>
      <pre class="datavibes-drawer__config">{{ drawerConfig }}</pre>

      <h4>{{ $t('datavibes.drawer.heading') }}</h4>
      <ul>
        <li
          v-for="report in drawerProfile.reports"
          :key="report.name"
        >
          <a
            :href="report.url"
            target="_blank"
            rel="noopener"
          >{{ report.name }}</a>
        </li>
      </ul>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDatavibesStore } from '../stores/datavibes';
import type { DatavibesProfileDetail } from '../api/datavibes';

const store = useDatavibesStore();
const { t } = useI18n();

const runningSlug = ref<string | null>(null);
const statusMessage = ref<string>('');
const drawerProfile = ref<DatavibesProfileDetail | null>(null);

const drawerConfig = computed(() =>
  drawerProfile.value ? JSON.stringify(drawerProfile.value.config_summary ?? {}, null, 2) : '',
);

function formatTimestamp(value: string | null): string {
  if (!value) return t('datavibes.status.never');
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

async function runNow(slug: string): Promise<void> {
  runningSlug.value = slug;
  statusMessage.value = '';
  try {
    await store.runProfile(slug);
    statusMessage.value = t('datavibes.profiles.runOk', { slug });
    await store.fetchProfiles();
  } catch {
    statusMessage.value = t('datavibes.profiles.runFailed', { slug });
  } finally {
    runningSlug.value = null;
  }
}

async function openDrawer(slug: string): Promise<void> {
  drawerProfile.value = await store.fetchProfile(slug);
}

onMounted(() => store.fetchProfiles());
</script>

<style scoped>
.datavibes-profiles {
  position: relative;
}

.datavibes-table {
  width: 100%;
  border-collapse: collapse;
}

.datavibes-table th,
.datavibes-table td {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--vbwd-border-color, #e5e7eb);
  text-align: left;
}

.datavibes-row {
  cursor: pointer;
}

.datavibes-report-link {
  display: inline-block;
  margin-right: 0.5rem;
}

.datavibes-btn {
  padding: 0.35rem 0.75rem;
  border: 1px solid var(--vbwd-border-color, #d1d5db);
  border-radius: 4px;
  background: var(--vbwd-surface-color, #ffffff);
  cursor: pointer;
}

.datavibes-btn:disabled {
  opacity: 0.6;
  cursor: default;
}

.datavibes-profiles__error {
  background: #fee2e2;
  color: #991b1b;
  padding: 0.6rem 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.datavibes-profiles__status {
  background: #ecfdf5;
  color: #065f46;
  padding: 0.6rem 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.datavibes-drawer {
  margin-top: 1.5rem;
  padding: 1rem;
  border: 1px solid var(--vbwd-border-color, #e5e7eb);
  border-radius: 6px;
  background: var(--vbwd-surface-color, #fafafa);
}

.datavibes-drawer__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.datavibes-drawer__config {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
