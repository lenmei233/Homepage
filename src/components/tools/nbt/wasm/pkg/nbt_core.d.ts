/* tslint:disable */
/* eslint-disable */

/**
 * Human-readable, parse-free validation used by the dropzone for early feedback.
 */
export function describe_input(bytes: Uint8Array): string;

/**
 * Reports the compression wrapper of a file without parsing it.
 */
export function detect_compression(bytes: Uint8Array): string;

/**
 * True when the bytes look like an NBT file this build can open.
 *
 * A recognizable gzip/zlib wrapper is accepted outright; otherwise the first byte
 * must be a valid root tag id, which is what raw `.nbt` files look like.
 */
export function is_probably_nbt(bytes: Uint8Array): boolean;

/**
 * Parses an NBT file (gzip/zlib/raw are auto-detected) into a JS tree.
 *
 * Returns a plain object, or throws a JS `Error` whose message explains what was
 * wrong with the file.
 */
export function parse_nbt(bytes: Uint8Array): any;

/**
 * Serializes a JS tree back to bytes.
 *
 * `compression` overrides the wrapper; pass `undefined`/`null` to reuse whatever
 * the opened file used (gzip header included).
 *
 * Note that this always re-serializes the tree: the boundary has no access to the
 * original byte stream, so the "untouched file comes back untouched" guarantee is
 * implemented on the TypeScript side by exporting the original `ArrayBuffer`
 * directly while the tree is unmodified (`NbtDocument::to_bytes` semantics).
 */
export function serialize_nbt(doc: any, compression?: string | null): Uint8Array;

/**
 * Version string shown in the UI footer.
 */
export function version(): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly describe_input: (a: number, b: number, c: number) => void;
    readonly detect_compression: (a: number, b: number, c: number) => void;
    readonly is_probably_nbt: (a: number, b: number) => number;
    readonly parse_nbt: (a: number, b: number, c: number) => void;
    readonly serialize_nbt: (a: number, b: number, c: number, d: number) => void;
    readonly version: (a: number) => void;
    readonly __wbindgen_export: (a: number, b: number) => number;
    readonly __wbindgen_export2: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_export3: (a: number) => void;
    readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
    readonly __wbindgen_export4: (a: number, b: number, c: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
