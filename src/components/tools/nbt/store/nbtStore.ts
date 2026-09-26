// Path: src/components/tools/nbt/store/nbtStore.ts
//
// Ported from nbt-web-editor `web/src/store/nbtStore.ts`. The logic — including
// the byte-identical export guarantee — is unchanged; only the store engine
// differs: `createStore` (below `createStore.ts`) replaces zustand so the site
// needs no new runtime dependency.
//
// The single owner of editor state: the parsed document, the editor's transient
// state, and — critically — the *original bytes* of the opened file.
//
// ── The byte-identical export guarantee ──────────────────────────────────────
// `serialize_nbt` has no access to the original byte stream: it always rebuilds
// the NBT payload from the tree and re-compresses it. The deflate stream it
// produces is valid and semantically equivalent, but it is not guaranteed to be
// byte-for-byte what the game wrote.
//
// So the app keeps the original `Uint8Array` alongside a single `isDirty`
// boolean:
//   * `isDirty` is set by every mutation action and cleared on a fresh open;
//   * `exportBytes()` returns `originalBytes` verbatim while `!isDirty`, and only
//     calls `serialize_nbt` once the tree actually changed.
//
// Deliberately NOT implemented by diffing the tree against a snapshot: that
// would be O(tree) per render and, worse, would export the original bytes for an
// edit that happened to be a no-op. The mutation is the only thing that knows it
// happened, so it is the thing that sets the flag.

import { createStore, useStore } from './createStore';
import { parseNbt, serializeNbt } from '../wasm/nbtModule';
import type { Compression, JsDocument, NamedTag, Tag, ValueTagType } from '../types/nbt';
import {
  addCompoundEntry,
  addDefaultListItem,
  addListItem,
  pathKey,
  removeCompoundEntry,
  removeListItem,
  renameCompoundEntry,
  renameRoot,
  replaceTagAt,
  resolveTag,
  setListElementType,
  type Path
} from '../lib/treeEdits';
import { createDefaultEntry, createDefaultTag } from '../lib/tagDefaults';

export type OpenStatus = 'idle' | 'parsing' | 'ready';

export interface NbtStoreState {
  /** The parsed tree, or `null` before the first successful open. */
  document: JsDocument | null;
  /**
   * The exact bytes of the opened file, retained so an unmodified export is
   * byte-identical. `null` only when no file has been opened.
   */
  originalBytes: Uint8Array | null;
  /** Set by every mutation, cleared on a fresh open. Drives `exportBytes`. */
  isDirty: boolean;
  fileName: string;
  /** Compression the *next* export should use; independent of the file's own. */
  exportCompression: Compression;
  status: OpenStatus;
  /** Dismissible banner text; also carries whole-file error messages. */
  error: string | null;
  /** Which tags are expanded, addressed by `pathKey`. */
  expanded: Record<string, boolean>;
  /** The one field whose edit produced a validation problem, if any. */
  fieldError: { pathKey: string; message: string } | null;

  // Actions
  loadFromBytes: (bytes: Uint8Array, fileName: string) => void;
  openFile: (file: File) => Promise<void>;
  reset: () => void;
  dismissError: () => void;
  clearFieldError: () => void;
  setExportCompression: (compression: Compression) => void;

  toggleExpanded: (path: Path) => void;
  setExpanded: (path: Path, open: boolean) => void;
  expandToDepth: (depth: number) => void;

  renameRootTag: (name: string) => void;
  setTagAt: (path: Path, tag: Tag) => void;
  addChild: (path: Path, type: ValueTagType) => void;
  renameChild: (path: Path, index: number, name: string) => void;
  deleteChild: (path: Path, index: number) => void;
  addItem: (path: Path) => void;
  addItemOfType: (path: Path, type: ValueTagType) => void;
  deleteItem: (path: Path, index: number) => void;
  exportBytes: () => Uint8Array;
}

/** Turns anything thrown into a message worth showing to a user. */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Depth every container is expanded to on open. */
export const INITIAL_EXPAND_DEPTH = 2;

/**
 * Initial expansion state: every container at depth `<= depth` is open, so the
 * first few levels of a save file are visible on open and the rest of a large
 * tree stays collapsed.
 */
export function defaultExpansion(root: Tag, depth: number): Record<string, boolean> {
  const expanded: Record<string, boolean> = { [pathKey([])]: true };
  const walk = (tag: Tag, path: Path): void => {
    if (path.length > depth) {
      return;
    }
    if (tag.type === 'compound') {
      expanded[pathKey(path)] = true;
      for (const entry of tag.value) {
        walk(entry.tag, [...path, entry.name]);
      }
    } else if (tag.type === 'list') {
      expanded[pathKey(path)] = true;
      tag.value.forEach((item, index) => walk(item, [...path, index]));
    }
  };
  walk(root, []);
  return expanded;
}

