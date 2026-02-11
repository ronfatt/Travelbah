"use client";

import { useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import type { Poi, TravelLanguage, TravelMode } from "@/lib/types";

type RecapText = {
  storyTitle: string;
  titleBadge: string;
  aiRoute: string;
  watermark: string;
  aiSummary: string;
  share: string;
  download: string;
  instagramStory: string;
  instagramPost: string;
  whatsapp: string;
  copyLink: string;
  footerLine1: string;
  footerLine2: string;
  stopsUnit: string;
  surpriseUnit: string;
  kmUnit: string;
  minsUnit: string;
  foodMood: string;
  chillMood: string;
  efficientMood: string;
  waShareText: string;
};

const recapText: Record<TravelLanguage, RecapText> = {
  en: {
    storyTitle: "TravelBah Journey Story",
    titleBadge: "TravelBah · Tawau Edition",
    aiRoute: "AI-curated route",
    watermark: "TravelBah watermark",
    aiSummary: "AI Summary",
    share: "Share",
    download: "Download PNG",
    instagramStory: "📱 Instagram Story",
    instagramPost: "📷 Instagram Post",
    whatsapp: "💬 WhatsApp",
    copyLink: "🔗 Copy Link",
    footerLine1: "AI Local Guide · TravelBah",
    footerLine2: "travelbah.app",
    stopsUnit: "stops",
    surpriseUnit: "surprise",
    kmUnit: "km",
    minsUnit: "mins",
    foodMood: "🍜 Food-first Adventure",
    chillMood: "😌 Chill Route",
    efficientMood: "⚡ Efficient Sprint",
    waShareText: "TravelBah Journey Story"
  },
  zh: {
    storyTitle: "TravelBah 旅程故事",
    titleBadge: "TravelBah · Tawau 版",
    aiRoute: "AI 规划路线",
    watermark: "TravelBah 水印",
    aiSummary: "AI 总结",
    share: "分享",
    download: "下载 PNG",
    instagramStory: "📱 Instagram 限时动态",
    instagramPost: "📷 Instagram 帖子",
    whatsapp: "💬 WhatsApp",
    copyLink: "🔗 复制链接",
    footerLine1: "AI 本地向导 · TravelBah",
    footerLine2: "travelbah.app",
    stopsUnit: "站",
    surpriseUnit: "个惊喜",
    kmUnit: "公里",
    minsUnit: "分钟",
    foodMood: "🍜 美食优先冒险",
    chillMood: "😌 轻松慢游",
    efficientMood: "⚡ 高效冲刺",
    waShareText: "TravelBah 旅程故事"
  },
  ms: {
    storyTitle: "Kisah Perjalanan TravelBah",
    titleBadge: "TravelBah · Edisi Tawau",
    aiRoute: "Laluan dikurasi AI",
    watermark: "Watermark TravelBah",
    aiSummary: "Ringkasan AI",
    share: "Kongsi",
    download: "Muat Turun PNG",
    instagramStory: "📱 Instagram Story",
    instagramPost: "📷 Instagram Post",
    whatsapp: "💬 WhatsApp",
    copyLink: "🔗 Salin Pautan",
    footerLine1: "AI Local Guide · TravelBah",
    footerLine2: "travelbah.app",
    stopsUnit: "hentian",
    surpriseUnit: "surprise",
    kmUnit: "km",
    minsUnit: "min",
    foodMood: "🍜 Pengembaraan Makan Dulu",
    chillMood: "😌 Laluan Santai",
    efficientMood: "⚡ Sprint Efisien",
    waShareText: "Kisah Perjalanan TravelBah"
  }
};

const foodMoodTags: Record<TravelLanguage, string[]> = {
  en: [
    "☕ Strong Kopi + Butter Toast Fix",
    "🔥 Char-grilled Lunch Hit",
    "🥢 Evening Satay Energy",
    "🍤 Seafood Comfort Punch",
    "🥘 Local Flavor Power-up"
  ],
  zh: ["☕ 浓咖啡 + 牛油吐司补给", "🔥 炭烤午餐能量", "🥢 傍晚沙爹加分", "🍤 海鲜满足感", "🥘 在地风味补给"],
  ms: [
    "☕ Kopi pekat + roti bakar mentega",
    "🔥 Hidangan tengah hari bakar arang",
    "🥢 Tenaga satay waktu petang",
    "🍤 Pukulan selesa makanan laut",
    "🥘 Boost rasa tempatan"
  ]
};

function seededIndex(seed: string, max: number) {
  const n = seed.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return n % max;
}

function stopRole(stop: Poi, idx: number, language: TravelLanguage) {
  if (stop.category === "food") {
    const tags = foodMoodTags[language];
    return tags[(seededIndex(stop.id, tags.length) + idx) % tags.length];
  }
  if (language === "zh") {
    if (stop.category === "spot") return "📸 黄金时段拍照点";
    if (stop.category === "stay") return "🛏 休息充电站";
    return "🎯 本地娱乐绕一下";
  }
  if (language === "ms") {
    if (stop.category === "spot") return "📸 Henti foto golden hour";
    if (stop.category === "stay") return "🛏 Titik rehat & recharge";
    return "🎯 Lencongan hiburan tempatan";
  }
  if (stop.category === "spot") return "📸 Golden Hour Photo Pause";
  if (stop.category === "stay") return "🛏 Reset & Recharge Point";
  return "🎯 Local Fun Detour";
}

function moodLine(mode: TravelMode, language: TravelLanguage) {
  if (mode === "food") return recapText[language].foodMood;
  if (mode === "chill") return recapText[language].chillMood;
  return recapText[language].efficientMood;
}

function headlineFor(mode: TravelMode, stops: Poi[], surpriseCount: number, language: TravelLanguage) {
  const poolByMode: Record<TravelLanguage, Record<TravelMode, string[]>> = {
    en: {
      food: ["Landed hungry. Left legendary.", "Runway in, flavor out.", "Checked in hungry. Checked out iconic."],
      chill: ["Smooth miles. Slow bites.", "Easy route, real moments.", "Slow pace. Solid memories."],
      efficient: ["Fast lane, full flavor.", "No detours. All payoff.", "Smart route. Zero wasted time."]
    },
    zh: {
      food: ["落地很饿，离开很传奇。", "一下飞机就开吃。", "饿着来，满足走。"],
      chill: ["慢慢走，稳稳玩。", "轻松路线，真实时刻。", "不赶路，也很精彩。"],
      efficient: ["快线直达，也有亮点。", "少绕路，回报更高。", "聪明路线，不浪费时间。"]
    },
    ms: {
      food: ["Mendarat lapar. Pulang legend.", "Dari runway terus ke rasa tempatan.", "Datang lapar, balik puas."],
      chill: ["Perjalanan tenang, rasa perlahan.", "Laluan santai, momen sebenar.", "Rentak perlahan, memori padu."],
      efficient: ["Laju, tepat, tetap berasa.", "Tiada lencongan, semua berbaloi.", "Laluan bijak, masa tak terbuang."]
    }
  };
  const hook = surpriseCount > 0 ? (language === "zh" ? "⚡ 惊喜已解锁。" : language === "ms" ? "⚡ Surprise dikunci." : "⚡ Surprise locked in.") : "";
  const seed = stops.map((s) => s.id).join("|") + mode;
  const pick = poolByMode[language][mode][seededIndex(seed, poolByMode[language][mode].length)];
  return hook ? `${pick} ${hook}` : pick;
}

function aiSummaryByMode(mode: TravelMode, stopCount: number, language: TravelLanguage) {
  if (language === "zh") {
    if (mode === "food") return `你落地时很饿，离开前已经锁定 ${stopCount} 个在地美食停靠点。`;
    if (mode === "chill") return "路线平稳、节奏放松、吃得刚刚好。";
    return "直线高效，停靠聪明，不浪费一分钟。";
  }
  if (language === "ms") {
    if (mode === "food") return `Anda mendarat lapar, dan pulang dengan ${stopCount} hentian rasa tempatan yang padu.`;
    if (mode === "chill") return "Perjalanan lancar, rentak santai, tiada tergesa-gesa.";
    return "Laluan terus, hentian bijak, masa tak terbuang.";
  }

  if (mode === "food") return `You landed hungry, and left with ${stopCount} solid local flavors locked in.`;
  if (mode === "chill") return "Smooth ride, slow bites, no rush.";
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
  mode,
  language
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
  language: TravelLanguage;
}) {
  const t = recapText[language];
  const cardRef = useRef<HTMLDivElement | null>(null);
  const storyRef = useRef<HTMLDivElement | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);

  const aiLine = useMemo(() => aiSummaryByMode(mode, stops.length, language), [mode, stops.length, language]);
  const headline = useMemo(() => headlineFor(mode, stops, surpriseCount ?? 0, language), [mode, stops, surpriseCount, language]);

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
      await navigator.share({ title: t.storyTitle, text: aiLine, url: window.location.href });
      return;
    }
    setShowShareMenu((v) => !v);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
  }

  const routePreview = useMemo(() => {
    const points = polyline.length > 1 ? polyline : stops.map((s) => [s.lng, s.lat] as [number, number]);
    const all = points.length ? points : [];
    const w = 900;
    const h = 400;
    const pad = 32;

    const procedural = () => {
      const n = Math.max(6, stops.length + 2);
      const xy = Array.from({ length: n }, (_, i) => {
        const tval = i / Math.max(1, n - 1);
        const x = pad + tval * (w - pad * 2);
        const y = h - pad - tval * (h - pad * 2) + Math.sin(i * 1.22) * 30;
        return [x, y] as [number, number];
      });
      const path = xy.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
      return { xy, path, w, h };
    };

    if (!all.length) return procedural();
    const lngs = all.map((p) => p[0]).filter((x) => Number.isFinite(x));
    const lats = all.map((p) => p[1]).filter((x) => Number.isFinite(x));
    if (!lngs.length || !lats.length) return procedural();
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    if (Math.abs(maxLng - minLng) < 0.000001 || Math.abs(maxLat - minLat) < 0.000001) return procedural();

    const toXY = ([lng, lat]: [number, number]) => {
      const x = pad + ((lng - minLng) / Math.max(0.0001, maxLng - minLng)) * (w - pad * 2);
      const y = pad + (1 - (lat - minLat) / Math.max(0.0001, maxLat - minLat)) * (h - pad * 2);
      return [x, y] as [number, number];
    };
    const xy = all.map(toXY);
    if (xy.some((p) => !Number.isFinite(p[0]) || !Number.isFinite(p[1]))) return procedural();
    const path = xy.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
    return { xy, path, w, h };
  }, [polyline, stops]);

  return (
    <div>
      <div className="mx-auto w-full max-w-[440px] rounded-[28px] bg-gradient-to-br from-[#4f46e5] via-[#6366f1] to-[#14b8a6] p-[2px] shadow-card">
        <div ref={cardRef} className="rounded-[26px] bg-white/92 p-4 backdrop-blur-[14px]">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#4f46e5] via-[#6366f1] to-[#3b82f6] p-3">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.35)_0%,rgba(0,0,0,0.15)_40%,rgba(0,0,0,0)_100%)]" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/85">{t.storyTitle}</p>
                <h2 className="mt-1 text-[1.5rem] font-extrabold leading-tight text-[#F8FAFF] [text-shadow:0_2px_12px_rgba(0,0,0,0.25)]">{headline}</h2>
                <p className="mt-1 inline-flex rounded-full bg-white/15 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-[8px]">
                  {moodLine(mode, language)}
                </p>
                <p className="mt-1 inline-flex rounded-full bg-white/15 px-2 py-1 text-xs text-white/90 backdrop-blur-[8px]">
                  {origin} → {destination} · {stops.length} {t.stopsUnit} · {surpriseCount ?? 0} {t.surpriseUnit}
                </p>
              </div>
              <span className="rounded-full border border-white/40 bg-white/20 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-[8px]">{t.titleBadge}</span>
            </div>
          </div>

          <div className="relative mt-3 overflow-hidden rounded-2xl">
            {staticMapUrl && !mapFailed ? (
              <img src={staticMapUrl} alt="Route map" className="h-40 w-full object-cover" onError={() => setMapFailed(true)} />
            ) : (
              <div className="h-40 bg-gradient-to-r from-[#4f46e5] via-[#6366f1] to-[#14b8a6]">
                {routePreview ? (
                  <svg viewBox={`0 0 ${routePreview.w} ${routePreview.h}`} className="relative z-20 h-full w-full opacity-95">
                    <defs>
                      <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#4F46E5" />
                        <stop offset="55%" stopColor="#6366F1" />
                        <stop offset="100%" stopColor="#14B8A6" />
                      </linearGradient>
                    </defs>
                    <path d={routePreview.path} stroke="#ffffff" strokeWidth="10" strokeOpacity="0.45" fill="none" />
                    <path d={routePreview.path} stroke="url(#routeGrad)" strokeWidth="5.5" fill="none" />
                    <path d={routePreview.path} stroke="#ffffff" strokeWidth="2.5" strokeDasharray="8 8" strokeOpacity="0.8" fill="none" />
                    {stops.slice(0, 6).map((s, idx) => {
                      const p =
                        routePreview.xy[
                          Math.max(0, Math.min(routePreview.xy.length - 1, Math.round(((idx + 1) / (stops.length + 1)) * routePreview.xy.length)))
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
                  <div className="relative z-20 flex h-full items-center justify-center text-xs font-semibold text-white/85">Route preview unavailable</div>
                )}
                {routePreview
                  ? routePreview.xy
                      .filter((_, i) => i % Math.max(1, Math.floor(routePreview.xy.length / 34)) === 0)
                      .map((p, i) => (
                        <span
                          key={`dot-${i}`}
                          className="absolute z-20 h-1.5 w-1.5 rounded-full bg-white/95 shadow-[0_0_8px_rgba(255,255,255,0.9)]"
                          style={{ left: `${(p[0] / routePreview.w) * 100}%`, top: `${(p[1] / routePreview.h) * 100}%` }}
                        />
                      ))
                  : null}
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-[#0f172a]/45 via-[#0f172a]/10 to-transparent" />
            <span className="absolute left-2 top-2 z-30 rounded-full bg-white/80 px-2 py-1 text-[10px] font-semibold text-[#4f46e5]">{t.aiRoute}</span>
            <p className="absolute left-3 top-9 z-30 text-[10px] font-medium text-white/90 [text-shadow:0_1px_6px_rgba(0,0,0,0.5)]">{t.watermark}</p>
            <p className="absolute bottom-2 right-3 z-30 text-[10px] font-medium text-white/90 [text-shadow:0_1px_6px_rgba(0,0,0,0.5)]">{t.titleBadge}</p>
          </div>

          <div className="mt-3 rounded-xl border border-border bg-white/80 p-2 text-xs text-text-primary">
            <p className="font-semibold">{t.aiSummary}</p>
            <p className="mt-1 text-text-secondary">{summary || aiLine}</p>
          </div>

          <div className="mt-2 grid grid-cols-4 gap-1.5 text-[11px]">
            <div className="rounded-xl border border-border bg-white/85 p-1.5 text-center">
              <p>🛣</p>
              <p className="font-semibold">{distanceKm ?? 0} {t.kmUnit}</p>
            </div>
            <div className="rounded-xl border border-border bg-white/85 p-1.5 text-center">
              <p>⏱</p>
              <p className="font-semibold">{etaMinutes ?? 0} {t.minsUnit}</p>
            </div>
            <div className="rounded-xl border border-border bg-white/85 p-1.5 text-center">
              <p>🍜</p>
              <p className="font-semibold">{stops.length} {t.stopsUnit}</p>
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
                <p className="text-text-secondary">{stopRole(s, idx, language)}</p>
              </div>
            ))}
          </div>

          <div className="mt-2 border-t border-border/60 pt-2 text-center text-[10px] text-text-secondary">
            {t.footerLine1}
            <br />
            {t.footerLine2}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-4 flex w-full max-w-[440px] gap-2">
        <button onClick={shareNative} className="travelbah-lift gradient-primary flex-1 rounded-full px-4 py-2 font-semibold text-white">
          {t.share}
        </button>
        <button onClick={downloadPng} className="travelbah-lift rounded-full border border-border bg-white/80 px-4 py-2 font-semibold text-text-primary">
          {t.download}
        </button>
      </div>

      {showShareMenu ? (
        <div className="mx-auto mt-3 grid w-full max-w-[440px] grid-cols-2 gap-2 rounded-2xl border border-border bg-white/85 p-3 text-sm">
          <button className="travelbah-lift rounded-xl border border-border px-2 py-2" onClick={downloadStoryPng}>{t.instagramStory}</button>
          <button className="travelbah-lift rounded-xl border border-border px-2 py-2" onClick={downloadPng}>{t.instagramPost}</button>
          <button
            className="travelbah-lift rounded-xl border border-border px-2 py-2"
            onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`${t.waShareText}\n${window.location.href}`)}`, "_blank")}
          >
            {t.whatsapp}
          </button>
          <button className="travelbah-lift rounded-xl border border-border px-2 py-2" onClick={copyLink}>{t.copyLink}</button>
        </div>
      ) : null}

      <div className="pointer-events-none absolute -left-[9999px] top-0">
        <div ref={storyRef} className="h-[640px] w-[360px] overflow-hidden rounded-[24px] bg-gradient-to-b from-[#eef2ff] to-white p-4">
          <h3 className="text-sm uppercase tracking-[0.18em] text-text-secondary">{t.storyTitle}</h3>
          <p className="mt-2 text-2xl font-extrabold text-text-primary">{headline}</p>
          <p className="mt-2 text-sm text-[#4f46e5]">{moodLine(mode, language)}</p>
          <div className="mt-3 overflow-hidden rounded-2xl">
            {staticMapUrl ? <img src={staticMapUrl} alt="Story map" className="h-52 w-full object-cover" /> : <div className="h-52 bg-gradient-to-r from-[#4f46e5] to-[#14b8a6]" />}
          </div>
          <p className="mt-3 text-sm text-text-secondary">{summary || aiLine}</p>
          <div className="mt-4 text-xs text-text-secondary">
            {t.footerLine1} · {t.footerLine2}
          </div>
        </div>
      </div>
    </div>
  );
}
