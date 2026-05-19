"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setWarnings([]);

    const trimmed = trackingNumber.trim();
    if (!trimmed) {
      setError("Please enter a container number or Bill of Lading number.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingNumber: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "An error occurred. Please try again.");
        setIsSubmitting(false);
        return;
      }

      if (data.warnings && data.warnings.length > 0) {
        setWarnings(data.warnings);
      }

      // Navigate to tracking result page
      router.push(`/track/${data.id}`);
    } catch {
      setError("Network error. Please check your connection and try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-between py-6 w-full">
      {/* Centered Adaptive Container */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12 w-full max-w-4xl">
        <div className="w-full max-w-2xl flex flex-col items-stretch gap-12 animate-fade-in">
          {/* Logo - Centered and High Up */}
          <div className="flex justify-center mb-2">
            <img src="/logo.png" alt="ITG Logo" className="h-32 sm:h-36 w-auto object-contain" />
          </div>

          {/* Title - ITG Tracker on the same line */}
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#0d131a] tracking-tight mb-6">
              ITG <span className="bg-gradient-to-r from-[#008361] to-[#00b090] bg-clip-text text-transparent">Tracker</span>
            </h1>
            <p className="text-lg text-slate-500 max-w-lg mx-auto leading-relaxed">
              Track your ocean freight shipments in real-time. Enter a container number or Bill of Lading to get started.
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSubmit} className="relative">
            <div className="glass-card p-2 animate-pulse-glow">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 relative">
                  <input
                    id="tracking-input"
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => {
                      setTrackingNumber(e.target.value);
                      setError(null);
                    }}
                    placeholder="Enter container number or Bill of Lading"
                    className="w-full pl-5 pr-4 py-4 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#00b090]/50 focus:ring-1 focus:ring-[#00b090]/30 transition-all text-base"
                    disabled={isSubmitting}
                    autoComplete="off"
                    spellCheck="false"
                    maxLength={50}
                  />
                </div>
                <button
                  id="submit-tracking"
                  type="submit"
                  disabled={isSubmitting || !trackingNumber.trim()}
                  className="px-8 py-4 bg-gradient-to-r from-[#008361] to-[#00b090] text-white font-semibold rounded-xl hover:from-[#00b090] hover:to-[#008361] disabled:opacity-40 disabled:cursor-not-allowed transition-all text-base shadow-lg shadow-[#008361]/25 hover:shadow-[#00b090]/35 flex items-center justify-center gap-2 min-w-[180px]"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      Track Shipment
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Auto-detection hint */}
            <p className="mt-3 text-center text-sm text-slate-400">
              Input type is auto-detected — Container (e.g. MSKU1234567) or Bill of Lading
            </p>
          </form>

          {/* Error */}
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-fade-in" id="error-message">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm animate-fade-in">
              {warnings.map((w, i) => (
                <p key={i} className="flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  {w}
                </p>
              ))}
            </div>
          )}

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
                title: "15+ Carriers",
                desc: "Coverage for all major ocean shipping lines",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                title: "Background Processing",
                desc: "Jobs are queued and processed asynchronously",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ),
                title: "Confidence Scoring",
                desc: "Transparent data source & confidence indicators",
              },
            ].map((f, i) => (
              <div key={i} className="glass-card glass-card-hover p-5 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#008361]/10 to-[#00b090]/10 text-[#00b090] mb-3">
                  {f.icon}
                </div>
                <h3 className="text-sm font-semibold text-slate-800 mb-1">{f.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Footer */}
      <footer className="py-6 border-t border-slate-100 w-full">
        <p className="text-center text-xs text-slate-400">
          ITG Tracker — © 2026 International Trading Group S.r.l. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
