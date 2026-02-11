"use client";

import { useEffect, useState } from "react";
import { RecapCard } from "@/components/RecapCard";
import { Poi, TravelMode } from "@/lib/types";
import { haversineKm } from "@/lib/scoring";

type RecapPayload = {
  origin: string;
  destination: string;
  stops: Poi[];
  summary: string;
  polyline: [number, number][];
  distanceKm?: number;
  etaMinutes?: number;
  surpriseDrop?: Poi;
  mode?: TravelMode;
};

function computeDistanceKm(polyline: [number, number][]) {
  if (polyline.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < polyline.length; i += 1) {
    total += haversineKm(polyline[i - 1], polyline[i]);
  }
  return Number(total.toFixed(1));
}

export default function RecapPage() {
  const [data, setData] = useState<RecapPayload | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("travelbah_recap");
    if (!raw) return;
    setData(JSON.parse(raw) as RecapPayload);
  }, []);

  if (!data) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-10">
        <div className="rounded-2xl bg-white/75 p-6 shadow-card">No recap yet. Finish a trip first.</div>
      </main>
    );
  }

  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const featureCollection = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: { type: "LineString", coordinates: data.polyline },
        properties: { stroke: "#6366F1", "stroke-width": 11, "stroke-opacity": 0.3 }
      },
      {
        type: "Feature",
        geometry: { type: "LineString", coordinates: data.polyline },
        properties: { stroke: "#4F46E5", "stroke-width": 5, "stroke-opacity": 0.95 }
      },
      ...data.stops.slice(0, 6).map((stop, idx) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [stop.lng, stop.lat] },
        properties: {
          "marker-color": "#14B8A6",
          "marker-size": "small",
          "marker-symbol": String((idx + 1) % 10)
        }
      })),
      ...(data.surpriseDrop
        ? [
            {
              type: "Feature" as const,
              geometry: { type: "Point" as const, coordinates: [data.surpriseDrop.lng, data.surpriseDrop.lat] },
              properties: {
                "marker-color": "#8B5CF6",
                "marker-size": "small",
                "marker-symbol": "star"
              }
            }
          ]
        : [])
    ]
  };
  const overlays = `geojson(${encodeURIComponent(JSON.stringify(featureCollection))})`;
  const staticMapUrl = token
    ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${overlays}/auto/900x600?padding=44&access_token=${token}`
    : undefined;
  const distanceKm = data.distanceKm && data.distanceKm > 0 ? data.distanceKm : computeDistanceKm(data.polyline);
  const etaMinutes = data.etaMinutes && data.etaMinutes > 0 ? data.etaMinutes : Math.max(10, Math.round(distanceKm * 2.6));

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-10">
      <h1 className="mb-4 text-2xl font-bold">TravelBah Journey Story</h1>
      <RecapCard
        origin={data.origin}
        destination={data.destination}
        stops={data.stops}
        summary={data.summary}
        staticMapUrl={staticMapUrl}
        distanceKm={distanceKm}
        etaMinutes={etaMinutes}
        surpriseCount={data.surpriseDrop ? 1 : 0}
        mode={data.mode ?? "food"}
      />
    </main>
  );
}
