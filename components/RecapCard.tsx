"use client";

import { useRef } from "react";
import html2canvas from "html2canvas";
import type { Poi } from "@/lib/types";

export function RecapCard({
  origin,
  destination,
  stops,
  summary,
  staticMapUrl
}: {
  origin: string;
  destination: string;
  stops: Poi[];
  summary: string;
  staticMapUrl?: string;
}) {
  const cardRef = useRef<HTMLDivElement | null>(null);

  async function downloadPng() {
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, { backgroundColor: "#fff", scale: 2 });
    const link = document.createElement("a");
    link.download = "travelbah-recap.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  async function share() {
    if (navigator.share) {
      await navigator.share({ title: "TravelBah Recap", text: summary });
    }
  }

  return (
    <div>
      <div ref={cardRef} className="mx-auto max-w-2xl rounded-2xl bg-white p-5 shadow-card">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">TravelBah Memory Card</p>
        <h2 className="mt-1 text-2xl font-bold text-ink">{origin} → {destination}</h2>

        {staticMapUrl ? (
          <img src={staticMapUrl} alt="Route map" className="mt-3 h-52 w-full rounded-xl object-cover" />
        ) : (
          <div className="mt-3 h-52 rounded-xl bg-gradient-to-r from-ocean to-sunset" />
        )}

        <p className="mt-3 text-sm text-slate-700">{summary}</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {stops.slice(0, 6).map((s) => (
            <div key={s.id} className="rounded-lg border border-slate-200 p-2 text-sm">
              <p className="font-semibold">{s.name}</p>
              <p className="text-xs text-slate-600">{s.category}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-4 flex max-w-2xl gap-2">
        <button onClick={share} className="flex-1 rounded-lg bg-ocean px-4 py-2 font-semibold text-white">Share</button>
        <button onClick={downloadPng} className="flex-1 rounded-lg bg-sunset px-4 py-2 font-semibold text-white">Download PNG</button>
      </div>
    </div>
  );
}