const store = createStore<NbtStoreState>((set, get) => {
  /**
   * Runs a structural edit and commits it.
   *
   * The functions in `lib/treeEdits` throw with a user-facing message when a
   * path went stale or an edit would produce invalid NBT. Catching here turns
   * those into a banner instead of letting them reach an error boundary, and
   * keeps the previous tree intact.
   */
  const commit = (edit: (root: NamedTag) => NamedTag, failurePath: Path): void => {
    const { document } = get();
    if (!document) {
      return;
    }
    try {
      set({
        document: { ...document, root: edit(document.root) },
        isDirty: true,
        fieldError: null
      });
    } catch (error) {
      set({ fieldError: { pathKey: pathKey(failurePath), message: errorMessage(error) } });
    }
  };

  /** Commit for edits that are not tied to an on-screen field. */
  const commitGlobal = (edit: (root: NamedTag) => NamedTag): void => {
    const { document } = get();
    if (!document) {
      return;
    }
    try {
      set({
        document: { ...document, root: edit(document.root) },
        isDirty: true,
        error: null
      });
    } catch (error) {
      set({ error: errorMessage(error) });
    }
  };

  return {
    document: null,
    originalBytes: null,
    isDirty: false,
    fileName: '',
    exportCompression: 'gzip',
    status: 'idle',
    error: null,
    expanded: {},
    fieldError: null,

    loadFromBytes: (bytes, fileName) => {
      set({ status: 'parsing', error: null, fieldError: null });
      try {
        // Keep our own copy: everything downstream may hold a view of it, and
        // the buffer promised to the export path must never alias wasm's memory.
        const originalBytes = new Uint8Array(bytes);
        const document = parseNbt(originalBytes);
        set({
          document,
          originalBytes,
          // A fresh open is by definition clean. This single line is what makes
          // the unmodified round trip byte-identical.
          isDirty: false,
          fileName,
          exportCompression: document.compression,
          status: 'ready',
          error: null,
          fieldError: null,
          expanded: defaultExpansion(document.root.tag, INITIAL_EXPAND_DEPTH)
        });
      } catch (error) {
        // The previously-open document is deliberately left in place: a file the
        // user dragged over the editor by mistake must not discard their work.
        set({
          status: get().document ? 'ready' : 'idle',
          error: errorMessage(error)
        });
      }
    },

    openFile: async (file) => {
      set({ status: 'parsing', error: null, fieldError: null });
      try {
        const buffer = await file.arrayBuffer();
        get().loadFromBytes(new Uint8Array(buffer), file.name);
      } catch (error) {
        set({
          status: get().document ? 'ready' : 'idle',
          error: `could not read '${file.name}': ${errorMessage(error)}`
        });
      }
    },

    reset: () =>
      set({
        document: null,
        originalBytes: null,
        isDirty: false,
        fileName: '',
        status: 'idle',
        error: null,
        expanded: {},
        fieldError: null
      }),

    dismissError: () => set({ error: null }),
    clearFieldError: () => set({ fieldError: null }),
    setExportCompression: (compression) => set({ exportCompression: compression }),

    toggleExpanded: (path) => {
      const key = pathKey(path);
      set((state) => ({ expanded: { ...state.expanded, [key]: !state.expanded[key] } }));
    },

    setExpanded: (path, open) => {
      const key = pathKey(path);
      set((state) => ({ expanded: { ...state.expanded, [key]: open } }));
    },

    expandToDepth: (depth) => {
      const { document } = get();
      if (document) {
        set({ expanded: defaultExpansion(document.root.tag, depth) });
      }
    },

    renameRootTag: (name) => {
      const { document } = get();
      if (!document || name === document.root.name) {
        return;
      }
      set({ document: { ...document, root: renameRoot(document.root, name) }, isDirty: true });
    },

    setTagAt: (path, tag) => {
      commit((root) => replaceTagAt(root, path, tag), path);
    },

    addChild: (path, type) => {
      const { document } = get();
      if (!document) {
        return;
      }
      const parent = resolveTag(document.root.tag, path);
      if (!parent || parent.type !== 'compound') {
        set({ error: 'a new entry can only be added to a compound' });
        return;
      }
      // Built from the current tree so the default name cannot collide.
      const entry = createDefaultEntry(type, parent.value);
      commit((root) => addCompoundEntry(root, path, entry), path);
    },

    renameChild: (path, index, name) => {
      commit((root) => renameCompoundEntry(root, path, index, name), path);
    },

    deleteChild: (path, index) => {
      commitGlobal((root) => removeCompoundEntry(root, path, index));
    },

    addItem: (path) => {
      commit((root) => addDefaultListItem(root, path), path);
    },

    addItemOfType: (path, type) => {
      // For an empty list: declare the element type and add the first item in a
      // single step, so the list is never left with a declared type and no items
      // to justify it.
      commit((root) => {
        const withType = setListElementType(root, path, type);
        return addListItem(withType, path, createDefaultTag(type));
      }, path);
    },

    deleteItem: (path, index) => {
      commitGlobal((root) => removeListItem(root, path, index));
    },

    /**
     * The bytes to write to disk.
     *
     * Unmodified document → the original bytes, verbatim. Modified → the tree is
     * re-serialized, because there is no way to patch the original deflate
     * stream from a JS tree.
     */
    exportBytes: () => {
      const { document, originalBytes, isDirty, exportCompression } = get();
      if (!document) {
        throw new Error('there is nothing to export yet — open a file first');
      }
      if (!isDirty && originalBytes) {
        return originalBytes;
      }
      // `null` means "reuse the compression the file was opened with, gzip
      // header included", which is the only way to keep that header.
      const compression: Compression | null =
        document.compression === exportCompression ? null : exportCompression;
      return serializeNbt(document, compression);
    }
  };
});

/**
 * Selector hook with the call shape every ported component already uses:
 * `useNbtStore((state) => state.document)`.
 */
function useNbtStoreSelector<S>(selector: (state: NbtStoreState) => S): S {
  return useStore(store, selector);
}

/** The store, plus the imperative entry point the tests and hooks use. */
export const useNbtStore = Object.assign(useNbtStoreSelector, {
  getState: store.getState,
  setState: store.setState,
  subscribe: store.subscribe
});
