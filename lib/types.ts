export type TravelMode = "food" | "chill" | "efficient";
export type TravelLanguage = "en" | "zh" | "ms";
export type PoiCategory = "food" | "stay" | "spot" | "entertainment";
export type ContextEvent = "rain" | "traffic" | "tired" | null;

export type Poi = {
  id: string;
  name: string;
  category: PoiCategory;
  lat: number;
  lng: number;
  short_desc: string;
  open_hours?: string;
  price_level: 1 | 2 | 3 | 4;
  tags: string[];
  partner_level: "none" | "partner";
  photos?: string[];
};

export type RoutePlan = {
  originName: string;
  destinationName: string;
  origin: [number, number];
  destination: [number, number];
  polyline: [number, number][];
  etaMinutes: number;
  distanceKm: number;
  strategy: string;
  aiIntro: string;
  stops: Poi[];
  surpriseDrop?: Poi;
};
