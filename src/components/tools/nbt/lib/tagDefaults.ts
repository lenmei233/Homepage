// Path: src/components/tools/nbt/lib/tagDefaults.ts
//
// Ported verbatim from nbt-web-editor `web/src/lib/tagDefaults.ts`. Validation,
// bounds and canonical formatting are the correctness-critical part of the tool
// and are byte-for-byte identical to the original.
//
// Everything about "what does a value mean for this tag type": defaults for new
// tags, and the parse/validate step for whatever the user typed.
//
// Validation is strict on purpose. The requirement is to reject out-of-range
// input with a visible message rather than silently truncating, so every
// numeric type is bounds-checked against the narrowest JS number the Rust side
// (`i8`/`i16`/`i32`/`i64`/`f32`/`f64`) accepts. Without the upper bound, typing
// `300` into a byte would sit in the JS tree as `300` and only fail much later
// inside wasm's serde deserialization (or be silently truncated on the way into
// the `i8`).
//
// 64-bit values are validated with `BigInt` and kept as decimal strings; they
// are never round-tripped through `Number`.

import type {
  Compression,
  NamedTag,
  Tag,
  TagType,
  ValueTagType
} from '../types/nbt';

/** A parse result: either the value, or a message to show the user. */
export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

export const COMPRESSIONS: readonly Compression[] = ['none', 'gzip', 'zlib'];

export const COMPRESSION_LABEL: Record<Compression, string> = {
  none: 'none (uncompressed)',
  gzip: 'gzip',
  zlib: 'zlib'
};

/** Inclusive bounds for the fixed-width integer types. */
const INT_BOUNDS = {
  byte: { min: -128n, max: 127n },
  short: { min: -32768n, max: 32767n },
  int: { min: -2147483648n, max: 2147483647n },
  long: { min: -9223372036854775808n, max: 9223372036854775807n }
} as const;

export const LONG_MIN = INT_BOUNDS.long.min;
export const LONG_MAX = INT_BOUNDS.long.max;

/** `f32::MAX`; anything larger cannot survive the trip through Rust's `f32`. */
const F32_MAX = 3.4028234663852886e38;

/** Matches an optionally-signed decimal integer, nothing else. */
const INTEGER_RE = /^[+-]?\d+$/;

type IntType = 'byte' | 'short' | 'int' | 'long';
type NumericScalarType = IntType | 'float' | 'double';

/** True for the scalar types edited through a numeric input. */
export function isNumericScalarType(type: TagType): type is NumericScalarType {
  return (
    type === 'byte' ||
    type === 'short' ||
    type === 'int' ||
    type === 'long' ||
    type === 'float' ||
    type === 'double'
  );
}

/**
 * Validates a decimal string as a 64-bit signed integer and returns it in the
 * canonical form the format expects. A string goes in, a string comes out.
 */
export function parseLongString(raw: string): ParseResult<string> {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return { ok: false, error: 'a long cannot be empty' };
  }
  if (!INTEGER_RE.test(trimmed)) {
    return {
      ok: false,
      error: `'${trimmed}' is not a whole number — 64-bit values need digits only (no decimal point, no exponent)`
    };
  }
  let value: bigint;
  try {
    value = BigInt(trimmed);
  } catch {
    return { ok: false, error: `'${trimmed}' is not a valid 64-bit integer` };
  }
  if (value < LONG_MIN || value > LONG_MAX) {
    return {
      ok: false,
      error: `${value} does not fit in 64 bits (${LONG_MIN} .. ${LONG_MAX})`
    };
  }
  return { ok: true, value: value.toString() };
}

/** Validates a byte/short/int, returning an in-range JS number. */
export function parseInteger(raw: string, type: 'byte' | 'short' | 'int'): ParseResult<number> {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return { ok: false, error: `a ${type} cannot be empty` };
  }
  if (!INTEGER_RE.test(trimmed)) {
    return { ok: false, error: `'${trimmed}' is not a whole number (digits only)` };
  }
  const bounds = INT_BOUNDS[type];
  let value: bigint;
  try {
    value = BigInt(trimmed);
  } catch {
    return { ok: false, error: `'${trimmed}' is not a valid integer` };
  }
  if (value < bounds.min || value > bounds.max) {
    return {
      ok: false,
      error: `${value} is outside the ${type} range (${bounds.min} .. ${bounds.max})`
    };
  }
  return { ok: true, value: Number(value) };
}

