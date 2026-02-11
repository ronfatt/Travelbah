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
    vibeLine: string;
    leadLine: string;
    aiOptimizing: string;
    aiPreview: string;
    dropLine: string;
    whereNow: string;
    whereGo: string;
    modeTitle: string;
    expansionTitle: string;
    liveExampleTitle: string;
    liveExampleHint: string;
    cta: string;
    learnLine: string;
    askTitle: string;
    askBtn: string;
    defaultAsk: string;
    askFoodReply: string;
    askSunsetReply: string;
    askGenericReply: string;
    moduleSpotTitle: string;
    moduleSpotDesc: string;
    moduleStayTitle: string;
    moduleStayDesc: string;
    moduleTransportTitle: string;
    moduleTransportDesc: string;
    moduleStatus: string;
  }
> = {
  en: {
    subtitle: "Tawau Edition — AI Local Guide, Bah.",
    vibeLine: "Less tourist traps. More real stuff, bah.",
    leadLine: "Tell us where you are and where you're heading — we'll handle the rest.",
    aiOptimizing: "🧠 Optimizing local routes in Tawau...",
    aiPreview: "Live engine preview: route scoring + stop matching + surprise trigger.",
    dropLine: "Drop two points. I'll do the rest.",
    whereNow: "Where are you now?",
    whereGo: "Where do you want to go?",
    modeTitle: "Mode Selection",
    expansionTitle: "Expansion Modules",
    liveExampleTitle: "Live Generated Example",
    liveExampleHint: "This preview updates by mode before you start the full trip.",
    cta: "👉 Plan My Route",
    learnLine: "🧠 Travel ah. learns your vibe as you explore.",
    askTitle: "💬 Ask TravelBah",
    askBtn: "Ask",
    defaultAsk: "Where should I eat tonight in Tawau?",
    askFoodReply: "Tonight, try Sabindo area for seafood, then hop to a nearby kopi spot for dessert. Want halal-first options?",
    askSunsetReply: "For sunset shots, check Waterfront Deck around 6:00-6:40 pm. I can route it into your trip.",
    askGenericReply: "Good one. Share your start and destination and I’ll shape a local-first route for you.",
    moduleSpotTitle: "Spots",
    moduleSpotDesc: "Scenic and photo-friendly spots",
    moduleStayTitle: "Stay",
    moduleStayDesc: "Smart stay picks near your route",
    moduleTransportTitle: "Transport",
    moduleTransportDesc: "Live transfer and ride suggestions",
    moduleStatus: "Coming soon · Not open yet"
  },
  zh: {
    subtitle: "斗湖版 — AI 在地向导，bah。",
    vibeLine: "少踩雷，多走本地真实路线。",
    leadLine: "告诉我起点和终点，剩下交给我。",
    aiOptimizing: "🧠 正在优化斗湖本地路线...",
    aiPreview: "实时引擎预览：路线评分 + 停靠匹配 + 惊喜触发。",
    dropLine: "给我两个点，剩下我来安排。",
    whereNow: "你现在在哪里？",
    whereGo: "你要去哪里？",
    modeTitle: "模式选择",
    expansionTitle: "扩展模块",
    liveExampleTitle: "实时生成示例",
    liveExampleHint: "这个预览会根据模式实时变化，再进入完整行程。",
    cta: "👉 开始规划路线",
    learnLine: "🧠 Travel ah. 会越走越懂你的偏好。",
    askTitle: "💬 问问 TravelBah",
    askBtn: "提问",
    defaultAsk: "今晚在斗湖我该吃什么？",
    askFoodReply: "今晚可先去 Sabindo 一带吃海鲜，再去附近 kopi 店吃甜点。要不要我改成 halal 优先？",
    askSunsetReply: "拍 sunset 建议去 Waterfront Deck，最佳时间约 6:00-6:40。",
    askGenericReply: "不错。告诉我起点和终点，我会帮你排一条本地优先路线。",
    moduleSpotTitle: "景点",
    moduleSpotDesc: "适合拍照和观景的路线点位",
    moduleStayTitle: "住宿",
    moduleStayDesc: "沿线智能住宿建议",
    moduleTransportTitle: "交通",
    moduleTransportDesc: "实时接驳与出行建议",
    moduleStatus: "即将开放 · 还没开放"
  },
  ms: {
    subtitle: "Edisi Tawau — AI Local Guide, Bah.",
    vibeLine: "Kurang perangkap pelancong. Lebih pengalaman tempatan sebenar.",
    leadLine: "Beritahu titik mula dan destinasi — selebihnya saya uruskan.",
    aiOptimizing: "🧠 Sedang optimumkan laluan tempatan di Tawau...",
    aiPreview: "Pratonton enjin langsung: skor laluan + padanan hentian + trigger surprise.",
    dropLine: "Beri dua titik. Saya urus selebihnya.",
    whereNow: "Anda berada di mana sekarang?",
    whereGo: "Anda mahu pergi ke mana?",
    modeTitle: "Pilihan Mod",
    expansionTitle: "Modul Tambahan",
    liveExampleTitle: "Contoh Dijana Secara Langsung",
    liveExampleHint: "Pratonton ini berubah ikut mod sebelum anda mula trip penuh.",
    cta: "👉 Rancang Laluan Saya",
    learnLine: "🧠 Travel ah. belajar vibe anda sepanjang perjalanan.",
    askTitle: "💬 Tanya TravelBah",
    askBtn: "Tanya",
    defaultAsk: "Di mana saya patut makan malam ini di Tawau?",
    askFoodReply: "Malam ini cuba kawasan Sabindo untuk seafood, kemudian sambung ke kedai kopi berdekatan untuk pencuci mulut. Mahu pilihan halal-first?",
    askSunsetReply: "Untuk sunset, cuba Waterfront Deck sekitar 6:00-6:40 petang.",
    askGenericReply: "Soalan bagus. Beri titik mula dan destinasi, saya susun laluan local-first untuk anda.",
    moduleSpotTitle: "Spot",
    moduleSpotDesc: "Spot pemandangan dan lokasi foto",
    moduleStayTitle: "Penginapan",
    moduleStayDesc: "Cadangan stay pintar sepanjang laluan",
    moduleTransportTitle: "Pengangkutan",
    moduleTransportDesc: "Cadangan transfer dan perjalanan langsung",
    moduleStatus: "Akan datang · Belum dibuka"
  }
};

