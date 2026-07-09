import { describe, it, expect, beforeEach } from 'vitest';
import { extensionRegistry } from '@/plugins/extensionRegistry';
import { PluginRegistry, type IPlatformSDK } from 'vbwd-view-component';
import datavibesAdminPlugin from '../../index';

describe('vbwd-datavibes admin plugin — identity + nav', () => {
  beforeEach(() => extensionRegistry.clear());

  it('exposes the plugin id "vbwd-datavibes"', () => {
    expect(datavibesAdminPlugin.name).toBe('vbwd-datavibes');
  });

  it('declares a dependency on the dataset plugin', () => {
    expect(datavibesAdminPlugin.dependencies).toContain('dataset');
  });

  it('registers a "Data Generator" item under the Sales section on activate', () => {
    datavibesAdminPlugin.activate?.();

    const salesItems = extensionRegistry.getSectionItems('sales');
    const item = salesItems.find((entry) => entry.id === 'data-generator');

    expect(item).toBeTruthy();
    // AdminSidebar renders injected labels verbatim (no $t), so the nav label is a
    // literal string, matching the `dataset` peer's 'Datasets'.
    expect(item?.label).toBe('Data Generator');
    expect(item?.to).toBe('/data-generator');
    expect(item?.requiredPermission).toBe('datavibes.view');
  });

  it('removes its Sales item on deactivate', () => {
    datavibesAdminPlugin.activate?.();
    datavibesAdminPlugin.deactivate?.();

    const stillThere = extensionRegistry
      .getSectionItems('sales')
      .find((entry) => entry.id === 'data-generator');
    expect(stillThere).toBeFalsy();
  });
});

describe('vbwd-datavibes admin plugin — dependency resolution', () => {
  it('throws at registry resolve when the dataset peer is missing', async () => {
    const registry = new PluginRegistry();
    registry.register(datavibesAdminPlugin);

    const sdk = {
      addRoute: () => undefined,
      addTranslations: () => undefined,
    } as unknown as IPlatformSDK;

    await expect(registry.installAll(sdk)).rejects.toThrow(/dataset/);
  });

  it('resolves cleanly when the dataset peer is registered', async () => {
    const registry = new PluginRegistry();
    registry.register({ name: 'dataset', version: '26.6.1' });
    registry.register(datavibesAdminPlugin);

    const installed: string[] = [];
    const sdk = {
      addRoute: () => undefined,
      addTranslations: () => undefined,
    } as unknown as IPlatformSDK;

    await registry.installAll(sdk);
    installed.push('dataset', datavibesAdminPlugin.name);
    expect(installed).toContain('vbwd-datavibes');
  });
});
