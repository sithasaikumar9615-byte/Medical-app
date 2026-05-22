"""
Pure-Python Markdown -> PDF converter (stdlib only, zero dependencies).

Generates a paginated, readable PDF of `diabetes_100day_plan.md`.
Handles: H1/H2/H3 headings, paragraphs, bullet/numbered lists,
horizontal rules, blockquotes, bold/italic inline (rendered as plain
weighted text), and basic table flattening to lines.

This produces PDF 1.4 compliant output using only the Python standard
library. It is intentionally minimal so it runs in any sandbox.

Usage:
    python3 build_pdf.py diabetes_100day_plan.md diabetes_100day_plan.pdf
"""
from __future__ import annotations

import re
import sys
import zlib
from pathlib import Path
from typing import List, Tuple

# ---------------------------------------------------------------------------
# Page geometry (US Letter).  All measurements in PostScript points (1/72").
# ---------------------------------------------------------------------------
PAGE_W = 612          # 8.5 in
PAGE_H = 792          # 11 in
MARGIN_L = 54         # 0.75 in
MARGIN_R = 54
MARGIN_T = 54
MARGIN_B = 54
TEXT_W = PAGE_W - MARGIN_L - MARGIN_R     # 504 pt usable width

# Line settings
LINE_H_BODY = 14
LINE_H_H1 = 28
LINE_H_H2 = 22
LINE_H_H3 = 18
PARA_GAP = 6

FONT_BODY = "F1"      # Helvetica
FONT_BOLD = "F2"      # Helvetica-Bold
FONT_ITALIC = "F3"    # Helvetica-Oblique
FONT_MONO = "F4"      # Courier

# Approximate Helvetica character widths in 1/1000 em.  Good enough for
# wrapping; the PDF still uses the embedded built-in font metrics.
HELV_WIDTHS = {
    " ": 278, "!": 278, "\"": 355, "#": 556, "$": 556, "%": 889, "&": 667,
    "'": 191, "(": 333, ")": 333, "*": 389, "+": 584, ",": 278, "-": 333,
    ".": 278, "/": 278, "0": 556, "1": 556, "2": 556, "3": 556, "4": 556,
    "5": 556, "6": 556, "7": 556, "8": 556, "9": 556, ":": 278, ";": 278,
    "<": 584, "=": 584, ">": 584, "?": 556, "@": 1015, "A": 667, "B": 667,
    "C": 722, "D": 722, "E": 667, "F": 611, "G": 778, "H": 722, "I": 278,
    "J": 500, "K": 667, "L": 556, "M": 833, "N": 722, "O": 778, "P": 667,
    "Q": 778, "R": 722, "S": 667, "T": 611, "U": 722, "V": 667, "W": 944,
    "X": 667, "Y": 667, "Z": 611, "[": 278, "\\": 278, "]": 278, "^": 469,
    "_": 556, "`": 333, "a": 556, "b": 556, "c": 500, "d": 556, "e": 556,
    "f": 278, "g": 556, "h": 556, "i": 222, "j": 222, "k": 500, "l": 222,
    "m": 833, "n": 556, "o": 556, "p": 556, "q": 556, "r": 333, "s": 500,
    "t": 278, "u": 556, "v": 500, "w": 722, "x": 500, "y": 500, "z": 500,
    "{": 334, "|": 260, "}": 334, "~": 584,
}
DEFAULT_W = 556  # fallback for unknown chars (em-dash, bullets, etc.)


def text_width(s: str, font_size: float) -> float:
    """Approximate width in points of `s` rendered in Helvetica at font_size."""
    units = sum(HELV_WIDTHS.get(c, DEFAULT_W) for c in s)
    return units * font_size / 1000.0


