"use client";

import katex from "katex";

// A segment is either a plain text run, an inline $...$, or a block $$...$$ expression.
type Segment =
  | { type: "text"; value: string }
  | { type: "inline"; value: string }
  | { type: "block"; value: string };

// Splits a mixed string into text and math segments.
// $$...$$ is matched before $...$ so block delimiters take priority.
function parseSegments(content: string): Segment[] {
  const segments: Segment[] = [];
  const re = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(content)) !== null) {
    if (match.index > cursor) {
      segments.push({ type: "text", value: content.slice(cursor, match.index) });
    }
    const raw = match[0];
    if (raw.startsWith("$$")) {
      segments.push({ type: "block", value: raw.slice(2, -2) });
    } else {
      segments.push({ type: "inline", value: raw.slice(1, -1) });
    }
    cursor = re.lastIndex;
  }

  if (cursor < content.length) {
    segments.push({ type: "text", value: content.slice(cursor) });
  }

  return segments;
}

// Renders a LaTeX string to an HTML object for dangerouslySetInnerHTML.
// throwOnError: false means KaTeX renders a red error span instead of throwing,
// so a bad formula never crashes the component tree.
function toHTML(latex: string, displayMode: boolean): { __html: string } {
  try {
    return {
      __html: katex.renderToString(latex, {
        displayMode,
        throwOnError: false,
        strict: false,
      }),
    };
  } catch {
    // Fallback: show the raw LaTeX in a muted style
    return { __html: `<span class="text-muted-foreground">${latex}</span>` };
  }
}

type MathTextProps = {
  content: string;
  className?: string;
};

// Renders a content string that may contain plain text, inline math ($...$)
// and block math ($$...$$) side-by-side. Safe to use anywhere in the app.
export function MathText({ content, className }: MathTextProps) {
  if (!content) return null;

  const segments = parseSegments(content);

  return (
    <span className={className}>
      {segments.map((seg, i) => {
        if (seg.type === "block") {
          return (
            <span
              key={i}
              className="block my-2 overflow-x-auto"
              dangerouslySetInnerHTML={toHTML(seg.value, true)}
            />
          );
        }
        if (seg.type === "inline") {
          return (
            <span
              key={i}
              dangerouslySetInnerHTML={toHTML(seg.value, false)}
            />
          );
        }
        return <span key={i}>{seg.value}</span>;
      })}
    </span>
  );
}
