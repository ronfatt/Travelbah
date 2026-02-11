"use client";

import { TravelMode } from "@/lib/types";

const options: Array<{ value: TravelMode; label: string; emoji: string; desc: string }> = [
  { value: "food", label: "Food-first", emoji: "🍜", desc: "Eat your way into town" },
  { value: "chill", label: "Chill", emoji: "😌", desc: "Scenic, relaxed, no rush" },
  { value: "efficient", label: "Efficient", emoji: "⚡", desc: "Fast, optimized, minimal stops" }
];

export function ModePicker({ value, onChange }: { value: TravelMode; onChange: (mode: TravelMode) => void }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`travelbah-lift rounded-2xl border px-4 py-4 text-left transition-colors ${
            value === opt.value
              ? "border-transparent text-white shadow-glow gradient-primary"
              : "border-border bg-white/70 text-text-primary hover:border-primary hover:bg-white"
          }`}
        >
          <p className="text-base font-semibold">
            <span className="mr-2">{opt.emoji}</span>
            {opt.label}
          </p>
          <p className={`mt-1 text-xs ${value === opt.value ? "text-white/90" : "text-text-secondary"}`}>{opt.desc}</p>
        </button>
      ))}
    </div>
  );
}
