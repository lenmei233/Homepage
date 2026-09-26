// Path: src/components/tools/nbt/types/nbt.ts
//
// Ported from nbt-web-editor `web/src/types/nbt.ts`. Only the badge classes
// changed: the editor's own Tailwind palette is replaced by the site's glass
// theme (see `nbt.css`), and per-type labels now come from the i18n catalogue
// instead of a hard-coded English string.
//
// The TypeScript mirror of the `nbt-core` wasm boundary. The shapes here are a
// direct transcription of `crates/nbt-core/src/wasm.rs` (serde structs) and of
// the generated `src/wasm/pkg/nbt_core.d.ts`; nothing is inferred.
//
// Two rules are load-bearing and easy to get wrong:
//   1. `long` / `longArray` values cross the boundary as decimal STRINGS. JS
//      numbers cannot hold 64 bits, so they must never be `Number()`ed for
//      storage. Use the helpers in `lib/tagDefaults.ts` to validate them.
//   2. A list's `elementType` must equal the `type` of every child, or
//      `serialize_nbt` rejects the tree with
//      `invalid NBT tree shape at list[N]: expected a 'X' ... found 'Y'`.

/** How the opened file was wrapped on disk. */
export type Compression = 'none' | 'gzip' | 'zlib';

/** The twelve real tag types, plus `end` which only ever appears as a list's
 *  declared element type for an empty list. */
export type TagType =
  | 'end'
  | 'byte'
  | 'short'
  | 'int'
  | 'long'
  | 'float'
  | 'double'
  | 'byteArray'
  | 'string'
  | 'list'
  | 'compound'
  | 'intArray'
  | 'longArray';

/** The types a user may actually create with the "add tag" menu. `end` is not a
 *  value, so it is excluded. */
export type ValueTagType = Exclude<TagType, 'end'>;

export interface ByteTag {
  type: 'byte';
  value: number;
}
export interface ShortTag {
  type: 'short';
  value: number;
}
export interface IntTag {
  type: 'int';
  value: number;
}
/** 64-bit integer as an exact decimal string (`"-9223372036854775808"`). */
export interface LongTag {
  type: 'long';
  value: string;
}
export interface FloatTag {
  type: 'float';
  value: number;
}
export interface DoubleTag {
  type: 'double';
  value: number;
}
export interface ByteArrayTag {
  type: 'byteArray';
  value: number[];
}
export interface StringTag {
  type: 'string';
  value: string;
}
export interface ListTag {
  type: 'list';
  /** `'end'` when the list is empty, otherwise every child must match this. */
  elementType: TagType;
  value: Tag[];
}
export interface CompoundTag {
  type: 'compound';
  /** Declaration order is preserved by the format and must not be sorted. */
  value: NamedTag[];
}
export interface IntArrayTag {
  type: 'intArray';
  value: number[];
}
/** 64-bit integers as exact decimal strings, same reason as `LongTag`. */
export interface LongArrayTag {
  type: 'longArray';
  value: string[];
}

export type Tag =
  | ByteTag
  | ShortTag
  | IntTag
  | LongTag
  | FloatTag
  | DoubleTag
  | ByteArrayTag
  | StringTag
  | ListTag
  | CompoundTag
  | IntArrayTag
  | LongArrayTag;

export type NumericTagType = 'byte' | 'short' | 'int' | 'float' | 'double';
export type ArrayTagType = 'byteArray' | 'intArray' | 'longArray';

/** One entry of a compound, or the document root. */
export interface NamedTag {
  name: string;
  tag: Tag;
}

export interface GzipHeader {
  mtime: number;
  extraFlags: number;
  operatingSystem: number;
}

/** Exactly what `parse_nbt()` returns and what `serialize_nbt()` consumes. */
export interface JsDocument {
  root: NamedTag;
  compression: Compression;
  gzipHeader: GzipHeader | null;
  /** Byte size of the file the user opened (compressed). */
  originalSize: number;
  /** Byte size of the decompressed NBT payload. */
  rawSize: number;
  /** Total number of tags in the tree. */
  nodeCount: number;
}

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

