/**
 * @file `BootdexClassicAdapter.ts`
 * @author Keith Choison <keith@tize.io>
 * @since 1.2.6
 */

import { logger } from '@showdex/utils/debug';
import { detectClassicHost } from '@showdex/utils/host';
import { BootdexAdapter } from './BootdexAdapter';

const l = logger('@showdex/pages/Bootdex/BootdexClassicAdapter');

export class BootdexClassicAdapter extends BootdexAdapter {
  public static override readonly scope = l.scope;
  private static __appReceive?: Showdown.ClientApp['receive'] = null;
  private static readonly __battleReceivers: [
    key: string, // e.g., roomId, battleRoom.id, etc.
    receiver: Showdown.ClientApp['receive'],
  ][] = [];
  private static __colorSchemeObserver?: MutationObserver = null;
  private static readonly __mutex: {
    /**
     * When `false` (default), `BattleRoom` data from `app.receive()` will be `push()`'d to the `battleBuf[]`;
     * once the pre-init async stuff is done, the `battleBuf[]` is processed & flushed first, then `ok` is set to `true`.
     */
    ok: boolean;
    battleBuf: [roomId: string, data: string][];
  } = { ok: false, battleBuf: [] };

  public static receiverFactory?: (key: string) => Showdown.ClientApp['receive'] = null;

  protected static override hook = (): void => {
    if (!detectClassicHost(window)) {
      return;
    }

    l.debug('Hooking into the client\'s app.receive()...');

    this.__appReceive = window.app.receive.bind(window.app) as Showdown.ClientApp['receive'];
    window.app.receive = (data: string): void => {
      // call the original function
      // update (2023/02/04): my dumb ass was calling the bootstrapper() BEFORE this,
      // so I was wondering why the `battle` object was never populated... hmm... LOL
      this.__appReceive(data);

      if (typeof data !== 'string' || !data?.length) {
        return;
      }

      // update (2024/07/21): prior to v1.2.4, the auth username was intercepted via app.user.finishRename(), but sometimes
      // the server will emit a guest user first (e.g., '|updateuser| Guest 2545835|0|mira|\n...'), which when the actual
      // registered user is emitted later (like in the example below), finishRename() doesn't fire again for some reason,
      // so we'll just intercept it right from the source! c: (idk why I didn't do this before LOL)
      // e.g., data = '|updateuser| showdex_testee|1|mira|\n{"blockChallenges":false,"blockPMs":false,...'
      if (data.startsWith('|updateuser|')) {
        const [
          , // i.e., ''
          , // i.e., 'updateuser'
          username, // e.g., ' showdex_testee'
          namedCode, // '0' = not registered; '1' = registered
        ] = data.split('|');

        l.debug(
          'app.receive()', 'Logged in as', namedCode === '1' ? 'registered' : 'guest',
          'user', username?.trim() || '???', '(probably)',
          '\n', data,
        );

        if (!username || namedCode !== '1') {
          return;
        }

        BootdexClassicAdapter.authUsername = username;
      }

      // e.g., data = '>battle-gen9randombattle-1234567890\n|init|battle|\n|title|P1 vs. P2\n|inactive|Battle timer is ON...'
      if (data.startsWith('>battle-')) {
        const roomId = data.slice(1, data.indexOf('\n'));

        l.debug(
          'app.receive()', 'data for BattleRoom', roomId,
          '\n', data,
        );

        if (!this.__mutex.ok) {
          return void this.__mutex.battleBuf.push([roomId, data]);
        }

        let receiver = this.receiverNamed(roomId);

        if (!receiver && typeof this.receiverFactory === 'function') {
          receiver = this.receiverFactory(roomId);

          if (typeof receiver === 'function') {
            this.addReceiver(roomId, receiver);
          }
        }

        if (typeof receiver !== 'function') {
          return;
        }

        receiver(data);
      }
    };

    l.debug('Initializing MutationObserver for client colorScheme changes...');

    // create a MutationObserver to listen for class changes in the <html> tag
    // (in order to dispatch colorScheme updates to Redux)
    this.__colorSchemeObserver = new MutationObserver((mutationList) => {
      const [mutation] = mutationList || [];

      if (mutation?.type !== 'attributes') {
        return;
      }

      // determine the color scheme from the presence of a 'dark' class in <html>
      const { className } = (mutation.target as typeof document.documentElement) || {};
      const colorScheme: Showdown.ColorScheme = className?.includes('dark') ? 'dark' : 'light';

      BootdexClassicAdapter.colorScheme = colorScheme;
    });

    // note: document.documentElement is a ref to the <html> tag
    this.__colorSchemeObserver.observe(document.documentElement, {
      // observe only 'class' attribute on <html>
      attributes: true,
      attributeFilter: ['class'],

      // don't observe the <html>'s children or data
      childList: false,
      characterData: false,
    });
  };

  protected static override ready = (): void => {
    // process any buffered battle `data` first before releasing the shitty 'ok' mutex lock
    this.__mutex.battleBuf.forEach(([roomId, data]) => void this.receiverNamed(roomId)?.(data));
    this.__mutex.battleBuf.length = 0;
    this.__mutex.ok = true;
  };

  public static get receivers() {
    return this.__battleReceivers;
  }

  public static receiverNamed(key: string): Showdown.ClientApp['receive'] {
    if (!key || !this.__battleReceivers.length) {
      return null;
    }

    const index = this.__battleReceivers.findIndex((r) => r[0] === key);

    return this.__battleReceivers[index]?.[1] || null;
  }

  public static addReceiver(
    ...receiver: UnwrapArray<typeof BootdexClassicAdapter.__battleReceivers>
  ): void {
    if (
      !receiver?.[0]
        || typeof receiver[1] !== 'function'
        || this.__battleReceivers.some((r) => r[0] === receiver[0])
    ) {
      return;
    }

    this.__battleReceivers.push(receiver);
  }

  public static removeReceiver(key: string): void {
    if (!key || !this.__battleReceivers.length) {
      return;
    }

    const index = this.__battleReceivers.findIndex((r) => r[0] === key);

    if (index < 0) {
      return;
    }

    this.__battleReceivers.splice(index, 1);
  }

  public static clearReceivers(): void {
    if (!this.__battleReceivers.length) {
      return;
    }

    this.__battleReceivers.length = 0;
  }
}
