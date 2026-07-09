<template>
  <div class="datavibes-view">
    <div class="datavibes-view__header">
      <h2>{{ $t('datavibes.title') }}</h2>
    </div>

    <nav
      class="datavibes-tabs"
      role="tablist"
    >
      <button
        type="button"
        class="datavibes-tab"
        :class="{ 'datavibes-tab--active': activeTab === 'profiles' }"
        data-testid="tab-profiles"
        role="tab"
        :aria-selected="activeTab === 'profiles'"
        @click="activeTab = 'profiles'"
      >
        {{ $t('datavibes.tabs.profiles') }}
      </button>
      <button
        type="button"
        class="datavibes-tab"
        :class="{ 'datavibes-tab--active': activeTab === 'cron' }"
        data-testid="tab-cron"
        role="tab"
        :aria-selected="activeTab === 'cron'"
        @click="activeTab = 'cron'"
      >
        {{ $t('datavibes.tabs.cron') }}
      </button>
    </nav>

    <section class="datavibes-tab-panel">
      <ProfilesTab v-if="activeTab === 'profiles'" />
      <CronManagementTab v-else />
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ProfilesTab from '../components/ProfilesTab.vue';
import CronManagementTab from '../components/CronManagementTab.vue';

type DataGeneratorTab = 'profiles' | 'cron';

const activeTab = ref<DataGeneratorTab>('profiles');
</script>

<style scoped>
.datavibes-view {
  background: var(--vbwd-surface-color, #ffffff);
  padding: 1.25rem;
  border-radius: 8px;
}

.datavibes-view__header h2 {
  margin: 0 0 1rem;
  color: var(--vbwd-heading-color, #2c3e50);
}

.datavibes-tabs {
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid var(--vbwd-border-color, #e5e7eb);
  margin-bottom: 1rem;
}

.datavibes-tab {
  padding: 0.5rem 1rem;
  border: none;
  background: none;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  color: var(--vbwd-muted-color, #6b7280);
}

.datavibes-tab--active {
  color: var(--vbwd-primary-color, #2563eb);
  border-bottom-color: var(--vbwd-primary-color, #2563eb);
  font-weight: 600;
}
</style>
