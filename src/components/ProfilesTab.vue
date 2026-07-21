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

    <div
      v-if="store.failedProfiles.length"
      class="datavibes-profiles__warning"
      data-testid="profiles-failed"
    >
      <strong>{{ $t('datavibes.profiles.failedHeading', { count: store.failedProfiles.length }) }}</strong>
      <ul>
        <li
          v-for="failure in store.failedProfiles"
          :key="failure.slug"
        >
          <code>{{ failure.slug }}</code> — {{ failure.error }}
        </li>
      </ul>
    </div>

    <div class="datavibes-profiles__toolbar">
      <button
        type="button"
        class="datavibes-btn"
        data-testid="new-profile-button"
        @click="toggleCreateForm"
      >
        {{ $t('datavibes.profiles.newProfile') }}
      </button>

      <label
        class="datavibes-btn datavibes-import-label"
        data-testid="import-label"
      >
        {{ $t('datavibes.profiles.import') }}
        <input
          type="file"
          accept="application/json,.json"
          class="datavibes-import-input"
          data-testid="import-file"
          @change="onImportFile"
        >
      </label>
    </div>

    <form
      v-if="showCreateForm"
      class="datavibes-create-form"
      data-testid="profile-create-form"
      @submit.prevent="submitCreate"
    >
      <label class="datavibes-field">
        <span>{{ $t('datavibes.profiles.form.slug') }}</span>
        <input
          v-model="createForm.slug"
          type="text"
          required
          data-testid="create-slug"
        >
      </label>
      <label class="datavibes-field">
        <span>{{ $t('datavibes.profiles.form.title') }}</span>
        <input
          v-model="createForm.title"
          type="text"
          data-testid="create-title"
        >
      </label>
      <label class="datavibes-field">
        <span>{{ $t('datavibes.profiles.form.category') }}</span>
        <input
          v-model="createForm.category"
          type="text"
          required
          data-testid="create-category"
        >
      </label>
      <label class="datavibes-field">
        <span>{{ $t('datavibes.profiles.form.definition') }}</span>
        <textarea
          v-model="createForm.definition"
          rows="8"
          data-testid="create-definition"
          :placeholder="$t('datavibes.profiles.form.definitionPlaceholder')"
        />
      </label>
      <div class="datavibes-create-form__actions">
        <button
          type="submit"
          class="datavibes-btn"
          data-testid="create-submit"
          :disabled="creating"
        >
          {{ creating ? $t('datavibes.profiles.creating') : $t('datavibes.profiles.create') }}
        </button>
        <button
          type="button"
          class="datavibes-btn"
          data-testid="create-cancel"
          @click="showCreateForm = false"
        >
          {{ $t('datavibes.profiles.cancel') }}
        </button>
      </div>
    </form>

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
import { missingDefinitionBlocks } from '../utils/profileDefinition';
import type { DatavibesProfileDetail } from '../api/datavibes';

const store = useDatavibesStore();
const { t } = useI18n();

const runningSlug = ref<string | null>(null);
const statusMessage = ref<string>('');
const drawerProfile = ref<DatavibesProfileDetail | null>(null);

const showCreateForm = ref(false);
const creating = ref(false);
const createForm = ref({ slug: '', title: '', category: '', definition: '' });

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

/**
 * A definition datavibes can load, used to seed the editor. Starting the
 * operator from a valid skeleton (rather than an empty box) is the cheapest way
 * to stop another metadata-only profile being created.
 */
const STARTER_DEFINITION = [
  'schema:',
  '  - name: value',
  '    dtype: float',
  'sources:',
  '  - type: static',
  '    rows: []',
  '',
].join('\n');

function toggleCreateForm(): void {
  showCreateForm.value = !showCreateForm.value;
  if (showCreateForm.value) {
    createForm.value = {
      slug: '',
      title: '',
      category: '',
      definition: STARTER_DEFINITION,
    };
  }
}

async function submitCreate(): Promise<void> {
  statusMessage.value = '';
  // Refuse the metadata-only body that datavibes cannot load — creating it once
  // bricked the whole profile list. The backend validates authoritatively too.
  const missingBlocks = missingDefinitionBlocks(createForm.value.definition);
  if (missingBlocks.length) {
    statusMessage.value = t('datavibes.profiles.missingBlocks', {
      blocks: missingBlocks.join(', '),
    });
    return;
  }

  creating.value = true;
  try {
    const definitionBody = createForm.value.definition;
    const created = await store.createProfile({
      slug: createForm.value.slug.trim(),
      title: createForm.value.title.trim() || undefined,
      category: createForm.value.category.trim() || undefined,
      // Send the YAML verbatim (trailing newlines can matter); only a
      // whitespace-only body is treated as "no definition".
      definition: definitionBody.trim() ? definitionBody : undefined,
    });
    statusMessage.value = t('datavibes.profiles.createOk', { slug: created.slug });
    showCreateForm.value = false;
  } catch (caught) {
    // Surface the backend's own validation text (e.g. "'schema' must be a
    // non-empty list") instead of a generic failure the operator cannot act on.
    statusMessage.value = backendMessage(caught) || t('datavibes.profiles.createFailed');
  } finally {
    creating.value = false;
  }
}

/** Pull the API's structured `error` (or its message) off a rejected call. */
function backendMessage(caught: unknown): string {
  const structured = (caught as { data?: { error?: string } } | null)?.data?.error;
  if (structured) return structured;
  return caught instanceof Error ? caught.message : '';
}

async function onImportFile(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  statusMessage.value = '';
  try {
    const envelope = JSON.parse(await file.text());
    const result = await store.importProfiles(envelope);
    statusMessage.value = t('datavibes.profiles.importOk', {
      created: result.created,
      updated: result.updated,
    });
  } catch (caught) {
    statusMessage.value = backendMessage(caught) || t('datavibes.profiles.importFailed');
  } finally {
    input.value = '';
  }
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

.datavibes-profiles__toolbar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.datavibes-import-label {
  display: inline-flex;
  align-items: center;
}

.datavibes-import-input {
  display: none;
}

.datavibes-create-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  margin-bottom: 1.25rem;
  border: 1px solid var(--vbwd-border-color, #e5e7eb);
  border-radius: 6px;
  background: var(--vbwd-surface-color, #fafafa);
}

.datavibes-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.datavibes-field span {
  font-weight: 600;
}

.datavibes-field input,
.datavibes-field textarea {
  padding: 0.4rem 0.6rem;
  border: 1px solid var(--vbwd-border-color, #d1d5db);
  border-radius: 4px;
  background: var(--vbwd-surface-color, #ffffff);
  font-family: inherit;
}

.datavibes-field textarea {
  font-family: var(--vbwd-font-mono, monospace);
  white-space: pre;
}

.datavibes-create-form__actions {
  display: flex;
  gap: 0.5rem;
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

.datavibes-profiles__warning {
  background: #fffbeb;
  color: #92400e;
  padding: 0.6rem 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.datavibes-profiles__warning ul {
  margin: 0.4rem 0 0;
  padding-left: 1.2rem;
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
