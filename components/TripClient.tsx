"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MapView } from "@/components/MapView";
import { ContextEvent, RoutePlan, TravelLanguage, TravelMode } from "@/lib/types";
import { recapSummary } from "@/lib/prompt";

const eventLabels: Record<TravelLanguage, Array<{ key: ContextEvent; label: string; userText: string }>> = {
  en: [
    { key: "rain", label: "🌧️ Rain", userText: "Rain mode on." },
    { key: "traffic", label: "🚗 Traffic", userText: "Traffic is getting heavy." },
    { key: "tired", label: "💤 I'm tired", userText: "I need a lighter pace." }
  ],
  zh: [
    { key: "rain", label: "🌧️ 下雨", userText: "切换到下雨场景。" },
    { key: "traffic", label: "🚗 塞车", userText: "现在路上有点塞。" },
    { key: "tired", label: "💤 我累了", userText: "我想走轻松一点。" }
  ],
  ms: [
    { key: "rain", label: "🌧️ Hujan", userText: "Aktifkan mod hujan." },
    { key: "traffic", label: "🚗 Trafik", userText: "Trafik semakin sesak." },
    { key: "tired", label: "💤 Saya penat", userText: "Saya mahu pace lebih ringan." }
  ]
};

const tripText: Record<TravelLanguage, Record<string, string>> = {
  en: {
    route: "Route Snapshot",
    eta: "ETA",
    stops: "Stops",
    surprise: "Surprise",
    surpriseDrop: "Surprise Drop",
    fitsSegment: "fits this segment.",
    partner: "Recommended Partner",
    addStop: "Add stop",
    skip: "Skip",
    askPlaceholder: "Ask anything...",
    send: "Send",
    endTrip: "🎉 Generate My Journey Story",
    added: "Added {name} to the route.",
    skipped: "Skipped {name}, keep moving.",
    simulate: "Simulate live changes",
    modeAckFood: "You: Pick Food-first.",
    modeAckChill: "You: Pick Chill mode.",
    modeAckEfficient: "You: Pick Efficient mode.",
    modeReply: "Got it. I'll line up 3 solid stops."
  },
  zh: {
    route: "路线快照",
    eta: "预计到达",
    stops: "停靠",
    surprise: "惊喜",
    surpriseDrop: "惊喜推荐",
    fitsSegment: "适合这段行程。",
    partner: "Recommended Partner",
    addStop: "加入停靠",
    skip: "跳过",
    askPlaceholder: "随时问我...",
    send: "发送",
    endTrip: "🎉 Generate My Journey Story",
    added: "已把 {name} 加入路线。",
    skipped: "已跳过 {name}，继续前进。",
    simulate: "模拟实时变化",
    modeAckFood: "你：选择 Food-first。",
    modeAckChill: "你：选择 Chill。",
    modeAckEfficient: "你：选择 Efficient。",
    modeReply: "收到，我会排 3 个扎实停靠点。"
  },
  ms: {
    route: "Ringkasan Laluan",
    eta: "Jangka Tiba",
    stops: "Hentian",
    surprise: "Surprise",
    surpriseDrop: "Cadangan Kejutan",
    fitsSegment: "sesuai untuk segmen ini.",
    partner: "Recommended Partner",
    addStop: "Tambah hentian",
    skip: "Lepas",
    askPlaceholder: "Tanya apa saja...",
    send: "Hantar",
    endTrip: "🎉 Generate My Journey Story",
    added: "{name} ditambah ke laluan.",
    skipped: "{name} dilepaskan, teruskan perjalanan.",
    simulate: "Simulasi perubahan langsung",
    modeAckFood: "Anda: pilih Food-first.",
    modeAckChill: "Anda: pilih Chill.",
    modeAckEfficient: "Anda: pilih Efficient.",
    modeReply: "Baik, saya susun 3 hentian yang mantap."
  }
};

function fillTemplate(template: string, name: string) {
  return template.replace("{name}", name);
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

  const t = tripText[language];
  const [chatLog, setChatLog] = useState<Array<{ role: "user" | "assistant"; text: string }>>([
    { role: "assistant", text: `Airport to town, nice. ${initialPlan.aiIntro}` },
    { role: "user", text: modeAck(mode, t) },
    { role: "assistant", text: t.modeReply },
    { role: "assistant", text: initialPlan.strategy }
  ]);

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
    setChatLog((prev) => [...prev, { role: "assistant", text: nextPlan.strategy }]);
    setLoading(false);
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
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <section className="glass-card rounded-2xl p-3 shadow-card">
        <MapView polyline={plan.polyline} origin={plan.origin} destination={plan.destination} stops={activeStops} />
      </section>

      <section className="glass-card rounded-2xl p-4 shadow-card">
        <div className="mb-1 text-xs uppercase tracking-[0.08em] text-text-secondary">{t.simulate}</div>
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
          <p className="mt-2 text-text-secondary">{plan.distanceKm} km · ~{plan.etaMinutes} mins</p>
        </div>

        {surpriseShown && plan.surpriseDrop ? (
          <div className="mb-3 rounded-2xl border border-accent/50 bg-[#fff8ec] p-3 text-sm shadow-[0_0_0_1px_rgba(20,184,166,0.16),0_10px_24px_rgba(20,184,166,0.1)] animate-pulse">
            <p className="font-semibold">⚡ {t.surpriseDrop}</p>
            <p>
              {plan.surpriseDrop.name} {t.fitsSegment}
            </p>
            {plan.surpriseDrop.partner_level === "partner" && (
              <span className="mt-1 inline-block rounded-[8px] bg-accent px-2 py-1 text-[0.75rem] text-white">{t.partner}</span>
            )}
          </div>
        ) : null}

        <div className="mb-3 max-h-52 overflow-auto rounded-2xl border border-border bg-white/80 p-3">
          {activeStops.map((stop) => (
            <div key={stop.id} className="mb-2 rounded-2xl border border-border p-2 text-sm transition-colors hover:bg-bg">
              <p className="font-medium">{stop.name}</p>
              <p className="text-text-secondary">{stop.short_desc}</p>
              <div className="mt-1 flex gap-2">
                <button
                  className="travelbah-lift rounded border border-border px-2 py-0.5 text-xs"
                  onClick={() => {
                    setChatLog((prev) => [...prev, { role: "user", text: `${t.addStop}: ${stop.name}` }, { role: "assistant", text: fillTemplate(t.added, stop.name) }]);
                  }}
                >
                  {t.addStop}
                </button>
                <button
                  className="travelbah-lift rounded border border-border px-2 py-0.5 text-xs"
                  onClick={() => {
                    setActiveStops((prev) => prev.filter((s) => s.id !== stop.id));
                    setChatLog((prev) => [...prev, { role: "user", text: `${t.skip}: ${stop.name}` }, { role: "assistant", text: fillTemplate(t.skipped, stop.name) }]);
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
                  line.role === "assistant" ? "bg-white text-text-primary border border-border" : "gradient-primary text-white"
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
            className="flex-1 rounded-[14px] border border-border px-3 py-2 text-sm outline-none transition-shadow focus:border-primary focus:shadow-[0_0_0_4px_rgba(22,94,99,0.12)]"
          />
          <button onClick={sendChat} className="travelbah-lift rounded-[14px] bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary-dark">
            {t.send}
          </button>
        </div>

        <button onClick={finishTrip} className="travelbah-lift gradient-primary-flow gradient-primary mt-3 w-full rounded-full px-4 py-3 font-semibold text-white">
          {t.endTrip}
        </button>
      </section>
    </div>
  );
}
