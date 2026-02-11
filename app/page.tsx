"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ModePicker } from "@/components/ModePicker";
import { normalizeLanguage, languageNames, uiText, fillTemplate } from "@/lib/i18n";
import { TravelLanguage, TravelMode } from "@/lib/types";
import { modeLabel } from "@/lib/prompt";

const languageOptions: TravelLanguage[] = ["en", "zh", "ms"];
const upcomingModules = [
  {
    emoji: "📸",
    title: "景点",
    desc: "Scenic and photo-friendly spots",
    status: "Coming soon · 还没开放"
  },
  {
    emoji: "🏨",
    title: "Stay",
    desc: "Smart stay picks near your route",
    status: "Coming soon · 还没开放"
  },
  {
    emoji: "🚌",
    title: "Transport",
    desc: "Live transfer and ride suggestions",
    status: "Coming soon · 还没开放"
  }
];

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
  const liveExample =
    mode === "food"
      ? "Airport -> Town · 3 food stops · 1 surprise"
      : mode === "chill"
        ? "Airport -> Town · 2 scenic stops · 1 coffee break"
        : "Airport -> Town · 2 quick stops · fastest route";

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
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center bg-[#f4f6fa] px-4 py-8">
      <div className="mx-auto w-full max-w-5xl rounded-[24px] border border-white bg-white/92 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.06)] sm:p-7">
        <section className="mx-auto max-w-3xl text-center">
          <h1 className="text-[3.45rem] font-extrabold leading-[1.01] tracking-[0.035em] sm:text-[3.9rem]">
            <span className="title-gradient">TravelBah</span>
            <span className={`sparkle-dot ${ctaHovered ? "sparkle-dot--active" : ""}`} />
          </h1>
          <p className="mt-2 text-lg font-medium text-text-primary">Tawau Edition — AI Local Guide, Bah.</p>
          <p className="mt-2 text-sm text-text-secondary">Less tourist traps. More real stuff, bah.</p>
          <p className="mt-3 text-sm text-text-secondary">Tell us where you are and where you&apos;re heading — we&apos;ll handle the rest.</p>
        </section>

        <div className="mt-8 grid gap-4">
          <section className="rounded-2xl border border-[#e7eaf7] bg-gradient-to-r from-[#4f46e5] to-[#14b8a6] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_12px_26px_rgba(79,70,229,0.2)]">
            <p className="relative z-10 text-sm font-semibold text-white/95">🧠 Optimizing local routes in Tawau...</p>
            <p className="relative z-10 mt-2 text-xs text-white/85">Live engine preview: route scoring + stop matching + surprise trigger.</p>
            <span className="ai-flow-line ai-flow-line--a" />
            <span className="ai-flow-line ai-flow-line--b" />
            <span className="ai-flow-line ai-flow-line--c" />
          </section>

          <section className="rounded-2xl border border-[#e7eaf7] bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
            <p className="mb-3 text-sm font-semibold text-text-primary">Drop two points. I&apos;ll do the rest.</p>
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
            <label className="mt-3 block text-sm font-medium text-text-primary">Where are you now?</label>
            <div className="mt-1 flex gap-2">
              <input
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="flex-1 rounded-[14px] border border-border bg-white p-[14px] text-text-primary outline-none transition-shadow focus:border-primary focus:shadow-[0_0_0_4px_rgba(79,70,229,0.12)]"
              />
              <button type="button" onClick={useLocation} className="travelbah-lift rounded-[14px] border border-border bg-white px-4 text-lg" aria-label="Use current location">
                📍
              </button>
            </div>

            <label className="mt-3 block text-sm font-medium text-text-primary">Where do you want to go?</label>
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="mt-1 w-full rounded-[14px] border border-border bg-white p-[14px] text-text-primary outline-none transition-shadow focus:border-primary focus:shadow-[0_0_0_4px_rgba(79,70,229,0.12)]"
            />
          </section>

          <section className="rounded-2xl border border-[#e7eaf7] bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
            <p className="mb-2 text-sm font-semibold text-text-primary">Mode Selection</p>
            <ModePicker value={mode} onChange={setMode} />
            <p className="mt-2 text-sm text-text-secondary">{modeHint}</p>
          </section>

          <section className="rounded-2xl border border-[#e7eaf7] bg-[#f9fbff] p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
            <p className="mb-2 text-sm font-semibold text-text-primary">Expansion Modules</p>
            <div className="grid gap-2 sm:grid-cols-3">
            {upcomingModules.map((item) => (
              <div key={item.title} className="rounded-2xl border border-dashed border-border bg-white/60 px-4 py-3 opacity-80">
                <p className="font-semibold text-text-primary">
                  {item.emoji} {item.title}
                </p>
                <p className="text-xs text-text-secondary">{item.desc}</p>
                <span className="mt-1 inline-block rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-medium text-text-secondary">
                  {item.status}
                </span>
              </div>
            ))}
            </div>
          </section>

          <section className="rounded-2xl border border-[#e7eaf7] bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
            <p className="text-xs uppercase tracking-[0.12em] text-text-secondary">Live Generated Example</p>
            <p className="mt-1 text-sm font-semibold text-text-primary">{liveExample}</p>
            <p className="mt-1 text-xs text-text-secondary">This preview updates by mode before you start the full trip.</p>

            <button
              onClick={go}
              onMouseEnter={() => setCtaHovered(true)}
              onMouseLeave={() => setCtaHovered(false)}
              onFocus={() => setCtaHovered(true)}
              onBlur={() => setCtaHovered(false)}
              className="travelbah-lift gradient-primary gradient-primary-flow mt-4 w-full rounded-full px-6 py-4 text-base font-semibold text-white"
            >
              👉 Plan My Route
            </button>
            <p className="mt-2 text-sm text-text-secondary">🧠 Travel ah. learns your vibe as you explore.</p>

            <p className="glass-card mt-3 rounded-2xl px-4 py-3 text-sm text-text-secondary">
              {t.guidePrefix}: {line}
            </p>
          </section>
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
