// Path: src/components/tools/nbt/NbtToolbar.tsx
//
// The file strip: what file is open, how big it is, how it is wrapped, the
// export controls, and the way back out (reopen / close).
//
// The brand line and the privacy note that the original header carried now live
// in the tool header (`NbtEditor.tsx`), because the site already has a page
// chrome around the tool — this strip only carries what is specific to the open
// document. On a narrow column it wraps instead of scrolling horizontally.
//
// The compression selector is deliberately just a wrapper over the second
// argument of `serialize_nbt`. Its choice only takes effect on a *modified*
// export — an unmodified document is handed back byte-for-byte, and no
// re-compression can reproduce those bytes exactly — so the strip says so
// instead of quietly ignoring the selection.

import { useRef, useState } from 'react';
import { TAG_TYPE_META, VALUE_TAG_TYPES, type Compression, type ValueTagType } from './types/nbt';
import { COMPRESSIONS, formatBytes } from './lib/tagDefaults';
import { downloadBytes, outputFileName } from './lib/download';
import { errorMessage, useNbtStore } from './store/nbtStore';
import { t } from './i18n';

export default function NbtToolbar() {
  const document_ = useNbtStore((state) => state.document);
  const originalBytes = useNbtStore((state) => state.originalBytes);
  const isDirty = useNbtStore((state) => state.isDirty);
  const fileName = useNbtStore((state) => state.fileName);
  const exportCompression = useNbtStore((state) => state.exportCompression);
  const setExportCompression = useNbtStore((state) => state.setExportCompression);
  const reset = useNbtStore((state) => state.reset);
  const exportBytes = useNbtStore((state) => state.exportBytes);
  const openFile = useNbtStore((state) => state.openFile);
  const addChild = useNbtStore((state) => state.addChild);
  const expandToDepth = useNbtStore((state) => state.expandToDepth);

  const reopenRef = useRef<HTMLInputElement>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = () => {
    try {
      const bytes = exportBytes();
      downloadBytes(bytes, outputFileName(fileName));
      setExportError(null);
    } catch (error) {
      // The message comes from the Rust boundary or from the shapes we validate
      // on the way in. Showing it beats a silent no-op on the button.
      setExportError(errorMessage(error));
    }
  };

  if (!document_) {
    return null;
  }

  const compressionChanged = document_.compression !== exportCompression;

  return (
    <div className="nbt-strip">
      <span className="nbt-file" title={fileName || t('tools.nbt-editor.no-name')}>
        {fileName || t('tools.nbt-editor.no-name')}
      </span>

      <span className="nbt-facts">
        <span>
          {originalBytes ? formatBytes(originalBytes.length) : '—'}{' '}
          {t('tools.nbt-editor.meta.disk')}
        </span>
        <span className="nbt-sep">·</span>
        <span>
          {formatBytes(document_.rawSize)} {t('tools.nbt-editor.meta.payload')}
        </span>
        <span className="nbt-sep">·</span>
        <span>
          {document_.nodeCount} {t('tools.nbt-editor.meta.tags')}
        </span>
      </span>

      <span
        className={`nbt-pill ${isDirty ? 'nbt-pill--dirty' : 'nbt-pill--clean'}`}
        title={
          isDirty
            ? t('tools.nbt-editor.state.modified-title')
            : t('tools.nbt-editor.state.original-title')
        }
      >
        {isDirty ? t('tools.nbt-editor.state.modified') : t('tools.nbt-editor.state.original')}
      </span>

      <div className="nbt-actions-bar">
        <button
          type="button"
          className="nbt-btn"
          onClick={() => expandToDepth(2)}
          title={t('tools.nbt-editor.expand2-title')}
        >
          {t('tools.nbt-editor.expand2')}
        </button>
        <AddRootEntry onAdd={(type) => addChild([], type)} />

        <label className="nbt-facts">
          <span>{t('tools.nbt-editor.compression')}</span>
          <select
            className="nbt-select"
            value={exportCompression}
            onChange={(event) =>
              setExportCompression(event.target.value as Compression)
            }
            title={t('tools.nbt-editor.compression-title')}
          >
            {COMPRESSIONS.map((compression) => (
              <option key={compression} value={compression}>
                {t(`tools.nbt-editor.comp.${compression}`)}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="nbt-btn"
          onClick={() => reopenRef.current?.click()}
          title={t('tools.nbt-editor.reopen-title')}
        >
          {t('tools.nbt-editor.reopen')}
        </button>
        <button
          type="button"
          className="nbt-btn nbt-btn--danger"
          onClick={reset}
          title={t('tools.nbt-editor.close-title')}
        >
          {t('tools.nbt-editor.close')}
        </button>
        <button
          type="button"
          className="nbt-btn nbt-btn--primary"
          onClick={handleExport}
          title={isDirty ? t('tools.nbt-editor.export-dirty') : t('tools.nbt-editor.export-clean')}
        >
          {t('tools.nbt-editor.export')}
        </button>
      </div>

      <input
        ref={reopenRef}
        type="file"
        className="hidden"
        accept=".dat,.nbt,.mcstructure,.schematic,.gz"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            // The picker is also the "replace this file" path, so the current
            // document is intentionally left on screen until the new one
            // parses successfully.
            void openFile(file);
          }
          event.target.value = '';
        }}
      />

      <div className="w-full">
        {compressionChanged ? (
          <p className="nbt-warn">
            {t(
              'tools.nbt-editor.comp-changed',
              t(`tools.nbt-editor.comp.${exportCompression}`),
              t(`tools.nbt-editor.comp.${document_.compression}`)
            )}
          </p>
        ) : null}

        {exportError ? (
          <p role="alert" className="nbt-row-error">
            {t('tools.nbt-editor.export-failed')} {exportError}
          </p>
        ) : null}
      </div>
    </div>
  );
}

interface AddRootEntryProps {
  onAdd: (type: ValueTagType) => void;
}

/** Adds a named entry to the document root. Only shown when that is possible. */
function AddRootEntry({ onAdd }: AddRootEntryProps) {
  const root = useNbtStore((state) => state.document?.root.tag);
  if (!root || root.type !== 'compound') {
    return null;
  }
  return (
    <select
      className="nbt-select"
      value=""
      aria-label={t('tools.nbt-editor.add-root-title')}
      onChange={(event) => {
        const value = event.target.value as ValueTagType | '';
        if (value !== '') {
          onAdd(value);
        }
        event.target.value = '';
      }}
    >
      <option value="">{t('tools.nbt-editor.add-root')}</option>
      {VALUE_TAG_TYPES.map((type) => (
        <option key={type} value={type}>
          {TAG_TYPE_META[type].wireName}
        </option>
      ))}
    </select>
  );
}
