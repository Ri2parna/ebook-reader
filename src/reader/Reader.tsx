import { createEffect, createSignal, onCleanup, onMount } from "solid-js";
import { OpenedBook, readChapter } from "../book";
import { resolvedTheme, settings } from "../store";
import { chapterCss, PALETTES } from "./theme";
import TypographyPanel from "./TypographyPanel";

export default function Reader(props: { book: OpenedBook; onBack: () => void }) {
  let frame!: HTMLIFrameElement;
  const [showTypography, setShowTypography] = createSignal(false);
  const scheme = window.matchMedia("(prefers-color-scheme: dark)");
  const onSchemeChange = () => applyStyle();

  function applyStyle(css?: string) {
    const doc = frame.contentDocument;
    if (!doc || !doc.head) return;
    let style = doc.head.querySelector<HTMLStyleElement>("#reader-style");
    if (!style) {
      style = doc.createElement("style");
      style.id = "reader-style";
      doc.head.appendChild(style);
    }
    style.textContent = css ?? chapterCss(settings, PALETTES[resolvedTheme()]);
  }

  createEffect(() => {
    // read tracked settings so any change re-applies instantly
    applyStyle(chapterCss(settings, PALETTES[resolvedTheme()]));
  });

  createEffect(() => {
    document.title = props.book.title;
  });

  onMount(async () => {
    scheme.addEventListener("change", onSchemeChange);
    if (props.book.kind === "pdf" && props.book.file) {
      const name = encodeURIComponent(props.book.file);
      frame.src = `book://local/${props.book.id}/${name}`;
    } else {
      frame.srcdoc = await readChapter(props.book.id, 0);
    }
  });

  onCleanup(() => scheme.removeEventListener("change", onSchemeChange));

  const palette = () => PALETTES[resolvedTheme()];

  return (
    <div
      class="reader"
      style={{
        "--chrome-bg": palette().bg,
        "--chrome-fg": palette().fg,
        "--chrome-muted": palette().muted,
        "--chrome-border": palette().border,
      }}
    >
      <header class="toolbar">
        <button class="tool-btn" title="Close book (Esc)" onClick={props.onBack}>
          ← Back
        </button>
        <div class="toolbar-title" title={props.book.title}>
          {props.book.title}
        </div>
        <div class="toolbar-actions">
          <button
            class="tool-btn"
            classList={{ active: showTypography() }}
            title="Appearance"
            onClick={() => setShowTypography((v) => !v)}
          >
            Aa
          </button>
        </div>
      </header>
      {showTypography() && <TypographyPanel />}
      <iframe
        ref={frame}
        class="reader-frame"
        title={props.book.title}
        onLoad={() => applyStyle()}
      />
    </div>
  );
}