/**
 * Validates a `float` or `double`. A `float` is additionally rounded to f32
 * precision so the displayed value matches the bytes the serializer writes.
 */
export function parseFloating(raw: string, type: 'float' | 'double'): ParseResult<number> {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return { ok: false, error: `a ${type} cannot be empty` };
  }
  const value = Number(trimmed);
  if (Number.isNaN(value)) {
    return { ok: false, error: `'${trimmed}' is not a number` };
  }
  if (!Number.isFinite(value)) {
    return { ok: false, error: 'only finite values can be stored' };
  }
  if (type === 'float') {
    if (Math.abs(value) > F32_MAX) {
      return { ok: false, error: `${trimmed} is outside the 32-bit float range` };
    }
    return { ok: true, value: Math.fround(value) };
  }
  return { ok: true, value };
}

/**
 * Validates user input for any scalar tag and returns a whole, valid tag of the
 * requested type. Returned values are already canonical, so the caller can drop
 * them straight into the tree.
 */
export function parseScalarTag(type: NumericScalarType | 'string', raw: string): ParseResult<Tag> {
  switch (type) {
    case 'string':
      return { ok: true, value: { type: 'string', value: raw } };
    case 'long': {
      const parsed = parseLongString(raw);
      return parsed.ok ? { ok: true, value: { type: 'long', value: parsed.value } } : parsed;
    }
    case 'byte': {
      const parsed = parseInteger(raw, 'byte');
      return parsed.ok ? { ok: true, value: { type: 'byte', value: parsed.value } } : parsed;
    }
    case 'short': {
      const parsed = parseInteger(raw, 'short');
      return parsed.ok ? { ok: true, value: { type: 'short', value: parsed.value } } : parsed;
    }
    case 'int': {
      const parsed = parseInteger(raw, 'int');
      return parsed.ok ? { ok: true, value: { type: 'int', value: parsed.value } } : parsed;
    }
    case 'float': {
      const parsed = parseFloating(raw, 'float');
      return parsed.ok ? { ok: true, value: { type: 'float', value: parsed.value } } : parsed;
    }
    case 'double': {
      const parsed = parseFloating(raw, 'double');
      return parsed.ok ? { ok: true, value: { type: 'double', value: parsed.value } } : parsed;
    }
  }
}

const ARRAY_ELEMENT = {
  byteArray: 'byte',
  intArray: 'int',
  longArray: 'long'
} as const;

/**
 * Parses the body of an array editor into a whole, valid array tag.
 *
 * Values may be separated by commas, spaces or newlines in any mix, which is
 * what makes pasting a long byte array practical. Empty input yields an empty
 * array rather than an error: the serializer writes a length of zero, which is
 * a perfectly representable NBT value.
 */
export function parseArrayTag(type: 'byteArray' | 'intArray' | 'longArray', raw: string): ParseResult<Tag> {
  const bounds = INT_BOUNDS[ARRAY_ELEMENT[type]];
  const tokens = raw
    .split(/[\s,]+/)
    .filter((token) => token !== '');

  const longs: string[] = [];
  const numbers: number[] = [];

  for (const token of tokens) {
    if (!INTEGER_RE.test(token)) {
      return { ok: false, error: `'${token}' is not a whole number (digits only)` };
    }
    let value: bigint;
    try {
      value = BigInt(token);
    } catch {
      return { ok: false, error: `'${token}' is not a valid integer` };
    }
    if (value < bounds.min || value > bounds.max) {
      return {
        ok: false,
        error: `'${token}' is outside the ${ARRAY_ELEMENT[type]} range (${bounds.min} .. ${bounds.max})`
      };
    }
    longs.push(value.toString());
    if (type !== 'longArray') {
      numbers.push(Number(value));
    }
  }

  switch (type) {
    case 'longArray':
      // Element values stay strings so 64-bit precision survives.
      return { ok: true, value: { type: 'longArray', value: longs } };
    case 'byteArray':
      return { ok: true, value: { type: 'byteArray', value: numbers } };
    case 'intArray':
      return { ok: true, value: { type: 'intArray', value: numbers } };
  }
}

