// Path: src/components/tools/nbt/wasm/nbtModule.ts
//
// Ported verbatim from nbt-web-editor `web/src/wasm/nbtModule.ts`. The generated
// glue in `./pkg` is the same build, so the tool and the standalone editor share
// one parsing/serialising core.
//
// Thin typed wrapper around the generated wasm-bindgen glue in `./pkg`.
//
// The generated `__wbg_init` accepts either the new object form
// (`{ module_or_path }`) or the legacy direct argument, but logs
// "using deprecated parameters ..." for the latter, so we always pass the
// object form. Note that the generated glue resolves its own default URL only
// when the argument is entirely omitted; by handing it an explicit `new URL()`
// we keep control over the asset path (Vite rewrites this into a hashed asset
// in production builds and serves it from the dev server otherwise).

import init, {
  parse_nbt,
  serialize_nbt,
  detect_compression,
  is_probably_nbt,
  describe_input,
  version,
  type InitInput
} from './pkg/nbt_core.js';
import type { Compression, JsDocument } from '../types/nbt';

export type { InitInput };

/** Resolved once, shared by every caller. */
let ready: Promise<void> | null = null;

/**
 * Instantiates the wasm module. Safe to call repeatedly and from several
 * places: the underlying glue memoises the instance and this wrapper memoises
 * the promise, so concurrent callers await the same instantiation.
 */
export function initNbtCore(moduleBytes?: Uint8Array): Promise<void> {
  if (!ready) {
    // `module_or_path` is the non-deprecated form; the generated glue warns if
    // the argument is passed directly instead. When explicit bytes are supplied
    // (the headless test path) they are instantiated without any fetch at all.
    // The cast is needed because the generated `InitInput` insists on
    // `ArrayBufferView<ArrayBuffer>`, which Node's `Uint8Array` is not narrowed to.
    const input = (moduleBytes ??
      new URL('./pkg/nbt_core_bg.wasm', import.meta.url)) as unknown as InitInput;
    ready = init({ module_or_path: input }).then(() => undefined);
    // A failed instantiation must not be cached as permanently broken: clearing
    // this lets a retry (e.g. after a network hiccup) attempt a fresh load.
    ready.catch(() => {
      ready = null;
    });
  }
  return ready;
}

/**
 * Parses NBT bytes into a JS tree. Throws an `Error` with a human-readable
 * message from the Rust side; callers surface `error.message` verbatim.
 */
export function parseNbt(bytes: Uint8Array): JsDocument {
  return parse_nbt(bytes) as JsDocument;
}

/**
 * Rebuilds the payload and re-compresses it. `compression` overrides the
 * wrapper the file was opened with; `null` reuses it (gzip header included).
 *
 * Because this rebuilds the deflate stream from scratch, the bytes are NOT
 * guaranteed identical to the original file: the store exports the retained
 * original bytes verbatim while the document is unmodified. See
 * `store/nbtStore.ts`.
 */
export function serializeNbt(
  doc: JsDocument,
  compression: Compression | null = null
): Uint8Array {
  return serialize_nbt(doc, compression);
}

/** Detects the wrapper without parsing. Throws on unreadable input. */
export function detectCompression(bytes: Uint8Array): Compression {
  return detect_compression(bytes) as Compression;
}

/** Cheap "does this look like NBT?" probe for dropzone feedback. */
export function isProbablyNbt(bytes: Uint8Array): boolean {
  return is_probably_nbt(bytes);
}

/** Human-readable, parse-free summary of the bytes ("12 bytes, gzip compression"). */
export function describeInput(bytes: Uint8Array): string {
  return describe_input(bytes);
}

/** Version string of the `nbt-core` build, shown in the footer. */
export function coreVersion(): string {
  return version();
}
