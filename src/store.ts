import { createStore } from "solid-js/store";

export type Theme = "light" | "dark" | "sepia" | "system";

export interface ReadingSettings {
  theme: Theme;
  fontFamily: "serif" | "sans" | "mono";
  fontSize: number;
  lineHeight: number;
  maxWidth: number;
}

const DEFAULTS: ReadingSettings = {
  theme: "system",
  fontFamily: "serif",
  fontSize: 19,
  lineHeight: 1.7,
  maxWidth: 720,
};

const STORAGE_KEY = "ebook-reader-settings";

function load(): ReadingSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

export const [settings, setSettings] = createStore<ReadingSettings>(load());

export function persistSettings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function resolvedTheme(): "light" | "dark" | "sepia" {
  if (settings.theme !== "system") return settings.theme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
