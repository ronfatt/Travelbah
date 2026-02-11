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
    partner: "Recommended partner",
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
      <section className="rounded-2xl bg-white/65 p-3 shadow-card">
        <MapView polyline={plan.polyline} origin={plan.origin} destination={plan.destination} stops={activeStops} />
      </section>

      <section className="rounded-2xl bg-white/75 p-4 shadow-card">
        <div className="mb-3 flex flex-wrap gap-2">
          {eventLabels[language].map((btn) => (
            <button
              key={btn.key}
              type="button"
              className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm hover:border-ocean"
              onClick={() => triggerReplan(btn.key)}
              disabled={loading}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div className="mb-3 rounded-xl border border-slate-200 bg-white p-3 text-sm">
          <p className="font-semibold">{t.route}</p>
          <p>
            {plan.distanceKm} km · ~{plan.etaMinutes} mins
          </p>
          <p className="mt-1 text-slate-600">{plan.strategy}</p>
        </div>

        {surpriseShown && plan.surpriseDrop ? (
          <div className="mb-3 rounded-xl border border-sunset bg-orange-50 p-3 text-sm">
            <p className="font-semibold">{t.surpriseDrop}</p>
            <p>
              {plan.surpriseDrop.name} {t.fitsSegment}
            </p>
            {plan.surpriseDrop.partner_level === "partner" && (
              <span className="mt-1 inline-block rounded bg-leaf px-2 py-0.5 text-xs text-white">{t.partner}</span>
            )}
          </div>
        ) : null}

        <div className="mb-3 max-h-52 overflow-auto rounded-xl border border-slate-200 bg-white p-3">
          {activeStops.map((stop) => (
            <div key={stop.id} className="mb-2 rounded-lg border border-slate-100 p-2 text-sm">
              <p className="font-medium">{stop.name}</p>
              <p className="text-slate-600">{stop.short_desc}</p>
              <div className="mt-1 flex gap-2">
                <button
                  className="rounded border px-2 py-0.5 text-xs"
                  onClick={() => setChatLog((prev) => [...prev, { role: "assistant", text: fillTemplate(t.added, stop.name) }])}
                >
                  {t.addStop}
                </button>
                <button
                  className="rounded border px-2 py-0.5 text-xs"
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

        <div className="mb-2 max-h-56 overflow-auto rounded-xl border border-slate-200 bg-white p-3">
          {chatLog.map((line, idx) => (
            <p key={idx} className={`mb-2 text-sm ${line.role === "assistant" ? "text-slate-700" : "text-ocean"}`}>
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
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button onClick={sendChat} className="rounded-lg bg-ocean px-3 py-2 text-sm font-semibold text-white">
            {t.send}
          </button>
        </div>

        <button onClick={finishTrip} className="mt-3 w-full rounded-lg bg-leaf px-4 py-2 font-semibold text-white">
          {t.endTrip}
        </button>
      </section>
    </div>
  );
}
