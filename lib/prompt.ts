import { ContextEvent, TravelLanguage, TravelMode } from "@/lib/types";

const modeLabels: Record<TravelLanguage, Record<TravelMode, string>> = {
  en: { food: "Food-first", chill: "Chill", efficient: "Efficient" },
  zh: { food: "吃饭优先", chill: "轻松慢游", efficient: "高效省时" },
  ms: { food: "Utamakan Makan", chill: "Santai", efficient: "Efisien" }
};

export function modeLabel(mode: TravelMode, lang: TravelLanguage = "en") {
  return modeLabels[lang][mode];
}

export function openingLine(mode: TravelMode, origin: string, destination: string, lang: TravelLanguage = "en") {
  if (lang === "zh") {
    const vibe = mode === "food" ? "先把好吃的排进路线" : mode === "chill" ? "节奏放松、拍照和休息都顾到" : "走更省时路线，少绕路";
    return `好，${origin} 去 ${destination} 我来带。${vibe}，先给你一条稳妥路线。`;
  }
  if (lang === "ms") {
    const vibe = mode === "food" ? "kita susun tempat makan dulu" : mode === "chill" ? "rentak santai, ada masa foto dan rehat" : "kita fokus laluan paling cepat";
    return `Baik, dari ${origin} ke ${destination}, saya bawa anda. ${vibe}, saya beri laluan yang stabil dulu.`;
  }

  const vibe =
    mode === "food"
      ? "we will lock in local food stops first"
      : mode === "chill"
        ? "we keep it relaxed with photo and rest breaks"
        : "we stay efficient and avoid unnecessary detours";
  return `Nice, from ${origin} to ${destination}, I got you. ${vibe}, let me start with a stable route.`;
}

export function strategyLine(mode: TravelMode, event: ContextEvent, lang: TravelLanguage = "en") {
  if (lang === "zh") {
    const modeText =
      mode === "food"
        ? "优先贴路线的在地餐食"
        : mode === "chill"
          ? "优先舒适和景观点，行程留白"
          : "优先低绕路和可快速进出点";

    if (!event) return `策略：${modeText}，并控制在 3-6 个停靠点。`;
    if (event === "rain") return "下雨了，我把建议换成室内、咖啡和短步行点，减少淋雨与临时变更。";
    if (event === "traffic") return "有塞车，我改成更靠主路、可快进快出的停靠点，避免深巷绕行。";
    return "你累了，我把顺序改成先休息再轻松活动，整体节奏更稳。";
  }

  if (lang === "ms") {
    const modeText =
      mode === "food"
        ? "utamakan makanan tempatan yang dekat dengan laluan"
        : mode === "chill"
          ? "utamakan keselesaan dan spot pemandangan"
          : "utamakan hentian yang cepat masuk-keluar";

    if (!event) return `Strategi: ${modeText}, dan kekalkan 3-6 hentian sahaja.`;
    if (event === "rain") return "Hujan sekarang, saya tukar cadangan kepada lokasi dalaman, kafe dan laluan jalan kaki pendek.";
    if (event === "traffic") return "Trafik sesak, saya susun semula hentian yang lebih dekat jalan utama untuk kurangkan pusingan.";
    return "Anda penat, saya ubah urutan supaya rehat dulu kemudian aktiviti ringan.";
  }

  const modeText =
    mode === "food"
      ? "prioritize local food near the route"
      : mode === "chill"
        ? "prioritize comfort and scenic stops"
        : "prioritize low-detour, quick in-and-out stops";

  if (!event) return `Strategy: ${modeText}, with only 3-6 stops.`;
  if (event === "rain") return "It is raining, so I switched to indoor spots, cafes, and short walking segments.";
  if (event === "traffic") return "Traffic is heavy, so I re-ordered to stops closer to main roads.";
  return "You are tired, so I re-ordered to rest first and keep the pace lighter.";
}

export function recapSummary(origin: string, destination: string, lang: TravelLanguage = "en") {
  if (lang === "zh") return `从 ${origin} 到 ${destination}，我们路线走得顺，也把在地体验安排进来了。`;
  if (lang === "ms") return `Dari ${origin} ke ${destination}, laluan kekal lancar sambil tambah pengalaman tempatan.`;
  return `From ${origin} to ${destination}, we kept the route practical while still adding local flavor.`;
}

export function languageInstruction(lang: TravelLanguage) {
  if (lang === "zh") return "Reply mainly in Simplified Chinese.";
  if (lang === "ms") return "Reply mainly in Bahasa Melayu.";
  return "Reply in English.";
}
