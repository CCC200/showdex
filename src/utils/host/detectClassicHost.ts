/**
 * Detects if the provided `host` is running the classic Showdown Backbone.js client.
 *
 * * Mostly for TypeScript lol.
 *
 * @example
 * ```ts
 * if (detectClassicHost(window)) {
 *   return void console.log(window.app.user?.attributes?.name); // -> 'showdex_testee'
 * }
 *
 * console.log(window.app?.user?.attributes?.name); // -> undefined (possibly)
 * ```
 * @since 1.2.6
 */
export const detectClassicHost = (
  host: Window,
): host is Window & Showdown.ClientGlobals => (
  (!host?.__SHOWDEX_HOST || host.__SHOWDEX_HOST === 'classic')
    && typeof host?.app?.receive === 'function'
);
