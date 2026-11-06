import { parseMarkdown } from "../utils/renderMarkdown";

function Inline({ nodes }) {
  return nodes.map((node, index) => {
    if (node.type === "strong") {
      return (
        <strong key={index} className="font-semibold">
          {node.value}
        </strong>
      );
    }
    if (node.type === "code") {
      return (
        <code key={index} className="rounded bg-black/25 px-1 py-0.5 text-[0.9em]">
          {node.value}
        </code>
      );
    }
    return <span key={index}>{node.value}</span>;
  });
}

export default function MarkdownMessage({ text }) {
  const blocks = parseMarkdown(text);

  if (!blocks.length) {
    return <p className="whitespace-pre-wrap">{text}</p>;
  }

  return (
    <div className="space-y-2">
      {blocks.map((block, index) => {
        if (block.type === "ul") {
          return (
            <ul key={index} className="list-disc space-y-1 pl-5">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  <Inline nodes={item.children} />
                </li>
              ))}
            </ul>
          );
        }
        if (block.type === "ol") {
          return (
            <ol key={index} className="list-decimal space-y-1 pl-5">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  <Inline nodes={item.children} />
                </li>
              ))}
            </ol>
          );
        }
        if (block.type === "heading") {
          return (
            <p key={index} className="font-semibold">
              <Inline nodes={block.children} />
            </p>
          );
        }
        return (
          <p key={index} className="whitespace-pre-wrap">
            <Inline nodes={block.children} />
          </p>
        );
      })}
    </div>
  );
}
