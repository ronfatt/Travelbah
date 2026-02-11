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
  const [quickAsk, setQuickAsk] = useState("Where should I eat tonight in Tawau?");
  const [quickReply, setQuickReply] = useState("");
  const [ctaHovered, setCtaHovered] = useState(false);

  const t = uiText[language];
  const activeLangIndex = useMemo(() => languageOptions.indexOf(language), [language]);
  const modeHint =
    mode === "food"
      ? "We’ll line up 2–3 local stops along your route."
      : mode === "chill"
        ? "Scenic spots + relaxed pacing."
        : "Minimal stops, fastest route.";

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

  function askTravelBah() {
    const q = quickAsk.toLowerCase();
    if (q.includes("eat") || q.includes("food") || q.includes("dinner")) {
      setQuickReply("Tonight, try Sabindo area for seafood, then hop to a nearby kopi spot for dessert. Want halal-first options?");
      return;
    }
    if (q.includes("sunset") || q.includes("photo")) {
      setQuickReply("For sunset shots, check Waterfront Deck around 6:00-6:40 pm. I can route it into your trip.");
      return;
    }
    setQuickReply("Good one. Share your start and destination and I’ll shape a local-first route for you.");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center px-4 py-8">
      <div className="glass-card rounded-2xl p-6 shadow-card sm:p-8">
        <section className="mx-auto max-w-2xl text-center">
          <h1 className="text-[3rem] font-extrabold leading-[1.02] tracking-[0.01em] sm:text-[3.4rem]">
            <span className="title-gradient">TravelBah</span>
            <span className={`sparkle-dot ${ctaHovered ? "sparkle-dot--active" : ""}`} />
          </h1>
          <p className="mt-2 text-xl font-medium text-text-primary">Tawau Edition — AI Local Guide, Bah.</p>
          <p className="mt-2 text-sm text-text-secondary">Less tourist traps. More real stuff, bah.</p>
          <p className="mt-3 text-sm text-text-secondary">Tell us where you are and where you&apos;re heading — we&apos;ll handle the rest.</p>
        </section>

        <div className="mt-8 grid gap-4">
          <div>
            <label className="text-sm font-medium text-text-primary">{t.chooseLanguage}</label>
            <div className="relative mt-2 grid grid-cols-3 rounded-[14px] border border-border bg-transparent p-1">
              <span
                className="pointer-events-none absolute bottom-1 left-1 top-1 rounded-[10px] gradient-primary transition-transform duration-300"
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
              className="flex-1 rounded-[14px] border border-border bg-white/70 p-[14px] text-text-primary outline-none transition-shadow focus:border-primary focus:shadow-[0_0_0_4px_rgba(79,70,229,0.12)]"
            />
            <button type="button" onClick={useLocation} className="travelbah-lift rounded-[14px] border border-border bg-white/70 px-4 text-lg" aria-label="Use current location">
              📍
            </button>
          </div>

          <label className="text-sm font-medium text-text-primary">Where do you want to go?</label>
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="rounded-[14px] border border-border bg-white/70 p-[14px] text-text-primary outline-none transition-shadow focus:border-primary focus:shadow-[0_0_0_4px_rgba(79,70,229,0.12)]"
          />

          <div className="mt-1">
            <ModePicker value={mode} onChange={setMode} />
          </div>
          <p className="text-sm text-text-secondary">{modeHint}</p>

          <button
            onClick={go}
            onMouseEnter={() => setCtaHovered(true)}
            onMouseLeave={() => setCtaHovered(false)}
            onFocus={() => setCtaHovered(true)}
            onBlur={() => setCtaHovered(false)}
            className="travelbah-lift gradient-primary mt-1 rounded-full px-6 py-4 text-base font-semibold text-white"
          >
            👉 Plan My Route
          </button>
          <p className="text-sm text-text-secondary">🧠 Travel ah. learns your vibe as you explore.</p>

          <p className="glass-card rounded-2xl px-4 py-3 text-sm text-text-secondary">
            {t.guidePrefix}: {line}
          </p>
        </div>
      </div>

      <aside className="glass-card ask-fab fixed bottom-4 right-4 z-20 w-[320px] rounded-2xl p-4 shadow-card">
        <p className="text-sm font-semibold text-text-primary">💬 Ask TravelBah</p>
        <input
          value={quickAsk}
          onChange={(e) => setQuickAsk(e.target.value)}
          className="mt-2 w-full rounded-[14px] border border-border bg-white/70 p-[12px] text-sm text-text-primary outline-none transition-shadow focus:border-primary focus:shadow-[0_0_0_4px_rgba(79,70,229,0.12)]"
        />
        <button onClick={askTravelBah} className="travelbah-lift gradient-primary mt-2 w-full rounded-full px-3 py-2 text-sm font-semibold text-white">
          Ask
        </button>
        {quickReply ? <p className="mt-2 text-sm text-text-secondary">{quickReply}</p> : null}
      </aside>
    </main>
  );
}
