#!/usr/bin/env python3
"""
Build a styled, printable HTML from diabetes_100day_plan.md.

Usage:
    python3 build_html.py
Produces:
    diabetes_100day_plan.html  (open in browser, Ctrl+P -> Save as PDF)
"""

import re
import html
from pathlib import Path

BASE_DIR = Path(__file__).parent
SRC = BASE_DIR / "diabetes_100day_plan.md"
DST = BASE_DIR / "diabetes_100day_plan.html"


def escape(text: str) -> str:
    return html.escape(text, quote=False)


def render_inline(text: str) -> str:
    # Inline code first (so its contents aren't reinterpreted)
    code_segments = []

    def stash_code(match):
        code_segments.append(match.group(1))
        return f"\u0000CODE{len(code_segments) - 1}\u0000"

    text = re.sub(r"`([^`]+)`", stash_code, text)

    # Escape HTML
    text = escape(text)

    # Bold ** **
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    # Italic * *
    text = re.sub(r"(?<!\*)\*(?!\*)([^*\n]+?)\*(?!\*)", r"<em>\1</em>", text)

    # Restore inline code
    def restore_code(match):
        idx = int(match.group(1))
        return f"<code>{escape(code_segments[idx])}</code>"

    text = re.sub(r"\u0000CODE(\d+)\u0000", restore_code, text)
    return text


def render_table(table_lines):
    """Render a markdown table block to HTML."""

    def split_row(line):
        line = line.strip()
        if line.startswith("|"):
            line = line[1:]
        if line.endswith("|"):
            line = line[:-1]
        return [c.strip() for c in line.split("|")]

    header = split_row(table_lines[0])
    body_rows = [split_row(r) for r in table_lines[2:]]
    out = ["<table>", "<thead><tr>"]
    for cell in header:
        out.append(f"<th>{render_inline(cell)}</th>")
    out.append("</tr></thead>")
    out.append("<tbody>")
    for row in body_rows:
        out.append("<tr>")
        for cell in row:
            out.append(f"<td>{render_inline(cell)}</td>")
        out.append("</tr>")
    out.append("</tbody></table>")
    return "\n".join(out)


def md_to_html(md_text: str) -> str:
    lines = md_text.splitlines()
    html_parts = []
    i = 0
    n = len(lines)

    while i < n:
        line = lines[i]
        stripped = line.strip()

        # Code block fenced
        if stripped.startswith("```"):
            i += 1
            buf = []
            while i < n and not lines[i].strip().startswith("```"):
                buf.append(lines[i])
                i += 1
            i += 1  # skip closing ```
            html_parts.append(
                "<pre><code>" + escape("\n".join(buf)) + "</code></pre>"
            )
            continue

        # Horizontal rule
        if stripped in ("---", "***", "___"):
            html_parts.append("<hr/>")
            i += 1
            continue

        # Headings
        m = re.match(r"^(#{1,6})\s+(.*)$", stripped)
        if m:
            level = len(m.group(1))
            html_parts.append(f"<h{level}>{render_inline(m.group(2))}</h{level}>")
            i += 1
            continue

        # Blockquote (one or more consecutive >)
        if stripped.startswith(">"):
            buf = []
            while i < n and lines[i].lstrip().startswith(">"):
                buf.append(re.sub(r"^>\s?", "", lines[i].lstrip()))
                i += 1
            html_parts.append(
                "<blockquote>"
                + render_inline(" ".join(b.strip() for b in buf if b.strip()))
                + "</blockquote>"
            )
            continue

        # Table — header line + separator line of dashes
        if (
            "|" in stripped
            and i + 1 < n
            and re.match(r"^\s*\|?\s*[-: ]+\|", lines[i + 1])
        ):
            buf = [lines[i]]
            i += 1
            while i < n and "|" in lines[i]:
                buf.append(lines[i])
                i += 1
            html_parts.append(render_table(buf))
            continue

        # Unordered list
        if re.match(r"^\s*[-*+]\s+", line):
            buf_items = []
            while i < n and re.match(r"^\s*[-*+]\s+", lines[i]):
                item_text = re.sub(r"^\s*[-*+]\s+", "", lines[i])
                # support continuation lines indented
                while i + 1 < n and lines[i + 1].startswith("  ") and lines[
                    i + 1
                ].strip() and not re.match(r"^\s*[-*+]\s+", lines[i + 1]):
                    i += 1
                    item_text += " " + lines[i].strip()
                buf_items.append(item_text)
                i += 1
            html_parts.append(
                "<ul>"
                + "".join(f"<li>{render_inline(it)}</li>" for it in buf_items)
                + "</ul>"
            )
            continue

        # Ordered list
        if re.match(r"^\s*\d+\.\s+", line):
            buf_items = []
            while i < n and re.match(r"^\s*\d+\.\s+", lines[i]):
                item_text = re.sub(r"^\s*\d+\.\s+", "", lines[i])
                buf_items.append(item_text)
                i += 1
            html_parts.append(
                "<ol>"
                + "".join(f"<li>{render_inline(it)}</li>" for it in buf_items)
                + "</ol>"
            )
            continue

        # Blank line — paragraph break
        if not stripped:
            i += 1
            continue

        # Paragraph (collect contiguous non-empty, non-special lines)
        buf = [line]
        i += 1
        while i < n:
            nxt = lines[i]
            if (
                not nxt.strip()
                or nxt.lstrip().startswith("#")
                or nxt.lstrip().startswith(">")
                or nxt.lstrip().startswith("```")
                or re.match(r"^\s*[-*+]\s+", nxt)
                or re.match(r"^\s*\d+\.\s+", nxt)
                or nxt.strip() in ("---", "***", "___")
                or (
                    "|" in nxt
                    and i + 1 < n
                    and re.match(r"^\s*\|?\s*[-: ]+\|", lines[i + 1])
                )
            ):
                break
            buf.append(nxt)
            i += 1
        para = " ".join(b.strip() for b in buf)
        html_parts.append(f"<p>{render_inline(para)}</p>")

    return "\n".join(html_parts)


