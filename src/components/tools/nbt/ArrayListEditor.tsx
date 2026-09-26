// Path: src/components/tools/nbt/ArrayListEditor.tsx
//
// byteArray / intArray / longArray as one editable text body.
//
// Values are separated by commas, spaces or newlines in any mix, because pasting
// a few hundred bytes out of a tool is the realistic workflow. Enter therefore
// inserts a newline rather than committing; commit with the Apply button,
// Cmd/Ctrl+Enter, or by leaving the field.
//
// A live count of the parsed values is shown, and long-array elements stay
// strings the whole way — a 64-bit value must never pass through `Number`.

import { useEffect, useRef, useState } from 'react';
import type { Tag } from './types/nbt';
import { arrayLength, formatArrayBody, parseArrayTag } from './lib/tagDefaults';
import { describeArrayCount } from './format';
import { t } from './i18n';

interface ArrayListEditorProps {
  tag: Tag;
  externalError: string | null;
  onCommit: (tag: Tag) => void;
}

type ArrayType = 'byteArray' | 'intArray' | 'longArray';

/** True when the tag is one of the three array types. */
function isArrayType(type: Tag['type']): type is ArrayType {
  return type === 'byteArray' || type === 'intArray' || type === 'longArray';
}

export default function ArrayListEditor({ tag, externalError, onCommit }: ArrayListEditorProps) {
  const current = formatArrayBody(tag);
  const [draft, setDraft] = useState(current);
  const [localError, setLocalError] = useState<string | null>(null);
  const skipBlurRef = useRef(false);
  const committedRef = useRef(current);

  useEffect(() => {
    if (current !== committedRef.current) {
      committedRef.current = current;
      setDraft(current);
      setLocalError(null);
    }
  }, [current]);

  if (!isArrayType(tag.type)) {
    return null;
  }
  const arrayType = tag.type;

  // Counted live so the user sees the effect of a paste before committing.
  const preview = parseArrayTag(arrayType, draft);
  const count = preview.ok ? arrayLength(preview.value) : null;

  const commit = (): void => {
    const parsed = parseArrayTag(arrayType, draft);
    if (!parsed.ok) {
      setLocalError(parsed.error);
      return;
    }
    setLocalError(null);
    const canonical = formatArrayBody(parsed.value);
    if (canonical === current) {
      setDraft(current);
      return;
    }
    committedRef.current = canonical;
    onCommit(parsed.value);
  };

  const revert = (): void => {
    setDraft(current);
    setLocalError(null);
  };

  const error = localError ?? externalError;
  const dirty = draft !== current;

  return (
    <div className="min-w-0 flex-1">
      <div className="nbt-array">
        <textarea
          className="nbt-value-input"
          rows={2}
          value={draft}
          spellCheck={false}
          aria-label={t('tools.nbt-editor.editor.array', arrayType)}
          aria-invalid={error ? true : undefined}
          placeholder="0, 1, 2, …"
          onChange={(event) => {
            setDraft(event.target.value);
            if (localError) {
              setLocalError(null);
            }
          }}
          onBlur={() => {
            if (skipBlurRef.current) {
              skipBlurRef.current = false;
              return;
            }
            if (dirty) {
              commit();
            }
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              commit();
              return;
            }
            if (event.key === 'Escape') {
              event.preventDefault();
              skipBlurRef.current = true;
              revert();
              event.currentTarget.blur();
            }
          }}
        />
        <div className="nbt-array-side">
          <span className="nbt-array-count">
            {count === null ? '—' : describeArrayCount(count)}
          </span>
          <button
            type="button"
            className="nbt-btn"
            disabled={!dirty}
            onClick={commit}
            title={t('tools.nbt-editor.array.apply-title')}
          >
            {t('tools.nbt-editor.array.apply')}
          </button>
        </div>
      </div>
      {error ? <p className="nbt-row-error">{error}</p> : null}
    </div>
  );
}
