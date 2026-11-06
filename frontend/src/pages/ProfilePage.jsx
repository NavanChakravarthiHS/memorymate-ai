import { useEffect, useState } from "react";
import { fetchMemories, getErrorMessage, reflectMemories } from "../services/api";
import { getUserId } from "../services/userStore";

export default function ProfilePage() {
  const [summary, setSummary] = useState("");
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const memories = await fetchMemories();
        setTotal(memories.total || 0);
        const reflected = await reflectMemories(
          "Summarize the user's profile using only stored memories. Cover name, education, skills, interests, learning goals, preferences, and important facts. If a field is unknown, say it is not stored yet."
        );
        setSummary(reflected.summary || "");
      } catch (err) {
        setError(getErrorMessage(err, "Could not load profile from Hindsight."));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold text-white">User Profile</h1>
        <p className="mt-2 text-sm text-slate-400">
          Demo identity: <span className="text-violet-200">{getUserId()}</span>
        </p>
        <div className="mt-6 rounded-2xl border border-white/6 bg-[#121a2d] p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Stored memories</p>
          <p className="mt-2 text-3xl font-semibold text-white">{total}</p>
          {loading ? (
            <p className="mt-6 text-sm text-slate-500">Generating a Hindsight Reflect summary...</p>
          ) : error ? (
            <p className="mt-6 text-sm text-rose-200">{error}</p>
          ) : (
            <p className="mt-6 whitespace-pre-wrap text-sm leading-7 text-slate-200">{summary}</p>
          )}
        </div>
      </div>
    </div>
  );
}
