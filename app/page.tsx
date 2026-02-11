"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ModePicker } from "@/components/ModePicker";
import { TravelMode } from "@/lib/types";
import { modeLabel } from "@/lib/prompt";

export default function LandingPage() {
  const router = useRouter();
  const [origin, setOrigin] = useState("Tawau Airport");
  const [destination, setDestination] = useState("Tawau Town");
  const [mode, setMode] = useState<TravelMode>("food");
  const [line, setLine] = useState("Tell me your start and destination, I will line up a local-friendly route.");

  function useLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;
      setOrigin(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
      setLine("Nice, got your live location. Pick a mode and go.");
    });
  }

  function go() {
    setLine(`Nice choice. ${modeLabel(mode)} mode, now generating your route...`);
    const params = new URLSearchParams({ origin, destination, mode });
    router.push(`/trip?${params.toString()}`);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-4 py-10">
      <div className="rounded-3xl bg-white/75 p-6 shadow-card sm:p-8">
        <p className="text-sm uppercase tracking-[0.18em] text-slate-500">TravelBah Investor Demo</p>
        <h1 className="mt-2 text-3xl font-bold text-ink">Tawau Smart Trip Planner</h1>

        <div className="mt-6 grid gap-3">
          <label className="text-sm font-medium">I&apos;m at</label>
          <div className="flex gap-2">
            <input value={origin} onChange={(e) => setOrigin(e.target.value)} className="flex-1 rounded-xl border border-slate-300 px-3 py-2" />
            <button type="button" onClick={useLocation} className="rounded-xl border border-ocean px-3 py-2 text-ocean">
              Locate
            </button>
          </div>

          <label className="mt-2 text-sm font-medium">I want to go</label>
          <input value={destination} onChange={(e) => setDestination(e.target.value)} className="rounded-xl border border-slate-300 px-3 py-2" />

          <div className="mt-2">
            <ModePicker value={mode} onChange={setMode} />
          </div>

          <button onClick={go} className="mt-2 rounded-xl bg-ocean px-4 py-3 font-semibold text-white">
            Go
          </button>

          <p className="rounded-lg bg-sand px-3 py-2 text-sm text-slate-700">Guide: {line}</p>
        </div>
      </div>
    </main>
  );
}