# ---------------------------------------------------------------------------
# Text sanitisation: PDF "WinAnsi" encoding only handles a subset of chars.
# Replace common Unicode dashes/quotes/bullets with ASCII equivalents so
# the built-in PDF fonts can render them.
# ---------------------------------------------------------------------------
UNICODE_MAP = {
    "\u2014": "--",  # em-dash
    "\u2013": "-",   # en-dash
    "\u2018": "'",   # left single quote
    "\u2019": "'",   # right single quote
    "\u201c": '"',   # left double quote
    "\u201d": '"',   # right double quote
    "\u2026": "...", # ellipsis
    "\u2022": "*",   # bullet
    "\u00b7": "*",   # middle dot
    "\u2192": "->",  # rightwards arrow
    "\u2190": "<-",
    "\u2265": ">=",
    "\u2264": "<=",
    "\u00d7": "x",   # multiplication sign
    "\u00b1": "+/-",
    "\u00b0": " deg",
    "\u00b5": "u",   # micro sign
    "\u2122": "(TM)",
    "\u00ae": "(R)",
    "\u00a9": "(C)",
    "\u00a0": " ",   # nbsp
    "\u2009": " ",   # thin space
    "\u200b": "",    # zero-width space
    "\ufeff": "",    # BOM
}


def to_winansi(s: str) -> str:
    out = []
    for c in s:
        if c in UNICODE_MAP:
            out.append(UNICODE_MAP[c])
        elif ord(c) < 128:
            out.append(c)
        elif 0xA1 <= ord(c) <= 0xFF:
            # Latin-1 supplement is mostly compatible with WinAnsi
            out.append(c)
        else:
            out.append("?")
    return "".join(out)


def escape_pdf(s: str) -> str:
    """Escape special chars for a PDF literal string."""
    return s.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


# ---------------------------------------------------------------------------
# Word wrapping
# ---------------------------------------------------------------------------
def wrap(text: str, font_size: float, max_w: float, indent: float = 0.0) -> List[str]:
    """Greedy word wrap.  Returns lines (no trailing newlines)."""
    text = text.strip()
    if not text:
        return [""]
    avail = max_w - indent
    words = text.split()
    lines: List[str] = []
    cur: List[str] = []
    cur_w = 0.0
    space_w = text_width(" ", font_size)
    for w in words:
        ww = text_width(w, font_size)
        if cur and cur_w + space_w + ww > avail:
            lines.append(" ".join(cur))
            cur = [w]
            cur_w = ww
        else:
            if cur:
                cur_w += space_w + ww
            else:
                cur_w = ww
            cur.append(w)
        # Hard break of impossibly long words
        if ww > avail and not cur[:-1]:
            lines.append(w)
            cur = []
            cur_w = 0.0
    if cur:
        lines.append(" ".join(cur))
    return lines or [""]


# ---------------------------------------------------------------------------
# Markdown -> Block stream
# ---------------------------------------------------------------------------
class Block:
    __slots__ = ("kind", "text", "level", "items")

    def __init__(self, kind: str, text: str = "", level: int = 0, items=None):
        self.kind = kind        # h1, h2, h3, p, ul, ol, hr, blockquote, code, table
        self.text = text
        self.level = level
        self.items = items or []


