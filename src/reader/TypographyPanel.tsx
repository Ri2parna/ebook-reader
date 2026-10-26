import { For } from "solid-js";
import { persistSettings, setSettings, settings, Theme } from "../store";

const THEMES: { id: Theme; label: string }[] = [
  { id: "system", label: "System" },
  { id: "light", label: "Light" },
  { id: "sepia", label: "Sepia" },
  { id: "dark", label: "Dark" },
];

const FONTS = [
  { id: "serif", label: "Serif" },
  { id: "sans", label: "Sans" },
  { id: "mono", label: "Mono" },
] as const;

export default function TypographyPanel() {
  const set = <K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) => {
    setSettings(key, value);
    persistSettings();
  };

  return (
    <div class="typography-panel">
      <div class="typo-group">
        <span class="typo-label">Theme</span>
        <div class="typo-row">
          <For each={THEMES}>
            {(t) => (
              <button
                class="typo-option"
                classList={{ active: settings.theme === t.id }}
                onClick={() => set("theme", t.id)}
              >
                {t.label}
              </button>
            )}
          </For>
        </div>
      </div>

      <div class="typo-group">
        <span class="typo-label">Font</span>
        <div class="typo-row">
          <For each={FONTS}>
            {(f) => (
              <button
                class="typo-option"
                classList={{ active: settings.fontFamily === f.id }}
                onClick={() => set("fontFamily", f.id)}
              >
                {f.label}
              </button>
            )}
          </For>
        </div>
      </div>

      <div class="typo-group">
        <span class="typo-label">Size — {settings.fontSize}px</span>
        <input
          type="range"
          min="14"
          max="28"
          step="1"
          value={settings.fontSize}
          onInput={(e) => set("fontSize", Number(e.currentTarget.value))}
        />
      </div>

      <div class="typo-group">
        <span class="typo-label">Line height — {settings.lineHeight.toFixed(2)}</span>
        <input
          type="range"
          min="1.3"
          max="2.4"
          step="0.05"
          value={settings.lineHeight}
          onInput={(e) => set("lineHeight", Number(e.currentTarget.value))}
        />
      </div>

      <div class="typo-group">
        <span class="typo-label">Width — {settings.maxWidth}px</span>
        <input
          type="range"
          min="520"
          max="960"
          step="20"
          value={settings.maxWidth}
          onInput={(e) => set("maxWidth", Number(e.currentTarget.value))}
        />
      </div>
    </div>
  );
}
