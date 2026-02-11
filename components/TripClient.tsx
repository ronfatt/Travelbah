"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MapView } from "@/components/MapView";
import { ContextEvent, RoutePlan, TravelMode } from "@/lib/types";

const eventButtons: Array<{ key: ContextEvent; label: string }> = [
  { key: "rain", label: "🌧️ Rain" },
  { key: "traffic", label: "🚗 Traffic" },
  { key: "tired", label: "💤 I'm tired" }
];

export function TripClient({
  initialPlan,
  mode,
  origin,
  destination
}: {
  initialPlan: RoutePlan;
  mode: TravelMode;
  origin: string;
  destination: string;
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

  const surpriseShown = useMemo(() => Boolean(plan.surpriseDrop), [plan.surpriseDrop]);

  async function triggerReplan(event: ContextEvent) {
    if (!event) return;
    setLoading(true);
    const res = await fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origin, destination, mode, event })
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
      body: JSON.stringify({ message: text, mode, stops: activeStops, origin, destination })
    });
    const data = (await res.json()) as { reply: string };
    setChatLog((prev) => [...prev, { role: "assistant", text: data.reply }]);
  }

  function finishTrip() {
    const recapPayload = {
      origin,
      destination,
      stops: activeStops,
      summary: `From ${origin} to ${destination}, we kept the route practical and still added local flavor.`,
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
          {eventButtons.map((btn) => (
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
          <p className="font-semibold">Route</p>
          <p>{plan.distanceKm} km · ~{plan.etaMinutes} mins</p>
          <p className="mt-1 text-slate-600">{plan.strategy}</p>
        </div>

        {surpriseShown && plan.surpriseDrop ? (
          <div className="mb-3 rounded-xl border border-sunset bg-orange-50 p-3 text-sm">
            <p className="font-semibold">Surprise Drop</p>
            <p>{plan.surpriseDrop.name} fits this segment.</p>
            {plan.surpriseDrop.partner_level === "partner" && (
              <span className="mt-1 inline-block rounded bg-leaf px-2 py-0.5 text-xs text-white">Recommended partner</span>
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
                  onClick={() => setChatLog((prev) => [...prev, { role: "assistant", text: `Added ${stop.name} to your active route.` }])}
                >
                  Add stop
                </button>
                <button
                  className="rounded border px-2 py-0.5 text-xs"
                  onClick={() => {
                    setActiveStops((prev) => prev.filter((s) => s.id !== stop.id));
                    setChatLog((prev) => [...prev, { role: "assistant", text: `Skipped ${stop.name}, route stays stable.` }]);
                  }}
                >
                  Skip
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-2 max-h-56 overflow-auto rounded-xl border border-slate-200 bg-white p-3">
          {chatLog.map((line, idx) => (
            <p key={idx} className={`mb-2 text-sm ${line.role === "assistant" ? "text-slate-700" : "text-ocean"}`}>
              <span className="font-semibold">{line.role === "assistant" ? "Guide" : "You"}:</span> {line.text}
            </p>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendChat()}
            placeholder="Ask anything..."
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button onClick={sendChat} className="rounded-lg bg-ocean px-3 py-2 text-sm font-semibold text-white">
            Send
          </button>
        </div>

        <button onClick={finishTrip} className="mt-3 w-full rounded-lg bg-leaf px-4 py-2 font-semibold text-white">
          End Trip & Generate Recap
        </button>
      </section>
    </div>
  );
}
