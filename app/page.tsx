"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ModePicker } from "@/components/ModePicker";
import { normalizeLanguage, languageNames, uiText, fillTemplate } from "@/lib/i18n";
import { TravelLanguage, TravelMode } from "@/lib/types";
import { modeLabel } from "@/lib/prompt";

const languageOptions: TravelLanguage[] = ["en", "zh", "ms"];

export default function LandingPage() {
  const router = useRouter();
  const [origin, setOrigin] = useState("Tawau Airport");
  const [destination, setDestination] = useState("Tawau Town");
  const [mode, setMode] = useState<TravelMode>("food");
  const [language, setLanguage] = useState<TravelLanguage>("en");
  const [line, setLine] = useState<string>(uiText.en.defaultLandingGuide);

  const t = uiText[language];

  function setLanguageAndLine(next: TravelLanguage) {
    const safe = normalizeLanguage(next);
    setLanguage(safe);
    setLine(uiText[safe].defaultLandingGuide);
  }

  function useLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;
      setOrigin(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
      setLine(t.locationCaptured);
    });
  }

  function go() {
    setLine(fillTemplate(t.generatingRoute, { mode: modeLabel(mode, language) }));
    const params = new URLSearchParams({ origin, destination, mode, language });
    router.push(`/trip?${params.toString()}`);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-4 py-10">
      <div className="rounded-3xl bg-white/75 p-6 shadow-card sm:p-8">
        <p className="text-sm uppercase tracking-[0.18em] text-slate-500">TravelBah Investor Demo</p>
        <h1 className="mt-2 text-3xl font-bold text-ink">Tawau Smart Trip Planner</h1>

        <div className="mt-6 grid gap-3">
          <div>
            <label className="text-sm font-medium">{t.chooseLanguage}</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {languageOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setLanguageAndLine(opt)}
                  className={`rounded-full border px-3 py-1 text-sm ${
                    language === opt ? "border-ocean bg-ocean text-white" : "border-slate-300 bg-white"
                  }`}
                >
                  {languageNames[opt]}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-slate-600">{t.languageHint}</p>
          </div>

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

          <p className="rounded-lg bg-sand px-3 py-2 text-sm text-slate-700">{t.guidePrefix}: {line}</p>
        </div>
      </div>
    </main>
  );
}
