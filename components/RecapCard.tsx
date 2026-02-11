"use client";

import { useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import type { Poi, TravelMode } from "@/lib/types";

const foodMoodTags = [
  "☕ Strong Kopi + Butter Toast Fix",
  "🔥 Char-grilled Lunch Hit",
  "🥢 Evening Satay Energy",
  "🍤 Seafood Comfort Punch",
  "🥘 Local Flavor Power-up"
];

function seededIndex(seed: string, max: number) {
  const n = seed.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return n % max;
}

function stopRole(stop: Poi, idx: number) {
  if (stop.category === "food") {
    return foodMoodTags[(seededIndex(stop.id, foodMoodTags.length) + idx) % foodMoodTags.length];
  }
  if (stop.category === "spot") return "📸 Golden Hour Photo Pause";
  if (stop.category === "stay") return "🛏 Reset & Recharge Point";
  return "🎯 Local Fun Detour";
}

function moodLine(mode: TravelMode) {
  if (mode === "food") return "🍜 Food-first Adventure";
  if (mode === "chill") return "😌 Chill Route";
  return "⚡ Efficient Sprint";
}

function headlineFor(mode: TravelMode, stops: Poi[], surpriseCount: number) {
  const poolByMode: Record<TravelMode, string[]> = {
    food: [
      "Landed hungry. Left legendary.",
      "Runway in, flavor out.",
      "Checked in hungry. Checked out iconic."
    ],
    chill: [
      "Smooth miles. Slow bites.",
      "Easy route, real moments.",
      "Slow pace. Solid memories."
    ],
    efficient: [
      "Fast lane, full flavor.",
      "No detours. All payoff.",
      "Smart route. Zero wasted time."
    ]
  };
  const hook = surpriseCount > 0 ? "⚡ Surprise locked in." : "";
  const seed = stops.map((s) => s.id).join("|") + mode;
  const pick = poolByMode[mode][seededIndex(seed, poolByMode[mode].length)];
  return hook ? `${pick} ${hook}` : pick;
}

function aiSummaryByMode(mode: TravelMode, stopCount: number) {
  if (mode === "food") {
    return `You landed hungry, and left with ${stopCount} solid local flavors locked in.`;
  }
  if (mode === "chill") {
    return "Smooth ride, slow bites, no rush.";
  }
  return "Straight route, smart stops, zero wasted time.";
}

export function RecapCard({
  origin,
  destination,
  stops,
  summary,
  staticMapUrl,
  polyline,
  distanceKm,
  etaMinutes,
  surpriseCount,
  mode
}: {
  origin: string;
  destination: string;
  stops: Poi[];
  summary: string;
  staticMapUrl?: string;
  polyline: [number, number][];
  distanceKm?: number;
  etaMinutes?: number;
  surpriseCount?: number;
  mode: TravelMode;
}) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const storyRef = useRef<HTMLDivElement | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);

  const aiLine = useMemo(
    () => aiSummaryByMode(mode, stops.length),
    [mode, stops.length]
  );
  const headline = useMemo(() => headlineFor(mode, stops, surpriseCount ?? 0), [mode, stops, surpriseCount]);

  async function captureAndDownload(ref: HTMLDivElement | null, fileName: string) {
    if (!ref) return;
    const canvas = await html2canvas(ref, { backgroundColor: null, scale: 2 });
    const link = document.createElement("a");
    link.download = fileName;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  async function downloadPng() {
    await captureAndDownload(cardRef.current, "travelbah-journey-story.png");
  }

  async function downloadStoryPng() {
    await captureAndDownload(storyRef.current, "travelbah-story-9x16.png");
  }

  async function shareNative() {
    if (navigator.share) {
      await navigator.share({ title: "TravelBah Journey Story", text: aiLine, url: window.location.href });
      return;
    }
    setShowShareMenu((v) => !v);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
  }

  const routePreview = useMemo(() => {
    // Build a lightweight local SVG route preview so map never disappears.
    // Prefer full polyline; if missing, fall back to stop coordinates.
    const points = polyline.length > 1 ? polyline : stops.map((s) => [s.lng, s.lat] as [number, number]);
    const all = points.length ? points : [];
    if (!all.length) return null;
    const lngs = all.map((p) => p[0]);
    const lats = all.map((p) => p[1]);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const w = 900;
    const h = 400;
    const pad = 32;
    const toXY = ([lng, lat]: [number, number]) => {
      const x = pad + ((lng - minLng) / Math.max(0.0001, maxLng - minLng)) * (w - pad * 2);
      const y = pad + (1 - (lat - minLat) / Math.max(0.0001, maxLat - minLat)) * (h - pad * 2);
      return [x, y] as [number, number];
    };
    const xy = all.map(toXY);
    const path = xy.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
    return { xy, path, w, h };
  }, [polyline]);

  return (
    <div>
      <div className="mx-auto w-full max-w-[440px] rounded-[28px] bg-gradient-to-br from-[#4f46e5] via-[#6366f1] to-[#14b8a6] p-[2px] shadow-card">
        <div ref={cardRef} className="rounded-[26px] bg-white/92 p-4 backdrop-blur-[14px]">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#4f46e5] via-[#6366f1] to-[#3b82f6] p-3">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.35)_0%,rgba(0,0,0,0.15)_40%,rgba(0,0,0,0)_100%)]" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/85">TravelBah Journey Story</p>
                <h2 className="mt-1 text-[1.5rem] font-extrabold leading-tight text-[#F8FAFF] [text-shadow:0_2px_12px_rgba(0,0,0,0.25)]">{headline}</h2>
                <p className="mt-1 inline-flex rounded-full bg-white/15 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-[8px]">
                  {moodLine(mode)}
                </p>
                <p className="mt-1 inline-flex rounded-full bg-white/15 px-2 py-1 text-xs text-white/90 backdrop-blur-[8px]">
                  {origin} → {destination} · {stops.length} stops · {surpriseCount ?? 0} surprise
                </p>
              </div>
              <span className="rounded-full border border-white/40 bg-white/20 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-[8px]">TravelBah · Tawau Edition</span>
            </div>
          </div>

          <div className="relative mt-3 overflow-hidden rounded-2xl">
            {staticMapUrl && !mapFailed ? (
              <img src={staticMapUrl} alt="Route map" className="h-40 w-full object-cover" onError={() => setMapFailed(true)} />
            ) : (
              <div className="h-40 bg-gradient-to-r from-[#4f46e5] via-[#6366f1] to-[#14b8a6]">
                {routePreview ? (
                  <svg viewBox={`0 0 ${routePreview.w} ${routePreview.h}`} className="h-full w-full opacity-90">
                    <defs>
                      <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#4F46E5" />
                        <stop offset="55%" stopColor="#6366F1" />
                        <stop offset="100%" stopColor="#14B8A6" />
                      </linearGradient>
                    </defs>
                    <path d={routePreview.path} stroke="#ffffff" strokeWidth="10" strokeOpacity="0.45" fill="none" />
                    <path d={routePreview.path} stroke="url(#routeGrad)" strokeWidth="5.5" fill="none" />
                    {stops.slice(0, 6).map((s, idx) => {
                      const p =
                        routePreview.xy[
                          Math.max(
                            0,
                            Math.min(routePreview.xy.length - 1, Math.round(((idx + 1) / (stops.length + 1)) * routePreview.xy.length))
                          )
                        ];
                      if (!p) return null;
                      return (
                      <g key={`pt-${idx}`}>
                        <circle cx={p[0]} cy={p[1]} r="12" fill="#ffffff" fillOpacity="0.9" />
                        <circle cx={p[0]} cy={p[1]} r="9.5" fill="#14B8A6" />
                        <text x={p[0]} y={p[1] + 3} textAnchor="middle" fontSize="10" fill="#fff" fontWeight="700">
                          {idx + 1}
                        </text>
                      </g>
                      );
                    })}
                  </svg>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs font-semibold text-white/85">Route preview unavailable</div>
                )}
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0f172a]/52 via-[#0f172a]/12 to-transparent" />
            <span className="absolute left-2 top-2 rounded-full bg-white/80 px-2 py-1 text-[10px] font-semibold text-[#4f46e5]">AI-curated route</span>
            <p className="absolute left-3 top-9 text-[10px] font-medium text-white/90 [text-shadow:0_1px_6px_rgba(0,0,0,0.5)]">TravelBah watermark</p>
            <p className="absolute bottom-2 right-3 text-[10px] font-medium text-white/90 [text-shadow:0_1px_6px_rgba(0,0,0,0.5)]">TravelBah · Tawau Edition</p>
          </div>

          <div className="mt-3 rounded-xl border border-border bg-white/80 p-2 text-xs text-text-primary">
            <p className="font-semibold">AI Summary</p>
            <p className="mt-1 text-text-secondary">{aiLine}</p>
          </div>

          <div className="mt-2 grid grid-cols-4 gap-1.5 text-[11px]">
            <div className="rounded-xl border border-border bg-white/85 p-1.5 text-center">
              <p>🛣</p>
              <p className="font-semibold">{distanceKm ?? 0} km</p>
            </div>
            <div className="rounded-xl border border-border bg-white/85 p-1.5 text-center">
              <p>⏱</p>
              <p className="font-semibold">{etaMinutes ?? 0} mins</p>
            </div>
            <div className="rounded-xl border border-border bg-white/85 p-1.5 text-center">
              <p>🍜</p>
              <p className="font-semibold">{stops.length} stops</p>
            </div>
            <div className="rounded-xl border border-border bg-white/85 p-1.5 text-center">
              <p>⚡</p>
              <p className="font-semibold">{surpriseCount ?? 0}</p>
            </div>
          </div>

          <div className="mt-2 grid gap-1.5">
            {stops.map((s, idx) => (
              <div key={s.id} className="rounded-xl border border-border bg-white/85 px-2 py-1.5 text-xs">
                <p className="font-semibold text-text-primary">
                  {idx + 1}️⃣ {s.name}
                </p>
                <p className="text-text-secondary">{stopRole(s, idx)}</p>
              </div>
            ))}
          </div>

          <div className="mt-2 border-t border-border/60 pt-2 text-center text-[10px] text-text-secondary">
            AI Local Guide · TravelBah
            <br />
            travelbah.app
          </div>
        </div>
      </div>

      <div className="mx-auto mt-4 flex w-full max-w-[440px] gap-2">
        <button onClick={shareNative} className="travelbah-lift gradient-primary flex-1 rounded-full px-4 py-2 font-semibold text-white">
          Share
        </button>
        <button onClick={downloadPng} className="travelbah-lift rounded-full border border-border bg-white/80 px-4 py-2 font-semibold text-text-primary">
          Download PNG
        </button>
      </div>

      {showShareMenu ? (
        <div className="mx-auto mt-3 grid w-full max-w-[440px] grid-cols-2 gap-2 rounded-2xl border border-border bg-white/85 p-3 text-sm">
          <button className="travelbah-lift rounded-xl border border-border px-2 py-2" onClick={downloadStoryPng}>📱 Instagram Story</button>
          <button className="travelbah-lift rounded-xl border border-border px-2 py-2" onClick={downloadPng}>📷 Instagram Post</button>
          <button
            className="travelbah-lift rounded-xl border border-border px-2 py-2"
            onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`TravelBah Journey Story\n${window.location.href}`)}`, "_blank")}
          >
            💬 WhatsApp
          </button>
          <button className="travelbah-lift rounded-xl border border-border px-2 py-2" onClick={copyLink}>🔗 Copy Link</button>
        </div>
      ) : null}

      <div className="pointer-events-none absolute -left-[9999px] top-0">
        <div ref={storyRef} className="h-[640px] w-[360px] overflow-hidden rounded-[24px] bg-gradient-to-b from-[#eef2ff] to-white p-4">
          <h3 className="text-sm uppercase tracking-[0.18em] text-text-secondary">TravelBah Journey Story</h3>
          <p className="mt-2 text-2xl font-extrabold text-text-primary">{headline}</p>
          <p className="mt-2 text-sm text-[#4f46e5]">{moodLine(mode)}</p>
          <div className="mt-3 overflow-hidden rounded-2xl">
            {staticMapUrl ? <img src={staticMapUrl} alt="Story map" className="h-52 w-full object-cover" /> : <div className="h-52 bg-gradient-to-r from-[#4f46e5] to-[#14b8a6]" />}
          </div>
          <p className="mt-3 text-sm text-text-secondary">{aiLine}</p>
          <div className="mt-4 text-xs text-text-secondary">AI Local Guide · TravelBah · travelbah.app</div>
        </div>
      </div>
    </div>
  );
}
