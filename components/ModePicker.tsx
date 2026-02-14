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
          className={`mode-option-card travelbah-lift rounded-[20px] border px-5 py-5 text-left ${
            value === opt.value
              ? `mode-option-card--active mode-option-card--${opt.value}`
              : "mode-card text-text-primary"
          }`}
        >
          <p className="text-base font-semibold">
            <span className={`mr-2 inline-block transition-transform duration-300 ${value === opt.value ? "scale-[1.12]" : ""}`}>{opt.emoji}</span>
            {opt.label}
          </p>
          <p className={`mt-1 text-xs ${value === opt.value ? "text-white/95" : "text-text-secondary"}`}>{opt.desc}</p>
        </button>
      ))}
    </div>
  );
}
