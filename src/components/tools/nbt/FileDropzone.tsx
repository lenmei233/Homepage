// Path: src/components/tools/nbt/FileDropzone.tsx
//
// The empty state and the re-open affordance: drag & drop anywhere on the box, or
// click to browse. The file is read as an `ArrayBuffer` and handed straight to
// the store; nothing is sent anywhere.
//
// Drag state is tracked with a counter rather than a boolean because dragenter /
// dragleave fire for every child element the pointer crosses; a boolean would
// flicker as the cursor passes over the label and the icon.
//
// Only the chrome changed from the original: the box is the site's dashed glass
// surface with an accent wash (`.nbt-drop`), and every string is localised.

import { useRef, useState } from 'react';
import { useNbtStore } from './store/nbtStore';
import { t } from './i18n';
import { LockIcon } from './icons';

/** Extensions the editor expects. Also used as the file picker's accept filter. */
const ACCEPTED_EXTENSIONS = ['.dat', '.nbt', '.mcstructure', '.schematic'];
const ACCEPT_ATTRIBUTE = ACCEPTED_EXTENSIONS.join(',');

interface FileDropzoneProps {
  /** Rendered inside the box, before the privacy line. */
  compact?: boolean;
}

export default function FileDropzone({ compact = false }: FileDropzoneProps) {
  const openFile = useNbtStore((state) => state.openFile);
  const status = useNbtStore((state) => state.status);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [dragging, setDragging] = useState(false);
  // A dropped file that is obviously not NBT is rejected here, before parse, so
  // the message can name the reason instead of echoing a byte-level parse error.
  const [rejection, setRejection] = useState<string | null>(null);

  const busy = status === 'parsing';

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) {
      return;
    }
    const lower = file.name.toLowerCase();
    const looksAccepted = ACCEPTED_EXTENSIONS.some((extension) => lower.endsWith(extension));
    const looksCompressed = /\.(gz|zlib|z)$/.test(lower);
    if (!looksAccepted && !looksCompressed) {
      setRejection(t('tools.nbt-editor.drop.reject', file.name));
      return;
    }
    setRejection(null);
    void openFile(file);
  };

  return (
    <div className="w-full">
      <div
        className="nbt-drop"
        data-dragging={dragging ? 'true' : 'false'}
        onDragEnter={(event) => {
          event.preventDefault();
          dragDepth.current += 1;
          setDragging(true);
        }}
        onDragOver={(event) => {
          // Required, or the browser navigates to the dropped file instead.
          event.preventDefault();
          event.dataTransfer.dropEffect = 'copy';
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          dragDepth.current -= 1;
          if (dragDepth.current <= 0) {
            dragDepth.current = 0;
            setDragging(false);
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          dragDepth.current = 0;
          setDragging(false);
          handleFiles(event.dataTransfer.files);
        }}
      >
        <button
          type="button"
          className="nbt-drop-btn"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          <span className="nbt-drop-title">
            {busy ? t('tools.nbt-editor.parsing') : t('tools.nbt-editor.drop.title')}
          </span>
          <span className="nbt-drop-pick">
            {t('tools.nbt-editor.drop.or')}{' '}
            <span className="nbt-drop-link">{t('tools.nbt-editor.drop.pick')}</span>
          </span>
          <span className="nbt-drop-ext">{ACCEPTED_EXTENSIONS.join('  ·  ')}</span>
        </button>

        {!compact ? <p className="nbt-drop-hint">{t('tools.nbt-editor.drop.hint')}</p> : null}
      </div>

      <p className="nbt-drop-privacy">
        <LockIcon />
        <span>{t('tools.nbt-editor.privacy')}</span>
      </p>

      {rejection ? (
        <p role="alert" className="nbt-reject">
          {rejection}
        </p>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={ACCEPT_ATTRIBUTE}
        onChange={(event) => {
          handleFiles(event.target.files);
          // Reset so re-picking the same file fires `change` again.
          event.target.value = '';
        }}
      />
    </div>
  );
}

export { ACCEPTED_EXTENSIONS };
