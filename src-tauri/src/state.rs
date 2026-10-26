use std::{
    collections::HashMap,
    hash::{DefaultHasher, Hash, Hasher},
    path::PathBuf,
    sync::Mutex,
};

use crate::formats::BookKind;

pub enum DocPayload {
    Markdown { body: String },
    Pdf { filename: String },
}

pub struct Document {
    pub id: String,
    pub path: PathBuf,
    pub kind: BookKind,
    pub title: String,
    pub payload: DocPayload,
}

#[derive(Default)]
pub struct DocRegistry {
    docs: Mutex<HashMap<String, Document>>,
}

impl DocRegistry {
    pub fn insert(&self, doc: Document) {
        self.docs.lock().unwrap().insert(doc.id.clone(), doc);
    }

    pub fn with<R>(
        &self,
        id: &str,
        f: impl FnOnce(&Document) -> Result<R, String>,
    ) -> Result<R, String> {
        let docs = self.docs.lock().unwrap();
        let doc = docs
            .get(id)
            .ok_or_else(|| format!("book not open: {id}"))?;
        f(doc)
    }
}

pub fn doc_id(path: &std::path::Path) -> String {
    let mtime = std::fs::metadata(path)
        .and_then(|m| m.modified())
        .ok()
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_millis())
        .unwrap_or(0);
    let mut hasher = DefaultHasher::new();
    path.hash(&mut hasher);
    mtime.hash(&mut hasher);
    format!("{:016x}", hasher.finish())
}
