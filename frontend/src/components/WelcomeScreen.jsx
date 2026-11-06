import { Brain, Compass, Sparkles } from "lucide-react";

const prompts = [
  "My name is Rahul. I am a computer science student. I am learning Java and React.",
  "I want to become a full-stack developer and I prefer concise answers.",
  "What technologies am I learning?",
];

export default function WelcomeScreen({ onPrompt }) {
  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center px-4 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-500/15 text-violet-200">
        <Brain size={32} />
      </div>
      <h1 className="text-3xl font-semibold tracking-tight text-white">Hi, I am MemoryMate.</h1>
      <p className="mt-3 max-w-lg text-sm leading-6 text-slate-400">
        I remember what you tell me across chats. Share your name, skills, goals, and preferences.
        I store them with Hindsight and use them the next time we talk.
      </p>
      <div className="mt-8 grid w-full gap-3 sm:grid-cols-3">
        {prompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onPrompt(prompt)}
            className="rounded-2xl border border-white/8 bg-white/4 p-4 text-left text-sm text-slate-300 transition hover:border-violet-400/40 hover:bg-violet-500/10"
          >
            {prompt}
          </button>
        ))}
      </div>
      <div className="mt-8 flex items-center gap-6 text-xs text-slate-500">
        <span className="flex items-center gap-2">
          <Sparkles size={14} /> Retain · Recall · Reflect
        </span>
        <span className="flex items-center gap-2">
          <Compass size={14} /> Memory survives refresh
        </span>
      </div>
    </div>
  );
}