CSS = """
:root {
  --teal: #0E5C66;
  --orange: #FF7A45;
  --bg: #F8F4EE;
  --ink: #2A2A2A;
  --muted: #6b6b6b;
  --rule: #d8d2c6;
  --code: #f1ebde;
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  background: var(--bg);
  color: var(--ink);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue",
               "Noto Sans", Arial, sans-serif;
  font-size: 14px;
  line-height: 1.55;
  margin: 0;
  padding: 0;
}
.wrap {
  max-width: 880px;
  margin: 0 auto;
  padding: 48px 56px;
}
h1, h2, h3, h4, h5, h6 {
  color: var(--teal);
  line-height: 1.25;
  margin: 1.4em 0 0.5em 0;
  page-break-after: avoid;
}
h1 { font-size: 28px; border-bottom: 3px solid var(--orange); padding-bottom: 8px; }
h2 { font-size: 22px; border-bottom: 1px solid var(--rule); padding-bottom: 4px;
     margin-top: 2em; }
h3 { font-size: 17px; }
h4 { font-size: 15px; color: var(--ink); }
p  { margin: 0.6em 0; }
a  { color: var(--orange); text-decoration: none; }
a:hover { text-decoration: underline; }
hr {
  border: 0;
  border-top: 1px dashed var(--rule);
  margin: 24px 0;
}
blockquote {
  border-left: 4px solid var(--orange);
  background: #fff5ee;
  padding: 10px 14px;
  color: #444;
  margin: 1em 0;
  font-style: italic;
}
ul, ol { padding-left: 22px; margin: 0.6em 0; }
li { margin: 0.2em 0; }
code {
  background: var(--code);
  padding: 1px 5px;
  border-radius: 3px;
  font-family: "JetBrains Mono", Consolas, "Courier New", monospace;
  font-size: 0.92em;
}
pre {
  background: var(--code);
  border-left: 3px solid var(--teal);
  padding: 12px 14px;
  overflow-x: auto;
  margin: 0.8em 0;
  border-radius: 4px;
}
pre code {
  background: transparent;
  padding: 0;
}
table {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
  font-size: 13px;
  page-break-inside: avoid;
}
th, td {
  border: 1px solid var(--rule);
  padding: 7px 10px;
  vertical-align: top;
  text-align: left;
}
th {
  background: var(--teal);
  color: #fff;
  font-weight: 600;
}
tr:nth-child(even) td {
  background: #fbf7f0;
}
strong { color: #1d3a3f; }
em { color: #6b3d2c; }

/* Print friendliness */
@media print {
  body { background: #fff; }
  .wrap { padding: 8mm 12mm; max-width: 100%; }
  a { color: #000; text-decoration: none; }
  h1, h2, h3 { page-break-after: avoid; }
  pre, blockquote, table { page-break-inside: avoid; }
}

/* Cover page */
.cover {
  text-align: center;
  padding: 80px 0 60px;
  border-bottom: 4px solid var(--orange);
  margin-bottom: 32px;
}
.cover .badge {
  display: inline-block;
  background: var(--teal);
  color: #fff;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 12px;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 14px;
}
.cover h1 { font-size: 34px; border: none; padding: 0; margin: 6px 0; }
.cover h2 { font-size: 16px; color: var(--muted); border: none; margin: 4px 0; font-weight: 400; }
.cover .meta {
  margin-top: 24px;
  font-size: 12px;
  color: var(--muted);
}

.toc-note {
  background: #fff;
  border: 1px solid var(--rule);
  padding: 14px 18px;
  border-radius: 6px;
  font-size: 13px;
  margin: 18px 0 28px;
}
"""

COVER_HTML = """
<div class="cover">
  <div class="badge">A Pharm.D + MSc Diabetes Care &amp; Management Playbook</div>
  <h1>The 100-Day Diabetes Education Content Plan</h1>
  <h2>Instagram Reels (1–2 min) &amp; YouTube Long-Form (5–6 min) — with peer-reviewed references</h2>
  <div class="meta">
    100 daily scripts &middot; ~210 references &middot; ~95,000 words &middot; copyright-safe<br/>
    Generated locally &middot; Open in any browser &middot; Press <strong>Ctrl+P</strong> &rarr; <strong>Save as PDF</strong>
  </div>
</div>
"""


def main():
    md_text = SRC.read_text(encoding="utf-8")
    body_html = md_to_html(md_text)
    out = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>The 100-Day Diabetes Education Content Plan</title>
<style>{CSS}</style>
</head>
<body>
<div class="wrap">
{COVER_HTML}
<div class="toc-note">
  <strong>How to make a PDF from this file:</strong> Open in Chrome / Edge / Firefox &rarr; press
  <strong>Ctrl+P</strong> (Cmd+P on Mac) &rarr; choose <em>Save as PDF</em> &rarr; A4 or Letter, default
  margins. The cover page above will be page 1; the rest of the document follows automatically.
</div>
{body_html}
</div>
</body>
</html>
"""
    DST.write_text(out, encoding="utf-8")
    print(f"Wrote {DST}")
    print(f"Size: {DST.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
