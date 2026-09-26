// Path: src/components/tools/nbt/TagEditor.tsx
//
// The per-type value editor: one inline field for scalars, and the array editor
// for byteArray/intArray/longArray. Container tags have no direct value to edit,
// so this renders nothing for them (the row shows a child summary instead).
//
// Commit semantics, uniformly across every editor here:
//   Enter  → validate and commit
//   blur   → validate and commit
//   Escape → discard the draft and restore what the tree holds
//
// An out-of-range or unparseable value is reported inline and the tree is left
// untouched, so nothing is ever silently truncated.

import { useEffect, useRef, useState } from 'react';
import { isArray, isScalar, type Tag } from './types/nbt';
import { formatScalarValue, parseScalarTag } from './lib/tagDefaults';
import { t } from './i18n';
import ArrayListEditor from './ArrayListEditor';

interface TagEditorProps {
  tag: Tag;
  /** A message produced by a structural edit (e.g. a duplicate name). */
  externalError: string | null;
  onCommit: (tag: Tag) => void;
}

export default function TagEditor({ tag, externalError, onCommit }: TagEditorProps) {
  if (isScalar(tag)) {
    return <ScalarField tag={tag} externalError={externalError} onCommit={onCommit} />;
  }
  if (isArray(tag)) {
    return <ArrayListEditor tag={tag} externalError={externalError} onCommit={onCommit} />;
  }
  return null;
}

/** What kind of virtual keyboard / stepping a numeric type wants. */
function inputModeFor(tag: Tag): 'numeric' | 'decimal' | 'text' {
  switch (tag.type) {
    case 'byte':
    case 'short':
    case 'int':
    case 'long':
      return 'numeric';
    case 'float':
    case 'double':
      return 'decimal';
    default:
      return 'text';
  }
}

interface ScalarFieldProps {
  tag: Tag;
  externalError: string | null;
  onCommit: (tag: Tag) => void;
}

function ScalarField({ tag, externalError, onCommit }: ScalarFieldProps) {
  const current = formatScalarValue(tag);
  const [draft, setDraft] = useState(current);
  const [localError, setLocalError] = useState<string | null>(null);

  // Set when Escape reverts the draft, so the blur that immediately follows does
  // not re-commit the text the user just discarded.
  const skipBlurRef = useRef(false);
  const committedRef = useRef(current);

  // The tree can change underneath this field (a reopen, or the same value edited
  // elsewhere), so resync whenever the committed value differs from what we last
  // saw — but never while the user is mid-edit on an identical value.
  useEffect(() => {
    if (current !== committedRef.current) {
      committedRef.current = current;
      setDraft(current);
      setLocalError(null);
    }
  }, [current]);

  const commit = (): void => {
    const parsed = parseScalarTag(
      tag.type as 'byte' | 'short' | 'int' | 'long' | 'float' | 'double' | 'string',
      draft
    );
    if (!parsed.ok) {
      setLocalError(parsed.error);
      return;
    }
    setLocalError(null);
    // Compare canonically, so re-entering the same value does not mark the
    // document dirty and cost the byte-identical export path.
    if (formatScalarValue(parsed.value) === current) {
      setDraft(current);
      return;
    }
    committedRef.current = formatScalarValue(parsed.value);
    onCommit(parsed.value);
  };

  const revert = (): void => {
    setDraft(current);
    setLocalError(null);
  };

  const error = localError ?? externalError;

  return (
    <div className="min-w-0 flex-1">
      <input
        className="nbt-value-input"
        value={draft}
        spellCheck={false}
        autoComplete="off"
        inputMode={inputModeFor(tag)}
        aria-label={t('tools.nbt-editor.editor.value', tag.type)}
        aria-invalid={error ? true : undefined}
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
          commit();
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commit();
            event.currentTarget.blur();
          } else if (event.key === 'Escape') {
            event.preventDefault();
            skipBlurRef.current = true;
            revert();
            event.currentTarget.blur();
          }
        }}
      />
      {error ? <p className="nbt-row-error">{error}</p> : null}
    </div>
  );
}
