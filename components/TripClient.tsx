"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MapView } from "@/components/MapView";
import { ContextEvent, Poi, RoutePlan, TravelLanguage, TravelMode } from "@/lib/types";
import { recapSummary } from "@/lib/prompt";

type Phase = "analyzing" | "briefing" | "interactive";

type TripText = {
  analyzing: string;
  engineLocked: string;
  routeLocked: string;
  stopsFound: string;
  surpriseAdded: string;
  briefing: string;
  estTravelTime: string;
  weatherLine: string;
  trafficLine: string;
  roadLine: string;
  simulate: string;
  askPlaceholder: string;
  askBtn: string;
  endBtn: string;
  storyHint: string;
  add3: string;
  keepFast: string;
  showScenic: string;
  foodStopsUnit: string;
  surpriseUnit: string;
  top3Dishes: string;
  nearLabel: string;
  recAs: string;
  add: string;
  skip: string;
  rainBtn: string;
  trafficBtn: string;
  tiredBtn: string;
};

const tripText: Record<TravelLanguage, TripText> = {
  en: {
    analyzing: "TravelBah is analyzing your journey...",
    engineLocked: "TravelBah route engine locked.",
    routeLocked: "Route locked",
    stopsFound: "stops found",
    surpriseAdded: "surprise added",
    briefing: "Journey Briefing",
    estTravelTime: "Estimated travel time",
    weatherLine: "Weather: Light rain near city center",
    trafficLine: "Traffic: Moderate congestion at Mile 3",
    roadLine: "Inner road faster than coastal route",
    simulate: "Simulate real-time changes",
    askPlaceholder: "Any sunset spots nearby?",
    askBtn: "Ask",
    endBtn: "🎉 Generate My Journey Story",
    storyHint: "Create a shareable recap of today's route.",
    add3: "Add 3 food stops",
    keepFast: "Keep fast route",
    showScenic: "Show scenic option",
    foodStopsUnit: "Food Stops",
    surpriseUnit: "Surprise",
    top3Dishes: "Top 3 Dishes",
    nearLabel: "Near",
    recAs: "Recommended as a {category} stop along your route.",
    add: "Add",
    skip: "Skip",
    rainBtn: "🌧 Rain",
    trafficBtn: "🚗 Traffic",
    tiredBtn: "💤 I'm tired"
  },
  zh: {
    analyzing: "TravelBah 正在分析你的行程...",
    engineLocked: "TravelBah 路线引擎已锁定。",
    routeLocked: "路线已锁定",
    stopsFound: "个停靠点",
    surpriseAdded: "个惊喜推荐",
    briefing: "行程简报",
    estTravelTime: "预计行程时间",
    weatherLine: "天气：市区附近有小雨",
    trafficLine: "交通：Mile 3 一带中度拥堵",
    roadLine: "内陆路线比沿海道路更快",
    simulate: "模拟实时变化",
    askPlaceholder: "附近有看日落的地方吗？",
    askBtn: "提问",
    endBtn: "🎉 生成我的旅程故事",
    storyHint: "生成可分享的今日路线故事卡。",
    add3: "加入 3 个美食停靠点",
    keepFast: "保持最快路线",
    showScenic: "查看风景路线",
    foodStopsUnit: "个美食停靠点",
    surpriseUnit: "个惊喜",
    top3Dishes: "必吃 3 道",
    nearLabel: "位置",
    recAs: "推荐作为路线中的{category}停靠点。",
    add: "加入",
    skip: "跳过",
    rainBtn: "🌧 下雨",
    trafficBtn: "🚗 塞车",
    tiredBtn: "💤 我累了"
  },
  ms: {
    analyzing: "TravelBah sedang menganalisis perjalanan anda...",
    engineLocked: "Enjin laluan TravelBah telah dikunci.",
    routeLocked: "Laluan dikunci",
    stopsFound: "hentian ditemui",
    surpriseAdded: "surprise ditambah",
    briefing: "Ringkasan Perjalanan",
    estTravelTime: "Anggaran masa perjalanan",
    weatherLine: "Cuaca: Hujan renyai berhampiran pusat bandar",
    trafficLine: "Trafik: Kesesakan sederhana di Mile 3",
    roadLine: "Jalan dalam bandar lebih pantas daripada laluan pesisir",
    simulate: "Simulasikan perubahan masa nyata",
    askPlaceholder: "Ada spot sunset dekat sini?",
    askBtn: "Tanya",
    endBtn: "🎉 Jana Kisah Perjalanan Saya",
    storyHint: "Cipta kad kisah perjalanan hari ini untuk dikongsi.",
    add3: "Tambah 3 hentian makanan",
    keepFast: "Kekalkan laluan pantas",
    showScenic: "Tunjuk pilihan scenic",
    foodStopsUnit: "Hentian Makanan",
    surpriseUnit: "Surprise",
    top3Dishes: "3 Hidangan Terbaik",
    nearLabel: "Berhampiran",
    recAs: "Disyorkan sebagai hentian {category} sepanjang laluan anda.",
    add: "Tambah",
    skip: "Langkau",
    rainBtn: "🌧 Hujan",
    trafficBtn: "🚗 Trafik",
    tiredBtn: "💤 Saya penat"
  }
};