def parse_markdown(md: str) -> List[Block]:
    """Very small markdown parser tuned for this document."""
    lines = md.splitlines()
    blocks: List[Block] = []
    i = 0
    in_code = False
    code_buf: List[str] = []

    def flush_code():
        if code_buf:
            blocks.append(Block("code", "\n".join(code_buf)))
            code_buf.clear()

    while i < len(lines):
        ln = lines[i]
        stripped = ln.strip()

        # Fenced code blocks
        if stripped.startswith("```"):
            if not in_code:
                in_code = True
            else:
                in_code = False
                flush_code()
            i += 1
            continue
        if in_code:
            code_buf.append(ln)
            i += 1
            continue

        # Horizontal rule
        if re.fullmatch(r"-{3,}|_{3,}|\*{3,}", stripped):
            blocks.append(Block("hr"))
            i += 1
            continue

        # Headings
        if stripped.startswith("#"):
            m = re.match(r"^(#{1,6})\s+(.*)$", stripped)
            if m:
                hashes, text = m.group(1), m.group(2).rstrip("# ").strip()
                level = len(hashes)
                kind = f"h{min(level, 3)}"
                blocks.append(Block(kind, text, level=level))
                i += 1
                continue

        # Tables (very basic): rows of `| a | b |`.  Flatten to lines.
        if stripped.startswith("|") and "|" in stripped[1:]:
            tbl: List[List[str]] = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                row = [c.strip() for c in lines[i].strip().strip("|").split("|")]
                # skip alignment separator row
                if not all(re.fullmatch(r":?-{2,}:?", c) for c in row):
                    tbl.append(row)
                i += 1
            blocks.append(Block("table", items=tbl))
            continue

        # Blockquote
        if stripped.startswith(">"):
            buf = []
            while i < len(lines) and lines[i].lstrip().startswith(">"):
                buf.append(lines[i].lstrip()[1:].lstrip())
                i += 1
            blocks.append(Block("blockquote", " ".join(buf)))
            continue

        # Bullet list
        if re.match(r"^\s*[-*+]\s+", ln):
            items = []
            while i < len(lines) and re.match(r"^\s*[-*+]\s+", lines[i]):
                items.append(re.sub(r"^\s*[-*+]\s+", "", lines[i]))
                i += 1
            blocks.append(Block("ul", items=items))
            continue

        # Numbered list
        if re.match(r"^\s*\d+\.\s+", ln):
            items = []
            while i < len(lines) and re.match(r"^\s*\d+\.\s+", lines[i]):
                items.append(re.sub(r"^\s*\d+\.\s+", "", lines[i]))
                i += 1
            blocks.append(Block("ol", items=items))
            continue

        # Blank line -> paragraph break
        if not stripped:
            i += 1
            continue

        # Paragraph (collect until blank line or block boundary)
        para = [stripped]
        i += 1
        while i < len(lines):
            nxt = lines[i]
            ns = nxt.strip()
            if not ns:
                break
            if ns.startswith("#") or ns.startswith("|") or ns.startswith(">") \
                    or re.match(r"^\s*[-*+]\s+", nxt) \
                    or re.match(r"^\s*\d+\.\s+", nxt) \
                    or re.fullmatch(r"-{3,}|_{3,}|\*{3,}", ns) \
                    or ns.startswith("```"):
                break
            para.append(ns)
            i += 1
        blocks.append(Block("p", " ".join(para)))

    flush_code()
    return blocks


# Strip simple inline markdown (we render as plain text but keep words).
INLINE_RE = re.compile(r"(\*\*|__|\*|_|`)")
LINK_RE = re.compile(r"\[([^\]]+)\]\([^)]+\)")
IMAGE_RE = re.compile(r"!\[([^\]]*)\]\([^)]+\)")


def strip_inline(s: str) -> str:
    s = IMAGE_RE.sub(r"[\1]", s)
    s = LINK_RE.sub(r"\1", s)
    s = INLINE_RE.sub("", s)
    return s


