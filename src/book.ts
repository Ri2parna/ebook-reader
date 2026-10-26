import { invoke } from "@tauri-apps/api/core";

export type BookKind = "markdown" | "epub" | "pdf";

export interface OpenedBook {
  id: string;
  title: string;
  kind: BookKind;
  spineLen: number;
  file: string;
}

export async function openBook(path: string): Promise<OpenedBook> {
  return invoke<OpenedBook>("open_book", { path });
}

export async function readChapter(id: string, index: number): Promise<string> {
  return invoke<string>("read_chapter", { id, index });
}