const categoryLabel: Record<TravelLanguage, Record<Poi["category"], string>> = {
  en: { food: "food", stay: "stay", spot: "spot", entertainment: "entertainment" },
  zh: { food: "美食", stay: "住宿", spot: "景点", entertainment: "娱乐" },
  ms: { food: "makanan", stay: "penginapan", spot: "tarikan", entertainment: "hiburan" }
};

const DISH_POOL = [
  "Signature Seafood Noodles",
  "Charcoal Satay Platter",
  "Crispy Butter Prawns",
  "Hainan Chicken Rice",
  "Kopi + Kaya Toast",
  "Spicy Sambal Fish",
  "Claypot Ginger Chicken",
  "Nasi Campur Local Set"
];
const DISH_PHOTOS = [
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1565299585323-38174c4a6c5b?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80"
];

function seededIndex(seed: string, max: number) {
  return seed.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % max;
}

function top3Dishes(stop: Poi) {
  const base = seededIndex(stop.id, DISH_POOL.length);
  return [DISH_POOL[base], DISH_POOL[(base + 2) % DISH_POOL.length], DISH_POOL[(base + 4) % DISH_POOL.length]];
}

function top3DishPhotos(stop: Poi) {
  const base = seededIndex(stop.id, DISH_PHOTOS.length);
  return [DISH_PHOTOS[base], DISH_PHOTOS[(base + 2) % DISH_PHOTOS.length], DISH_PHOTOS[(base + 4) % DISH_PHOTOS.length]];
}

function whereLine(stop: Poi, language: TravelLanguage) {
  const cat = categoryLabel[language][stop.category];
  if (language === "zh") return `${tripText.zh.nearLabel} ${stop.lat.toFixed(3)}, ${stop.lng.toFixed(3)} · ${cat}`;
  if (language === "ms") return `${tripText.ms.nearLabel} ${stop.lat.toFixed(3)}, ${stop.lng.toFixed(3)} · ${cat}`;
  return `${tripText.en.nearLabel} ${stop.lat.toFixed(3)}, ${stop.lng.toFixed(3)} · ${cat}`;
}

