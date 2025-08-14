/**
 * @file `BootdexAdapter.ts`
 * @author Keith Choison <keith@tize.io>
 * @since 1.3.0
 */

import {
  type RootState,
  calcdexSlice,
  createStore,
  showdexSlice,
} from '@showdex/redux/store';
import { bakeBakedexBundles, loadI18nextLocales } from '@showdex/utils/app';
import { nonEmptyObject } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import { openIndexedDb, readHonksDb, readSettingsDb } from '@showdex/utils/storage';

const l = logger('@showdex/pages/Bootdex/BootdexAdapter');

export abstract class BootdexAdapter {
  public static readonly scope = l.scope;
  public static readonly store = createStore();
  public static db?: Awaited<ReturnType<typeof openIndexedDb>> = null;
  public static i18next?: Awaited<ReturnType<typeof loadI18nextLocales>> = null;
  private static __initialized = false;

  protected static hook?: () => void | Promise<void> = null;
  protected static ready?: () => void | Promise<void> = null;

  private static async __init(): Promise<void> {
    if (this.__initialized) {
      return;
    }

    if (!this.db) {
      this.db = await openIndexedDb();
    }

    const settings = await readSettingsDb(this.db);

    if (!this.i18next) {
      this.i18next = await loadI18nextLocales(settings?.locale);
    }

    if (nonEmptyObject(settings)) {
      delete settings.colorScheme;

      this.store.dispatch(showdexSlice.actions.updateSettings({
        ...settings,
        locale: settings.locale || this.i18next?.language || 'en', // fucc it yolo
      }));
    }

    const honks = await readHonksDb(this.db);

    if (nonEmptyObject(honks)) {
      this.store.dispatch(calcdexSlice.actions.restore(honks));
    }

    void bakeBakedexBundles({ db: this.db, store: this.store });
    this.__initialized = true;
  }

  public static get rootState() {
    return this.store.getState() as RootState;
  }

  public static get colorScheme(): Showdown.ColorScheme {
    return this.rootState?.showdex?.settings?.colorScheme;
  }

  public static set colorScheme(value: Showdown.ColorSchemeOption) {
    this.store.dispatch(showdexSlice.actions.setColorScheme(value));
  }

  public static get authUsername(): string {
    return this.rootState?.showdex?.authUsername;
  }

  public static set authUsername(value: string) {
    this.store.dispatch(showdexSlice.actions.setAuthUsername(value?.trim()));
  }

  public static async run(): Promise<void> {
    l.debug('beep boop bootdex is now booting the big booty');

    try {
      void this.hook?.();
    } catch (error) {
      l.error('Couldn\'t hook() in run() cuz of', error);
    }

    try {
      await this.__init();
      await this.ready?.();
    } catch (error) {
      l.error('Couldn\'t run() cuz of', error);
    }

    l.debug('beep boop job done');
  }
}
