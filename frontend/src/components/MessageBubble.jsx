import { Bot, User } from "lucide-react";
import MarkdownMessage from "./MarkdownMessage";

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={`fade-up flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-violet-200">
          <Bot size={16} />
        </div>
      )}
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-lg ${
          isUser
            ? "bg-violet-500 text-white"
            : message.error
              ? "border border-rose-400/40 bg-rose-500/15 text-rose-50"
              : "border border-white/10 bg-[#243049] text-slate-50"
        }`}
      >
        {isUser || message.error ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <MarkdownMessage text={message.content} />
        )}
      </div>
      {isUser && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-500/15 text-sky-200">
          <User size={16} />
        </div>
      )}
    </div>
  );
}
