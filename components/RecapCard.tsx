"use client";

import { useMemo, useRef } from "react";
import html2canvas from "html2canvas";
import type { Poi } from "@/lib/types";

function stopRole(stop: Poi, idx: number) {
  if (stop.category === "food") {
    const tags = [
      "☕ Kopi & Toast Stop",
      "🔥 Grilled Lunch Spot",
      "🥢 Evening Satay Break",
      "🍤 Seafood Comfort Stop",
      "🥘 Local Flavor Fix"
    ];
    return tags[idx % tags.length];
  }
  if (stop.category === "spot") return "📸 Scenic Photo Pause";
  if (stop.category === "stay") return "🛏 Rest & Recharge Point";
  return "🎯 Local Fun Detour";
}

export function RecapCard({
  origin,
  destination,
  stops,
  summary,
  staticMapUrl,
  distanceKm,
  etaMinutes,
  surpriseCount
}: {
  origin: string;
  destination: string;
  stops: Poi[];
  summary: string;
  staticMapUrl?: string;
  distanceKm?: number;
  etaMinutes?: number;
  surpriseCount?: number;
}) {
  const cardRef = useRef<HTMLDivElement | null>(null);

  const aiLine = useMemo(
    () =>
      `You landed hungry, and left with ${stops.length} solid local flavors locked in. Classic Tawau move, bah.`,
    [stops.length]
  );

  async function downloadPng() {
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, { backgroundColor: null, scale: 2 });
    const link = document.createElement("a");
    link.download = "travelbah-journey-story.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  async function share() {
    if (navigator.share) {
      await navigator.share({ title: "TravelBah Journey Story", text: aiLine });
    }
  }

  return (
    <div>
      <div className="mx-auto w-full max-w-[440px] rounded-[28px] bg-gradient-to-br from-[#4f46e5] via-[#6366f1] to-[#14b8a6] p-[2px] shadow-card">
        <div ref={cardRef} className="aspect-[4/5] overflow-hidden rounded-[26px] bg-white/92 p-4 backdrop-blur-[14px]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-text-secondary">TravelBah Journey Story</p>
              <h2 className="mt-1 text-[1.5rem] font-extrabold leading-tight text-text-primary">From runway to real flavors.</h2>
              <p className="mt-1 text-xs text-text-secondary">
                {origin} → {destination}
                <br />
                {stops.length} local stops · {surpriseCount ?? 0} surprise
              </p>
            </div>
            <span className="rounded-full border border-white/80 bg-white/70 px-2 py-1 text-[10px] font-semibold text-[#4f46e5]">TravelBah · Tawau Edition</span>
          </div>

          <div className="relative mt-3 overflow-hidden rounded-2xl">
            {staticMapUrl ? (
              <img src={staticMapUrl} alt="Route map" className="h-40 w-full object-cover" />
            ) : (
              <div className="h-40 bg-gradient-to-r from-[#4f46e5] via-[#6366f1] to-[#14b8a6]" />
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0f172a]/45 via-transparent to-transparent" />
            <p className="absolute bottom-2 right-3 text-[10px] font-medium text-white/90">TravelBah · Tawau Edition</p>
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
            {stops.slice(0, 4).map((s, idx) => (
              <div key={s.id} className="rounded-xl border border-border bg-white/85 px-2 py-1.5 text-xs">
                <p className="font-semibold text-text-primary">
                  {idx + 1}️⃣ {s.name}
                </p>
                <p className="text-text-secondary">{stopRole(s, idx)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-4 flex w-full max-w-[440px] gap-2">
        <button onClick={share} className="travelbah-lift gradient-primary flex-1 rounded-full px-4 py-2 font-semibold text-white">
          Share
        </button>
        <button onClick={downloadPng} className="travelbah-lift rounded-full border border-border bg-white/80 px-4 py-2 font-semibold text-text-primary">
          Download PNG
        </button>
      </div>
    </div>
  );
}
