// Path: src/components/tools/nbt/hooks/useNbtWasm.ts
//
// Ported verbatim from nbt-web-editor `web/src/hooks/useNbtWasm.ts`.
//
// Loads and awaits the wasm module exactly once for the whole app.
//
// The module-level promise inside `wasm/nbtModule` already deduplicates the
// instantiation; this hook adds the React-facing state (ready / error) and makes
// sure the effect does not set state after unmount.

import { useEffect, useState } from 'react';
import { coreVersion, initNbtCore } from '../wasm/nbtModule';

export interface NbtWasmState {
  /** True once the module is instantiated and every boundary call is safe. */
  ready: boolean;
  /** Message to show when instantiation failed, e.g. the wasm asset 404'd. */
  error: string | null;
  /** `nbt-core` version string, for the footer. `null` until ready. */
  version: string | null;
}

let versionCache: string | null = null;

export function useNbtWasm(): NbtWasmState {
  const [state, setState] = useState<NbtWasmState>(() => ({
    ready: versionCache !== null,
    error: null,
    version: versionCache
  }));

  useEffect(() => {
    let cancelled = false;

    if (versionCache !== null) {
      return;
    }

    initNbtCore()
      .then(() => {
        if (cancelled) {
          return;
        }
        try {
          versionCache = coreVersion();
        } catch {
          versionCache = 'unknown';
        }
        setState({ ready: true, error: null, version: versionCache });
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        setState({
          ready: false,
          error: error instanceof Error ? error.message : String(error),
          version: null
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
