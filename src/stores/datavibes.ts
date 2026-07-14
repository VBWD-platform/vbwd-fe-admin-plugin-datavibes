/**
 * Datavibes admin store (S125 · Data Generator page).
 *
 * Drives the two tabs of the "Data Generator" page — Datavibes Profiles and
 * Profiles Cron Management — against the backend contract in S125 §3.5. All
 * endpoint knowledge lives in `datavibesApi`; the store owns list/detail state,
 * loading/error flags and the run/save orchestration.
 */
import { defineStore } from 'pinia';
import {
  datavibesApi,
  type DatavibesImportOptions,
  type DatavibesImportResult,
  type DatavibesProfile,
  type DatavibesProfileDetail,
  type DatavibesProfileInput,
  type DatavibesRunResult,
  type DatavibesSchedule,
  type DatavibesScheduleInput,
} from '../api/datavibes';

interface DatavibesStoreState {
  profiles: DatavibesProfile[];
  currentProfile: DatavibesProfileDetail | null;
  schedules: DatavibesSchedule[];
  loading: boolean;
  error: string | null;
}

function toMessage(caught: unknown): string {
  return caught instanceof Error ? caught.message : String(caught);
}

export const useDatavibesStore = defineStore('datavibes-admin', {
  state: (): DatavibesStoreState => ({
    profiles: [],
    currentProfile: null,
    schedules: [],
    loading: false,
    error: null,
  }),

  actions: {
    // ── Profiles ──────────────────────────────────────────────────────────────
    async fetchProfiles(): Promise<void> {
      this.loading = true;
      this.error = null;
      try {
        this.profiles = await datavibesApi.listProfiles();
      } catch (caught) {
        this.error = toMessage(caught);
      } finally {
        this.loading = false;
      }
    },

    async fetchProfile(slug: string): Promise<DatavibesProfileDetail> {
      this.loading = true;
      this.error = null;
      try {
        this.currentProfile = await datavibesApi.getProfile(slug);
        return this.currentProfile;
      } finally {
        this.loading = false;
      }
    },

    async runProfile(slug: string): Promise<DatavibesRunResult> {
      return datavibesApi.runProfile(slug);
    },

    async createProfile(input: DatavibesProfileInput): Promise<DatavibesProfile> {
      const created = await datavibesApi.createProfile(input);
      await this.fetchProfiles();
      return created;
    },

    async importProfiles(
      envelope: unknown,
      options?: DatavibesImportOptions,
    ): Promise<DatavibesImportResult> {
      const result = await datavibesApi.importProfiles(envelope, options);
      await this.fetchProfiles();
      return result;
    },

    // ── Schedules ───────────────────────────────────────────────────────────────
    async fetchSchedules(): Promise<void> {
      this.loading = true;
      this.error = null;
      try {
        this.schedules = await datavibesApi.listSchedules();
      } catch (caught) {
        this.error = toMessage(caught);
      } finally {
        this.loading = false;
      }
    },

    async saveSchedule(slug: string, input: DatavibesScheduleInput): Promise<DatavibesSchedule> {
      const saved = await datavibesApi.saveSchedule(slug, input);
      const index = this.schedules.findIndex((schedule) => schedule.dataset_slug === slug);
      if (index >= 0) this.schedules.splice(index, 1, saved);
      return saved;
    },

    async runSchedule(slug: string): Promise<DatavibesRunResult> {
      return datavibesApi.runSchedule(slug);
    },
  },
});