# ---------------------------------------------------------------------------
# Layout: turn blocks into a list of "page commands" (font, text, position).
# ---------------------------------------------------------------------------
class PageBuilder:
    def __init__(self):
        self.pages: List[List[str]] = []
        self.cur: List[str] = []
        self.y = PAGE_H - MARGIN_T
        self._start_page()

    def _start_page(self):
        self.cur = []
        self.y = PAGE_H - MARGIN_T

    def _flush_page(self):
        if self.cur:
            self.pages.append(self.cur)
            self._start_page()
        else:
            # still want a (possibly blank) page if forced
            self.pages.append(self.cur)
            self._start_page()

    def need_space(self, h: float):
        if self.y - h < MARGIN_B:
            self.pages.append(self.cur)
            self._start_page()

    def draw_line(self, text: str, font: str, size: float, x: float, line_h: float):
        text = to_winansi(text)
        text = escape_pdf(text)
        # Move to (x, y - size*0.85)  (text baseline)
        baseline = self.y - size * 0.85
        self.cur.append(
            f"BT /{font} {size} Tf 1 0 0 1 {x:.2f} {baseline:.2f} Tm ({text}) Tj ET"
        )
        self.y -= line_h

    def draw_hr(self):
        self.need_space(LINE_H_BODY)
        y = self.y - LINE_H_BODY / 2
        self.cur.append(f"q 0.6 0.6 0.6 RG 0.5 w {MARGIN_L} {y:.2f} m {PAGE_W - MARGIN_R} {y:.2f} l S Q")
        self.y -= LINE_H_BODY

    def draw_block_band(self, h: float):
        """Light grey band behind blockquote text."""
        self.cur.append(
            f"q 0.95 0.95 0.95 rg {MARGIN_L} {self.y - h:.2f} "
            f"{TEXT_W} {h:.2f} re f Q"
        )

    def add_paragraph(self, text: str, size: float = 11, font: str = FONT_BODY,
                      indent: float = 0, line_h: float = LINE_H_BODY):
        text = strip_inline(text)
        if not text.strip():
            self.y -= PARA_GAP
            return
        for ln in wrap(text, size, TEXT_W, indent=indent):
            self.need_space(line_h)
            self.draw_line(ln, font, size, MARGIN_L + indent, line_h)
        self.y -= PARA_GAP

    def add_heading(self, text: str, level: int):
        text = strip_inline(text)
        # Generous space above
        gap_above = {1: 18, 2: 14, 3: 10}.get(level, 8)
        size = {1: 22, 2: 16, 3: 13}.get(level, 12)
        line_h = {1: LINE_H_H1, 2: LINE_H_H2, 3: LINE_H_H3}.get(level, LINE_H_BODY)
        # H1 always starts on a new page (cleaner ToC look).
        if level == 1 and self.cur:
            self.pages.append(self.cur)
            self._start_page()
        else:
            self.need_space(line_h + gap_above)
            self.y -= gap_above
        for ln in wrap(text, size, TEXT_W):
            self.need_space(line_h)
            self.draw_line(ln, FONT_BOLD, size, MARGIN_L, line_h)
        self.y -= 4

    def add_list(self, items: List[str], ordered: bool):
        for idx, item in enumerate(items, 1):
            bullet = f"{idx}." if ordered else "*"
            txt = strip_inline(item)
            wrapped = wrap(txt, 11, TEXT_W - 18, indent=0)
            for li, ln in enumerate(wrapped):
                self.need_space(LINE_H_BODY)
                if li == 0:
                    self.draw_line(bullet, FONT_BODY, 11, MARGIN_L, 0)
                    # then text on the same line
                    self.cur[-1] = self.cur[-1].replace(") Tj ET", "")
                    # Simpler: draw bullet + text as separate ops on same line
                    # Actually: undo the previous draw_line bookkeeping by not
                    # decrementing y twice. We just emitted draw_line that moved
                    # y by LINE_H_BODY; emit text at correct x without moving y
                    # again.
                    self.y += LINE_H_BODY  # restore
                    self.draw_line(bullet, FONT_BODY, 11, MARGIN_L, 0)
                    self.y += 0  # no extra movement
                    # draw text portion
                    base = self.y - 11 * 0.85
                    safe = escape_pdf(to_winansi(ln))
                    self.cur.append(
                        f"BT /{FONT_BODY} 11 Tf 1 0 0 1 {MARGIN_L + 18:.2f} {base:.2f} Tm ({safe}) Tj ET"
                    )
                    self.y -= LINE_H_BODY
                else:
                    self.draw_line(ln, FONT_BODY, 11, MARGIN_L + 18, LINE_H_BODY)
        self.y -= PARA_GAP

    def add_blockquote(self, text: str):
        text = strip_inline(text)
        size = 11
        wrapped = wrap(text, size, TEXT_W - 24, indent=0)
        h = len(wrapped) * LINE_H_BODY + 8
        self.need_space(h)
        # Background
        self.cur.append(
            f"q 0.96 0.96 0.92 rg {MARGIN_L} {self.y - h + 4:.2f} "
            f"{TEXT_W} {h:.2f} re f Q"
        )
        # Left border
        self.cur.append(
            f"q 0.7 0.7 0.4 RG 2 w {MARGIN_L + 2} {self.y - h + 4:.2f} m "
            f"{MARGIN_L + 2} {self.y + 4:.2f} l S Q"
        )
        for ln in wrapped:
            self.draw_line(ln, FONT_ITALIC, size, MARGIN_L + 12, LINE_H_BODY)
        self.y -= PARA_GAP

    def add_code(self, text: str):
        size = 9
        line_h = 12
        for raw in text.splitlines():
            ln = raw.replace("\t", "    ")
            for chunk in wrap(ln, size, TEXT_W - 16, indent=0) or [""]:
                self.need_space(line_h)
                self.draw_line(chunk, FONT_MONO, size, MARGIN_L + 8, line_h)
        self.y -= PARA_GAP

    def add_table(self, rows: List[List[str]]):
        if not rows:
            return
        ncols = max(len(r) for r in rows)
        col_w = TEXT_W / ncols
        # Header row in bold, then body
        for ridx, row in enumerate(rows):
            cells = [strip_inline(c) for c in row] + [""] * (ncols - len(row))
            # wrap each cell to col_w-8
            wrapped_cells = [wrap(c, 10, col_w - 8) for c in cells]
            row_lines = max(len(wc) for wc in wrapped_cells)
            row_h = row_lines * 12 + 4
            self.need_space(row_h)
            top_y = self.y
            # Background for header
            if ridx == 0:
                self.cur.append(
                    f"q 0.92 0.92 0.92 rg {MARGIN_L} {top_y - row_h:.2f} "
                    f"{TEXT_W} {row_h:.2f} re f Q"
                )
            font = FONT_BOLD if ridx == 0 else FONT_BODY
            for ci, lines in enumerate(wrapped_cells):
                cx = MARGIN_L + ci * col_w + 4
                for li, ln in enumerate(lines):
                    base = top_y - 12 * 0.85 - li * 12 - 2
                    safe = escape_pdf(to_winansi(ln))
                    self.cur.append(
                        f"BT /{font} 10 Tf 1 0 0 1 {cx:.2f} {base:.2f} Tm ({safe}) Tj ET"
                    )
            # Row border bottom
            self.cur.append(
                f"q 0.7 0.7 0.7 RG 0.4 w {MARGIN_L} {top_y - row_h:.2f} m "
                f"{PAGE_W - MARGIN_R} {top_y - row_h:.2f} l S Q"
            )
            self.y = top_y - row_h
        self.y -= PARA_GAP


