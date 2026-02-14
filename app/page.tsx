"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ModePicker } from "@/components/ModePicker";
import { normalizeLanguage, languageNames, uiText, fillTemplate } from "@/lib/i18n";
import { TravelLanguage, TravelMode } from "@/lib/types";
import { modeLabel } from "@/lib/prompt";

const languageOptions: TravelLanguage[] = ["en", "zh", "ms"];

const homeCopy: Record<
  TravelLanguage,
  {
    subtitle: string;
    tagline1: string;
    tagline2: string;
    engineBadge: string;
    engineSub: string;
    exampleA: string;
    exampleBFood: string;
    exampleBChill: string;
    exampleBEfficient: string;
    exampleC: string;
    inputTitle: string;
    whereNow: string;
    whereGo: string;
    modeTitle: string;
    modeSubFood: string;
    modeSubChill: string;
    modeSubEfficient: string;
    expansionTitle: string;
    expansionSub: string;
    scenic: string;
    stay: string;
    transport: string;
    cta: string;
    footer: string;
  }
> = {
  en: {
    subtitle: "Tawau Edition — AI Local Guide, Bah.",
    tagline1: "Fewer tourist traps. More local insights.",
    tagline2: "Drop your start and end — I'll do the rest.",
    engineBadge: "🧠 TravelBah is optimizing local routes in Tawau...",
    engineSub: "Live engine preview: route scoring + stop matching + surprise trigger",
    exampleA: "📍 Airport → Town",
    exampleBFood: "🍜 3 recommended stops • ⚡ 1 surprise",
    exampleBChill: "😌 2 scenic stops • ☕ 1 break",
    exampleBEfficient: "⚡ 2 quick stops • minimal detour",
    exampleC: "⏱ Estimated ~18 mins",
    inputTitle: "Drop two points. I'll do the rest.",
    whereNow: "Where are you now?",
    whereGo: "Where do you want to go?",
    modeTitle: "Mode Selection",
    modeSubFood: "We'll line up 2–3 recommended local stops along your route.",
    modeSubChill: "Scenic spots + relaxed pacing.",
    modeSubEfficient: "Minimal stops, fastest route.",
    expansionTitle: "Expansion Modules",
    expansionSub: "Coming soon — useful suggestions as you travel",
    scenic: "Scenic",
    stay: "Stay",
    transport: "Transport",
    cta: "✨ See My Smart Route",
    footer: "TravelBah · AI Local Guide · Tawau Edition"
  },
  zh: {
    subtitle: "斗湖版 — AI 本地向导，Bah。",
    tagline1: "少踩游客雷，多看本地门道。",
    tagline2: "给我起点和终点，其他交给我。",
    engineBadge: "🧠 TravelBah 正在优化斗湖本地路线...",
    engineSub: "实时引擎预览：路线评分 + 停靠匹配 + 惊喜触发",
    exampleA: "📍 机场 → 市区",
    exampleBFood: "🍜 3 个推荐停靠 • ⚡ 1 个惊喜",
    exampleBChill: "😌 2 个景观点 • ☕ 1 次休息",
    exampleBEfficient: "⚡ 2 个快速停靠 • 最少绕路",
    exampleC: "⏱ 预计约 18 分钟",
    inputTitle: "给我两个点，剩下我来安排。",
    whereNow: "你现在在哪里？",
    whereGo: "你要去哪里？",
    modeTitle: "模式选择",
    modeSubFood: "我们会沿线安排 2-3 个本地推荐停靠点。",
    modeSubChill: "景点更放松，节奏更慢。",
    modeSubEfficient: "停靠更少，路线更快。",
    expansionTitle: "扩展模块",
    expansionSub: "即将上线 — 旅途中会给你更多实用建议",
    scenic: "景点",
    stay: "住宿",
    transport: "交通",
    cta: "✨ 查看我的智能路线",
    footer: "TravelBah · AI 本地向导 · Tawau 版"
  },
  ms: {
    subtitle: "Edisi Tawau — AI Local Guide, Bah.",
    tagline1: "Kurang perangkap pelancong. Lebih insight tempatan.",
    tagline2: "Letak mula dan akhir — saya urus selebihnya.",
    engineBadge: "🧠 TravelBah sedang optimumkan laluan tempatan di Tawau...",
    engineSub: "Pratonton enjin langsung: skor laluan + padanan hentian + surprise trigger",
    exampleA: "📍 Airport → Town",
    exampleBFood: "🍜 3 hentian disyorkan • ⚡ 1 surprise",
    exampleBChill: "😌 2 spot scenic • ☕ 1 rehat",
    exampleBEfficient: "⚡ 2 hentian cepat • lencongan minimum",
    exampleC: "⏱ Anggaran ~18 min",
    inputTitle: "Letak dua titik. Saya urus selebihnya.",
    whereNow: "Di mana anda sekarang?",
    whereGo: "Anda mahu pergi ke mana?",
    modeTitle: "Pilihan Mod",
    modeSubFood: "Kami akan susun 2-3 hentian tempatan sepanjang laluan anda.",
    modeSubChill: "Spot scenic + rentak santai.",
    modeSubEfficient: "Hentian minimum, laluan paling cepat.",
    expansionTitle: "Modul Perluasan",
    expansionSub: "Akan datang — cadangan berguna semasa anda bergerak",
    scenic: "Scenic",
    stay: "Penginapan",
    transport: "Pengangkutan",
    cta: "✨ Lihat Laluan Pintar Saya",
    footer: "TravelBah · AI Local Guide · Edisi Tawau"
  }
};

