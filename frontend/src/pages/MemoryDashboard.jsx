import { Search, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import {
  fetchMemories,
  getErrorMessage,
  reflectMemories,
  searchMemories,
} from "../services/api";

export default function MemoryDashboard() {
  const [memories, setMemories] = useState([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [profile, setProfile] = useState("");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [reflecting, setReflecting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadMemories();
  }, []);

  async function loadMemories() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchMemories();
      setMemories(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load stored memories."));
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(event) {
    event.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setError("");
    try {
      const data = await searchMemories(query.trim());
      setSearchResults(data.memories || []);
    } catch (err) {
      setError(getErrorMessage(err, "Memory search failed."));
    } finally {
      setSearching(false);
    }
  }

  async function generateProfile() {
    setReflecting(true);
    setError("");
    try {
      const data = await reflectMemories();
      setProfile(data.summary || "No profile could be generated from stored memories yet.");
    } catch (err) {
      setError(getErrorMessage(err, "Hindsight Reflect failed."));
    } finally {
      setReflecting(false);
    }
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white">Memory Dashboard</h1>
            <p className="mt-1 text-sm text-slate-400">
              This view reads Hindsight, not local chat history.
            </p>
          </div>
          <button
            type="button"
            onClick={generateProfile}
            disabled={reflecting}
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
          >
            <Sparkles size={16} />
            {reflecting ? "Generating..." : "Generate My Profile"}
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        )}

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <Stat label="Total stored memories" value={total} />
          <Stat label="Recent items loaded" value={memories.length} />
          <Stat label="Search hits" value={searchResults.length} />
        </div>

        <form onSubmit={handleSearch} className="mb-6 flex gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-2xl border border-white/8 bg-[#121a2d] px-4">
            <Search size={16} className="text-slate-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search stored memories with Hindsight Recall"
              className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-500"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="rounded-2xl bg-white/8 px-5 text-sm text-white hover:bg-white/12 disabled:opacity-50"
          >
            {searching ? "Searching..." : "Search"}
          </button>
        </form>

        {profile && (
          <section className="mb-6 rounded-2xl border border-violet-400/20 bg-violet-500/8 p-5">
            <h2 className="text-sm font-semibold text-violet-200">Hindsight Reflect profile</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-100">{profile}</p>
          </section>
        )}

        {searchResults.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-3 text-sm font-semibold text-white">Recall results</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {searchResults.map((item, index) => (
                <MemoryCard key={item.id || index} item={item} />
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-3 text-sm font-semibold text-white">Recent memory activity</h2>
          {loading ? (
            <p className="text-sm text-slate-500">Loading Hindsight memories...</p>
          ) : memories.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {memories.map((item, index) => (
                <MemoryCard key={item.id || index} item={item} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">
              No memories stored yet. Tell MemoryMate your name, skills, or goals in chat.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/6 bg-[#121a2d] p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function MemoryCard({ item }) {
  return (
    <article className="rounded-2xl border border-white/6 bg-[#121a2d] p-4">
      {item.type && (
        <p className="text-[11px] uppercase tracking-wide text-violet-300">{item.type}</p>
      )}
      <p className="mt-2 text-sm leading-6 text-slate-200">{item.text}</p>
    </article>
  );
}