function aiIntro(mode: TravelMode, eta: number, language: TravelLanguage) {
  if (language === "zh") {
    if (mode === "food") return "前往市区在 Mile 3 会有一点点塞车，但不严重。我看到沿路有 3 家很稳的在地美食和 2 个风景点，要我直接帮你排进去吗？";
    if (mode === "efficient") return `目前车程约 ${eta} 分钟，最快路线已锁定。你要保持干净直达，还是加 1 个快速在地停靠点？`;
    return "路上可能有小雨，但海岸线视野还不错。我可以帮你加 2 个轻松风景停靠点，要走慢节奏路线吗？";
  }
  if (language === "ms") {
    if (mode === "food") return "Akan ada trafik ringan di Mile 3, tapi masih ok. Saya nampak 3 spot makan tempatan padu dan 2 spot scenic sepanjang laluan. Mahu saya susun sekarang?";
    if (mode === "efficient") return `Masa perjalanan stabil sekitar ${eta} minit. Laluan terpantas sudah dikunci. Mahu kekalkan terus, atau tambah 1 hentian tempatan yang cepat?`;
    return "Hujan mungkin perlahan sedikit, tapi pemandangan pesisir masih cantik. Saya boleh campur 2 hentian scenic santai, mahu pilih laluan perlahan?";
  }

  if (mode === "food") {
    return "You'll hit mild traffic near Mile 3, but nothing serious. I see 3 solid local food spots and 2 scenic stops along your path. Want me to line them up for you?";
  }
  if (mode === "efficient") {
    return `Travel time's stable at ${eta} mins. Fastest route locked. I can keep it clean - or add 1 quick local stop. Your call.`;
  }
  return "Rain might slow things a little, but views are clear by the coast. I can blend 2 scenic stops into your ride. Want the slow route?";
}

function userEventText(event: ContextEvent, language: TravelLanguage) {
  if (language === "zh") {
    if (event === "rain") return "下雨了。";
    if (event === "traffic") return "开始塞车了。";
    return "我想轻松一点。";
  }
  if (language === "ms") {
    if (event === "rain") return "Hujan dikesan.";
    if (event === "traffic") return "Trafik mula sesak.";
    return "Saya mahu rentak lebih ringan.";
  }
  if (event === "rain") return "Rain detected.";
  if (event === "traffic") return "Traffic building up.";
  return "I need a lighter pace.";
}

function assistantEventReply(event: ContextEvent, language: TravelLanguage) {
  if (language === "zh") {
    if (event === "rain") return "检测到下雨，第一站已切换为室内座位。";
    if (event === "traffic") return "Mile 3 拥堵已更新，路线切到内陆主路。";
    return "收到，我已放慢节奏并保留更顺的路线。";
  }
  if (language === "ms") {
    if (event === "rain") return "Hujan dikesan. Hentian pertama ditukar ke tempat duduk dalaman.";
    if (event === "traffic") return "Kesesakan Mile 3 dikemas kini. Laluan dialih ke jalan dalam bandar.";
    return "Baik, saya perlahan rentak dan kekalkan laluan yang lebih selesa.";
  }
  if (event === "rain") return "Rain detected. Switching first stop to indoor seating.";
  if (event === "traffic") return "Mile 3 congestion updated. Shifting route to inner road.";
  return "Got it. Slowing the pace and keeping the smooth route.";
}

function choiceUserText(choice: "add3" | "fast" | "scenic", language: TravelLanguage) {
  if (language === "zh") {
    if (choice === "add3") return "加入 3 个美食停靠点。";
    if (choice === "fast") return "保持最快路线。";
    return "显示风景路线。";
  }
  if (language === "ms") {
    if (choice === "add3") return "Tambah 3 hentian makanan.";
    if (choice === "fast") return "Kekalkan laluan pantas.";
    return "Tunjuk pilihan scenic.";
  }
  if (choice === "add3") return "Add 3 food stops.";
  if (choice === "fast") return "Keep fast route.";
  return "Show scenic option.";
}

function choiceAssistantText(choice: "add3" | "fast" | "scenic", language: TravelLanguage) {
  if (language === "zh") {
    if (choice === "add3") return "已锁定，加入 3 个在地高分美食停靠点。";
    if (choice === "fast") return "最快路线已锁定，保持干净直达。";
    return "风景选项已开启，加入 2 个沿海观景停靠点。";
  }
  if (language === "ms") {
    if (choice === "add3") return "Dikunci. 3 hentian makanan tempatan terbaik telah ditambah.";
    if (choice === "fast") return "Laluan pantas dikunci. Kekal terus dan kemas.";
    return "Pilihan scenic diaktifkan. 2 hentian pemandangan pesisir telah ditambah.";
  }
  if (choice === "add3") return "Locked. Added 3 food stops with strong local hits.";
  if (choice === "fast") return "Fast route locked. Keeping it clean and direct.";
  return "Scenic option on. Added 2 coastal view stops.";
}

