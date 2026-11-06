import { useState } from "react";
import { getErrorMessage, sendChat } from "../services/api";

export function useChat({ active, updateActive }) {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function sendMessage(text) {
    if (!text.trim() || sending) return;
    setError("");
    setSending(true);

    const userMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text.trim(),
      createdAt: new Date().toISOString(),
    };

    updateActive((conversation) => ({
      ...conversation,
      title:
        conversation.messages.length === 0
          ? text.trim().slice(0, 42)
          : conversation.title,
      messages: [...conversation.messages, userMessage],
    }));

    try {
      const history = (active?.messages || []).map((message) => ({
        role: message.role,
        content: message.content,
      }));
      const data = await sendChat({ message: text.trim(), history });
      updateActive((conversation) => ({
        ...conversation,
        messages: [
          ...conversation.messages,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: data.reply,
            memories: data.memories || [],
            memoryStatus: data.memoryStatus,
            createdAt: new Date().toISOString(),
          },
        ],
      }));
      return data;
    } catch (err) {
      const message = getErrorMessage(err, "The assistant could not respond.");
      setError(message);
      updateActive((conversation) => ({
        ...conversation,
        messages: [
          ...conversation.messages,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: `I could not complete that request. ${message}`,
            error: true,
            createdAt: new Date().toISOString(),
          },
        ],
      }));
      return null;
    } finally {
      setSending(false);
    }
  }

  return { sending, error, setError, sendMessage };
}
