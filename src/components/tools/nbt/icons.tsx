// Path: src/components/tools/nbt/icons.tsx
//
// The few inline icons the tool's chrome needs. The site ships no icon set (its
// own navigation draws SVGs inline), so the editor keeps doing the same instead
// of adding a dependency.

/** Privacy marker: parsing and export both happen in the browser. */
export function LockIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4.5 7V5.5a3.5 3.5 0 1 1 7 0V7" />
      <path d="M3.75 7h8.5a.75.75 0 0 1 .75.75v5a.75.75 0 0 1-.75.75h-8.5A.75.75 0 0 1 3 12.75v-5A.75.75 0 0 1 3.75 7Z" />
    </svg>
  );
}

/** The brand mark: a box, because everything here is a binary container. */
export function BoxIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}

/** Expand/collapse marker for a tree row. */
export function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden="true">
      <path
        d={open ? 'M2.5 4.25 6 7.75l3.5-3.5' : 'M4.25 2.5 7.75 6l-3.5 3.5'}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