export default function LandingPage() {
  const router = useRouter();
  const [origin, setOrigin] = useState("Tawau Airport");
  const [destination, setDestination] = useState("Tawau Town");
  const [mode, setMode] = useState<TravelMode>("food");
  const [language, setLanguage] = useState<TravelLanguage>("en");
  const [line, setLine] = useState<string>(uiText.en.defaultLandingGuide);

  const t = uiText[language];
  const h = homeCopy[language];
  const activeLangIndex = useMemo(() => languageOptions.indexOf(language), [language]);

  const modeSub =
    mode === "food" ? h.modeSubFood : mode === "chill" ? h.modeSubChill : h.modeSubEfficient;
  const exampleB =
    mode === "food" ? h.exampleBFood : mode === "chill" ? h.exampleBChill : h.exampleBEfficient;

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
    <main className="mx-auto min-h-screen w-full max-w-6xl bg-[#f4f6fa] px-4 py-8">
      <div className="mx-auto w-full max-w-5xl rounded-[24px] border border-white bg-white/92 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.06)] sm:p-7">
        <div className="grid gap-4">
          <section className="hero-vibe-card relative overflow-hidden rounded-2xl border border-[#e7eaf7] p-5 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
            <span className="hero-vibe-icon hero-vibe-icon--plane">✈</span>
            <span className="hero-vibe-icon hero-vibe-icon--mountain">△</span>
            <span className="hero-vibe-icon hero-vibe-icon--wave">≈≈</span>
            <span className="hero-vibe-icon hero-vibe-icon--sun">☀</span>
            <div className="relative z-10">
              <h1 className="text-[3rem] font-extrabold leading-[1.01] tracking-[0.035em] sm:text-[3.5rem]">
                <span className="title-gradient">TravelBah</span>
              </h1>
              <p className="mt-2 text-lg font-medium text-text-primary">{h.subtitle}</p>
              <p className="mt-2 text-sm text-text-secondary">{h.tagline1}</p>
              <p className="text-sm text-text-secondary">{h.tagline2}</p>
            </div>
          </section>

          <section className="relative overflow-hidden rounded-2xl border border-[#e7eaf7] bg-gradient-to-r from-[#4f46e5] to-[#14b8a6] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_12px_26px_rgba(79,70,229,0.2)]">
            <p className="relative z-10 text-sm font-semibold text-white/95">{h.engineBadge}</p>
            <p className="relative z-10 mt-1 text-xs text-white/85">{h.engineSub}</p>
            <div className="relative z-10 mt-3 grid gap-2 text-xs text-white/95 sm:grid-cols-3">
              <div className="rounded-xl border border-white/30 bg-white/10 px-3 py-2 backdrop-blur-[4px]">{h.exampleA}</div>
              <div className="rounded-xl border border-white/30 bg-white/10 px-3 py-2 backdrop-blur-[4px]">{exampleB}</div>
              <div className="rounded-xl border border-white/30 bg-white/10 px-3 py-2 backdrop-blur-[4px]">{h.exampleC}</div>
            </div>
            <span className="ai-flow-line ai-flow-line--a" />
            <span className="ai-flow-line ai-flow-line--b" />
            <span className="ai-flow-line ai-flow-line--c" />
          </section>

          <section className="rounded-2xl border border-[#e7eaf7] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
            <p className="mb-3 text-sm font-semibold text-text-primary">{h.inputTitle}</p>
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
                  className={`travelbah-lift relative z-10 rounded-[10px] border px-3 py-2 text-sm ${language === opt ? "border-transparent text-white" : "border-border bg-transparent text-text-primary"}`}
                >
                  {languageNames[opt]}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-text-secondary">{t.languageHint}</p>

            <label className="mt-3 block text-sm font-medium text-text-primary">{h.whereNow}</label>
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

            <label className="mt-3 block text-sm font-medium text-text-primary">{h.whereGo}</label>
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="mt-1 w-full rounded-[14px] border border-border bg-white p-[14px] text-text-primary outline-none transition-shadow focus:border-primary focus:shadow-[0_0_0_4px_rgba(79,70,229,0.12)]"
            />
          </section>

          <section className="rounded-2xl border border-[#e7eaf7] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
            <p className="mb-2 text-sm font-semibold text-text-primary">{h.modeTitle}</p>
            <ModePicker value={mode} onChange={setMode} />
            <p className="mt-2 text-sm text-text-secondary">{modeSub}</p>
          </section>

          <section className="rounded-2xl border border-[#e7eaf7] bg-[#f9fbff] p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
            <p className="mb-2 text-sm font-semibold text-text-primary">{h.expansionTitle}</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-border bg-white/75 px-3 py-1 text-sm text-text-primary">{h.scenic}</span>
              <span className="rounded-full border border-border bg-white/75 px-3 py-1 text-sm text-text-primary">{h.stay}</span>
              <span className="rounded-full border border-border bg-white/75 px-3 py-1 text-sm text-text-primary">{h.transport}</span>
            </div>
            <p className="mt-2 text-sm text-text-secondary">{h.expansionSub}</p>
          </section>

          <section className="rounded-2xl border border-[#e7eaf7] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
            <button onClick={go} className="travelbah-lift gradient-primary gradient-primary-flow w-full rounded-full px-6 py-4 text-base font-semibold text-white">
              {h.cta}
            </button>
            <p className="glass-card mt-3 rounded-2xl px-4 py-3 text-sm text-text-secondary">
              {t.guidePrefix}: {line}
            </p>
          </section>

          <footer className="pt-1 text-center text-xs text-text-secondary">{h.footer}</footer>
        </div>
      </div>
    </main>
  );
}
