import { TravelMode } from "@/lib/types";

type LngLat = [number, number];

const fallbackPlaces: Record<string, LngLat> = {
  "tawau airport": [117.894444, 4.320278],
  "tawau town": [117.895, 4.244],
  tawau: [117.889, 4.244],
  semporna: [118.611, 4.481],
  kk: [116.074, 5.980]
};

function inferSabahPlace(rawPlace: string): LngLat | null {
  const place = rawPlace.trim().toLowerCase();
  if (place in fallbackPlaces) return fallbackPlaces[place];
  if (place.includes("tawau airport")) return fallbackPlaces["tawau airport"];
  if (place.includes("tawau town")) return fallbackPlaces["tawau town"];
  if (place.includes("tawau")) return fallbackPlaces.tawau;
  if (place.includes("semporna")) return fallbackPlaces.semporna;
  if (place === "kk" || place.includes("kota kinabalu")) return fallbackPlaces.kk;
  return null;
}

export async function geocode(place: string): Promise<LngLat> {
  const directCoord = place.match(/(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)/);
  if (directCoord) {
    const lat = Number(directCoord[1]);
    const lng = Number(directCoord[3]);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) return [lng, lat];
  }

  const inferred = inferSabahPlace(place);
  if (inferred) return inferred;

  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (token) {
    const sabahBbox = "115.7,4.0,119.4,7.4";
    const sabahProximity = "117.889,4.244";
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      place
    )}.json?limit=1&country=MY&bbox=${sabahBbox}&proximity=${sabahProximity}&access_token=${token}`;
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { features?: Array<{ center: [number, number] }> };
      if (data.features?.[0]?.center) return data.features[0].center;
    }
  }

  const key = place.trim().toLowerCase();
  return fallbackPlaces[key] ?? [117.889 + Math.random() * 0.02, 4.244 + Math.random() * 0.02];
}

function interpolateRoute(a: LngLat, b: LngLat, n = 16): LngLat[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const jitter = Math.sin(i * 2.1) * 0.003;
    return [
      Number((a[0] + (b[0] - a[0]) * t + jitter).toFixed(6)),
      Number((a[1] + (b[1] - a[1]) * t - jitter / 2).toFixed(6))
    ];
  });
}

export async function route(origin: LngLat, destination: LngLat, mode: TravelMode) {
  const key = process.env.ORS_API_KEY;
  if (key) {
    const profile = mode === "efficient" ? "driving-car" : "driving-hgv";
    const res = await fetch(`https://api.openrouteservice.org/v2/directions/${profile}/geojson`, {
      method: "POST",
      headers: {
        Authorization: key,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ coordinates: [origin, destination] }),
      cache: "no-store"
    });

    if (res.ok) {
      const data = (await res.json()) as {
        features?: Array<{ geometry?: { coordinates?: [number, number][] }; properties?: { summary?: { distance?: number; duration?: number } } }>;
      };
      const feature = data.features?.[0];
      if (feature?.geometry?.coordinates) {
        const distanceKm = (feature.properties?.summary?.distance ?? 0) / 1000;
        const etaMinutes = Math.max(8, Math.round((feature.properties?.summary?.duration ?? 0) / 60));
        return {
          polyline: feature.geometry.coordinates,
          distanceKm: Number(distanceKm.toFixed(1)),
          etaMinutes
        };
      }
    }
  }

  const polyline = interpolateRoute(origin, destination);
  const distanceKm = Number((Math.abs(origin[0] - destination[0]) * 111 + Math.abs(origin[1] - destination[1]) * 85).toFixed(1));
  const etaMinutes = Math.max(10, Math.round(distanceKm * 2.6));
  return { polyline, distanceKm, etaMinutes };
}
