import { ReadingSettings } from "../store";

export interface Palette {
  bg: string;
  fg: string;
  muted: string;
  codeBg: string;
  link: string;
  border: string;
}

export const PALETTES: Record<"light" | "dark" | "sepia", Palette> = {
  light: {
    bg: "#fafaf6",
    fg: "#26241f",
    muted: "#8a8577",
    codeBg: "#f0ede3",
    link: "#4d6db5",
    border: "#e3dfd2",
  },
  dark: {
    bg: "#151518",
    fg: "#dcdcdb",
    muted: "#8b8b90",
    codeBg: "#1e1e22",
    link: "#7aa2f7",
    border: "#2a2a2f",
  },
  sepia: {
    bg: "#f4ecd8",
    fg: "#3d3225",
    muted: "#8b7d61",
    codeBg: "#ece1c8",
    link: "#a05f2c",
    border: "#e2d6b8",
  },
};

const FONT_STACKS = {
  serif: "ui-serif, Georgia, 'Noto Serif', 'Liberation Serif', serif",
  sans: "ui-sans-serif, system-ui, 'Segoe UI', 'Noto Sans', sans-serif",
  mono: "ui-monospace, 'Cascadia Mono', Consolas, 'Liberation Mono', monospace",
};

export function chapterCss(settings: ReadingSettings, palette: Palette): string {
  const font = FONT_STACKS[settings.fontFamily];
  return `
html { background: ${palette.bg}; }
body {
  background: ${palette.bg};
  color: ${palette.fg};
  font-family: ${FONT_STACKS.sans};
  font-size: ${settings.fontSize}px;
  line-height: ${settings.lineHeight};
  max-width: ${settings.maxWidth}px;
  margin: 0 auto;
  padding: 2.5em 2em 50vh;
  font-family: ${font};
  overflow-wrap: break-word;
}
img, svg, video { max-width: 100%; height: auto; }
a { color: ${palette.link}; }
h1, h2, h3, h4, h5, h6 { line-height: 1.25; margin: 1.6em 0 0.6em; }
h1 { font-size: 1.9em; }
h2 { font-size: 1.5em; }
h3 { font-size: 1.2em; }
p { margin: 0.9em 0; }
code {
  font-family: ${FONT_STACKS.mono};
  font-size: 0.86em;
  background: ${palette.codeBg};
  padding: 0.15em 0.4em;
  border-radius: 4px;
}
pre {
  background: ${palette.codeBg};
  padding: 1em;
  border-radius: 6px;
  overflow-x: auto;
}
pre code { background: none; padding: 0; font-size: 0.9em; }
blockquote {
  margin: 1em 0;
  padding: 0.2em 1.2em;
  border-left: 3px solid ${palette.border};
  color: ${palette.muted};
}
table { border-collapse: collapse; margin: 1.2em 0; width: 100%; }
th, td { border: 1px solid ${palette.border}; padding: 0.45em 0.8em; }
th { background: ${palette.codeBg}; }
hr { border: none; border-top: 1px solid ${palette.border}; margin: 2.5em 0; }
::selection { background: ${palette.link}; color: ${palette.bg}; }
`.trim();
}
