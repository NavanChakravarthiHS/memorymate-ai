import { Eraser, Send } from "lucide-react";
import { useState } from "react";

export default function MessageInput({ onSend, onClear, disabled }) {
  const [value, setValue] = useState("");

  function submit(event) {
    event.preventDefault();
    if (!value.trim() || disabled) return;
    onSend(value);
    setValue("");
  }

  return (
    <form onSubmit={submit} className="border-t border-white/5 bg-[#0b1220]/80 p-4">
      <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-white/8 bg-[#121a2d] p-2">
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit(event);
            }
          }}
          rows={1}
          placeholder="Tell MemoryMate something to remember..."
          className="max-h-36 min-h-12 flex-1 resize-none bg-transparent px-3 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500"
        />
        <button
          type="button"
          onClick={onClear}
          className="rounded-xl p-2.5 text-slate-400 transition hover:bg-white/5 hover:text-white"
          title="Clear conversation"
        >
          <Eraser size={18} />
        </button>
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="rounded-xl bg-violet-600 p-2.5 text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send size={18} />
        </button>
      </div>
    </form>
  );
}
