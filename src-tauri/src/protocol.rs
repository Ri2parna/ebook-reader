use std::borrow::Cow;
use std::path::{Path, PathBuf};

use percent_encoding::percent_decode_str;
use tauri::{
    http::{Response, StatusCode},
    AppHandle, Manager,
};

use crate::state::DocRegistry;

/// Serve a resource for the `book://` scheme. URL shape:
///   book://local/<doc-id>/<relative-path>
/// Windows WebView2 delivers this normalized as
///   http://book.local/<doc-id>/<relative-path>
/// so only the URI path is used.
pub fn respond(
    app: &AppHandle,
    uri: &tauri::http::Uri,
) -> Response<Cow<'static, [u8]>> {
    match resolve(app, uri) {
        Ok((bytes, mime)) => Response::builder()
            .status(StatusCode::OK)
            .header("Content-Type", mime)
            .header("Access-Control-Allow-Origin", "*")
            .body(bytes.into())
            .unwrap(),
        Err((status, message)) => Response::builder()
            .status(status)
            .body(message.into_bytes().into())
            .unwrap(),
    }
}

fn resolve(
    app: &AppHandle,
    uri: &tauri::http::Uri,
) -> Result<(Vec<u8>, &'static str), (StatusCode, String)> {
    let segments: Vec<String> = uri
        .path()
        .trim_matches('/')
        .split('/')
        .filter(|s| !s.is_empty())
        .map(|s| percent_decode_str(s).decode_utf8_lossy().into_owned())
        .collect();
    let (doc_id, rest) = segments
        .split_first()
        .filter(|(_, rest)| !rest.is_empty())
        .ok_or((StatusCode::NOT_FOUND, "bad book:// url".to_string()))?;
    serve_resource(app, doc_id, &rest.join("/"))
}

fn serve_resource(
    app: &AppHandle,
    doc_id: &str,
    rel: &str,
) -> Result<(Vec<u8>, &'static str), (StatusCode, String)> {
    let not_found = || (StatusCode::NOT_FOUND, "not found or outside book root".to_string());

    let root = app
        .state::<DocRegistry>()
        .with(doc_id, |doc| {
            doc.path
                .parent()
                .map(Path::to_path_buf)
                .ok_or_else(|| "no book root".to_string())
        })
        .map_err(|_| not_found())?;

    let root = root.canonicalize().map_err(|_| not_found())?;
    let target: PathBuf = root.join(rel).canonicalize().map_err(|_| not_found())?;
    if !target.starts_with(&root) || !target.is_file() {
        return Err(not_found());
    }
    let mime = mime_for(&target);
    let bytes = std::fs::read(&target)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("read {}: {e}", target.display())))?;
    Ok((bytes, mime))
}

fn mime_for(path: &Path) -> &'static str {
    match path
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_ascii_lowercase())
        .as_deref()
    {
        Some("png") => "image/png",
        Some("jpg") | Some("jpeg") => "image/jpeg",
        Some("gif") => "image/gif",
        Some("webp") => "image/webp",
        Some("svg") => "image/svg+xml",
        Some("avif") => "image/avif",
        Some("css") => "text/css",
        Some("woff2") => "font/woff2",
        Some("woff") => "font/woff",
        Some("ttf") => "font/ttf",
        Some("otf") => "font/otf",
        Some("pdf") => "application/pdf",
        _ => "application/octet-stream",
    }
}
