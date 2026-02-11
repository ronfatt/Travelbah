"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { TripClient } from "@/components/TripClient";
import { RoutePlan, TravelMode } from "@/lib/types";

export default function TripPage() {
  const search = useSearchParams();
  const origin = search.get("origin") ?? "Tawau Airport";
  const destination = search.get("destination") ?? "Tawau Town";
  const mode = (search.get("mode") as TravelMode) ?? "food";

  const [plan, setPlan] = useState<RoutePlan | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origin, destination, mode })
    })
      .then((res) => res.json())
      .then((data: RoutePlan) => {
        if (mounted) setPlan(data);
      });

    return () => {
      mounted = false;
    };
  }, [origin, destination, mode]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold text-ink">Live Trip</h1>
      {!plan ? <div className="rounded-xl bg-white/70 p-4">Planning your route...</div> : <TripClient initialPlan={plan} mode={mode} origin={origin} destination={destination} />}
    </main>
  );
}
