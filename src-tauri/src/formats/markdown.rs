use std::path::Path;

use pulldown_cmark::{Event, HeadingLevel, Options, Parser, Tag, TagEnd};

pub struct MarkdownDoc {
    pub title: String,
    pub body: String,
}

pub fn convert(path: &Path) -> Result<MarkdownDoc, String> {
    let source = std::fs::read_to_string(path)
        .map_err(|e| format!("failed to read {}: {e}", path.display()))?;

    let mut options = Options::empty();
    options.insert(Options::ENABLE_TABLES);
    options.insert(Options::ENABLE_FOOTNOTES);
    options.insert(Options::ENABLE_STRIKETHROUGH);
    options.insert(Options::ENABLE_TASKLISTS);

    let title = first_h1(&source, options).unwrap_or_else(|| {
        path.file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("Untitled")
            .replace(['-', '_'], " ")
    });

    let parser = Parser::new_ext(&source, options);
    let mut body = String::with_capacity(source.len() + source.len() / 2);
    pulldown_cmark::html::push_html(&mut body, parser);

    Ok(MarkdownDoc { title, body })
}

fn first_h1(source: &str, options: Options) -> Option<String> {
    let mut in_h1 = false;
    let mut title = String::new();
    for event in Parser::new_ext(source, options) {
        match event {
            Event::Start(Tag::Heading {
                level: HeadingLevel::H1,
                ..
            }) => {
                in_h1 = true;
                title.clear();
            }
            Event::End(TagEnd::Heading(HeadingLevel::H1)) => break,
            Event::Text(text) | Event::Code(text) if in_h1 => title.push_str(&text),
            _ => {}
        }
    }
    (!title.is_empty()).then_some(title)
}

pub fn xml_escape(input: &str) -> String {
    input
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
}

#[cfg(test)]
mod tests {
    use super::*;

    const SAMPLE: &str = include_str!("../../tests/fixtures/sample.md");

    fn convert_str(source: &str) -> MarkdownDoc {
        let path = std::env::temp_dir().join("ebook-reader-test-sample.md");
        std::fs::write(&path, source).unwrap();
        convert(&path).unwrap()
    }

    #[test]
    fn extracts_title_from_first_h1() {
        let doc = convert_str(SAMPLE);
        assert_eq!(doc.title, "Sample Document");
    }

    #[test]
    fn renders_commonmark_features() {
        let doc = convert_str(SAMPLE);
        assert!(doc.body.contains("<h1>Sample Document</h1>"));
        assert!(doc.body.contains("<table>"), "table missing: {}", doc.body);
        assert!(doc.body.contains("<del>struck</del>"));
        assert!(doc.body.contains(r#"<img src="images/cover.png""#));
    }

    #[test]
    fn falls_back_to_filename_without_h1() {
        let path = std::env::temp_dir().join("my-notes_file.md");
        std::fs::write(&path, "just text, no heading").unwrap();
        let doc = convert(&path).unwrap();
        assert_eq!(doc.title, "my notes file");
    }

    #[test]
    fn xml_escape_handles_specials() {
        assert_eq!(xml_escape("a<b>&\"c\""), "a&lt;b&gt;&amp;&quot;c&quot;");
    }
}
