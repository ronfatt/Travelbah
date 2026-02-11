"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { TripClient } from "@/components/TripClient";
import { RoutePlan, TravelLanguage, TravelMode } from "@/lib/types";
import { normalizeLanguage } from "@/lib/i18n";

export function TripPageClient() {
  const search = useSearchParams();
  const origin = search.get("origin") ?? "Tawau Airport";
  const destination = search.get("destination") ?? "Tawau Town";
  const mode = (search.get("mode") as TravelMode) ?? "food";
  const language = normalizeLanguage(search.get("language") as TravelLanguage);
  const loadingText = language === "zh" ? "正在规划你的路线..." : language === "ms" ? "Sedang merancang laluan anda..." : "Planning your route...";

  const [plan, setPlan] = useState<RoutePlan | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origin, destination, mode, language })
    })
      .then((res) => res.json())
      .then((data: RoutePlan) => {
        if (mounted) setPlan(data);
      });

    return () => {
      mounted = false;
    };
  }, [origin, destination, mode, language]);

  return (
    <>
      {!plan ? (
        <div className="rounded-xl bg-white/70 p-4">{loadingText}</div>
      ) : (
        <TripClient initialPlan={plan} mode={mode} origin={origin} destination={destination} language={language} />
      )}
    </>
  );
}
