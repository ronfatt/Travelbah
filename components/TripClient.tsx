"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MapView } from "@/components/MapView";
import { ContextEvent, RoutePlan, TravelLanguage, TravelMode } from "@/lib/types";
import { recapSummary } from "@/lib/prompt";

const eventLabels: Record<TravelLanguage, Array<{ key: ContextEvent; label: string }>> = {
  en: [
    { key: "rain", label: "🌧️ Rain" },
    { key: "traffic", label: "🚗 Traffic" },
    { key: "tired", label: "💤 I'm tired" }
  ],
  zh: [
    { key: "rain", label: "🌧️ 下雨" },
    { key: "traffic", label: "🚗 塞车" },
    { key: "tired", label: "💤 我累了" }
  ],
  ms: [
    { key: "rain", label: "🌧️ Hujan" },
    { key: "traffic", label: "🚗 Trafik" },
    { key: "tired", label: "💤 Saya penat" }
  ]
};

const tripText: Record<TravelLanguage, Record<string, string>> = {
  en: {
    route: "Route",
    surpriseDrop: "Surprise Drop",
    fitsSegment: "fits this segment.",
    partner: "Recommended Partner",
    addStop: "Add stop",
    skip: "Skip",
    askPlaceholder: "Ask anything...",
    send: "Send",
    endTrip: "End Trip & Generate Recap",
    guide: "Guide",
    you: "You",
    added: "Added {name} to your active route.",
    skipped: "Skipped {name}, route stays stable."
  },
  zh: {
    route: "路线",
    surpriseDrop: "惊喜推荐",
    fitsSegment: "适合这段行程。",
    partner: "推荐合作伙伴",
    addStop: "加入停靠",
    skip: "跳过",
    askPlaceholder: "随时问我...",
    send: "发送",
    endTrip: "结束旅程并生成回忆卡",
    guide: "向导",
    you: "你",
    added: "已把 {name} 加入当前路线。",
    skipped: "已跳过 {name}，整体路线保持稳定。"
  },
  ms: {
    route: "Laluan",
    surpriseDrop: "Cadangan Kejutan",
    fitsSegment: "sesuai untuk segmen ini.",
    partner: "Rakan disyorkan",
    addStop: "Tambah hentian",
    skip: "Lepas",
    askPlaceholder: "Tanya apa saja...",
    send: "Hantar",
    endTrip: "Tamatkan Trip & Jana Recap",
    guide: "Pemandu",
    you: "Anda",
    added: "{name} ditambah ke laluan aktif anda.",
    skipped: "{name} dilepaskan, laluan kekal stabil."
  }
};

function fillTemplate(template: string, name: string) {
  return template.replace("{name}", name);
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
  const [chatLog, setChatLog] = useState<Array<{ role: "user" | "assistant"; text: string }>>([
    { role: "assistant", text: initialPlan.aiIntro },
    { role: "assistant", text: initialPlan.strategy }
  ]);

  const t = tripText[language];
  const surpriseShown = useMemo(() => Boolean(plan.surpriseDrop), [plan.surpriseDrop]);

  async function triggerReplan(event: ContextEvent) {
    if (!event) return;
    setLoading(true);
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
      <section className="rounded-2xl border border-border bg-card/85 p-3 shadow-card">
        <MapView polyline={plan.polyline} origin={plan.origin} destination={plan.destination} stops={activeStops} />
      </section>

      <section className="rounded-2xl border border-border bg-card/90 p-4 shadow-card">
        <div className="mb-3 flex flex-wrap gap-2">
          {eventLabels[language].map((btn) => (
            <button
              key={btn.key}
              type="button"
              className="travelbah-lift rounded-full border border-border bg-card px-3 py-1 text-sm hover:bg-bg"
              onClick={() => triggerReplan(btn.key)}
              disabled={loading}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div className="mb-3 rounded-2xl border border-border bg-card p-3 text-sm">
          <p className="font-semibold">{t.route}</p>
          <p>
            {plan.distanceKm} km · ~{plan.etaMinutes} mins
          </p>
          <p className="mt-1 text-text-secondary">{plan.strategy}</p>
        </div>

        {surpriseShown && plan.surpriseDrop ? (
          <div className="mb-3 rounded-2xl border border-accent/50 bg-[#fff8ec] p-3 text-sm">
            <p className="font-semibold">{t.surpriseDrop}</p>
            <p>
              {plan.surpriseDrop.name} {t.fitsSegment}
            </p>
            {plan.surpriseDrop.partner_level === "partner" && (
              <span className="mt-1 inline-block rounded-[8px] bg-accent px-2 py-1 text-[0.75rem] text-white">{t.partner}</span>
            )}
          </div>
        ) : null}

        <div className="mb-3 max-h-52 overflow-auto rounded-2xl border border-border bg-card p-3">
          {activeStops.map((stop) => (
            <div key={stop.id} className="mb-2 rounded-2xl border border-border p-2 text-sm transition-colors hover:bg-bg">
              <p className="font-medium">{stop.name}</p>
              <p className="text-text-secondary">{stop.short_desc}</p>
              <div className="mt-1 flex gap-2">
                <button
                  className="travelbah-lift rounded border border-border px-2 py-0.5 text-xs"
                  onClick={() => setChatLog((prev) => [...prev, { role: "assistant", text: fillTemplate(t.added, stop.name) }])}
                >
                  {t.addStop}
                </button>
                <button
                  className="travelbah-lift rounded border border-border px-2 py-0.5 text-xs"
                  onClick={() => {
                    setActiveStops((prev) => prev.filter((s) => s.id !== stop.id));
                    setChatLog((prev) => [...prev, { role: "assistant", text: fillTemplate(t.skipped, stop.name) }]);
                  }}
                >
                  {t.skip}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-2 max-h-56 overflow-auto rounded-2xl border border-border bg-card p-3">
          {chatLog.map((line, idx) => (
            <p key={idx} className={`mb-2 text-sm ${line.role === "assistant" ? "text-text-primary" : "text-primary"}`}>
              <span className="font-semibold">{line.role === "assistant" ? t.guide : t.you}:</span> {line.text}
            </p>
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

        <button onClick={finishTrip} className="travelbah-lift mt-3 w-full rounded-[18px] bg-primary-dark px-4 py-3 font-semibold text-white hover:bg-primary">
          {t.endTrip}
        </button>
      </section>
    </div>
  );
}
