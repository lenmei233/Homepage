// Path: src/components/tools/nbt/ErrorBanner.tsx
//
// The dismissible error strip.
//
// Messages are surfaced verbatim, exactly as the original editor did: the Rust
// side's text ("unexpected end of input while reading TAG_Int: needed 4 more
// byte(s), 0 left") is more useful than anything this layer could paraphrase.
// Only the framing — title and the dismiss control — is localised.
//
// The app never renders an empty screen because of a failure: this takes the
// place of a crash, next to an intact tree.

import { t } from './i18n';

interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
  /** Extra framing for messages that come from a specific attempt. */
  title?: string;
}

export default function ErrorBanner({ message, onDismiss, title }: ErrorBannerProps) {
  return (
    <div role="alert" className="nbt-banner">
      <span className="nbt-banner-dot" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title ? <p className="nbt-banner-title">{title}</p> : null}
        <p className="nbt-banner-body">{message}</p>
      </div>
      <button
        type="button"
        className="nbt-btn nbt-btn--danger"
        onClick={onDismiss}
        aria-label={t('tools.nbt-editor.dismiss')}
      >
        {t('tools.nbt-editor.dismiss')}
      </button>
    </div>
  );
}
