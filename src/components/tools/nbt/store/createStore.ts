// Path: src/components/tools/nbt/store/createStore.ts
//
// A small stand-in for the slice of zustand the editor uses.
//
// The site does not depend on zustand, and this tool needs exactly one store, so
// the same behaviour is reproduced with React's own `useSyncExternalStore`
// rather than adding a runtime dependency to every page that loads Tools.
//
// The semantics are the ones the ported actions rely on, and they match zustand
// v5 on purpose:
//   * `set` takes a partial or an updater; object partials are shallow-merged;
//   * `get` always returns the current state;
//   * listeners run after the state reference has been replaced;
//   * the hook takes a selector and re-renders when the selected slice changes
//     (React compares snapshots with `Object.is`, the same rule zustand uses).

import { useSyncExternalStore } from 'react';

export type SetState<T> = (partial: Partial<T> | ((state: T) => Partial<T>)) => void;

export interface StoreApi<T> {
  getState: () => T;
  setState: SetState<T>;
  subscribe: (listener: () => void) => () => void;
}

export function createStore<T>(initializer: (set: SetState<T>, get: () => T) => T): StoreApi<T> {
  let state: T;
  const listeners = new Set<() => void>();

  const get = (): T => state;

  const set: SetState<T> = (partial) => {
    const next = typeof partial === 'function' ? partial(get()) : partial;
    if (!Object.is(next, state)) {
      const previous = state;
      // A non-object partial replaces the state outright, like zustand does.
      state = typeof next === 'object' && next !== null ? { ...previous, ...next } : next;
      for (const listener of [...listeners]) {
        listener();
      }
    }
  };

  const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  state = initializer(set, get);
  return { getState: get, setState: set, subscribe };
}

/** Binds a store to React: re-renders the caller when the selected slice changes. */
export function useStore<T, S>(store: StoreApi<T>, selector: (state: T) => S): S {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getState())
  );
}
