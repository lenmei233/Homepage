// Path: src/components/tools/nbt/NbtEditor.tsx
//
// The tool as the Tools tab sees it: one glass card holding the header, the open
// document's strip and tree (or the dropzone), and the keyboard hints.
//
// What changed structurally from the standalone editor (`App.tsx` + `Toolbar.tsx`
// of nbt-web-editor):
//   * the app's own page chrome — full-height column, brand bar — is gone; the
//     site's Tools page supplies the page, sidebar and background;
//   * the brand line and the privacy note moved into this header, and the core
//     version is shown next to them instead of in a strip of its own;
//   * the tree lives in a scroll-capped glass panel, because the page scrolls
//     with the site instead of the editor owning the viewport height;
//   * a wasm-load failure now gets a dismiss button, where the original passed a
//     no-op;
//   * a render error anywhere below is caught by a boundary that keeps the rest
//     of the page alive — the same guarantee the standalone app made.
//
// Nothing about parsing, editing, the modified/original distinction or the
// export path changed: those all live in the modules below.

import { Component, useEffect, useState, type ErrorInfo, type ReactNode } from 'react';
import { useNbtWasm } from './hooks/useNbtWasm';
import { detectLang, setLang, t, type Lang } from './i18n';
import { useNbtStore } from './store/nbtStore';
import FileDropzone from './FileDropzone';
import NbtToolbar from './NbtToolbar';
import NbtTreeView from './NbtTreeView';
import ErrorBanner from './ErrorBanner';
import { BoxIcon, LockIcon } from './icons';
import './nbt.css';

export default function NbtEditor() {
  return (
    <ToolBoundary>
      <NbtEditorBody />
    </ToolBoundary>
  );
}

function NbtEditorBody() {
  // The translator has to be installed before the children render, so it is set
  // inside the initialiser rather than in an effect (that would flash the raw
  // keys on the first paint).
  const [lang, setLangState] = useState<Lang>(() => {
    const initial = detectLang();
    setLang(initial);
    return initial;
  });
  const [wasmErrorDismissed, setWasmErrorDismissed] = useState(false);

  const wasm = useNbtWasm();
  const document_ = useNbtStore((state) => state.document);
  const error = useNbtStore((state) => state.error);
  const dismissError = useNbtStore((state) => state.dismissError);
  const status = useNbtStore((state) => state.status);

  useEffect(() => {
    // The Settings panel switches the whole site's language with this event.
    const handler = (event: Event) => {
      const next = (event as CustomEvent<Lang>).detail;
      setLang(next);
      setLangState(next);
    };
    document.addEventListener('lang-changed', handler);
    return () => document.removeEventListener('lang-changed', handler);
  }, []);

  return (
    <div className="gc nbt-tool">
      <header className="nbt-head">
        <span className="nbt-brand">
          <span className="nbt-brand-mark">
            <BoxIcon />
          </span>
          {t('tools.nbt-editor')}
        </span>
        <span className="nbt-note">
          <LockIcon />
          {t('tools.nbt-editor.privacy')}
        </span>
        {wasm.version ? (
          <span className="nbt-head-meta">nbt-core {wasm.version}</span>
        ) : null}
      </header>

      {wasm.error && !wasmErrorDismissed ? (
        <ErrorBanner
          title={t('tools.nbt-editor.wasm-failed')}
          message={`${wasm.error}\n\n${t('tools.nbt-editor.wasm-failed-hint')}`}
          onDismiss={() => setWasmErrorDismissed(true)}
        />
      ) : null}

      {document_ ? <NbtToolbar /> : null}

      {document_ ? (
        <div className="nbt-panel nbt-treewrap nbt-scroll">
          <NbtTreeView document={document_} />
        </div>
      ) : wasm.ready ? (
        <FileDropzone />
      ) : (
        <div className="nbt-drop">
          <span className="nbt-drop-title">
            {status === 'parsing'
              ? t('tools.nbt-editor.parsing')
              : t('tools.nbt-editor.starting')}
          </span>
        </div>
      )}

      {error ? (
        <ErrorBanner
          title={t('tools.nbt-editor.open-failed')}
          message={error}
          onDismiss={dismissError}
        />
      ) : null}

      {document_ ? (
        <footer className="nbt-foot">
          <span>{t('tools.nbt-editor.foot.hints')}</span>
          <span className="nbt-foot-meta">
            {document_.compression} · {document_.root.tag.type}
          </span>
        </footer>
      ) : null}
    </div>
  );
}

interface BoundaryProps {
  children: ReactNode;
}

interface BoundaryState {
  error: Error | null;
}

/**
 * Last-resort boundary, for the tool only. A render error inside the tree would
 * otherwise blank the whole single-page app; this keeps the rest of the site
 * interactive, offers a retry, and reports the actual message.
 */
class ToolBoundary extends Component<BoundaryProps, BoundaryState> {
  override state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('the NBT tool crashed while rendering', error, info.componentStack);
  }

  override render(): ReactNode {
    const { error } = this.state;
    if (!error) {
      return this.props.children;
    }
    return (
      <div className="gc nbt-tool">
        <ErrorBanner
          title={t('tools.nbt-editor.crash')}
          message={`${error.message}\n\n${t('tools.nbt-editor.crash-hint')}`}
          onDismiss={() => this.setState({ error: null })}
        />
      </div>
    );
  }
}
