import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * False while React is hydrating server HTML, true once the page is alive in
 * the browser. Anything that depends on the browser's clock or time zone
 * renders behind this, so the server, which keeps UTC, never paints it first.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
