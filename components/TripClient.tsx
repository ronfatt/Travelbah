"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MapView } from "@/components/MapView";
import { ContextEvent, Poi, RoutePlan, TravelLanguage, TravelMode } from "@/lib/types";
import { recapSummary } from "@/lib/prompt";

type Phase = "analyzing" | "briefing" | "interactive";

const labels = {
  analyzing: "TravelBah is analyzing your journey...",
  briefing: "Journey Briefing",
  simulate: "Simulate real-time changes",
  askPlaceholder: "Any sunset spots nearby?",
  askBtn: "Ask",
  endBtn: "🎉 Generate My Journey Story",
  storyHint: "Create a shareable recap of today's route.",
  add3: "Add 3 food stops",
  keepFast: "Keep fast route",
  showScenic: "Show scenic option"
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

function seededIndex(seed: string, max: number) {
  return seed.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % max;
}

function top3Dishes(stop: Poi) {
  const base = seededIndex(stop.id, DISH_POOL.length);
  return [DISH_POOL[base], DISH_POOL[(base + 2) % DISH_POOL.length], DISH_POOL[(base + 4) % DISH_POOL.length]];
}

function whereLine(stop: Poi) {
  return `Near ${stop.lat.toFixed(3)}, ${stop.lng.toFixed(3)} · ${stop.category}`;
}

function aiIntro(mode: TravelMode, eta: number) {
  if (mode === "food") {
    return "You'll hit mild traffic near Mile 3, but nothing serious. I see 3 solid local food spots and 2 scenic stops along your path. Want me to line them up for you?";
  }
  if (mode === "efficient") {
    return `Travel time's stable at ${eta} mins. Fastest route locked. I can keep it clean - or add 1 quick local stop. Your call.`;
  }
  return "Rain might slow things a little, but views are clear by the coast. I can blend 2 scenic stops into your ride. Want the slow route?";
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
      setChatLog([{ role: "assistant", text: aiIntro(mode, plan.etaMinutes) }]);
    }, 1000);
    return () => clearTimeout(timer);
  }, [mode, plan.etaMinutes]);

  async function triggerReplan(event: ContextEvent) {
    if (!event) return;
    setLoading(true);
    setPhase("analyzing");

    const userText = event === "rain" ? "Rain detected." : event === "traffic" ? "Traffic building up." : "I need a lighter pace.";
    setChatLog((prev) => [...prev, { role: "user", text: userText }]);

    const res = await fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origin, destination, mode, event, language })
    });
    const nextPlan = (await res.json()) as RoutePlan;
    setPlan(nextPlan);
    setActiveStops(nextPlan.stops);

    const aiReply =
      event === "rain"
        ? "Rain detected. Switching first stop to indoor seating."
        : event === "traffic"
          ? "Mile 3 congestion updated. Shifting route to inner road."
          : "Got it. Slowing the pace and keeping the smooth route.";

    setTimeout(() => {
      setPhase("interactive");
      setChatLog((prev) => [...prev, { role: "assistant", text: aiReply }]);
    }, 900);

    setLoading(false);
  }

  function applyChoice(choice: "add3" | "fast" | "scenic") {
    const nextStops = reorderForChoice(choice, plan.stops);
    setActiveStops(nextStops);
    setPhase("interactive");

    const userText = choice === "add3" ? "Add 3 food stops." : choice === "fast" ? "Keep fast route." : "Show scenic option.";
    const aiText =
      choice === "add3"
        ? "Locked. Added 3 food stops with strong local hits."
        : choice === "fast"
          ? "Fast route locked. Keeping it clean and direct."
          : "Scenic option on. Added 2 coastal view stops.";
    setChatLog((prev) => [...prev, { role: "user", text: userText }, { role: "assistant", text: aiText }]);
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
      mode
    };
    sessionStorage.setItem("travelbah_recap", JSON.stringify(recapPayload));
    router.push("/recap");
  }

  return (
    <div className="space-y-4">
      <section className={`glass-card rounded-2xl px-4 py-3 ${phase === "analyzing" ? "status-shimmer" : ""}`}>
        <p className="text-sm font-semibold text-text-primary">🧠 {phase === "analyzing" ? labels.analyzing : "TravelBah route engine locked."}</p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-border bg-white/75 px-2 py-1">✓ Route locked</span>
          <span className="rounded-full border border-border bg-white/75 px-2 py-1">✓ {activeStops.length} stops found</span>
          <span className="rounded-full border border-border bg-white/75 px-2 py-1">✓ {plan.surpriseDrop ? 1 : 0} surprise added</span>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <section className={`glass-card relative rounded-2xl p-3 shadow-card ${loading ? "opacity-95" : ""}`}>
          <div className="absolute left-6 top-6 z-10 rounded-2xl border border-border bg-white/85 px-3 py-2 text-xs shadow-card">
            <p>🚗 {plan.distanceKm} km · {plan.etaMinutes} mins</p>
            <p>🍜 {activeStops.length} Food Stops</p>
            <p>⚡ {plan.surpriseDrop ? "1" : "0"} Surprise</p>
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
            <p className="mt-1">🚗 Estimated travel time: {plan.etaMinutes} mins</p>
            <p>🌦 Weather: Light rain near city center</p>
            <p>🚦 Traffic: Moderate congestion at Mile 3</p>
            <p>🛣 Inner road faster than coastal route</p>
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
                <p className="mt-0.5 text-xs text-text-secondary">📍 {whereLine(stop)}</p>

                {stop.category === "food" ? (
                  <div className="mt-1 rounded-lg border border-border bg-white p-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-secondary">Top 3 Dishes</p>
                    <ul className="mt-1 text-xs text-text-primary">
                      {top3Dishes(stop).map((dish) => (
                        <li key={`${stop.id}-${dish}`}>• {dish}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-text-secondary">Recommended as a {stop.category} stop along your route.</p>
                )}

                <div className="mt-2 flex gap-2">
                  <button
                    className="travelbah-lift rounded border border-border px-2 py-0.5 text-xs"
                    onClick={() =>
                      setChatLog((prev) => [...prev, { role: "user", text: `Add ${stop.name}.` }, { role: "assistant", text: "Added. I’ll keep the route balanced." }])
                    }
                  >
                    Add
                  </button>
                  <button
                    className="travelbah-lift rounded border border-border px-2 py-0.5 text-xs"
                    onClick={() => {
                      setActiveStops((prev) => prev.filter((s) => s.id !== stop.id));
                      setChatLog((prev) => [...prev, { role: "user", text: `Skip ${stop.name}.` }, { role: "assistant", text: "Skipped. Keeping route efficient." }]);
                    }}
                  >
                    Skip
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
            <button type="button" className="travelbah-lift rounded-full border border-border bg-white px-3 py-1 text-sm" onClick={() => triggerReplan("rain")}>🌧 Rain</button>
            <button type="button" className="travelbah-lift rounded-full border border-border bg-white px-3 py-1 text-sm" onClick={() => triggerReplan("traffic")}>🚗 Traffic</button>
            <button type="button" className="travelbah-lift rounded-full border border-border bg-white px-3 py-1 text-sm" onClick={() => triggerReplan("tired")}>💤 I&apos;m tired</button>
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
