import { useCallback, useEffect, useState } from "react";
import { getUserId } from "../services/userStore";

function storageKey() {
  return `memorymate.conversations.${getUserId()}`;
}

function createConversation() {
  return {
    id: crypto.randomUUID(),
    title: "New chat",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [],
  };
}

function readConversations() {
  try {
    const raw = localStorage.getItem(storageKey());
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) && parsed.length ? parsed : [createConversation()];
  } catch {
    return [createConversation()];
  }
}

export function useConversations() {
  const [conversations, setConversations] = useState(readConversations);
  const [activeId, setActiveId] = useState(conversations[0]?.id);

  useEffect(() => {
    localStorage.setItem(storageKey(), JSON.stringify(conversations));
  }, [conversations]);

  const active = conversations.find((item) => item.id === activeId) || conversations[0];

  const updateActive = useCallback((updater) => {
    setConversations((current) =>
      current.map((item) => {
        if (item.id !== (activeId || current[0]?.id)) return item;
        const next = updater(item);
        return { ...next, updatedAt: new Date().toISOString() };
      })
    );
  }, [activeId]);

  const startNewChat = useCallback(() => {
    const next = createConversation();
    setConversations((current) => [next, ...current]);
    setActiveId(next.id);
  }, []);

  const clearActive = useCallback(() => {
    updateActive((item) => ({ ...item, title: "New chat", messages: [] }));
  }, [updateActive]);

  return {
    conversations,
    active,
    activeId: active?.id,
    setActiveId,
    startNewChat,
    clearActive,
    updateActive,
  };
}
