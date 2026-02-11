"use client";

import { useMemo, useState } from "react";
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
  const activeLangIndex = useMemo(() => languageOptions.indexOf(language), [language]);

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
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center px-4 py-8">
      <div className="rounded-2xl border border-border bg-card/90 p-6 shadow-card sm:p-8">
        <section className="mx-auto max-w-2xl text-center">
          <h1 className="text-[2.5rem] font-semibold leading-tight text-primary-dark">TravelBah</h1>
          <p className="mt-2 text-xl font-medium text-text-primary">Tawau Edition — AI-Guided Local Journey</p>
          <p className="mt-3 text-sm text-text-secondary">Tell us where you are and where you&apos;re heading — we&apos;ll handle the rest.</p>
        </section>

        <div className="mt-8 grid gap-4">
          <div>
            <label className="text-sm font-medium text-text-primary">{t.chooseLanguage}</label>
            <div className="relative mt-2 grid grid-cols-3 rounded-[14px] border border-border bg-transparent p-1">
              <span
                className="pointer-events-none absolute bottom-1 left-1 top-1 rounded-[10px] bg-accent transition-transform duration-300"
                style={{ width: "calc(33.333% - 0.34rem)", transform: `translateX(calc(${activeLangIndex * 100}% + ${activeLangIndex * 0.16}rem))` }}
              />
              {languageOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setLanguageAndLine(opt)}
                  className={`travelbah-lift relative z-10 rounded-[10px] border px-3 py-2 text-sm ${
                    language === opt ? "border-transparent text-white" : "border-border bg-transparent text-text-primary"
                  }`}
                >
                  {languageNames[opt]}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-text-secondary">{t.languageHint}</p>
          </div>

          <label className="text-sm font-medium text-text-primary">Where are you now?</label>
          <div className="flex gap-2">
            <input
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="flex-1 rounded-[14px] border border-border bg-card p-[14px] text-text-primary outline-none transition-shadow focus:border-primary focus:shadow-[0_0_0_4px_rgba(22,94,99,0.12)]"
            />
            <button type="button" onClick={useLocation} className="travelbah-lift rounded-[14px] border border-border bg-card px-4 text-lg" aria-label="Use current location">
              📍
            </button>
          </div>

          <label className="text-sm font-medium text-text-primary">Where do you want to go?</label>
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="rounded-[14px] border border-border bg-card p-[14px] text-text-primary outline-none transition-shadow focus:border-primary focus:shadow-[0_0_0_4px_rgba(22,94,99,0.12)]"
          />

          <div className="mt-1">
            <ModePicker value={mode} onChange={setMode} />
          </div>

          <button onClick={go} className="travelbah-lift mt-1 rounded-[18px] bg-primary px-5 py-4 text-base font-semibold text-white shadow-card hover:bg-primary-dark">
            Start My Journey →
          </button>

          <p className="rounded-2xl border border-border bg-bg px-4 py-3 text-sm text-text-secondary">
            {t.guidePrefix}: {line}
          </p>
        </div>
      </div>
    </main>
  );
}