def render(blocks: List[Block]) -> List[List[str]]:
    pb = PageBuilder()
    for b in blocks:
        if b.kind == "h1":
            pb.add_heading(b.text, 1)
        elif b.kind == "h2":
            pb.add_heading(b.text, 2)
        elif b.kind == "h3":
            pb.add_heading(b.text, 3)
        elif b.kind == "p":
            pb.add_paragraph(b.text)
        elif b.kind == "hr":
            pb.draw_hr()
        elif b.kind == "ul":
            pb.add_list(b.items, ordered=False)
        elif b.kind == "ol":
            pb.add_list(b.items, ordered=True)
        elif b.kind == "blockquote":
            pb.add_blockquote(b.text)
        elif b.kind == "code":
            pb.add_code(b.text)
        elif b.kind == "table":
            pb.add_table(b.items)
    # finalise last page
    pb.pages.append(pb.cur)
    # remove any empty trailing page
    while pb.pages and not pb.pages[-1]:
        pb.pages.pop()
    return pb.pages


# ---------------------------------------------------------------------------
# Page-number footer
# ---------------------------------------------------------------------------
def add_footers(pages: List[List[str]]):
    n = len(pages)
    for i, page in enumerate(pages, 1):
        label = f"Page {i} of {n}"
        w = text_width(label, 9)
        x = (PAGE_W - w) / 2
        page.append(
            f"BT /{FONT_BODY} 9 Tf 1 0 0 1 {x:.2f} 24 Tm ({escape_pdf(label)}) Tj ET"
        )


