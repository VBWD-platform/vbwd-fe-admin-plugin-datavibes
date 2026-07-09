/**
 * Datavibes Admin Plugin (S125 · Increment 3)
 *
 * Adds the "Data Generator" page to the admin backoffice — a tabbed page that
 * lets an operator list and run datavibes dataset profiles (Tab 1) and manage
 * their cron schedules (Tab 2), against the backend `vbwd_datavibes` plugin
 * (S125 §3.5).
 *
 * Depends on the `dataset` plugin: report companions are served through the
 * existing dataset download routes, so the platform's PluginRegistry must
 * resolve `dataset` before this plugin (declared dependency below).
 */
import type { IPlugin, IPlatformSDK } from 'vbwd-view-component';
import { extensionRegistry } from '../../vue/src/plugins/extensionRegistry';
import en from './locales/en.json';

// AdminSidebar renders an injected `sectionItems` label verbatim (`{{ item.label }}`,
// no `$t`), so the nav label must be a literal string — the `dataset` peer does the
// same with 'Datasets'. Translating injected labels would be a core change.
// The i18n key `nav.dataGenerator` still exists for in-page use.
const DATAVIBES_ADMIN_EXTENSION = {
  sectionItems: {
    sales: [
      {
        id: 'data-generator',
        label: 'Data Generator',
        to: '/data-generator',
        icon: 'grid',
        requiredPermission: 'datavibes.view',
      },
    ],
  },
};

export const datavibesAdminPlugin: IPlugin = {
  name: 'vbwd-datavibes',
  version: '26.7.0',
  description: 'Data Generator — run datavibes profiles and manage their cron schedules',
  dependencies: ['dataset'],

  install(sdk: IPlatformSDK) {
    sdk.addTranslations('en', en as Record<string, unknown>);
    sdk.addRoute({
      path: '/data-generator',
      name: 'DataGenerator',
      component: () => import('./src/views/DataGenerator.vue'),
      meta: { requiredPermission: 'datavibes.view' },
    });
  },

  activate() {
    extensionRegistry.register('vbwd-datavibes', DATAVIBES_ADMIN_EXTENSION);
  },

  deactivate() {
    extensionRegistry.unregister('vbwd-datavibes');
  },
};

export default datavibesAdminPlugin;
