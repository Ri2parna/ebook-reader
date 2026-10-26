import { createSignal, onMount, Show } from "solid-js";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { open } from "@tauri-apps/plugin-dialog";
import { openBook, OpenedBook } from "./book";
import { resolvedTheme, settings } from "./store";
import { PALETTES } from "./reader/theme";
import Reader from "./reader/Reader";
import "./App.css";

const EXTENSIONS = ["md", "markdown", "mdown", "mdx", "epub", "pdf"];

export default function App() {
  const [book, setBook] = createSignal<OpenedBook | null>(null);
  const [error, setError] = createSignal("");
  const [opening, setOpening] = createSignal(false);

  async function tryOpen(path: string) {
    const ext = path.split(".").pop()?.toLowerCase() ?? "";
    if (!EXTENSIONS.includes(ext)) {
      setError(`Unsupported file type: .${ext}`);
      return;
    }
    setOpening(true);
    setError("");
    try {
      setBook(await openBook(path));
    } catch (e) {
      setError(String(e));
    } finally {
      setOpening(false);
    }
  }

  async function pickFile() {
    const picked = await open({
      multiple: false,
      filters: [{ name: "Books", extensions: EXTENSIONS }],
    });
    if (typeof picked === "string") await tryOpen(picked);
  }

  onMount(async () => {
    await getCurrentWebview().onDragDropEvent((event) => {
      if (event.payload.type === "drop" && event.payload.paths.length > 0) {
        tryOpen(event.payload.paths[0]);
      }
    });
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && book()) setBook(null);
    });
  });

  const palette = () => PALETTES[resolvedTheme()];

  return (
    <div
      class="app"
      style={{
        "--chrome-bg": palette().bg,
        "--chrome-fg": palette().fg,
        "--chrome-muted": palette().muted,
        "--chrome-border": palette().border,
      }}
    >
      <Show when={book()} fallback={<Landing onPick={pickFile} error={error()} opening={opening()} />}>
        {(b) => <Reader book={b()} onBack={() => setBook(null)} />}
      </Show>
    </div>
  );
}

function Landing(props: { onPick: () => void; error: string; opening: boolean }) {
  return (
    <div class="landing">
      <h1 class="landing-title">Ebook Reader</h1>
      <p class="landing-sub">
        Drop a <code>.md</code>, <code>.epub</code> or <code>.pdf</code> file anywhere to start
        reading.
      </p>
      <button class="landing-open" onClick={props.onPick} disabled={props.opening}>
        {props.opening ? "Opening…" : "Open a file"}
      </button>
      <Show when={props.error}>
        <p class="landing-error">{props.error}</p>
      </Show>
    </div>
  );
}
