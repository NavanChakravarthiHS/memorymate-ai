import { useEffect, useMemo, useRef } from "react";
import MemoryPanel from "../components/MemoryPanel";
import MessageBubble from "../components/MessageBubble";
import MessageInput from "../components/MessageInput";
import TypingIndicator from "../components/TypingIndicator";
import WelcomeScreen from "../components/WelcomeScreen";

export default function ChatPage({
  active,
  sending,
  error,
  onSend,
  onClear,
}) {
  const bottomRef = useRef(null);
  const lastAssistant = useMemo(
    () => [...(active?.messages || [])].reverse().find((item) => item.role === "assistant"),
    [active]
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages, sending]);

  return (
    <div className="flex min-h-0 flex-1">
      <section className="flex min-w-0 flex-1 flex-col">
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mx-auto flex min-h-full max-w-3xl flex-col gap-4">
            {!active?.messages?.length ? (
              <WelcomeScreen onPrompt={onSend} />
            ) : (
              active.messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))
            )}
            {sending && <TypingIndicator />}
            <div ref={bottomRef} />
            {error && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </div>
            )}
          </div>
        </div>
        <MessageInput onSend={onSend} onClear={onClear} disabled={sending} />
      </section>
      <MemoryPanel
        memories={lastAssistant?.memories}
        status={lastAssistant?.memoryStatus}
        loading={sending}
      />
    </div>
  );
}