function addStopReply(language: TravelLanguage) {
  if (language === "zh") return "已加入。我会继续平衡整条路线。";
  if (language === "ms") return "Ditambah. Saya akan kekalkan laluan seimbang.";
  return "Added. I'll keep the route balanced.";
}

function skipStopReply(language: TravelLanguage) {
  if (language === "zh") return "已跳过。继续保持路线高效。";
  if (language === "ms") return "Dilangkau. Laluan kekal efisien.";
  return "Skipped. Keeping route efficient.";
}

function stopActionUserText(action: "add" | "skip", stopName: string, language: TravelLanguage) {
  if (language === "zh") return action === "add" ? `加入 ${stopName}。` : `跳过 ${stopName}。`;
  if (language === "ms") return action === "add" ? `Tambah ${stopName}.` : `Langkau ${stopName}.`;
  return action === "add" ? `Add ${stopName}.` : `Skip ${stopName}.`;
}

function getCongestionSegment(polyline: [number, number][]) {
  if (polyline.length < 5) return polyline;
  const start = Math.floor(polyline.length * 0.3);
  const end = Math.floor(polyline.length * 0.46);
  return polyline.slice(start, end);
}

function getAltPolyline(polyline: [number, number][]) {
  return polyline.map((p, i) => [p[0] + Math.sin(i * 0.5) * 0.004, p[1] + Math.cos(i * 0.4) * 0.002] as [number, number]);
}

function reorderForChoice(choice: "add3" | "fast" | "scenic", stops: Poi[]) {
  if (choice === "add3") {
    const food = stops.filter((s) => s.category === "food").slice(0, 3);
    return food.length ? food : stops.slice(0, 3);
  }
  if (choice === "fast") return stops.slice(0, 2);
  const scenic = stops.filter((s) => s.category === "spot").slice(0, 2);
  const rest = stops.filter((s) => !scenic.some((x) => x.id === s.id));
  return [...scenic, ...rest].slice(0, 5);
}

