function parseInline(text) {
  const nodes = [];
  const pattern = /(\*\*([^*]+)\*\*|`([^`]+)`)/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text))) {
    if (match.index > lastIndex) {
      nodes.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    if (match[2]) {
      nodes.push({ type: "strong", value: match[2] });
    } else if (match[3]) {
      nodes.push({ type: "code", value: match[3] });
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push({ type: "text", value: text.slice(lastIndex) });
  }

  return nodes.length ? nodes : [{ type: "text", value: text }];
}

function listKind(line) {
  if (/^\s*[-*]\s+/.test(line)) return "ul";
  if (/^\s*\d+\.\s+/.test(line)) return "ol";
  return null;
}

function listText(line) {
  return line.replace(/^\s*(?:[-*]|\d+\.)\s+/, "");
}

export function parseMarkdown(text) {
  const lines = String(text || "").replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const kind = listKind(line);

    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (kind) {
      const items = [];
      while (index < lines.length && listKind(lines[index]) === kind) {
        items.push({ type: "li", children: parseInline(listText(lines[index])) });
        index += 1;
      }
      blocks.push({ type: kind, items });
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      blocks.push({
        type: "heading",
        level: heading[1].length,
        children: parseInline(heading[2]),
      });
      index += 1;
      continue;
    }

    blocks.push({ type: "paragraph", children: parseInline(line) });
    index += 1;
  }

  return blocks;
}
