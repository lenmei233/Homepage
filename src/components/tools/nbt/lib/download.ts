// Path: src/components/tools/nbt/lib/download.ts
//
// Ported verbatim from nbt-web-editor `web/src/lib/download.ts`.
//
// Handing bytes back to the user. Kept tiny and explicit so the export path
// (which is the one thing that must be byte-exact) has no surprises in it.

/** Default output name when no source file name is known. */
export const DEFAULT_FILE_NAME = 'edited.nbt';

/**
 * Derives an output name from the opened file's name.
 *
 * Exported files keep the original name: an NBT file's name is how the game
 * finds it (`level.dat`, `map_1.dat`, ...), so renaming on export would be
 * actively unhelpful.
 */
export function outputFileName(sourceName: string | null): string {
  if (!sourceName) {
    return DEFAULT_FILE_NAME;
  }
  // Strip any path components a browser might have leaked through, so a crafted
  // file name cannot escape into a different "directory" in the save dialog.
  const base = sourceName.split(/[\\/]/).pop();
  return base && base.trim() !== '' ? base : DEFAULT_FILE_NAME;
}

/**
 * Downloads `bytes` as a file.
 *
 * The object URL is revoked as soon as the click has been dispatched. The
 * download has already latched onto the blob by then, so revoking immediately
 * is safe and avoids leaking a URL per export.
 */
export function downloadBytes(bytes: Uint8Array, fileName: string): void {
  // A fresh copy keeps the Blob independent of any view we retain in the store,
  // so a later mutation of the store cannot alter what was queued for download.
  const blob = new Blob([new Uint8Array(bytes)], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.rel = 'noopener';
    anchor.style.display = 'none';
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}
