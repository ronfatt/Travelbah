"use client";

import { useEffect, useState } from "react";
import { RecapCard } from "@/components/RecapCard";
import { Poi } from "@/lib/types";

type RecapPayload = {
  origin: string;
  destination: string;
  stops: Poi[];
  summary: string;
  polyline: [number, number][];
};

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
  const path = encodeURIComponent(data.polyline.map((p) => `${p[0]},${p[1]}`).join(";"));
  const staticMapUrl = token
    ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/path-4+f78a4d(${path})/117.89,4.25,9/900x400?access_token=${token}`
    : undefined;

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-10">
      <h1 className="mb-4 text-2xl font-bold">Trip Recap</h1>
      <RecapCard origin={data.origin} destination={data.destination} stops={data.stops} summary={data.summary} staticMapUrl={staticMapUrl} />
    </main>
  );
}
