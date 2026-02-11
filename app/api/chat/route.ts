import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { Poi, TravelLanguage, TravelMode } from "@/lib/types";
import { languageInstruction, modeLabel } from "@/lib/prompt";
import { normalizeLanguage } from "@/lib/i18n";

type ChatPayload = {
  message: string;
  mode: TravelMode;
  stops: Poi[];
  origin: string;
  destination: string;
  language?: TravelLanguage;
};

function localAnswer(message: string, payload: ChatPayload, lang: TravelLanguage) {
  const text = message.toLowerCase();

  if (lang === "zh") {
    if (text.includes("sunset") || text.includes("拍照")) {
      const sunset = payload.stops.find((s) => s.tags.includes("sunset") || s.tags.includes("photo"));
      if (sunset) return `有，建议你去 ${sunset.name}。大概傍晚 6:00-6:40 光线最好。`;
      return "想拍 sunset 的话，我会建议绕去 Waterfront Deck 或 Hill View 一带。";
    }
    if (text.includes("halal") || text.includes("清真")) {
      const halal = payload.stops.filter((s) => s.tags.includes("halal")).slice(0, 2).map((s) => s.name);
      return halal.length ? `可以，这条线里你可先看 ${halal.join("、")}。` : "这批点里 halal 选项不多，我下一轮可以改成 halal-first。";
    }
    return `我建议先照 ${modeLabel(payload.mode, lang)} 走到中段，再看天气加一个临时点。你更想吃东西、拍照，还是先休息？`;
  }

  if (lang === "ms") {
    if (text.includes("sunset") || text.includes("gambar") || text.includes("foto")) {
      const sunset = payload.stops.find((s) => s.tags.includes("sunset") || s.tags.includes("photo"));
      if (sunset) return `Ada, cuba ${sunset.name}. Waktu terbaik sekitar 6:00-6:40 petang.`;
      return "Untuk sunset, saya syorkan kawasan Waterfront Deck atau Hill View.";
    }
    if (text.includes("halal")) {
      const halal = payload.stops.filter((s) => s.tags.includes("halal")).slice(0, 2).map((s) => s.name);
      return halal.length ? `Boleh, dalam laluan ini cuba ${halal.join(" dan ")}.` : "Pilihan halal dalam senarai ini terhad, saya boleh replan khusus halal.";
    }
    return `Saya cadangkan ikut mod ${modeLabel(payload.mode, lang)} dahulu, kemudian tambah satu hentian ikut cuaca. Anda mahu makan, bergambar, atau rehat dulu?`;
  }

  if (text.includes("sunset") || text.includes("photo")) {
    const sunset = payload.stops.find((s) => s.tags.includes("sunset") || s.tags.includes("photo"));
    if (sunset) return `Yes, try ${sunset.name}. Best light is around 6:00-6:40 pm.`;
    return "For sunset shots, I suggest Waterfront Deck or Hill View area.";
  }
  if (text.includes("halal")) {
    const halal = payload.stops.filter((s) => s.tags.includes("halal")).slice(0, 2).map((s) => s.name);
    return halal.length ? `Yes, in this route try ${halal.join(" and ")}.` : "Halal options in this batch are limited; I can replan halal-first next.";
  }
  return `I suggest following ${modeLabel(payload.mode, lang)} until mid-route, then we add one flexible stop based on weather. Prefer food, photos, or rest first?`;
}

export async function POST(req: NextRequest) {
  let language: TravelLanguage = "en";
  try {
    const payload = (await req.json()) as ChatPayload;
    language = normalizeLanguage(payload.language);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ reply: localAnswer(payload.message, payload, language) });
    }

    const client = new OpenAI({ apiKey });
    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `You are TravelBah local friend guide in Tawau. Keep replies short, practical, friendly and direct. Avoid corporate tone. Ask max one clarifying question if needed. ${languageInstruction(
            language
          )}`
        },
        {
          role: "user",
          content: `Trip: ${payload.origin} -> ${payload.destination}; mode=${modeLabel(payload.mode, language)}; stops=${payload.stops
            .map((s) => s.name)
            .join(", ")}. User asks: ${payload.message}`
        }
      ]
    });

    return NextResponse.json({ reply: completion.choices[0]?.message?.content ?? localAnswer(payload.message, payload, language) });
  } catch (error) {
    const fallback =
      language === "zh"
        ? "我先帮你把路线稳住，稍后再问我也可以。"
        : language === "ms"
          ? "Saya akan kekalkan laluan anda dulu. Tanya saya lagi sebentar."
          : "I will keep your route stable first. Ask me again in a moment.";
    return NextResponse.json({ reply: fallback }, { status: 200 });
  }
}
