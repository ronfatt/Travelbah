"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MapView } from "@/components/MapView";
import { ContextEvent, RoutePlan, TravelLanguage, TravelMode } from "@/lib/types";
import { recapSummary } from "@/lib/prompt";

const FOOD_PHOTOS = [
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1565299585323-38174c4a6c5b?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80"
];

function seedFromId(id: string) {
  return id.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
}

function bestFoodsForStop(stopId: string) {
  const dishPool = [
    "Signature Seafood Noodles",
    "Charcoal Satay Platter",
    "Crispy Butter Prawns",
    "Hainan Chicken Rice",
    "Teh Tarik + Kaya Toast",
    "Spicy Sambal Fish",
    "Claypot Ginger Chicken",
    "Nasi Campur Local Set"
  ];
  const base = seedFromId(stopId) % dishPool.length;
  return [dishPool[base], dishPool[(base + 2) % dishPool.length], dishPool[(base + 4) % dishPool.length]];
}

function foodPhotosForStop(stopId: string) {
  const base = seedFromId(stopId) % FOOD_PHOTOS.length;
  return [FOOD_PHOTOS[base], FOOD_PHOTOS[(base + 2) % FOOD_PHOTOS.length], FOOD_PHOTOS[(base + 4) % FOOD_PHOTOS.length]];
}

const eventLabels: Record<TravelLanguage, Array<{ key: ContextEvent; label: string; userText: string }>> = {
  en: [
    { key: "rain", label: "🌧 Rain", userText: "Rain detected." },
    { key: "traffic", label: "🚗 Traffic", userText: "Traffic is building up." },
    { key: "tired", label: "💤 I'm tired", userText: "I need a lighter pace." }
  ],
  zh: [
    { key: "rain", label: "🌧 下雨", userText: "下雨了。" },
    { key: "traffic", label: "🚗 塞车", userText: "有点塞车。" },
    { key: "tired", label: "💤 我累了", userText: "我想走轻松一点。" }
  ],
  ms: [
    { key: "rain", label: "🌧 Hujan", userText: "Hujan dikesan." },
    { key: "traffic", label: "🚗 Trafik", userText: "Trafik semakin sesak." },
    { key: "tired", label: "💤 Saya penat", userText: "Saya mahu pace lebih ringan." }
  ]
};

