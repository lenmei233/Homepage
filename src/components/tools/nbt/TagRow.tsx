// Path: src/components/tools/nbt/TagRow.tsx
//
// One row of the tree: type badge, name, value (or child summary), and the
// actions that apply to whatever kind of tag it is.
//
// Actions are hidden until the row is hovered or holds focus, so a large tree
// stays readable, but they remain reachable by keyboard because `:focus-within`
// reveals them too.
//
// The "add" control is a native `<select>` rather than a custom popover: it is
// keyboard- and screen-reader-correct for free, which matters more here than a
// bespoke menu would.

import { useEffect, useRef, useState } from 'react';
import {
  isCompound,
  isList,
  TAG_TYPE_META,
  VALUE_TAG_TYPES,
  type Tag,
  type ValueTagType
} from './types/nbt';
import { describeTag } from './format';
import { t } from './i18n';
import type { Path } from './lib/treeEdits';
import { ChevronIcon } from './icons';
import TagEditor from './TagEditor';

interface TagRowProps {
  /** Compound entry name, or the index label for a list item. */
  name: string;
  tag: Tag;
  path: Path;
  depth: number;
  /** Compound children can be renamed; list items are addressed by index. */
  renamable: boolean;
  /** Omit the name editor entirely (used for tags that cannot be renamed). */
  fixedName?: boolean;
  /** The document root cannot be deleted, only renamed. */
  deletable?: boolean;
  expanded: boolean;
  onToggleExpanded: () => void;
  onRename: (name: string) => void;
  onCommitValue: (tag: Tag) => void;
  onAddChild: (type: ValueTagType) => void;
  onDelete: () => void;
  fieldError: { pathKey: string; message: string } | null;
}

export default function TagRow({
  name,
  tag,
  path,
  depth,
  renamable,
  fixedName = false,
  deletable = true,
  expanded,
  onToggleExpanded,
  onRename,
  onCommitValue,
  onAddChild,
  onDelete,
  fieldError
}: TagRowProps) {
  const meta = TAG_TYPE_META[tag.type];
  const isContainer = isCompound(tag) || isList(tag);
  const childCount = isCompound(tag) || isList(tag) ? tag.value.length : 0;
  const error = fieldError && fieldError.pathKey === pathKeyOf(path) ? fieldError.message : null;

  return (
    <div
      className="nbt-row"
      style={{ paddingLeft: `${depth * 1.05 + 0.25}rem` }}
    >
      {/* Expand/collapse gutter. Kept the same width for leaves so columns line up. */}
      <span className="nbt-row-gutter">
        {isContainer ? (
          <button
            type="button"
            className="nbt-twisty"
            onClick={onToggleExpanded}
            aria-expanded={expanded}
            aria-label={`${t(expanded ? 'tools.nbt-editor.row.collapse' : 'tools.nbt-editor.row.expand')} ${name}`}
          >
            <ChevronIcon open={expanded} />
          </button>
        ) : null}
      </span>

      <span className={meta.badgeClass} title={t(`tools.nbt-editor.type.${tag.type}`)}>
        {meta.badge}
      </span>

      {/* Name */}
      {fixedName ? (
        <span className="nbt-name nbt-name-text" title={name}>
          {name === '' ? t('tools.nbt-editor.unnamed') : name}
        </span>
      ) : (
        <NameField
          name={name}
          renamable={renamable}
          onRename={onRename}
          ariaLabel={t('tools.nbt-editor.editor.name', tag.type)}
        />
      )}

      {/* Value or child summary */}
      <div className="nbt-value">
        {isContainer ? (
          <span className="nbt-value-summary">
            {describeTag(tag)}
            {isList(tag) && tag.elementType === 'end' && childCount === 0 ? (
              <span className="nbt-warn"> {t('tools.nbt-editor.list.needs-type')}</span>
            ) : null}
          </span>
        ) : (
          <TagEditor tag={tag} externalError={error} onCommit={onCommitValue} />
        )}
      </div>

      {/* Row actions */}
      <span className="nbt-actions">
        <AddChildControl
          parent={tag}
          onAddChild={onAddChild}
          label={t('tools.nbt-editor.row.add', name === '' ? t('tools.nbt-editor.this-tag') : name)}
        />
        {deletable ? (
          <button
            type="button"
            className="nbt-mini nbt-mini--danger"
            onClick={onDelete}
            aria-label={t(
              'tools.nbt-editor.row.delete',
              name === '' ? t('tools.nbt-editor.this-tag') : name
            )}
            title={t('tools.nbt-editor.row.delete-title')}
          >
            ✕
          </button>
        ) : null}
      </span>
    </div>
  );
}