export function TripClient({
  initialPlan,
  mode,
  origin,
  destination,
  language
}: {
  initialPlan: RoutePlan;
  mode: TravelMode;
  origin: string;
  destination: string;
  language: TravelLanguage;
}) {
  const router = useRouter();
  const labels = tripText[language];
  const [phase, setPhase] = useState<Phase>("analyzing");
  const [plan, setPlan] = useState(initialPlan);
  const [loading, setLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [activeStops, setActiveStops] = useState(initialPlan.stops);
  const [chatLog, setChatLog] = useState<Array<{ role: "user" | "assistant"; text: string }>>([]);

  const congestionSegment = useMemo(() => getCongestionSegment(plan.polyline), [plan.polyline]);
  const altPolyline = useMemo(() => getAltPolyline(plan.polyline), [plan.polyline]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase("briefing");
      setChatLog([{ role: "assistant", text: aiIntro(mode, plan.etaMinutes, language) }]);
    }, 1000);
    return () => clearTimeout(timer);
  }, [mode, plan.etaMinutes, language]);

  async function triggerReplan(event: ContextEvent) {
    if (!event) return;
    setLoading(true);
    setPhase("analyzing");

    setChatLog((prev) => [...prev, { role: "user", text: userEventText(event, language) }]);

    const res = await fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origin, destination, mode, event, language })
    });
    const nextPlan = (await res.json()) as RoutePlan;
    setPlan(nextPlan);
    setActiveStops(nextPlan.stops);

    setTimeout(() => {
      setPhase("interactive");
      setChatLog((prev) => [...prev, { role: "assistant", text: assistantEventReply(event, language) }]);
    }, 900);

    setLoading(false);
  }

  function applyChoice(choice: "add3" | "fast" | "scenic") {
    const nextStops = reorderForChoice(choice, plan.stops);
    setActiveStops(nextStops);
    setPhase("interactive");

    setChatLog((prev) => [
      ...prev,
      { role: "user", text: choiceUserText(choice, language) },
      { role: "assistant", text: choiceAssistantText(choice, language) }
    ]);
  }

  async function sendChat() {
    if (!chatInput.trim()) return;
    const text = chatInput.trim();
    setChatInput("");
    setChatLog((prev) => [...prev, { role: "user", text }]);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, mode, stops: activeStops, origin, destination, language })
    });
    const data = (await res.json()) as { reply: string };
    setChatLog((prev) => [...prev, { role: "assistant", text: data.reply }]);
  }

  function finishTrip() {
    const recapPayload = {
      origin,
      destination,
      stops: activeStops,
      summary: recapSummary(origin, destination, language),
      polyline: plan.polyline,
      surpriseDrop: plan.surpriseDrop,
      distanceKm: plan.distanceKm,
      etaMinutes: plan.etaMinutes,
      mode,
      language
    };
    sessionStorage.setItem("travelbah_recap", JSON.stringify(recapPayload));
    router.push("/recap");
  }

  return (
    <div className="space-y-4">
      <section className={`glass-card rounded-2xl px-4 py-3 ${phase === "analyzing" ? "status-shimmer" : ""}`}>
        <p className="text-sm font-semibold text-text-primary">🧠 {phase === "analyzing" ? labels.analyzing : labels.engineLocked}</p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-border bg-white/75 px-2 py-1">✓ {labels.routeLocked}</span>
          <span className="rounded-full border border-border bg-white/75 px-2 py-1">✓ {activeStops.length} {labels.stopsFound}</span>
          <span className="rounded-full border border-border bg-white/75 px-2 py-1">✓ {plan.surpriseDrop ? 1 : 0} {labels.surpriseAdded}</span>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <section className={`glass-card relative rounded-2xl p-3 shadow-card ${loading ? "opacity-95" : ""}`}>
          <div className="absolute left-6 top-6 z-10 rounded-2xl border border-border bg-white/85 px-3 py-2 text-xs shadow-card">
            <p>🚗 {plan.distanceKm} km · {plan.etaMinutes} mins</p>
            <p>🍜 {activeStops.length} {labels.foodStopsUnit}</p>
            <p>⚡ {plan.surpriseDrop ? "1" : "0"} {labels.surpriseUnit}</p>
          </div>
          <MapView
            polyline={plan.polyline}
            origin={plan.origin}
            destination={plan.destination}
            stops={activeStops}
            surprise={plan.surpriseDrop}
            congestionSegment={congestionSegment}
            altPolyline={altPolyline}
          />
        </section>

        <section className="glass-card rounded-2xl p-4 shadow-card">
          <div className="mb-3 rounded-2xl border border-border bg-white/80 p-3 text-sm">
            <p className="font-semibold">📊 {labels.briefing}</p>
            <p className="mt-1">🚗 {labels.estTravelTime}: {plan.etaMinutes} mins</p>
            <p>🌦 {labels.weatherLine}</p>
            <p>🚦 {labels.trafficLine}</p>
            <p>🛣 {labels.roadLine}</p>
          </div>

          {phase !== "analyzing" ? (
            <div className="mb-3 rounded-2xl border border-border bg-white/80 p-3">
              <div className="mb-2 flex flex-wrap gap-2">
                <button className="travelbah-lift rounded-full border border-border bg-white px-3 py-1 text-sm" onClick={() => applyChoice("add3")}>{labels.add3}</button>
                <button className="travelbah-lift rounded-full border border-border bg-white px-3 py-1 text-sm" onClick={() => applyChoice("fast")}>{labels.keepFast}</button>
                <button className="travelbah-lift rounded-full border border-border bg-white px-3 py-1 text-sm" onClick={() => applyChoice("scenic")}>{labels.showScenic}</button>
              </div>
              <p className="text-xs text-text-secondary">{labels.simulate}</p>
            </div>
          ) : null}

          <div className="mb-3 max-h-56 overflow-auto rounded-2xl border border-border bg-white/80 p-3">
            {activeStops.map((stop, idx) => (
              <div key={stop.id} className="mb-2 rounded-xl border border-border bg-white/85 p-2 text-sm">
                <p className="font-semibold text-text-primary">
                  {idx + 1}. {stop.name}
                </p>
                <p className="mt-0.5 text-xs text-text-secondary">📍 {whereLine(stop, language)}</p>

                {stop.category === "food" ? (
                  <div className="mt-1 rounded-lg border border-border bg-white p-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-secondary">{labels.top3Dishes}</p>
                    <ul className="mt-1 text-xs text-text-primary">
                      {top3Dishes(stop).map((dish) => (
                        <li key={`${stop.id}-${dish}`}>• {dish}</li>
                      ))}
                    </ul>
                    <div className="mt-2 grid grid-cols-3 gap-1.5">
                      {top3DishPhotos(stop).map((src, i) => (
                        <img
                          key={`${stop.id}-dish-photo-${i}`}
                          src={src}
                          alt={`${stop.name} dish ${i + 1}`}
                          className="h-14 w-full rounded-md object-cover"
                          loading="lazy"
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-text-secondary">
                    {labels.recAs.replace("{category}", categoryLabel[language][stop.category])}
                  </p>
                )}

                <div className="mt-2 flex gap-2">
                  <button
                    className="travelbah-lift rounded border border-border px-2 py-0.5 text-xs"
                    onClick={() =>
                      setChatLog((prev) => [
                        ...prev,
                        { role: "user", text: stopActionUserText("add", stop.name, language) },
                        { role: "assistant", text: addStopReply(language) }
                      ])
                    }
                  >
                    {labels.add}
                  </button>
                  <button
                    className="travelbah-lift rounded border border-border px-2 py-0.5 text-xs"
                    onClick={() => {
                      setActiveStops((prev) => prev.filter((s) => s.id !== stop.id));
                      setChatLog((prev) => [
                        ...prev,
                        { role: "user", text: stopActionUserText("skip", stop.name, language) },
                        { role: "assistant", text: skipStopReply(language) }
                      ]);
                    }}
                  >
                    {labels.skip}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mb-2 max-h-64 overflow-auto rounded-2xl border border-border bg-white/80 p-3">
            {chatLog.map((line, idx) => (
              <div key={idx} className={`mb-2 flex ${line.role === "assistant" ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm ${line.role === "assistant" ? "border border-border bg-white text-text-primary" : "gradient-primary text-white"}`}>
                  {line.text}
                </div>
              </div>
            ))}
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            <button type="button" className="travelbah-lift rounded-full border border-border bg-white px-3 py-1 text-sm" onClick={() => triggerReplan("rain")}>{labels.rainBtn}</button>
            <button type="button" className="travelbah-lift rounded-full border border-border bg-white px-3 py-1 text-sm" onClick={() => triggerReplan("traffic")}>{labels.trafficBtn}</button>
            <button type="button" className="travelbah-lift rounded-full border border-border bg-white px-3 py-1 text-sm" onClick={() => triggerReplan("tired")}>{labels.tiredBtn}</button>
          </div>

          <div className="flex gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendChat()}
              placeholder={labels.askPlaceholder}
              className="flex-1 rounded-[14px] border border-border bg-white/70 px-3 py-2 text-sm outline-none backdrop-blur-[10px] transition-shadow focus:border-primary focus:shadow-[0_0_0_4px_rgba(79,70,229,0.16)]"
            />
            <button onClick={sendChat} className="travelbah-lift gradient-primary gradient-primary-flow rounded-[14px] px-3 py-2 text-sm font-semibold text-white">
              {labels.askBtn}
            </button>
          </div>

          <button onClick={finishTrip} className="travelbah-lift gradient-primary-flow gradient-primary mt-3 w-full rounded-full px-4 py-3 font-semibold text-white">
            {labels.endBtn}
          </button>
          <p className="mt-2 text-center text-xs text-text-secondary">{labels.storyHint}</p>
        </section>
      </div>
    </div>
  );
}
