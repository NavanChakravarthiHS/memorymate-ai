import { Activity, Database, ShieldCheck, Wrench } from "lucide-react";

export default function MemoryPanel({ memories, status, loading }) {
  const used = memories || [];
  return (
    <aside className="hidden w-[300px] shrink-0 border-l border-white/10 bg-[#121a2f] p-4 md:flex md:flex-col">
      <h2 className="text-sm font-semibold text-white">Memory activity</h2>
      <p className="mt-1 text-xs text-slate-500">Hindsight recall, retain, and bank status.</p>

      <div className="mt-5 grid gap-3">
        <StatusCard
          icon={Database}
          label="Stored memories"
          value={status?.memoryCount ?? "—"}
        />
        <StatusCard
          icon={ShieldCheck}
          label="Last retain"
          value={
            status?.retained
              ? "Saved"
              : status?.retainError
                ? "Failed"
                : status?.skipReason
                  ? "Skipped"
                  : "Waiting"
          }
        />
        <StatusCard
          icon={Activity}
          label="Last recall"
          value={status?.recalled ? `${used.length} used` : status?.recallError ? "Failed" : "Waiting"}
        />
        <StatusCard
          icon={Wrench}
          label="Tool calls"
          value={typeof status?.toolCallCount === "number" ? status.toolCallCount : "—"}
        />
      </div>

      <p className="mt-6 text-[11px] uppercase tracking-[0.18em] text-slate-500">
        Relevant memories used
      </p>
      <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto">
        {loading ? (
          <p className="text-sm text-slate-500">Looking up memories...</p>
        ) : used.length ? (
          used.map((memory, index) => (
            <div key={memory.id || index} className="rounded-xl border border-white/6 bg-white/4 p-3">
              <p className="text-[11px] uppercase tracking-wide text-violet-300">{memory.type || "memory"}</p>
              <p className="mt-1 text-sm leading-5 text-slate-200">{memory.text}</p>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-slate-500">
            No Hindsight memories were used for the latest reply yet.
          </div>
        )}
      </div>

      {(status?.recallError || status?.retainError || status?.skipReason) && (
        <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/8 p-3 text-xs text-amber-100">
          {status.retainError && <p>Retain: {status.retainError}</p>}
          {status.recallError && <p>Recall: {status.recallError}</p>}
          {status.skipReason && <p>{status.skipReason}</p>}
        </div>
      )}
    </aside>
  );
}

function StatusCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/6 bg-[#121a2d] p-3">
      <div className="flex items-center gap-2 text-slate-400">
        <Icon size={14} />
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-2 text-lg font-medium text-white">{value}</p>
    </div>
  );
}
