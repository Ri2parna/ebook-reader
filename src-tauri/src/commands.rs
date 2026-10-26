use std::path::PathBuf;

use serde::Serialize;
use tauri::State;

use crate::formats::{self, markdown, BookKind};
use crate::state::{doc_id, DocPayload, DocRegistry, Document};

#[derive(Serialize)]
pub struct OpenedBook {
    pub id: String,
    pub title: String,
    pub kind: BookKind,
    #[serde(rename = "spineLen")]
    pub spine_len: usize,
    #[serde(rename = "file")]
    pub file: String,
}

#[tauri::command]
pub fn open_book(path: String, registry: State<'_, DocRegistry>) -> Result<OpenedBook, String> {
    let path = PathBuf::from(path);
    if !path.is_file() {
        return Err(format!("no such file: {}", path.display()));
    }
    let kind = formats::detect(&path)?;
    let id = doc_id(&path);
    if let Ok(cached) = registry.with(&id, |doc| {
        let file = doc
            .path
            .file_name()
            .and_then(|s| s.to_str())
            .unwrap_or("")
            .to_string();
        Ok(OpenedBook {
            id: doc.id.clone(),
            title: doc.title.clone(),
            kind: doc.kind,
            spine_len: 1,
            file,
        })
    }) {
        return Ok(cached);
    }

    let (title, payload) = match kind {
        BookKind::Markdown => {
            let doc = markdown::convert(&path)?;
            (doc.title, DocPayload::Markdown { body: doc.body })
        }
        BookKind::Epub => return Err("EPUB support coming in the next phase".into()),
        BookKind::Pdf => {
            let filename = path
                .file_name()
                .and_then(|s| s.to_str())
                .unwrap_or("document.pdf")
                .to_string();
            (path
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("Untitled")
                .to_string(), DocPayload::Pdf { filename })
        }
    };

    registry.insert(Document {
        id: id.clone(),
        path,
        kind,
        title: title.clone(),
        payload,
    });
    let file = path
        .file_name()
        .and_then(|s| s.to_str())
        .unwrap_or("")
        .to_string();
    Ok(OpenedBook {
        id,
        title,
        kind,
        spine_len: 1,
        file,
    })
}

#[tauri::command]
pub fn read_chapter(
    id: String,
    _index: usize,
    registry: State<'_, DocRegistry>,
) -> Result<String, String> {
    registry.with(&id, |doc| match &doc.payload {
        DocPayload::Markdown { body } => Ok(format!(
            concat!(
                "<!DOCTYPE html><html><head><meta charset=\"utf-8\">",
                "<base href=\"book://local/{id}/\">",
                "<title>{title}</title></head><body>{body}</body></html>"
            ),
            id = doc.id,
            title = markdown::xml_escape(&doc.title),
            body = body,
        )),
        DocPayload::Pdf { filename } => Ok(format!(
            concat!(
                "<!DOCTYPE html><html><head><meta charset=\"utf-8\">",
                "<title>{title}</title></head>",
                "<body style=\"margin:0\"><iframe src=\"book://local/{id}/{filename}\" ",
                "style=\"width:100%;height:100vh;border:0\"></iframe></body></html>"
            ),
            title = markdown::xml_escape(&doc.title),
            id = doc.id,
            filename = filename,
        )),
    })
}
