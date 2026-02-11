"use client";

import { TravelMode } from "@/lib/types";

const options: Array<{ value: TravelMode; label: string; emoji: string }> = [
  { value: "food", label: "Food-first", emoji: "🍜" },
  { value: "chill", label: "Chill", emoji: "😌" },
  { value: "efficient", label: "Efficient", emoji: "⚡" }
];

export function ModePicker({ value, onChange }: { value: TravelMode; onChange: (mode: TravelMode) => void }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`rounded-xl border px-4 py-3 text-left transition ${
            value === opt.value ? "border-ocean bg-ocean text-white" : "border-slate-300 bg-white/70 hover:border-ocean"
          }`}
        >
          <span className="mr-2">{opt.emoji}</span>
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
