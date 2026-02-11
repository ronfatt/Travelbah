import { TravelLanguage } from "@/lib/types";

export function normalizeLanguage(value: string | null | undefined): TravelLanguage {
  if (value === "zh" || value === "ms") return value;
  return "en";
}

export const languageNames: Record<TravelLanguage, string> = {
  en: "English",
  zh: "中文",
  ms: "Bahasa Melayu"
};

export const uiText = {
  en: {
    chooseLanguage: "Language",
    languageHint: "AI replies will follow this language.",
    guidePrefix: "Guide",
    defaultLandingGuide: "Don’t worry lah. Drop your start and end — I’ll sort the good stuff.",
    locationCaptured: "Nice, got your live location. Pick a mode and go.",
    generatingRoute: "Nice choice. {mode} mode, now generating your route..."
  },
  zh: {
    chooseLanguage: "语言",
    languageHint: "AI 会尽量按你选择的语言回答。",
    guidePrefix: "向导",
    defaultLandingGuide: "告诉我起点和终点，我会给你一条像本地朋友带路的路线。",
    locationCaptured: "已获取你的位置，选模式后就能出发。",
    generatingRoute: "选得好，{mode} 模式，正在帮你生成路线..."
  },
  ms: {
    chooseLanguage: "Bahasa",
    languageHint: "AI akan jawab ikut bahasa pilihan anda.",
    guidePrefix: "Pemandu",
    defaultLandingGuide: "Beritahu titik mula dan destinasi, saya akan susun laluan mesra tempatan.",
    locationCaptured: "Lokasi anda sudah dikesan. Pilih mod dan teruskan.",
    generatingRoute: "Pilihan bagus. Mod {mode}, sedang jana laluan anda..."
  }
} as const;

export function fillTemplate(template: string, vars: Record<string, string>) {
  return Object.entries(vars).reduce((acc, [key, value]) => acc.replaceAll(`{${key}}`, value), template);
}
