import * as React from "react";

// Tiny server-side Markdown to JSX renderer. Mirrors the parser in
// docs/diabetes-education-plan/build_html.py (md_to_html + render_inline)
// but emits React elements instead of HTML strings. React only; no
// external dependencies, no dangerouslySetInnerHTML.
//
// Supports: # / ## / ### headings, paragraphs, -/*/+ unordered lists,
// 1. ordered lists, > blockquotes, ``` fenced code blocks, --- rules,
// **bold**, *italic*, `code`. Everything else renders as plain text.

const CODE_PLACEHOLDER = /\u0000C(\d+)\u0000/g;

function restoreCodeNodes(
  text: string,
  stash: string[],
  keyBase: string,
): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let last = 0;
  let k = 0;
  CODE_PLACEHOLDER.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = CODE_PLACEHOLDER.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(
      <code
        key={`${keyBase}-c${k++}`}
        className="rounded bg-gray-100 px-1 py-0.5 text-xs font-mono"
      >
        {stash[Number(m[1])] ?? ""}
      </code>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

type Tok =
  | { kind: "text"; value: string }
  | { kind: "bold"; value: string }
  | { kind: "italic"; value: string };

function renderInline(text: string, keyBase: string): React.ReactNode[] {
  // Stash inline `code` so its contents aren't reinterpreted.
  const stash: string[] = [];
  const working = text.replace(/`([^`]+)`/g, (_full, body: string) => {
    stash.push(body);
    return `\u0000C${stash.length - 1}\u0000`;
  });

  // Split on **bold** first.
  const bold: Tok[] = [];
  const boldRe = /\*\*(.+?)\*\*/g;
  let pos = 0;
  let bm: RegExpExecArray | null;
  while ((bm = boldRe.exec(working)) !== null) {
    if (bm.index > pos) bold.push({ kind: "text", value: working.slice(pos, bm.index) });
    bold.push({ kind: "bold", value: bm[1] });
    pos = bm.index + bm[0].length;
  }
  if (pos < working.length) bold.push({ kind: "text", value: working.slice(pos) });

  // Split each text token on *italic*.
  const italicRe = /(?<!\*)\*(?!\*)([^*\n]+?)\*(?!\*)/g;
  const tokens: Tok[] = [];
  for (const t of bold) {
    if (t.kind !== "text") {
      tokens.push(t);
      continue;
    }
    const s = t.value;
    let p = 0;
    italicRe.lastIndex = 0;
    let im: RegExpExecArray | null;
    while ((im = italicRe.exec(s)) !== null) {
      if (im.index > p) tokens.push({ kind: "text", value: s.slice(p, im.index) });
      tokens.push({ kind: "italic", value: im[1] });
      p = im.index + im[0].length;
    }
    if (p < s.length) tokens.push({ kind: "text", value: s.slice(p) });
  }

  const out: React.ReactNode[] = [];
  let k = 0;
  for (const t of tokens) {
    const tk = `${keyBase}-${k++}`;
    if (t.kind === "bold") {
      out.push(<strong key={tk}>{restoreCodeNodes(t.value, stash, tk)}</strong>);
    } else if (t.kind === "italic") {
      out.push(<em key={tk}>{restoreCodeNodes(t.value, stash, tk)}</em>);
    } else {
      for (const n of restoreCodeNodes(t.value, stash, tk)) out.push(n);
    }
  }
  return out;
}

const H_CLS: Record<number, string> = {
  1: "text-3xl font-semibold text-brand-dark mt-8 mb-3",
  2: "text-2xl font-semibold text-brand-dark mt-8 mb-2",
  3: "text-lg font-semibold text-brand-dark mt-6 mb-2",
};

const isUl = (s: string) => /^\s*[-*+]\s+/.test(s);
const isOl = (s: string) => /^\s*\d+\.\s+/.test(s);
const isHr = (s: string) => s === "---" || s === "***" || s === "___";

function parseBlocks(md: string): React.ReactNode[] {
  const lines = md.split(/\r?\n/);
  const out: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  const nextKey = () => `b${key++}`;

  while (i < lines.length) {
    const line = lines[i];
    const stripped = line.trim();

    if (stripped.startsWith("```")) {
      i++;
      const buf: string[] = [];
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        buf.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;
      out.push(
        <pre
          key={nextKey()}
          className="my-3 overflow-x-auto rounded bg-gray-100 p-3 text-xs font-mono text-gray-800"
        >
          <code>{buf.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    if (isHr(stripped)) {
      out.push(<hr key={nextKey()} className="my-6 border-gray-200" />);
      i++;
      continue;
    }

    const hMatch = /^(#{1,6})\s+(.*)$/.exec(stripped);
    if (hMatch) {
      const level = Math.min(hMatch[1].length, 3);
      const k = nextKey();
      const inline = renderInline(hMatch[2], k);
      const cls = H_CLS[level];
      if (level === 1) out.push(<h1 key={k} className={cls}>{inline}</h1>);
      else if (level === 2) out.push(<h2 key={k} className={cls}>{inline}</h2>);
      else out.push(<h3 key={k} className={cls}>{inline}</h3>);
      i++;
      continue;
    }

    if (stripped.startsWith(">")) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].trimStart().startsWith(">")) {
        buf.push(lines[i].trimStart().replace(/^>\s?/, ""));
        i++;
      }
      const joined = buf.map((b) => b.trim()).filter(Boolean).join(" ");
      const k = nextKey();
      out.push(
        <blockquote
          key={k}
          className="border-l-4 border-brand bg-brand/5 px-4 py-2 italic text-gray-700 my-4"
        >
          {renderInline(joined, k)}
        </blockquote>,
      );
      continue;
    }

    if (isUl(line)) {
      const items: string[] = [];
      while (i < lines.length && isUl(lines[i])) {
        let item = lines[i].replace(/^\s*[-*+]\s+/, "");
        while (
          i + 1 < lines.length &&
          lines[i + 1].startsWith("  ") &&
          lines[i + 1].trim().length > 0 &&
          !isUl(lines[i + 1]) &&
          !isOl(lines[i + 1])
        ) {
          i++;
          item += " " + lines[i].trim();
        }
        items.push(item);
        i++;
      }
      const k = nextKey();
      out.push(
        <ul key={k} className="list-disc pl-6 text-sm text-gray-700 space-y-1 my-3">
          {items.map((it, idx) => (
            <li key={`${k}-${idx}`}>{renderInline(it, `${k}-${idx}`)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    if (isOl(line)) {
      const items: string[] = [];
      while (i < lines.length && isOl(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      const k = nextKey();
      out.push(
        <ol key={k} className="list-decimal pl-6 text-sm text-gray-700 space-y-1 my-3">
          {items.map((it, idx) => (
            <li key={`${k}-${idx}`}>{renderInline(it, `${k}-${idx}`)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    if (!stripped) {
      i++;
      continue;
    }

    const buf: string[] = [line];
    i++;
    while (i < lines.length) {
      const nxt = lines[i];
      const ns = nxt.trim();
      if (
        !ns ||
        ns.startsWith("#") ||
        nxt.trimStart().startsWith(">") ||
        nxt.trimStart().startsWith("```") ||
        isUl(nxt) ||
        isOl(nxt) ||
        isHr(ns)
      ) {
        break;
      }
      buf.push(nxt);
      i++;
    }
    const para = buf.map((b) => b.trim()).join(" ");
    const k = nextKey();
    out.push(
      <p key={k} className="text-sm text-gray-700 leading-relaxed my-3">
        {renderInline(para, k)}
      </p>,
    );
  }

  return out;
}

export function renderMarkdown(md: string): React.ReactElement {
  return <>{parseBlocks(md)}</>;
}
