import { Suspense } from "react";
import { TripPageClient } from "@/app/trip/TripPageClient";

export default function TripPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold text-ink">Live Trip</h1>
      <Suspense fallback={<div className="rounded-xl bg-white/70 p-4">Loading trip...</div>}>
        <TripPageClient />
      </Suspense>
    </main>
  );
}
