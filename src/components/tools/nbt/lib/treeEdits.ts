// Path: src/components/tools/nbt/lib/treeEdits.ts
//
// Ported verbatim from nbt-web-editor `web/src/lib/treeEdits.ts`. The pure
// structural edits are exactly what keeps a save file valid, so nothing in here
// was touched.
//
// Pure, immutable structural edits over an NBT tree. No React, no wasm, no I/O:
// every function takes the root `NamedTag` plus a path and returns a new root,
// so this module is unit-testable in plain Node (see treeEdits.test.ts).
//
// A `Path` describes a walk from the root *tag*:
//   * a `string` segment addresses a compound entry by name;
//   * a `number` segment addresses a list item by index.
// The two never collide because compounds and lists have different `type`s, and
// the traversal verifies that each segment matches the container it lands in.
//
// Only the tags along the edited path are rebuilt; untouched siblings keep their
// object identity, which keeps React re-renders cheap on the large trees real
// save files contain.

import type { ListTag, NamedTag, Tag, TagType, ValueTagType } from '../types/nbt';
import { createDefaultTag } from './tagDefaults';

export type PathSegment = string | number;
export type Path = readonly PathSegment[];

// ---------------------------------------------------------------------------
// Traversal
// ---------------------------------------------------------------------------

/** The tag at `path`, or `null` when the path does not resolve. */
export function resolveTag(root: Tag, path: Path): Tag | null {
  let current: Tag = root;
  for (const segment of path) {
    if (typeof segment === 'string') {
      if (current.type !== 'compound') {
        return null;
      }
      const entry = current.value.find((candidate) => candidate.name === segment);
      if (!entry) {
        return null;
      }
      current = entry.tag;
    } else {
      if (current.type !== 'list') {
        return null;
      }
      const item = current.value[segment];
      if (!item) {
        return null;
      }
      current = item;
    }
  }
  return current;
}

/**
 * Immutable substitution of the tag at `path`. Throws when the path is stale,
 * with a message describing what went wrong, because every caller here is a
 * deliberate user action on a tag that was on screen a moment ago.
 */
function replaceTag(tag: Tag, path: Path, next: Tag): Tag {
  if (path.length === 0) {
    return next;
  }
  const [head, ...rest] = path;

  if (typeof head === 'string') {
    if (tag.type !== 'compound') {
      throw new Error(`cannot resolve '${head}': its parent is a ${tag.type}, not a compound`);
    }
    const index = tag.value.findIndex((entry) => entry.name === head);
    if (index < 0) {
      throw new Error(`no entry named '${head}' at this path`);
    }
    const entries = tag.value.slice();
    entries[index] = { ...entries[index], tag: replaceTag(entries[index].tag, rest, next) };
    return { ...tag, value: entries };
  }

  if (tag.type !== 'list') {
    throw new Error(`cannot resolve index ${head}: its parent is a ${tag.type}, not a list`);
  }
  if (head < 0 || head >= tag.value.length) {
    throw new Error(`list index ${head} is out of range (0..${tag.value.length - 1})`);
  }
  const items = tag.value.slice();
  items[head] = replaceTag(items[head], rest, next);
  return { ...tag, value: items };
}

/** Replaces the whole tag at `path`. */
export function replaceTagAt(root: NamedTag, path: Path, next: Tag): NamedTag {
  return { ...root, tag: replaceTag(root.tag, path, next) };
}

/** Applies `transform` to the tag at `path`, rebuilding only that branch. */
function updateTag(root: Tag, path: Path, transform: (tag: Tag) => Tag): Tag {
  const current = resolveTag(root, path);
  if (!current) {
    throw new Error('the tag being edited is no longer at this path');
  }
  return replaceTag(root, path, transform(current));
}

/** Resolves a tag to a compound's entry list, or throws. */
function expectCompound(tag: Tag): NamedTag[] {
  if (tag.type !== 'compound') {
    throw new Error(`expected a compound at this path, found a ${tag.type}`);
  }
  return tag.value;
}

/** Resolves a tag to a list, or throws. */
function expectList(tag: Tag): ListTag {
  if (tag.type !== 'list') {
    throw new Error(`expected a list at this path, found a ${tag.type}`);
  }
  return tag;
}

// ---------------------------------------------------------------------------
// Root and scalar edits
// ---------------------------------------------------------------------------

/** Renames the document root. */
export function renameRoot(root: NamedTag, name: string): NamedTag {
  return { ...root, name };
}

// ---------------------------------------------------------------------------
// Compound edits
// ---------------------------------------------------------------------------

/** Appends `entry` to the compound at `path`. */
export function addCompoundEntry(root: NamedTag, path: Path, entry: NamedTag): NamedTag {
  return {
    ...root,
    tag: updateTag(root.tag, path, (tag) => {
      const entries = expectCompound(tag);
      if (entries.some((existing) => existing.name === entry.name)) {
        throw new Error(`this compound already has an entry named '${entry.name}'`);
      }
      return { type: 'compound', value: [...entries, entry] };
    })
  };
}

/**
 * Renames the child at `index` of the compound at `path`.
 *
 * Duplicate keys would be legal on the wire but make the tree ambiguous both to
 * address (every path here names compound children by name) and to display, so
 * the second occurrence is rejected with a visible message.
 */
