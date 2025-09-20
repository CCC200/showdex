/**
 * @file `locales.ts`
 * @author Keith Choison <keith@tize.io>
 * @since 1.2.1
 */

import { type ShowdexLocaleBundle } from '@showdex/interfaces/app';

/**
 * Locales currently bundled with this build of Showdex.
 *
 * @since 1.2.1
 */
export const ShowdexLocaleBundles: ShowdexLocaleBundle[] = [
  {
    id: 'i18n.en',
    ext: 'json',
    ntt: 'locale',
    name: '(i18n)',
    label: 'EN',
    locale: 'en',
    author: 'BOT Keith',
    desc: '(i18n)',
    created: '2024-01-05T12:18:35.813Z',
    updated: '2025-09-20T07:14:46.978Z',
    disabled: false,
  },
  {
    id: 'i18n.fr',
    ext: 'json',
    ntt: 'locale',
    name: '(i18n)',
    label: 'FR',
    locale: 'fr',
    author: 'Sykless, Betcheg, ChatGPT & Google Translate',
    desc: '(i18n)',
    created: '2024-01-08T16:46:10.432Z',
    updated: '2025-09-20T07:14:49.973Z',
    disabled: false,
  },
];
