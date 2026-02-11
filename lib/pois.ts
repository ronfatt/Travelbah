import { Poi, PoiCategory } from "@/lib/types";

const center = { lat: 4.244, lng: 117.889 };

const categoryConfig: Array<{ category: PoiCategory; count: number; baseNames: string[]; tags: string[] }> = [
  {
    category: "food",
    count: 60,
    baseNames: ["Seafood House", "Nasi Corner", "Satay Yard", "Halal Grill", "Local Kopitiam", "Roti Place"],
    tags: ["seafood", "local", "family", "halal", "cafe"]
  },
  {
    category: "stay",
    count: 15,
    baseNames: ["Harbor Hotel", "Lagoon Inn", "Town Suites", "Borneo Lodge", "Palm Stay"],
    tags: ["family", "budget", "city", "quiet"]
  },
  {
    category: "spot",
    count: 15,
    baseNames: ["Sunset Point", "Mangrove Walk", "Waterfront Deck", "Hill View", "Heritage Square"],
    tags: ["sunset", "photo", "nature", "local"]
  },
  {
    category: "entertainment",
    count: 10,
    baseNames: ["Bowling Zone", "Game Loft", "Cinema Hub", "Karaoke Bay", "Mini Park"],
    tags: ["indoor", "family", "night", "fun"]
  }
];

const descByCategory: Record<PoiCategory, string> = {
  food: "Popular local stop with quick service and reliable taste for travelers.",
  stay: "Convenient stay option near the route with practical facilities.",
  spot: "Easy photo-friendly landmark with strong Tawau local vibe.",
  entertainment: "Casual indoor option if weather changes or you need a break."
};

function seededOffset(idx: number) {
  const a = Math.sin(idx * 12.9898) * 43758.5453;
  const b = Math.sin((idx + 7) * 78.233) * 12345.6789;
  const lat = (a - Math.floor(a) - 0.5) * 0.22;
  const lng = (b - Math.floor(b) - 0.5) * 0.28;
  return { lat, lng };
}

function makePoi(category: PoiCategory, i: number, baseNames: string[], tags: string[]): Poi {
  const idx = `${category}-${i + 1}`;
  const name = `${baseNames[i % baseNames.length]} ${i + 1}`;
  const offset = seededOffset(i + category.length * 17);
  return {
    id: idx,
    name,
    category,
    lat: Number((center.lat + offset.lat).toFixed(6)),
    lng: Number((center.lng + offset.lng).toFixed(6)),
    short_desc: descByCategory[category],
    open_hours: "10:00-22:00",
    price_level: (((i % 4) + 1) as 1 | 2 | 3 | 4),
    tags,
    partner_level: i % 5 === 0 ? "partner" : "none"
  };
}

export const tawauPois: Poi[] = categoryConfig.flatMap((cfg) =>
  Array.from({ length: cfg.count }, (_, i) => makePoi(cfg.category, i, cfg.baseNames, cfg.tags))
);