const tripText: Record<TravelLanguage, Record<string, string>> = {
  en: {
    optimizing: "TravelBah is optimizing your route",
    routeLocked: "Route locked",
    stopsFound: "{n} stops found",
    surpriseAdded: "{n} surprise added",
    route: "Route Snapshot",
    eta: "ETA",
    stops: "Stops",
    surprise: "Surprise",
    surpriseDrop: "Surprise Drop",
    fitsSegment: "fits this segment.",
    partner: "Recommended Partner",
    addStop: "Add Stop",
    skip: "Skip",
    askPlaceholder: "Any sunset spots nearby?",
    ask: "Ask",
    endTrip: "🎉 Generate My Journey Story",
    storyHint: "Create a shareable recap of today's route.",
    added: "Added. ETA extended by 12 mins.",
    skipped: "Got it. Keeping route efficient.",
    simulate: "Simulate real-time changes",
    modeAckFood: "You picked Food-first.",
    modeAckChill: "You picked Chill mode.",
    modeAckEfficient: "You picked Efficient mode.",
    modeReply: "Airport to town, nice. Since you picked Food-first, I'll lock in 3 solid local stops.",
    rainReply: "Rain detected. Switching first stop to indoor seating.",
    trafficReply: "Traffic detected. Reordering stops to reduce detour.",
    tiredReply: "Fatigue detected. Moving rest-friendly stop earlier."
  },
  zh: {
    optimizing: "TravelBah 正在优化你的路线",
    routeLocked: "路线已锁定",
    stopsFound: "找到 {n} 个停靠点",
    surpriseAdded: "已加入 {n} 个惊喜点",
    route: "路线快照",
    eta: "预计到达",
    stops: "停靠",
    surprise: "惊喜",
    surpriseDrop: "惊喜推荐",
    fitsSegment: "适合这段行程。",
    partner: "Recommended Partner",
    addStop: "加入停靠",
    skip: "跳过",
    askPlaceholder: "附近有 sunset 拍照点吗？",
    ask: "Ask",
    endTrip: "🎉 Generate My Journey Story",
    storyHint: "Create a shareable recap of today's route.",
    added: "已加入，预计延长 12 分钟。",
    skipped: "收到，路线保持高效。",
    simulate: "Simulate real-time changes",
    modeAckFood: "你选择了 Food-first。",
    modeAckChill: "你选择了 Chill。",
    modeAckEfficient: "你选择了 Efficient。",
    modeReply: "机场到市区，没问题。我先锁定 3 个在地好点。",
    rainReply: "检测到下雨，第一站改成有室内座位。",
    trafficReply: "检测到塞车，重新排序减少绕路。",
    tiredReply: "检测到疲劳，先安排更好休息的点。"
  },
  ms: {
    optimizing: "TravelBah sedang optimumkan laluan anda",
    routeLocked: "Laluan dikunci",
    stopsFound: "{n} hentian ditemui",
    surpriseAdded: "{n} surprise ditambah",
    route: "Ringkasan Laluan",
    eta: "Jangka Tiba",
    stops: "Hentian",
    surprise: "Surprise",
    surpriseDrop: "Cadangan Kejutan",
    fitsSegment: "sesuai untuk segmen ini.",
    partner: "Recommended Partner",
    addStop: "Tambah",
    skip: "Lepas",
    askPlaceholder: "Ada spot sunset berdekatan?",
    ask: "Ask",
    endTrip: "🎉 Generate My Journey Story",
    storyHint: "Create a shareable recap of today's route.",
    added: "Ditambah. ETA bertambah 12 minit.",
    skipped: "Baik, laluan kekal efisien.",
    simulate: "Simulate real-time changes",
    modeAckFood: "Anda pilih Food-first.",
    modeAckChill: "Anda pilih Chill.",
    modeAckEfficient: "Anda pilih Efficient.",
    modeReply: "Airport ke town, baik. Saya kunci 3 hentian tempatan yang mantap.",
    rainReply: "Hujan dikesan. Hentian pertama ditukar ke tempat duduk dalaman.",
    trafficReply: "Trafik dikesan. Susun semula hentian untuk kurangkan lencongan.",
    tiredReply: "Keletihan dikesan. Hentian rehat dipercepatkan."
  }
};

function fillTemplate(template: string, vars: Record<string, string>) {
  return Object.entries(vars).reduce((acc, [k, v]) => acc.replace(`{${k}}`, v), template);
}