/** Formats an array tag's body for the text editor. */
export function formatArrayBody(tag: Tag): string {
  switch (tag.type) {
    case 'byteArray':
    case 'intArray':
    case 'longArray':
      return tag.value.join(', ');
    default:
      return '';
  }
}

/** Number of elements in an array tag, for the live count next to the editor. */
export function arrayLength(tag: Tag): number | null {
  switch (tag.type) {
    case 'byteArray':
    case 'intArray':
    case 'longArray':
      return tag.value.length;
    default:
      return null;
  }
}

/** Formats a scalar tag's value for a text input. */
export function formatScalarValue(tag: Tag): string {
  switch (tag.type) {
    case 'byte':
    case 'short':
    case 'int':
    case 'float':
    case 'double':
      return String(tag.value);
    case 'long':
      return tag.value;
    case 'string':
      return tag.value;
    default:
      return '';
  }
}

/**
 * Creates a fresh, valid, empty tag of the requested type. Used by the "add
 * child" and "add list item" flows.
 */
export function createDefaultTag(type: ValueTagType): Tag {
  switch (type) {
    case 'byte':
      return { type: 'byte', value: 0 };
    case 'short':
      return { type: 'short', value: 0 };
    case 'int':
      return { type: 'int', value: 0 };
    case 'long':
      return { type: 'long', value: '0' };
    case 'float':
      return { type: 'float', value: 0 };
    case 'double':
      return { type: 'double', value: 0 };
    case 'string':
      return { type: 'string', value: '' };
    case 'byteArray':
      return { type: 'byteArray', value: [] };
    case 'intArray':
      return { type: 'intArray', value: [] };
    case 'longArray':
      return { type: 'longArray', value: [] };
    case 'list':
      // A brand-new list is empty, which the format represents with element type
      // `end`; the UI asks for a real element type before the first item exists.
      return { type: 'list', elementType: 'end', value: [] };
    case 'compound':
      return { type: 'compound', value: [] };
  }
}

/** A new compound entry whose default name does not collide with its siblings. */
export function createDefaultEntry(type: ValueTagType, siblings: readonly NamedTag[]): NamedTag {
  const existing = new Set(siblings.map((entry) => entry.name));
  let index = 1;
  let name: string = type;
  while (existing.has(name)) {
    name = `${type}${index}`;
    index += 1;
  }
  return { name, tag: createDefaultTag(type) };
}

/** Single-line preview of a tag, used on collapsed container rows. */
export function previewTag(tag: Tag): string {
  switch (tag.type) {
    case 'byte':
    case 'short':
    case 'int':
    case 'float':
    case 'double':
      return String(tag.value);
    case 'long':
      return tag.value;
    case 'string': {
      const shown = tag.value.length > 64 ? `${tag.value.slice(0, 61)}…` : tag.value;
      return JSON.stringify(shown);
    }
    case 'byteArray':
      return `${tag.value.length} byte${tag.value.length === 1 ? '' : 's'}`;
    case 'intArray':
      return `${tag.value.length} int${tag.value.length === 1 ? '' : 's'}`;
    case 'longArray':
      return `${tag.value.length} long${tag.value.length === 1 ? '' : 's'}`;
    case 'list': {
      const kind = tag.elementType === 'end' ? 'untyped' : tag.elementType;
      return `${tag.value.length} ${kind} item${tag.value.length === 1 ? '' : 's'}`;
    }
    case 'compound':
      return `${tag.value.length} ${tag.value.length === 1 ? 'entry' : 'entries'}`;
  }
}

/** Formats a byte count for the toolbar. */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return '—';
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const units = ['KiB', 'MiB', 'GiB'];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${units[unitIndex]}`;
}