export function renameCompoundEntry(
  root: NamedTag,
  path: Path,
  index: number,
  name: string
): NamedTag {
  return {
    ...root,
    tag: updateTag(root.tag, path, (tag) => {
      const entries = expectCompound(tag);
      const target = entries[index];
      if (!target) {
        throw new Error('the entry being renamed no longer exists');
      }
      if (entries.some((entry, i) => i !== index && entry.name === name)) {
        throw new Error(`this compound already has an entry named '${name}'`);
      }
      const next = entries.slice();
      next[index] = { ...target, name };
      return { type: 'compound', value: next };
    })
  };
}

/** Removes the child at `index` of the compound at `path`. */
export function removeCompoundEntry(root: NamedTag, path: Path, index: number): NamedTag {
  return {
    ...root,
    tag: updateTag(root.tag, path, (tag) => {
      const entries = expectCompound(tag);
      if (!entries[index]) {
        throw new Error('the entry being removed no longer exists');
      }
      return { type: 'compound', value: entries.filter((_, i) => i !== index) };
    })
  };
}

// ---------------------------------------------------------------------------
// List edits
// ---------------------------------------------------------------------------

/**
 * Appends `item` to the list at `path`.
 *
 * NBT lists are homogeneous, so an item added to a non-empty list must match
 * the declared element type — an older Rust note calling this an "approximate
 * memory footprint" aside, `serialize_nbt` refuses anything else. The one
 * exception is an empty list: its first item decides the element type, which is
 * exactly the wire behaviour (`elementType` becomes a real type id).
 */
export function addListItem(root: NamedTag, path: Path, item: Tag): NamedTag {
  return {
    ...root,
    tag: updateTag(root.tag, path, (tag) => {
      const list = expectList(tag);
      if (list.value.length > 0 && item.type !== list.elementType) {
        throw new Error(
          `this list holds ${list.elementType} items, so a ${item.type} would make it invalid NBT`
        );
      }
      const elementType = list.value.length === 0 ? item.type : list.elementType;
      return { type: 'list', elementType, value: [...list.value, item] };
    })
  };
}

/**
 * Appends a default-valued item of the list's element type.
 *
 * An empty list has `elementType: 'end'`, which is not a tag that can exist, so
 * the caller must first declare the type it holds (see `setListElementType`).
 */
export function addDefaultListItem(root: NamedTag, path: Path): NamedTag {
  const tag = resolveTag(root.tag, path);
  if (!tag || tag.type !== 'list') {
    throw new Error('expected a list at this path');
  }
  if (tag.elementType === 'end') {
    throw new Error('pick the type this empty list should hold first');
  }
  return addListItem(root, path, createDefaultTag(tag.elementType as ValueTagType));
}

/**
 * Removes the item at `index`.
 *
 * Removing the last item resets `elementType` to `'end'`, which is what the
 * serializer writes for an empty list and therefore what the tree must say too.
 */
export function removeListItem(root: NamedTag, path: Path, index: number): NamedTag {
  return {
    ...root,
    tag: updateTag(root.tag, path, (tag) => {
      const list = expectList(tag);
      if (!list.value[index]) {
        throw new Error('the list item being removed no longer exists');
      }
      const value = list.value.filter((_, i) => i !== index);
      return {
        type: 'list',
        elementType: value.length === 0 ? 'end' : list.elementType,
        value
      };
    })
  };
}

/**
 * Declares what a list holds. Only meaningful for an empty list; retyping a
 * non-empty list would invalidate every item it already has, so that is
 * rejected rather than silently coercing the children.
 */
export function setListElementType(root: NamedTag, path: Path, elementType: TagType): NamedTag {
  return {
    ...root,
    tag: updateTag(root.tag, path, (tag) => {
      const list = expectList(tag);
      if (elementType === 'end' && list.value.length > 0) {
        throw new Error('a non-empty list cannot be given the element type "end"');
      }
      if (list.value.length > 0 && elementType !== list.elementType) {
        throw new Error(
          `this list already holds ${list.value.length} ${list.elementType} item(s); retyping it would invalidate them`
        );
      }
      return { type: 'list', elementType, value: list.value };
    })
  };
}

// ---------------------------------------------------------------------------
// Path and count helpers
// ---------------------------------------------------------------------------

/** Stable string form of a path, used as a React key and for expansion state. */
export function pathKey(path: Path): string {
  let key = '$';
  for (const segment of path) {
    key += typeof segment === 'number' ? `[${segment}]` : `/${segment}`;
  }
  return key;
}

/** Display form of a path, e.g. `Level > items[3] > Count`. */
export function pathLabel(path: Path, rootName: string): string {
  let out = rootName === '' ? '(root)' : rootName;
  for (const segment of path) {
    out += typeof segment === 'number' ? `[${segment}]` : ` > ${segment}`;
  }
  return out;
}

/**
 * Number of tags in a subtree. Mirrors `Tag::node_count` in Rust: a container
 * counts as one plus its children, every other tag counts as one.
 */
export function countNodes(tag: Tag): number {
  switch (tag.type) {
    case 'list':
      return 1 + tag.value.reduce((total, item) => total + countNodes(item), 0);
    case 'compound':
      return 1 + tag.value.reduce((total, entry) => total + countNodes(entry.tag), 0);
    default:
      return 1;
  }
}