export function isCompound(tag: Tag): tag is CompoundTag {
  return tag.type === 'compound';
}

export function isList(tag: Tag): tag is ListTag {
  return tag.type === 'list';
}

/** True for tags that hold a value the user edits as a single token. */
export function isScalar(tag: Tag): boolean {
  switch (tag.type) {
    case 'byte':
    case 'short':
    case 'int':
    case 'long':
    case 'float':
    case 'double':
    case 'string':
      return true;
    default:
      return false;
  }
}

export function isArray(tag: Tag): tag is ByteArrayTag | IntArrayTag | LongArrayTag {
  return tag.type === 'byteArray' || tag.type === 'intArray' || tag.type === 'longArray';
}

/** A container tag holds children rather than a directly editable value. */
export function isContainer(tag: Tag): tag is CompoundTag | ListTag {
  return isCompound(tag) || isList(tag);
}

// ---------------------------------------------------------------------------
// Per-type metadata
// ---------------------------------------------------------------------------

export interface TypeMeta {
  /** Wire name, e.g. `TAG_Int`. */
  wireName: string;
  /** The name shown in the type badge. */
  badge: string;
  /**
   * CSS classes for the badge, defined in `nbt.css`. Colour is grouped by kind:
   * numbers share a hue, strings another, containers a third, so the tree reads
   * at a glance. The container hues are derived from the site's accent colour,
   * so badges follow the theme picked in Settings instead of a fixed palette.
   */
  badgeClass: string;
}

export const TAG_TYPE_META: Record<TagType, TypeMeta> = {
  end: {
    wireName: 'TAG_End',
    badge: 'end',
    badgeClass: 'nbt-badge nbt-badge--end'
  },
  byte: {
    wireName: 'TAG_Byte',
    badge: 'byte',
    badgeClass: 'nbt-badge nbt-badge--int'
  },
  short: {
    wireName: 'TAG_Short',
    badge: 'short',
    badgeClass: 'nbt-badge nbt-badge--int'
  },
  int: {
    wireName: 'TAG_Int',
    badge: 'int',
    badgeClass: 'nbt-badge nbt-badge--int'
  },
  long: {
    wireName: 'TAG_Long',
    badge: 'long',
    badgeClass: 'nbt-badge nbt-badge--long'
  },
  float: {
    wireName: 'TAG_Float',
    badge: 'float',
    badgeClass: 'nbt-badge nbt-badge--float'
  },
  double: {
    wireName: 'TAG_Double',
    badge: 'double',
    badgeClass: 'nbt-badge nbt-badge--float'
  },
  byteArray: {
    wireName: 'TAG_Byte_Array',
    badge: 'byte[]',
    badgeClass: 'nbt-badge nbt-badge--array'
  },
  string: {
    wireName: 'TAG_String',
    badge: 'string',
    badgeClass: 'nbt-badge nbt-badge--string'
  },
  list: {
    wireName: 'TAG_List',
    badge: 'list',
    badgeClass: 'nbt-badge nbt-badge--list'
  },
  compound: {
    wireName: 'TAG_Compound',
    badge: 'compound',
    badgeClass: 'nbt-badge nbt-badge--compound'
  },
  intArray: {
    wireName: 'TAG_Int_Array',
    badge: 'int[]',
    badgeClass: 'nbt-badge nbt-badge--array'
  },
  longArray: {
    wireName: 'TAG_Long_Array',
    badge: 'long[]',
    badgeClass: 'nbt-badge nbt-badge--array'
  }
};

/** The types offered by the "add child" / "new list" menus, in wire order. */
export const VALUE_TAG_TYPES: ValueTagType[] = [
  'byte',
  'short',
  'int',
  'long',
  'float',
  'double',
  'string',
  'byteArray',
  'list',
  'compound',
  'intArray',
  'longArray'
];

/** Narrowing cast used where the wasm boundary hands back `any`. */
export function asDocument(value: unknown): JsDocument {
  return value as JsDocument;
}
