/**
 * @file `exportMultiPokePastes.ts`
 * @author Keith Choison <keith@tize.io>
 * @since 1.2.4
 */

import { type GenerationNum } from '@smogon/calc';
import { exportPokePaste } from './exportPokePaste';

/**
 * Converts the provided `presets[]` into `config.delimiter`-deliminated PokéPastes.
 *
 * * Returns `null` if conversion fails for whatever reason.
 *
 * @since 1.2.4
 */
export const exportMultiPokePaste = (
  presets: Parameters<typeof exportPokePaste>[0][],
  config?: Parameters<typeof exportPokePaste>[1] & {
    delimiter?: string;
  },
): string => {
  const {
    format,
    delimiter = '\n\n',
    ...exportConfig
  } = config || {};

  if (!presets?.length) {
    return null;
  }

  return presets
    .map((p) => exportPokePaste(p, { ...exportConfig, format }))
    .filter(Boolean)
    .join(delimiter);
};
