pub mod markdown;

use std::path::Path;

#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "lowercase")]
pub enum BookKind {
    Markdown,
    Epub,
    Pdf,
}

pub fn detect(path: &Path) -> Result<BookKind, String> {
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_ascii_lowercase())
        .ok_or_else(|| format!("no file extension: {}", path.display()))?;
    match ext.as_str() {
        "md" | "markdown" | "mdown" | "mdx" => Ok(BookKind::Markdown),
        "epub" => Ok(BookKind::Epub),
        "pdf" => Ok(BookKind::Pdf),
        other => Err(format!("unsupported file type: .{other}")),
    }
}