function modeAck(mode: TravelMode, t: Record<string, string>) {
  if (mode === "food") return t.modeAckFood;
  if (mode === "chill") return t.modeAckChill;
  return t.modeAckEfficient;
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
  const [plan, setPlan] = useState(initialPlan);
  const [loading, setLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [activeStops, setActiveStops] = useState(initialPlan.stops);
  const [engineRunning, setEngineRunning] = useState(true);
  const [statusStep, setStatusStep] = useState(0);

  const t = tripText[language];
  const [chatLog, setChatLog] = useState<Array<{ role: "user" | "assistant"; text: string }>>([
    { role: "assistant", text: "Airport to town, nice." },
    { role: "user", text: modeAck(mode, t) },
    { role: "assistant", text: t.modeReply }
  ]);

  useEffect(() => {
    if (!engineRunning) return;
    setStatusStep(0);
    const tick1 = setTimeout(() => setStatusStep(1), 260);
    const tick2 = setTimeout(() => setStatusStep(2), 560);
    const tick3 = setTimeout(() => setStatusStep(3), 860);
    const done = setTimeout(() => setEngineRunning(false), 1100);
    return () => {
      clearTimeout(tick1);
      clearTimeout(tick2);
      clearTimeout(tick3);
      clearTimeout(done);
    };
  }, [engineRunning]);

  const surpriseShown = useMemo(() => Boolean(plan.surpriseDrop), [plan.surpriseDrop]);
  const etaTime = useMemo(
    () =>
      new Date(Date.now() + plan.etaMinutes * 60_000).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      }),
    [plan.etaMinutes]
  );

  async function triggerReplan(event: ContextEvent) {
    if (!event) return;
    setLoading(true);
    setEngineRunning(true);
    setStatusStep(0);

    const selected = eventLabels[language].find((x) => x.key === event);
    if (selected) {
      setChatLog((prev) => [...prev, { role: "user", text: selected.userText }]);
    }

    const res = await fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origin, destination, mode, event, language })
    });
    const nextPlan = (await res.json()) as RoutePlan;
    setPlan(nextPlan);
    setActiveStops(nextPlan.stops);

    const aiReply =
      event === "rain" ? t.rainReply : event === "traffic" ? t.trafficReply : t.tiredReply;
    setChatLog((prev) => [...prev, { role: "assistant", text: aiReply }]);

    setLoading(false);
    setTimeout(() => setEngineRunning(false), 900);
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
      surpriseDrop: plan.surpriseDrop
    };
    sessionStorage.setItem("travelbah_recap", JSON.stringify(recapPayload));
    router.push("/recap");
  }

  return (
    <div className="space-y-4">
      <section className={`glass-card rounded-2xl px-4 py-3 ${engineRunning ? "status-shimmer" : ""}`}>
        <p className="text-sm font-semibold text-text-primary">
          🧠 {t.optimizing}
          {engineRunning ? "..." : ""}
        </p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <span className={`rounded-full border border-border bg-white/75 px-2 py-1 transition-opacity ${statusStep >= 1 ? "opacity-100" : "opacity-40"}`}>
            {statusStep >= 1 ? "✓ " : "… "}
            {t.routeLocked}
          </span>
          <span className={`rounded-full border border-border bg-white/75 px-2 py-1 transition-opacity ${statusStep >= 2 ? "opacity-100" : "opacity-40"}`}>
            {statusStep >= 2 ? "✓ " : "… "}
            {fillTemplate(t.stopsFound, { n: String(activeStops.length) })}
          </span>
          <span className={`rounded-full border border-border bg-white/75 px-2 py-1 transition-opacity ${statusStep >= 3 ? "opacity-100" : "opacity-40"}`}>
            {statusStep >= 3 ? "✓ " : "… "}
            {fillTemplate(t.surpriseAdded, { n: plan.surpriseDrop ? "1" : "0" })}
          </span>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <section className={`glass-card relative rounded-2xl p-3 shadow-card ${loading ? "opacity-95" : ""}`}>
          <div className="absolute left-6 top-6 z-10 rounded-2xl border border-border bg-white/85 px-3 py-2 text-xs shadow-card">
            <p>🚗 {plan.distanceKm} km · {plan.etaMinutes} mins</p>
            <p>🍜 {activeStops.length} Food Stops</p>
            <p>⚡ {plan.surpriseDrop ? "1" : "0"} Surprise</p>
          </div>
          <MapView polyline={plan.polyline} origin={plan.origin} destination={plan.destination} stops={activeStops} surprise={plan.surpriseDrop} />
        </section>

        <section className="glass-card rounded-2xl p-4 shadow-card">
          <div className="mb-3 flex flex-wrap gap-2">
            {eventLabels[language].map((btn) => (
              <button
                key={btn.key}
                type="button"
                className="travelbah-lift rounded-full border border-border bg-white/75 px-3 py-1 text-sm hover:bg-white"
                onClick={() => triggerReplan(btn.key)}
                disabled={loading}
              >
                {btn.label}
              </button>
            ))}
          </div>
          <div className="mb-3 text-xs text-text-secondary">{t.simulate}</div>

          <div className="mb-3 rounded-2xl border border-border bg-white/80 p-3 text-sm">
            <p className="font-semibold">{t.route}</p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-xl bg-white/85 p-2 text-center">
                <p>🟢 {t.eta}</p>
                <p className="mt-1 font-semibold">{etaTime}</p>
              </div>
              <div className="rounded-xl bg-white/85 p-2 text-center">
                <p>🟣 {t.stops}</p>
                <p className="mt-1 font-semibold">{activeStops.length}</p>
              </div>
              <div className="rounded-xl bg-white/85 p-2 text-center">
                <p>🔵 {t.surprise}</p>
                <p className="mt-1 font-semibold">{plan.surpriseDrop ? "1" : "0"}</p>
              </div>
            </div>
          </div>

          {surpriseShown && plan.surpriseDrop ? (
            <div className="mb-3 rounded-2xl border border-[#8b5cf6]/45 bg-[rgba(248,245,255,0.92)] p-3 text-sm shadow-[0_0_0_1px_rgba(139,92,246,0.24),0_10px_24px_rgba(99,102,241,0.14)] transition-shadow hover:shadow-[0_0_0_1px_rgba(139,92,246,0.35),0_16px_32px_rgba(99,102,241,0.2)]">
              <p className="font-semibold">⚡ {t.surpriseDrop}</p>
              <p>
                {plan.surpriseDrop.name} {t.fitsSegment}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="inline-block rounded-[8px] bg-accent px-2 py-1 text-[0.75rem] text-white">{t.partner}</span>
                <button
                  className="travelbah-lift rounded border border-border bg-white px-2 py-0.5 text-xs"
                  onClick={() =>
                    setChatLog((prev) => [
                      ...prev,
                      { role: "user", text: `Add ${plan.surpriseDrop!.name}.` },
                      { role: "assistant", text: t.added }
                    ])
                  }
                >
                  {t.addStop}
                </button>
                <button
                  className="travelbah-lift rounded border border-border bg-white px-2 py-0.5 text-xs"
                  onClick={() =>
                    setChatLog((prev) => [
                      ...prev,
                      { role: "user", text: `Skip ${plan.surpriseDrop!.name}.` },
                      { role: "assistant", text: t.skipped }
                    ])
                  }
                >
                  {t.skip}
                </button>
              </div>
            </div>
          ) : null}

          <div className="mb-3 max-h-52 overflow-auto rounded-2xl border border-border bg-white/80 p-3">
            {activeStops.map((stop, idx) => (
              <div key={stop.id} className="mb-2 rounded-2xl border border-border p-2 text-sm transition-colors hover:bg-bg">
                <p className="font-medium">{idx + 1}. {stop.name}</p>
                <div className="mt-1 inline-block max-w-[92%] rounded-2xl border border-border bg-white px-3 py-1.5 text-xs text-text-secondary">
                  AI: After {stop.name}, swing by the next stop for a quick local fix.
                </div>
                {stop.category === "food" ? (
                  <div className="mt-2 space-y-2">
                    <div className="rounded-xl border border-border bg-white/80 p-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-secondary">3 Best Food</p>
                      <ul className="mt-1 text-xs text-text-primary">
                        {bestFoodsForStop(stop.id).map((dish) => (
                          <li key={`${stop.id}-${dish}`} className="mb-0.5">• {dish}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {foodPhotosForStop(stop.id).map((src, i) => (
                        <img key={`${stop.id}-photo-${i}`} src={src} alt={`${stop.name} food ${i + 1}`} className="h-16 w-full rounded-lg object-cover" loading="lazy" />
                      ))}
                    </div>
                  </div>
                ) : null}
                <div className="mt-1 flex gap-2">
                  <button
                    className="travelbah-lift rounded border border-border px-2 py-0.5 text-xs"
                    onClick={() =>
                      setChatLog((prev) => [...prev, { role: "user", text: `Add ${stop.name}.` }, { role: "assistant", text: t.added }])
                    }
                  >
                    {t.addStop}
                  </button>
                  <button
                    className="travelbah-lift rounded border border-border px-2 py-0.5 text-xs"
                    onClick={() => {
                      setActiveStops((prev) => prev.filter((s) => s.id !== stop.id));
                      setChatLog((prev) => [...prev, { role: "user", text: `Skip ${stop.name}.` }, { role: "assistant", text: t.skipped }]);
                    }}
                  >
                    {t.skip}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mb-2 max-h-56 overflow-auto rounded-2xl border border-border bg-white/80 p-3">
            {chatLog.map((line, idx) => (
              <div key={idx} className={`mb-2 flex ${line.role === "assistant" ? "justify-start" : "justify-end"}`}>
                <div
                  className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm ${
                    line.role === "assistant" ? "border border-border bg-white text-text-primary" : "gradient-primary text-white"
                  }`}
                >
                  {line.text}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendChat()}
              placeholder={t.askPlaceholder}
              className="flex-1 rounded-[14px] border border-border bg-white/70 px-3 py-2 text-sm outline-none backdrop-blur-[10px] transition-shadow focus:border-primary focus:shadow-[0_0_0_4px_rgba(79,70,229,0.16)]"
            />
            <button onClick={sendChat} className="travelbah-lift gradient-primary gradient-primary-flow rounded-[14px] px-3 py-2 text-sm font-semibold text-white">
              {t.ask}
            </button>
          </div>

          <button onClick={finishTrip} className="travelbah-lift gradient-primary-flow gradient-primary mt-3 w-full rounded-full px-4 py-3 font-semibold text-white">
            {t.endTrip}
          </button>
          <p className="mt-2 text-center text-xs text-text-secondary">{t.storyHint}</p>
        </section>
      </div>
    </div>
  );
}
