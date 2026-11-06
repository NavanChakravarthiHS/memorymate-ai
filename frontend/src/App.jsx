import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import { useChat } from "./hooks/useChat";
import { useConversations } from "./hooks/useConversations";
import ChatPage from "./pages/ChatPage";
import MemoryDashboard from "./pages/MemoryDashboard";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const conversations = useConversations();
  const chat = useChat({
    active: conversations.active,
    updateActive: conversations.updateActive,
  });

  return (
    <div className="flex h-screen overflow-hidden text-slate-100">
      <Sidebar
        conversations={conversations.conversations}
        activeId={conversations.activeId}
        onSelect={(id) => {
          conversations.setActiveId(id);
          if (location.pathname !== "/") navigate("/");
        }}
        onNewChat={() => {
          conversations.startNewChat();
          navigate("/");
        }}
      />
      <main className="flex min-w-0 flex-1 flex-col">
        <Routes>
          <Route
            path="/"
            element={
              <ChatPage
                active={conversations.active}
                sending={chat.sending}
                error={chat.error}
                onSend={chat.sendMessage}
                onClear={conversations.clearActive}
              />
            }
          />
          <Route path="/memory" element={<MemoryDashboard />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
