"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

interface TrackingData {
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
    portOfLoading: string | null;
    portOfDischarge: string | null;
    etd: string | null;
    eta: string | null;
    currentStatus: string | null;
    lastEventLocation: string | null;
    lastEventDate: string | null;
    sourceType: string;
    sourceUrl: string | null;
    confidenceScore: number | null;
    createdAt: string;
  } | null;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    queued: { bg: "bg-slate-500/10", text: "text-slate-400", dot: "bg-slate-400", label: "Queued" },
    processing: { bg: "bg-cyan-500/10", text: "text-cyan-400", dot: "bg-cyan-400 animate-pulse", label: "Processing" },
    completed: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400", label: "Completed" },
    failed: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400", label: "Failed" },
    needs_manual_review: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400", label: "Needs Review" },
  };
  const c = config[status] || config.queued;
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className={`w-2 h-2 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

function SourceTypeBadge({ sourceType }: { sourceType: string }) {
  const labels: Record<string, { label: string; color: string }> = {
    official_api: { label: "Official API", color: "text-emerald-400 bg-emerald-500/10" },
    official_tracking_page: { label: "Official Tracking Page", color: "text-blue-400 bg-blue-500/10" },
    third_party_api: { label: "Third-Party API", color: "text-purple-400 bg-purple-500/10" },
    manual_review: { label: "Manual Review", color: "text-amber-400 bg-amber-500/10" },
    mock_data: { label: "⚠ Mock Data", color: "text-orange-400 bg-orange-500/10" },
  };
  const cfg = labels[sourceType] || { label: sourceType, color: "text-slate-400 bg-slate-500/10" };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function ConfidenceBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 80 ? "from-emerald-500 to-emerald-400" : pct >= 50 ? "from-amber-500 to-amber-400" : "from-red-500 to-red-400";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-1000`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-semibold text-white tabular-nums">{pct}%</span>
    </div>
  );
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TrackingResultPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pollError, setPollError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/track/${id}`);
      if (!res.ok) {
        setPollError("Failed to load tracking data.");
        return;
      }
      const json = await res.json();
      setData(json);
      setPollError(null);
    } catch {
      setPollError("Network error. Retrying...");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      if (data && (data.status === "completed" || data.status === "failed" || data.status === "needs_manual_review")) {
        return;
      }
      fetchData();
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchData, data]);

  async function handleRetry() {
    setRetrying(true);
    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingNumber: data?.userInput }),
      });
      const json = await res.json();
      if (res.ok) {
        window.location.href = `/track/${json.id}`;
      }
    } catch {
      // ignore
    } finally {
      setRetrying(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center animate-pulse">
            <svg className="w-8 h-8 text-cyan-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <p className="text-slate-400 text-sm">Loading tracking data...</p>
        </div>
      </div>
    );
  }

  if (pollError && !data) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="glass-card p-8 max-w-md text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-400 mb-4">{pollError}</p>
          <a href="/" className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 text-slate-300 rounded-lg hover:bg-white/10 transition-all text-sm">
            ← Back to Search
          </a>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const isProcessing = data.status === "queued" || data.status === "processing";
  const result = data.result;

  return (
    <div className="w-full flex justify-center py-6 sm:py-10">
      <div className="w-full max-w-4xl px-4 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <a href="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-300 transition-colors mb-3">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Search
          </a>
          <h1 className="text-2xl font-bold text-white">Tracking: {data.userInput}</h1>
          <p className="text-sm text-slate-400 mt-1">
            {data.inputType === "container" ? "Container Number" : data.inputType === "bill_of_lading" ? "Bill of Lading" : "Unknown Type"}
            {" · "}Created {formatDate(data.createdAt)}
          </p>
        </div>
        <StatusBadge status={data.status} />
      </div>

      {/* Processing State */}
      {isProcessing && (
        <div className="glass-card p-8 text-center mb-8 animate-pulse-glow">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-cyan-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Processing Your Request</h2>
          <p className="text-sm text-slate-400">
            {data.detectedCarrier
              ? `Detected carrier: ${data.detectedCarrier}. Fetching tracking data...`
              : "Identifying carrier and fetching tracking data..."}
          </p>
          <div className="mt-4 h-1 bg-slate-800 rounded-full overflow-hidden max-w-xs mx-auto">
            <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full animate-shimmer" style={{ width: "60%" }} />
          </div>
        </div>
      )}

      {/* Error State / External Portal */}
      {data.status === "failed" && (
        <div className={`glass-card p-6 mb-8 ${data.errorReason?.includes("Live tracking is not yet") ? "border-cyan-500/20" : "border-red-500/20"}`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${data.errorReason?.includes("Live tracking is not yet") ? "bg-cyan-500/10" : "bg-red-500/10"}`}>
              {data.errorReason?.includes("Live tracking is not yet") ? (
                <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">
                {data.errorReason?.includes("Live tracking is not yet") ? "External Tracking Portal" : "Tracking Failed"}
              </h3>
              <p className="text-sm text-slate-400 mb-3">{data.errorReason || "An unknown error occurred."}</p>
              {data.detectedCarrier && (
                <p className="text-xs text-slate-500 mb-3">Attempted carrier: {data.detectedCarrier}</p>
              )}
              <div className="flex gap-2 flex-wrap">
                <button onClick={handleRetry} disabled={retrying} className="px-4 py-2 bg-cyan-500/10 text-cyan-400 rounded-lg hover:bg-cyan-500/20 transition-all text-sm font-medium disabled:opacity-50">
                  {retrying ? "Retrying..." : "Retry Tracking"}
                </button>
                {result?.sourceUrl && (
                  <a href={result.sourceUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-white/5 text-slate-300 rounded-lg hover:bg-white/10 transition-all text-sm font-medium">
                    Open Official Tracking Page ↗
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Needs Review State */}
      {data.status === "needs_manual_review" && (
        <div className="glass-card p-6 mb-8 border-amber-500/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">Manual Review Required</h3>
              <p className="text-sm text-slate-400 mb-3">{data.errorReason || "The carrier could not be reliably identified."}</p>
              <button onClick={handleRetry} disabled={retrying} className="px-4 py-2 bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500/20 transition-all text-sm font-medium disabled:opacity-50">
                {retrying ? "Retrying..." : "Retry Tracking"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result Cards */}
      {result && data.status === "completed" && (
        <div className="space-y-4">
          {/* Mock data warning */}
          {result.sourceType === "mock_data" && (
            <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm flex items-start gap-3">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <p className="font-semibold">Mock Data</p>
                <p className="text-orange-400/70 mt-0.5">This result contains simulated data for demonstration purposes. It does not represent a real shipment.</p>
              </div>
            </div>
          )}

          {/* Carrier & Status Card */}
          <div className="glass-card p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Carrier</p>
                <h2 className="text-xl font-bold text-white">{result.carrierName}</h2>
              </div>
              <div className="flex items-center gap-3">
                <SourceTypeBadge sourceType={result.sourceType} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {result.containerNumber && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Container Number</p>
                  <p className="text-sm font-mono font-semibold text-white">{result.containerNumber}</p>
                </div>
              )}
              {result.billOfLadingNumber && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Bill of Lading</p>
                  <p className="text-sm font-mono font-semibold text-white">{result.billOfLadingNumber}</p>
                </div>
              )}
              {result.currentStatus && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-slate-500 mb-1">Current Status</p>
                  <p className="text-sm font-semibold text-cyan-400">{result.currentStatus}</p>
                </div>
              )}
            </div>
          </div>

          {/* Vessel Card */}
          {result.vesselName && (
            <div className="glass-card p-6">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Vessel</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15l2-2 4 4 4-4 4 4 4-4 2 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">{result.vesselName}</h3>
              </div>
            </div>
          )}

          {/* Route Card */}
          {(result.portOfLoading || result.portOfDischarge) && (
            <div className="glass-card p-6">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-4">Route</p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                {/* Port of Loading */}
                <div className="flex-1 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                  <p className="text-xs text-emerald-400/70 mb-1">Port of Loading</p>
                  <p className="text-sm font-semibold text-white">{result.portOfLoading || "—"}</p>
                  {result.etd && (
                    <p className="text-xs text-slate-500 mt-1">ETD: {formatDate(result.etd)}</p>
                  )}
                </div>

                {/* Arrow */}
                <div className="hidden sm:flex items-center justify-center px-2">
                  <div className="flex items-center gap-1 text-slate-600">
                    <div className="w-8 h-px bg-slate-700" />
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                {/* Port of Discharge */}
                <div className="flex-1 p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
                  <p className="text-xs text-cyan-400/70 mb-1">Port of Discharge</p>
                  <p className="text-sm font-semibold text-white">{result.portOfDischarge || "—"}</p>
                  {result.eta && (
                    <p className="text-xs text-slate-500 mt-1">ETA: {formatDate(result.eta)}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Timeline Card */}
          {result.lastEventLocation && (
            <div className="glass-card p-6">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-4">Latest Event</p>
              <div className="flex items-start gap-4">
                <div className="w-3 h-3 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0 shadow-lg shadow-cyan-400/30" />
                <div>
                  <p className="text-sm font-semibold text-white">{result.lastEventLocation}</p>
                  {result.lastEventDate && (
                    <p className="text-xs text-slate-500 mt-0.5">{formatDate(result.lastEventDate)}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Confidence Card */}
          <div className="glass-card p-6">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-4">Data Confidence</p>
            <div className="space-y-3">
              {data.carrierConfidenceScore != null && (
                <div>
                  <p className="text-xs text-slate-400 mb-1.5">Carrier Identification</p>
                  <ConfidenceBar score={data.carrierConfidenceScore} />
                </div>
              )}
              {result.confidenceScore != null && (
                <div>
                  <p className="text-xs text-slate-400 mb-1.5">Tracking Data</p>
                  <ConfidenceBar score={result.confidenceScore} />
                </div>
              )}
            </div>
          </div>

          {/* Source & Actions */}
          <div className="glass-card p-6">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-4">Source</p>
            {result.sourceUrl && (
              <p className="text-sm text-slate-400 mb-4 break-all font-mono text-xs">{result.sourceUrl}</p>
            )}
            <div className="flex gap-2 flex-wrap">
              {result.sourceUrl && (
                <a href={result.sourceUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-400 hover:to-blue-500 transition-all text-sm font-medium shadow-lg shadow-cyan-500/20">
                  Open Official Tracking Page ↗
                </a>
              )}
              <button onClick={handleRetry} disabled={retrying} className="px-4 py-2 bg-white/5 text-slate-300 rounded-lg hover:bg-white/10 transition-all text-sm font-medium disabled:opacity-50">
                {retrying ? "Retrying..." : "Retry Tracking"}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
