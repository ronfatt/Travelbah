import { ContextEvent, TravelMode } from "@/lib/types";

export function modeLabel(mode: TravelMode) {
  if (mode === "food") return "Food-first";
  if (mode === "chill") return "Chill";
  return "Efficient";
}

export function openingLine(mode: TravelMode, origin: string, destination: string) {
  const vibe = mode === "food" ? "先把好吃的排进路线" : mode === "chill" ? "节奏放松、拍照和休息都顾到" : "走最省时路线，少绕路";
  return `Nice, ${origin} 去 ${destination} 我来带。${vibe}，先给你一条稳妥路线。`;
}

export function strategyLine(mode: TravelMode, event: ContextEvent) {
  const modeText =
    mode === "food"
      ? "优先贴路线的在地餐食"
      : mode === "chill"
        ? "优先舒适和景观点，行程留白"
        : "优先低绕路和可快速进出点";

  if (!event) return `策略：${modeText}，并控制在 3-6 个停靠点。`;
  if (event === "rain") return `下雨了，我把建议换成室内、咖啡和短步行点，减少淋雨与临时变更。`;
  if (event === "traffic") return `有塞车，我改成更靠主路、可快进快出的停靠点，避免深巷绕行。`;
  return `你累了，我把顺序改成先休息再轻松活动，整体节奏更稳。`;
}
