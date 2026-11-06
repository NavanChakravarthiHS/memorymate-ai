import { useEffect, useState } from "react";
import { fetchHealth, getErrorMessage } from "../services/api";
import { getUserId, setUserId } from "../services/userStore";

export default function SettingsPage() {
  const [userId, setLocalUserId] = useState(getUserId());
  const [saved, setSaved] = useState(false);
  const [health, setHealth] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchHealth()
      .then(setHealth)
      .catch((err) => setError(getErrorMessage(err, "Could not reach the backend.")));
  }, []);

  function save(event) {
    event.preventDefault();
    setUserId(userId);
    setSaved(true);
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <p className="mt-2 text-sm text-slate-400">
          Demo mode uses a local user id. Each id maps to a separate Hindsight memory bank.
        </p>

        <form onSubmit={save} className="mt-6 rounded-2xl border border-white/6 bg-[#121a2d] p-5">
          <label className="text-sm text-slate-300">Demo user id</label>
          <input
            value={userId}
            onChange={(event) => {
              setLocalUserId(event.target.value);
              setSaved(false);
            }}
            className="mt-2 w-full rounded-xl border border-white/8 bg-[#0b1220] px-4 py-3 text-sm outline-none"
          />
          <button
            type="submit"
            className="mt-4 rounded-xl bg-violet-600 px-4 py-2 text-sm text-white hover:bg-violet-500"
          >
            Save identity
          </button>
          {saved && (
            <p className="mt-3 text-sm text-emerald-300">
              Saved. Reload chat to use the new memory bank.
            </p>
          )}
        </form>

        {error && <p className="mt-4 text-sm text-rose-200">{error}</p>}

        {health && (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <HealthCard
              title="Groq"
              ok={health.groq?.configured}
              detail={health.groq?.model || "Not configured"}
            />
            <HealthCard
              title="Hindsight"
              ok={health.hindsight?.ok}
              detail={
                health.hindsight?.ok
                  ? `Connected${health.hindsight.apiVersion ? ` · ${health.hindsight.apiVersion}` : ""}`
                  : health.hindsight?.reason || "Not connected"
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}

function HealthCard({ title, ok, detail }) {
  return (
    <div className="rounded-2xl border border-white/6 bg-[#121a2d] p-5">
      <p className="text-sm text-slate-400">{title}</p>
      <p className={`mt-2 text-lg font-medium ${ok ? "text-emerald-300" : "text-amber-200"}`}>
        {ok ? "Ready" : "Needs setup"}
      </p>
      <p className="mt-2 text-sm text-slate-400">{detail}</p>
    </div>
  );
}