export default function LandingPage() {
  const router = useRouter();
  const [origin, setOrigin] = useState("Tawau Airport");
  const [destination, setDestination] = useState("Tawau Town");
  const [mode, setMode] = useState<TravelMode>("food");
  const [language, setLanguage] = useState<TravelLanguage>("en");
  const [line, setLine] = useState<string>(uiText.en.defaultLandingGuide);
  const [quickAsk, setQuickAsk] = useState(homeCopy.en.defaultAsk);
  const [quickReply, setQuickReply] = useState("");
  const [ctaHovered, setCtaHovered] = useState(false);

  const t = uiText[language];
  const h = homeCopy[language];
  const activeLangIndex = useMemo(() => languageOptions.indexOf(language), [language]);
  const modeHint =
    language === "zh"
      ? mode === "food"
        ? "我们会沿路线排 2-3 个本地美食点。"
        : mode === "chill"
          ? "看景 + 放松节奏，不赶时间。"
          : "停靠更少，路线更快。"
      : language === "ms"
        ? mode === "food"
          ? "Kami susun 2-3 hentian makanan tempatan sepanjang laluan."
          : mode === "chill"
            ? "Spot pemandangan + rentak santai."
            : "Hentian minimum, laluan paling cepat."
        : mode === "food"
          ? "We’ll line up 2–3 local stops along your route."
          : mode === "chill"
            ? "Scenic spots + relaxed pacing."
            : "Minimal stops, fastest route.";
  const liveExample =
    language === "zh"
      ? mode === "food"
        ? "Airport -> Town · 3 个美食停靠 · 1 个惊喜"
        : mode === "chill"
          ? "Airport -> Town · 2 个景观点 · 1 次咖啡休息"
          : "Airport -> Town · 2 个快停靠 · 最快路线"
      : language === "ms"
        ? mode === "food"
          ? "Airport -> Town · 3 hentian makanan · 1 surprise"
          : mode === "chill"
            ? "Airport -> Town · 2 spot pemandangan · 1 rehat kopi"
            : "Airport -> Town · 2 hentian pantas · laluan terpantas"
        : mode === "food"
          ? "Airport -> Town · 3 food stops · 1 surprise"
          : mode === "chill"
            ? "Airport -> Town · 2 scenic stops · 1 coffee break"
            : "Airport -> Town · 2 quick stops · fastest route";
  const upcomingModules = [
    {
      emoji: "📸",
      title: h.moduleSpotTitle,
      desc: h.moduleSpotDesc,
      status: h.moduleStatus
    },
    {
      emoji: "🏨",
      title: h.moduleStayTitle,
      desc: h.moduleStayDesc,
      status: h.moduleStatus
    },
    {
      emoji: "🚌",
      title: h.moduleTransportTitle,
      desc: h.moduleTransportDesc,
      status: h.moduleStatus
    }
  ];

  function setLanguageAndLine(next: TravelLanguage) {
    const safe = normalizeLanguage(next);
    setLanguage(safe);
    setLine(uiText[safe].defaultLandingGuide);
    setQuickAsk(homeCopy[safe].defaultAsk);
    setQuickReply("");
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
      setQuickReply(h.askFoodReply);
      return;
    }
    if (q.includes("sunset") || q.includes("photo")) {
      setQuickReply(h.askSunsetReply);
      return;
    }
    setQuickReply(h.askGenericReply);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center bg-[#f4f6fa] px-4 py-8">
      <div className="mx-auto w-full max-w-5xl rounded-[24px] border border-white bg-white/92 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.06)] sm:p-7">
        <section className="mx-auto max-w-3xl text-center">
          <h1 className="text-[3.45rem] font-extrabold leading-[1.01] tracking-[0.035em] sm:text-[3.9rem]">
            <span className="title-gradient">TravelBah</span>
            <span className={`sparkle-dot ${ctaHovered ? "sparkle-dot--active" : ""}`} />
          </h1>
          <p className="mt-2 text-lg font-medium text-text-primary">{h.subtitle}</p>
          <p className="mt-2 text-sm text-text-secondary">{h.vibeLine}</p>
          <p className="mt-3 text-sm text-text-secondary">{h.leadLine}</p>
        </section>

        <div className="mt-8 grid gap-4">
          <section className="rounded-2xl border border-[#e7eaf7] bg-gradient-to-r from-[#4f46e5] to-[#14b8a6] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_12px_26px_rgba(79,70,229,0.2)]">
            <p className="relative z-10 text-sm font-semibold text-white/95">{h.aiOptimizing}</p>
            <p className="relative z-10 mt-2 text-xs text-white/85">{h.aiPreview}</p>
            <span className="ai-flow-line ai-flow-line--a" />
            <span className="ai-flow-line ai-flow-line--b" />
            <span className="ai-flow-line ai-flow-line--c" />
          </section>

          <section className="rounded-2xl border border-[#e7eaf7] bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
            <p className="mb-3 text-sm font-semibold text-text-primary">{h.dropLine}</p>
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

          <section className="rounded-2xl border border-[#e7eaf7] bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
            <p className="mb-2 text-sm font-semibold text-text-primary">{h.modeTitle}</p>
            <ModePicker value={mode} onChange={setMode} />
            <p className="mt-2 text-sm text-text-secondary">{modeHint}</p>
          </section>

          <section className="rounded-2xl border border-[#e7eaf7] bg-[#f9fbff] p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
            <p className="mb-2 text-sm font-semibold text-text-primary">{h.expansionTitle}</p>
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
            <p className="text-xs uppercase tracking-[0.12em] text-text-secondary">{h.liveExampleTitle}</p>
            <p className="mt-1 text-sm font-semibold text-text-primary">{liveExample}</p>
            <p className="mt-1 text-xs text-text-secondary">{h.liveExampleHint}</p>

            <button
              onClick={go}
              onMouseEnter={() => setCtaHovered(true)}
              onMouseLeave={() => setCtaHovered(false)}
              onFocus={() => setCtaHovered(true)}
              onBlur={() => setCtaHovered(false)}
              className="travelbah-lift gradient-primary gradient-primary-flow mt-4 w-full rounded-full px-6 py-4 text-base font-semibold text-white"
            >
              {h.cta}
            </button>
            <p className="mt-2 text-sm text-text-secondary">{h.learnLine}</p>

            <p className="glass-card mt-3 rounded-2xl px-4 py-3 text-sm text-text-secondary">
              {t.guidePrefix}: {line}
            </p>
          </section>
        </div>
      </div>

      <aside className="glass-card ask-fab fixed bottom-4 right-4 z-20 w-[320px] rounded-2xl p-4 shadow-card">
        <p className="text-sm font-semibold text-text-primary">{h.askTitle}</p>
        <input
          value={quickAsk}
          onChange={(e) => setQuickAsk(e.target.value)}
          className="mt-2 w-full rounded-[14px] border border-border bg-white/70 p-[12px] text-sm text-text-primary outline-none transition-shadow focus:border-primary focus:shadow-[0_0_0_4px_rgba(79,70,229,0.12)]"
        />
        <button onClick={askTravelBah} className="travelbah-lift gradient-primary mt-2 w-full rounded-full px-3 py-2 text-sm font-semibold text-white">
          {h.askBtn}
        </button>
        {quickReply ? <p className="mt-2 text-sm text-text-secondary">{quickReply}</p> : null}
      </aside>
    </main>
  );
}
