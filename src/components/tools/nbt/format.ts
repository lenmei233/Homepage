// Path: src/components/tools/nbt/format.ts
//
// The words that sit next to the numbers.
//
// `lib/tagDefaults.ts` stays language-free on purpose — it is the module the
// correctness tests exercise — so the human-readable summaries are assembled
// here from the i18n catalogue. The shape of each string matches what
// `previewTag` used to produce inline (`"3 compound items"`, `"12 bytes"`); only
// the nouns are translated.
//
// Scalars keep using `previewTag` directly: numbers and quoted strings are the
// same in both languages, and re-formatting them here would risk drifting from
// what the serializer writes.

import { previewTag } from './lib/tagDefaults';
import { t } from './i18n';
import type { Tag } from './types/nbt';

function plural(one: string, many: string, count: number): string {
  return count === 1 ? t(one) : t(many);
}

/** One-line summary for a row that has no inline editor: containers and arrays. */
export function describeTag(tag: Tag): string {
  switch (tag.type) {
    case 'compound':
      return `${tag.value.length} ${plural(
        'tools.nbt-editor.preview.entry-one',
        'tools.nbt-editor.preview.entry-many',
        tag.value.length
      )}`;
    case 'list': {
      const kind =
        tag.elementType === 'end'
          ? t('tools.nbt-editor.preview.untyped')
          : t(`tools.nbt-editor.type.${tag.elementType}`).toLowerCase();
      return `${tag.value.length} ${kind} ${plural(
        'tools.nbt-editor.preview.item-one',
        'tools.nbt-editor.preview.item-many',
        tag.value.length
      )}`;
    }
    case 'byteArray':
    case 'intArray':
    case 'longArray':
      return `${tag.value.length} ${plural(
        'tools.nbt-editor.preview.value-one',
        'tools.nbt-editor.preview.value-many',
        tag.value.length
      )}`;
    default:
      return previewTag(tag);
  }
}

/** Live element count shown beside an array editor. */
export function describeArrayCount(count: number): string {
  return `${count} ${plural(
    'tools.nbt-editor.preview.value-one',
    'tools.nbt-editor.preview.value-many',
    count
  )}`;
}