/** Same encoding as `pathKey`, inlined to avoid a circular import. */
function pathKeyOf(path: Path): string {
  let key = '$';
  for (const segment of path) {
    key += typeof segment === 'number' ? `[${segment}]` : `/${segment}`;
  }
  return key;
}

interface NameFieldProps {
  name: string;
  renamable: boolean;
  onRename: (name: string) => void;
  ariaLabel: string;
}

/**
 * The key of a compound entry. List items show their index instead, since they
 * have no name on the wire.
 */
function NameField({ name, renamable, onRename, ariaLabel }: NameFieldProps) {
  const [draft, setDraft] = useState(name);
  const skipBlurRef = useRef(false);

  useEffect(() => {
    setDraft(name);
  }, [name]);

  if (!renamable) {
    return (
      <span className="nbt-name nbt-name-text" title={name}>
        {name}
      </span>
    );
  }

  const commit = (): void => {
    if (draft === name) {
      return;
    }
    onRename(draft);
  };

  return (
    <span className="nbt-name">
      <input
        className="nbt-name-input"
        value={draft}
        spellCheck={false}
        autoComplete="off"
        aria-label={ariaLabel}
        placeholder={t('tools.nbt-editor.unnamed')}
        onChange={(event) => setDraft(event.target.value)}
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
            setDraft(name);
            event.currentTarget.blur();
          }
        }}
      />
    </span>
  );
}

interface AddChildControlProps {
  parent: Tag;
  onAddChild: (type: ValueTagType) => void;
  label: string;
}

/**
 * The add-a-tag control, present only where it makes sense:
 *   * a compound takes a new named child of any type;
 *   * an EMPTY list takes a first item, which is also what declares its element
 *     type — so this doubles as the "what does this list hold?" prompt;
 *   * a non-empty list adds another item of its existing element type.
 *
 * A non-empty list's element type is fixed by the format, so it gets a plain
 * button rather than a type menu.
 */
function AddChildControl({ parent, onAddChild, label }: AddChildControlProps) {
  if (isCompound(parent)) {
    return <TypeSelect onPick={onAddChild} label={label} />;
  }
  if (isList(parent)) {
    if (parent.value.length > 0) {
      const elementType = parent.elementType as ValueTagType;
      return (
        <button
          type="button"
          className="nbt-mini"
          onClick={() => onAddChild(elementType)}
          aria-label={t('tools.nbt-editor.row.add-item', elementType)}
          title={t('tools.nbt-editor.row.add-item-title', elementType)}
        >
          {t('tools.nbt-editor.add.item')}
        </button>
      );
    }
    return (
      <TypeSelect onPick={onAddChild} label={label} placeholder={t('tools.nbt-editor.add.item-of')} />
    );
  }
  return null;
}

interface TypeSelectProps {
  onPick: (type: ValueTagType) => void;
  label: string;
  placeholder?: string;
}

/** The menu of the twelve real tag types. `end` is not a value, so it is absent. */
function TypeSelect({ onPick, label, placeholder }: TypeSelectProps) {
  return (
    <select
      className="nbt-mini nbt-mini-select"
      value=""
      aria-label={label}
      onChange={(event) => {
        const value = event.target.value as ValueTagType | '';
        if (value !== '') {
          onPick(value);
        }
        // Reset so the same type can be picked again for the next child.
        event.target.value = '';
      }}
    >
      <option value="">{placeholder ?? t('tools.nbt-editor.add.tag')}</option>
      {VALUE_TAG_TYPES.map((type) => (
        <option key={type} value={type}>
          {TAG_TYPE_META[type].wireName} — {t(`tools.nbt-editor.type.${type}`)}
        </option>
      ))}
    </select>
  );
}
