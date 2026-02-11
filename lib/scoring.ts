import { Poi, RoutePlan, TravelMode, ContextEvent } from "@/lib/types";
import { tawauPois } from "@/lib/pois";

type Coord = [number, number];

const modeBonus: Record<TravelMode, Record<Poi["category"], number>> = {
  food: { food: 3, stay: 1, spot: 1, entertainment: 1 },
  chill: { food: 2, stay: 2, spot: 3, entertainment: 2 },
  efficient: { food: 1, stay: 2, spot: 1, entertainment: 1 }
};

export function haversineKm(a: Coord, b: Coord) {
  const R = 6371;
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLon = ((b[0] - a[0]) * Math.PI) / 180;
  const lat1 = (a[1] * Math.PI) / 180;
  const lat2 = (b[1] * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function minDistanceToRouteKm(poi: Poi, route: Coord[]) {
  return Math.min(...route.map((c) => haversineKm(c, [poi.lng, poi.lat])));
}

function timeMatchBonus(tags: string[]) {
  const hour = new Date().getHours();
  if ((hour >= 11 && hour <= 14) || (hour >= 18 && hour <= 21)) {
    return tags.includes("seafood") || tags.includes("local") ? 2 : 1;
  }
  return tags.includes("cafe") || tags.includes("quiet") ? 2 : 1;
}

function eventModifier(poi: Poi, event: ContextEvent) {
  if (!event) return 0;
  if (event === "rain") return poi.tags.includes("indoor") || poi.category === "stay" ? 3 : -1;
  if (event === "traffic") return poi.category === "food" || poi.category === "stay" ? 2 : 0;
  if (event === "tired") return poi.tags.includes("quiet") || poi.category === "stay" || poi.category === "entertainment" ? 3 : -1;
  return 0;
}

function scorePoi(poi: Poi, route: Coord[], mode: TravelMode, event: ContextEvent) {
  const routeDist = minDistanceToRouteKm(poi, route);
  const routeBonus = routeDist <= 1 ? 2 : routeDist <= 3 ? 1 : -2;
  return (
    routeBonus +
    modeBonus[mode][poi.category] +
    timeMatchBonus(poi.tags) +
    (poi.partner_level === "partner" ? 1 : 0) +
    eventModifier(poi, event)
  );
}

export function searchPoisAlongRoute(route: Coord[], mode: TravelMode, event: ContextEvent = null) {
  const scored = tawauPois
    .map((poi) => ({ poi, score: scorePoi(poi, route, mode, event) }))
    .filter((x) => x.score > 1)
    .sort((a, b) => b.score - a.score);

  const chosen: Poi[] = [];
  for (const item of scored) {
    if (chosen.length >= 6) break;
    if (chosen.some((c) => c.category === item.poi.category && c.name.split(" ")[0] === item.poi.name.split(" ")[0])) {
      continue;
    }
    chosen.push(item.poi);
  }
  return chosen.slice(0, Math.max(3, chosen.length));
}

export function chooseSurpriseDrop(plan: RoutePlan, mode: TravelMode) {
  const progressIndex = Math.floor(plan.polyline.length * 0.4);
  const nearCoord = plan.polyline[progressIndex] ?? plan.polyline[Math.floor(plan.polyline.length / 2)];

  const pool = tawauPois
    .map((poi) => {
      const dist = haversineKm(nearCoord, [poi.lng, poi.lat]);
      const score = (dist <= 1.5 ? 2 : dist <= 3 ? 1 : -2) + modeBonus[mode][poi.category] + (poi.partner_level === "partner" ? 1 : 0);
      return { poi, score };
    })
    .filter((x) => x.score >= 3)
    .sort((a, b) => b.score - a.score);

  return pool[0]?.poi;
}
