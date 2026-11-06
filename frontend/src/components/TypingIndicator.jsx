import { Bot } from "lucide-react";

export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/20 text-violet-200">
        <Bot size={16} />
      </div>
      <div className="dot-pulse flex items-center gap-1 rounded-2xl border border-white/6 bg-[#151d32] px-4 py-3">
        <span className="h-1.5 w-1.5 rounded-full bg-violet-300" />
        <span className="h-1.5 w-1.5 rounded-full bg-violet-300" />
        <span className="h-1.5 w-1.5 rounded-full bg-violet-300" />
      </div>
    </div>
  );
}
