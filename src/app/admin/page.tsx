"use client";

import { useEffect, useState } from "react";

interface RequestEntry {
  id: string;
  userInput: string;
  inputType: string;
  detectedCarrier: string | null;
  carrierConfidenceScore: number | null;
  status: string;
  errorReason: string | null;
  createdAt: string;
  updatedAt: string;
  result: {
    carrierName: string;
    containerNumber: string | null;
    billOfLadingNumber: string | null;
    vesselName: string | null;
    currentStatus: string | null;
    sourceType: string;
    sourceUrl: string | null;
    rawResponseJson: string | null;
    confidenceScore: number | null;
  } | null;
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    queued: "bg-slate-400",
    processing: "bg-cyan-400 animate-pulse",
    completed: "bg-emerald-400",
    failed: "bg-red-400",
    needs_manual_review: "bg-amber-400",
  };
  return <span className={`w-2.5 h-2.5 rounded-full ${colors[status] || colors.queued}`} />;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function AdminPage() {
  const [requests, setRequests] = useState<RequestEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<RequestEntry | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/requests?limit=100");
        const data = await res.json();
        setRequests(data.requests || []);
        setTotal(data.total || 0);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  async function handleRetry(userInput: string) {
    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingNumber: userInput }),
      });
      if (res.ok) {
        // Refresh list
        const listRes = await fetch("/api/admin/requests?limit=100");
        const data = await listRes.json();
        setRequests(data.requests || []);
        setTotal(data.total || 0);
      }
    } catch {
      // ignore
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12 animate-slide-up">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">{total} total tracking requests</p>
        </div>
        <a href="/" className="px-4 py-2 bg-white/5 text-slate-300 rounded-lg hover:bg-white/10 transition-all text-sm">
          ← Back to Tracker
        </a>
      </div>

      {loading ? (
        <div className="glass-card p-12 text-center">
          <svg className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-slate-400 text-sm">Loading requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-slate-400">No tracking requests yet.</p>
          <a href="/" className="inline-block mt-4 px-4 py-2 bg-cyan-500/10 text-cyan-400 rounded-lg hover:bg-cyan-500/20 transition-all text-sm">
            Submit your first tracking request →
          </a>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Request List */}
          <div className="flex-1 space-y-2">
            {requests.map((r) => (
              <div
                key={r.id}
                onClick={() => setSelected(r)}
                className={`glass-card p-4 cursor-pointer transition-all hover:border-cyan-500/20 ${
                  selected?.id === r.id ? "border-cyan-500/30 bg-slate-800/60" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <StatusDot status={r.status} />
                    <div className="min-w-0">
                      <p className="text-sm font-mono font-semibold text-white truncate">{r.userInput}</p>
                      <p className="text-xs text-slate-500">
                        {r.detectedCarrier || "Unknown carrier"} · {r.inputType} · {formatDate(r.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      r.status === "completed" ? "bg-emerald-500/10 text-emerald-400" :
                      r.status === "failed" ? "bg-red-500/10 text-red-400" :
                      r.status === "processing" ? "bg-cyan-500/10 text-cyan-400" :
                      r.status === "needs_manual_review" ? "bg-amber-500/10 text-amber-400" :
                      "bg-slate-500/10 text-slate-400"
                    }`}>
                      {r.status}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRetry(r.userInput); }}
                      className="text-xs text-slate-500 hover:text-cyan-400 transition-colors"
                      title="Retry"
                    >
                      ↻
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detail Panel */}
          {selected && (
            <div className="lg:w-[420px] flex-shrink-0">
              <div className="glass-card p-6 lg:sticky lg:top-24 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Request Details</h3>
                  <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-white text-xs">✕</button>
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-500">ID</p>
                    <p className="font-mono text-xs text-slate-300 break-all">{selected.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Input</p>
                    <p className="font-mono text-white">{selected.userInput}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-slate-500">Type</p>
                      <p className="text-slate-300">{selected.inputType}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Status</p>
                      <p className="text-slate-300">{selected.status}</p>
                    </div>
                  </div>
                  {selected.detectedCarrier && (
                    <div>
                      <p className="text-xs text-slate-500">Detected Carrier</p>
                      <p className="text-slate-300">{selected.detectedCarrier} ({Math.round((selected.carrierConfidenceScore || 0) * 100)}%)</p>
                    </div>
                  )}
                  {selected.errorReason && (
                    <div>
                      <p className="text-xs text-slate-500">Error</p>
                      <p className="text-red-400 text-xs">{selected.errorReason}</p>
                    </div>
                  )}
                </div>

                {selected.result && (
                  <>
                    <hr className="border-white/5" />
                    <div className="space-y-3 text-sm">
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Result</h4>
                      {selected.result.currentStatus && (
                        <div>
                          <p className="text-xs text-slate-500">Status</p>
                          <p className="text-cyan-400">{selected.result.currentStatus}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-slate-500">Source Type</p>
                        <p className="text-slate-300">{selected.result.sourceType}</p>
                      </div>
                      {selected.result.sourceUrl && (
                        <div>
                          <p className="text-xs text-slate-500">Source URL</p>
                          <a href={selected.result.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline text-xs break-all">
                            {selected.result.sourceUrl}
                          </a>
                        </div>
                      )}
                      {selected.result.rawResponseJson && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Raw Response</p>
                          <pre className="text-xs text-slate-400 bg-slate-900/50 p-3 rounded-lg overflow-auto max-h-48 font-mono">
                            {JSON.stringify(JSON.parse(selected.result.rawResponseJson), null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div className="flex gap-2">
                  <a href={`/track/${selected.id}`} className="flex-1 px-3 py-2 bg-cyan-500/10 text-cyan-400 rounded-lg hover:bg-cyan-500/20 transition-all text-sm text-center font-medium">
                    View Full Result
                  </a>
                  <button onClick={() => handleRetry(selected.userInput)} className="px-3 py-2 bg-white/5 text-slate-300 rounded-lg hover:bg-white/10 transition-all text-sm font-medium">
                    Retry
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
