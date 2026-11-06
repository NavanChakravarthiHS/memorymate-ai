import {
  BrainCircuit,
  MessageSquarePlus,
  Settings,
  Sparkles,
  UserRound,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

export default function Sidebar({ conversations, activeId, onSelect, onNewChat }) {
  const location = useLocation();
  const navClass = (path) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
      location.pathname === path
        ? "bg-violet-500/15 text-violet-200"
        : "text-slate-300 hover:bg-white/5 hover:text-white"
    }`;

  return (
    <aside className="flex h-full w-[272px] shrink-0 flex-col border-r border-white/5 bg-[#0b1220]/90 p-4 backdrop-blur">
      <div className="mb-6 flex items-center gap-3 px-1">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/20 text-violet-200">
          <BrainCircuit size={22} />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-wide text-white">MemoryMate AI</p>
          <p className="text-xs text-slate-400">Long-term memory assistant</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onNewChat}
        className="mb-5 flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-900/40 transition hover:bg-violet-500"
      >
        <MessageSquarePlus size={16} />
        New Chat
      </button>

      <p className="mb-2 px-1 text-[11px] uppercase tracking-[0.18em] text-slate-500">
        Chat history
      </p>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
        {conversations.map((chat) => (
          <button
            key={chat.id}
            type="button"
            onClick={() => onSelect(chat.id)}
            className={`block w-full truncate rounded-xl px-3 py-2 text-left text-sm ${
              chat.id === activeId
                ? "bg-white/8 text-white"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            {chat.title}
          </button>
        ))}
      </div>

      <nav className="mt-4 space-y-1 border-t border-white/5 pt-4">
        <NavLink to="/memory" className={navClass("/memory")}>
          <Sparkles size={16} />
          Memory Dashboard
        </NavLink>
        <NavLink to="/profile" className={navClass("/profile")}>
          <UserRound size={16} />
          User Profile
        </NavLink>
        <NavLink to="/settings" className={navClass("/settings")}>
          <Settings size={16} />
          Settings
        </NavLink>
      </nav>
    </aside>
  );
}
