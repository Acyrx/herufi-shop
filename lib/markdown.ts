/**
 * Lightweight Markdown → HTML renderer.
 * Handles: h1-h6, bold, italic, inline code, code blocks,
 * tables, ordered/unordered lists, blockquotes, horizontal rules, links.
 * Safe for server-side rendering of our own doc files (not user input).
 */

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** Render inline markdown: bold, italic, code, links */
function renderInline(text: string): string {
  return text
    .replace(/`([^`]+)`/g, '<code class="md-code">$1</code>')
    .replace(/\*\*\*([^*]+)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="md-link">$1</a>')
    .replace(/~~([^~]+)~~/g, "<del>$1</del>");
}

export function renderMarkdown(markdown: string): string {
  const lines = markdown.split("\n");
  const out: string[] = [];
  let i = 0;
  let inCode = false;
  let inTable = false;
  let tableFirstRow = false;

  // Flush any open table
  const closeTable = () => {
    if (inTable) {
      out.push("</tbody></table></div>");
      inTable = false;
    }
  };

  while (i < lines.length) {
    const raw = lines[i];

    // ── Fenced code block ──────────────────────────────────────────────────
    if (raw.startsWith("```")) {
      closeTable();
      if (!inCode) {
        inCode = true;
        const lang = raw.slice(3).trim();
        out.push(
          `<pre class="md-pre"><code${lang ? ` class="lang-${lang}"` : ""}>`
        );
      } else {
        inCode = false;
        out.push("</code></pre>");
      }
      i++;
      continue;
    }

    if (inCode) {
      out.push(escapeHtml(raw));
      i++;
      continue;
    }

    // ── Empty line ─────────────────────────────────────────────────────────
    if (raw.trim() === "") {
      closeTable();
      i++;
      continue;
    }

    // ── Horizontal rule ────────────────────────────────────────────────────
    if (/^-{3,}$/.test(raw.trim())) {
      closeTable();
      out.push('<hr class="md-hr">');
      i++;
      continue;
    }

    // ── ATX Headings ───────────────────────────────────────────────────────
    const hMatch = raw.match(/^(#{1,6})\s+(.+)/);
    if (hMatch) {
      closeTable();
      const level = hMatch[1].length;
      const text = hMatch[2].replace(/\s+#+\s*$/, ""); // strip trailing #
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .trim()
        .replace(/\s+/g, "-");
      out.push(
        `<h${level} id="${id}" class="md-h${level}">${renderInline(text)}</h${level}>`
      );
      i++;
      continue;
    }

    // ── Blockquote ─────────────────────────────────────────────────────────
    if (raw.startsWith("> ")) {
      closeTable();
      const bqLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        bqLines.push(lines[i].slice(2));
        i++;
      }
      out.push(`<blockquote class="md-blockquote">${bqLines.map(renderInline).join("<br>")}</blockquote>`);
      continue;
    }

    // ── Unordered list ─────────────────────────────────────────────────────
    if (/^(\s*)[-*+]\s/.test(raw)) {
      closeTable();
      const items: string[] = [];
      while (i < lines.length && /^(\s*)[-*+]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^(\s*)[-*+]\s+/, ""));
        i++;
      }
      out.push(
        `<ul class="md-ul">${items.map((it) => `<li>${renderInline(it)}</li>`).join("")}</ul>`
      );
      continue;
    }

    // ── Ordered list ───────────────────────────────────────────────────────
    if (/^\d+\.\s/.test(raw)) {
      closeTable();
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""));
        i++;
      }
      out.push(
        `<ol class="md-ol">${items.map((it) => `<li>${renderInline(it)}</li>`).join("")}</ol>`
      );
      continue;
    }

    // ── Table ──────────────────────────────────────────────────────────────
    if (raw.includes("|")) {
      // Detect separator row: | --- | :---: | ---: |
      const isSep = /^\|?\s*[-:]+[-|\s:]*\|?\s*$/.test(raw);

      if (!inTable) {
        // Look ahead: next row must be a separator to confirm this is a table header
        const nextRaw = lines[i + 1] ?? "";
        const nextIsSep = /^\|?\s*[-:]+[-|\s:]*\|?\s*$/.test(nextRaw);

        if (nextIsSep) {
          inTable = true;
          tableFirstRow = true;
          const cells = parseCells(raw);
          out.push(
            '<div class="md-table-wrap"><table class="md-table"><thead><tr>' +
              cells.map((c) => `<th>${renderInline(c)}</th>`).join("") +
              "</tr></thead><tbody>"
          );
          i += 2; // skip header + separator
          continue;
        }
      }

      if (inTable && !isSep) {
        const cells = parseCells(raw);
        out.push(
          "<tr>" +
            cells.map((c) => `<td>${renderInline(c)}</td>`).join("") +
            "</tr>"
        );
        i++;
        continue;
      }

      if (isSep) {
        // Stray separator — skip
        i++;
        continue;
      }
    }

    // ── Paragraph ──────────────────────────────────────────────────────────
    closeTable();
    // Gather consecutive paragraph lines
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].startsWith("#") &&
      !lines[i].startsWith(">") &&
      !/^(\s*)[-*+]\s/.test(lines[i]) &&
      !/^\d+\.\s/.test(lines[i]) &&
      !lines[i].startsWith("```") &&
      !/^-{3,}$/.test(lines[i].trim()) &&
      !lines[i].includes("|")
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      out.push(`<p class="md-p">${renderInline(paraLines.join(" "))}</p>`);
    } else {
      // Fallback: advance to avoid infinite loop
      i++;
    }
  }

  closeTable();
  return out.join("\n");
}

function parseCells(row: string): string[] {
  return row
    .split("|")
    .map((c) => c.trim())
    .filter((_, idx, arr) => {
      // Strip leading/trailing empty segments from outer pipes
      if (idx === 0 && arr[0] === "") return false;
      if (idx === arr.length - 1 && arr[arr.length - 1] === "") return false;
      return true;
    });
}