# ---------------------------------------------------------------------------
# PDF assembly
# ---------------------------------------------------------------------------
def build_pdf(pages: List[List[str]]) -> bytes:
    objects: List[bytes] = []  # 1-indexed; objects[0] = obj 1

    def add(obj: bytes) -> int:
        objects.append(obj)
        return len(objects)

    # Reserve catalog (1) and pages tree (2) numbers
    catalog_id = 1
    pages_id = 2
    objects.append(b"")  # placeholder for catalog
    objects.append(b"")  # placeholder for pages tree

    # Fonts (4 standard built-in fonts; no embedding needed)
    font_objs = {}
    for name, base in [
        (FONT_BODY, "Helvetica"),
        (FONT_BOLD, "Helvetica-Bold"),
        (FONT_ITALIC, "Helvetica-Oblique"),
        (FONT_MONO, "Courier"),
    ]:
        oid = add(
            (
                f"<< /Type /Font /Subtype /Type1 /BaseFont /{base} "
                f"/Encoding /WinAnsiEncoding >>"
            ).encode("latin-1")
        )
        font_objs[name] = oid

    # Page content streams + page objects
    page_ids: List[int] = []
    for ops in pages:
        stream = ("\n".join(ops)).encode("latin-1", errors="replace")
        compressed = zlib.compress(stream)
        content_obj = (
            f"<< /Length {len(compressed)} /Filter /FlateDecode >>\nstream\n"
        ).encode("latin-1") + compressed + b"\nendstream"
        content_id = add(content_obj)

        font_dict = " ".join(f"/{k} {v} 0 R" for k, v in font_objs.items())
        page_obj = (
            f"<< /Type /Page /Parent {pages_id} 0 R "
            f"/MediaBox [0 0 {PAGE_W} {PAGE_H}] "
            f"/Contents {content_id} 0 R "
            f"/Resources << /Font << {font_dict} >> >> >>"
        ).encode("latin-1")
        page_id = add(page_obj)
        page_ids.append(page_id)

    # Pages tree
    kids = " ".join(f"{i} 0 R" for i in page_ids)
    objects[pages_id - 1] = (
        f"<< /Type /Pages /Count {len(page_ids)} /Kids [{kids}] >>"
    ).encode("latin-1")

    # Catalog
    objects[catalog_id - 1] = (
        f"<< /Type /Catalog /Pages {pages_id} 0 R >>"
    ).encode("latin-1")

    # Serialise
    out = bytearray()
    out += b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n"  # binary marker
    offsets: List[int] = [0]
    for idx, body in enumerate(objects, 1):
        offsets.append(len(out))
        out += f"{idx} 0 obj\n".encode("latin-1")
        out += body
        out += b"\nendobj\n"

    xref_pos = len(out)
    out += f"xref\n0 {len(objects) + 1}\n".encode("latin-1")
    out += b"0000000000 65535 f \n"
    for off in offsets[1:]:
        out += f"{off:010d} 00000 n \n".encode("latin-1")

    out += (
        f"trailer\n<< /Size {len(objects) + 1} /Root {catalog_id} 0 R >>\n"
        f"startxref\n{xref_pos}\n%%EOF\n"
    ).encode("latin-1")

    return bytes(out)


def main():
    if len(sys.argv) < 3:
        print("usage: build_pdf.py input.md output.pdf", file=sys.stderr)
        sys.exit(1)
    src = Path(sys.argv[1])
    dst = Path(sys.argv[2])
    md = src.read_text(encoding="utf-8")
    blocks = parse_markdown(md)
    pages = render(blocks)
    add_footers(pages)
    pdf = build_pdf(pages)
    dst.write_bytes(pdf)
    print(f"Wrote {dst}  pages={len(pages)}  bytes={len(pdf):,}")


if __name__ == "__main__":
    main()
