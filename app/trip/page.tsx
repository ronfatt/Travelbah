import { Suspense } from "react";
import Link from "next/link";
import { TripPageClient } from "@/app/trip/TripPageClient";

export default function TripPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/" className="travelbah-lift text-2xl font-extrabold tracking-[0.02em]">
          <span className="title-gradient">TravelBah</span>
        </Link>
        <h1 className="text-xl font-semibold text-text-primary">TravelBah</h1>
      </div>
      <Suspense fallback={<div className="rounded-xl bg-white/70 p-4">...</div>}>
        <TripPageClient />
      </Suspense>
    </main>
  );
}
