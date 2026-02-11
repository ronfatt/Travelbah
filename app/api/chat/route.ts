import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { Poi, TravelMode } from "@/lib/types";
import { modeLabel } from "@/lib/prompt";

type ChatPayload = {
  message: string;
  mode: TravelMode;
  stops: Poi[];
  origin: string;
  destination: string;
};

function localAnswer(message: string, payload: ChatPayload) {
  const text = message.toLowerCase();
  if (text.includes("sunset") || text.includes("拍照")) {
    const sunset = payload.stops.find((s) => s.tags.includes("sunset") || s.tags.includes("photo"));
    if (sunset) {
      return `有，建议你去 ${sunset.name}。大概傍晚 6:00-6:40 光线最好，现场风大时手机夜景模式更稳。`;
    }
    return "想拍 sunset 的话，我会建议绕去 Waterfront Deck 或 Hill View 一带，傍晚前 20 分钟到最稳。";
  }
  if (text.includes("halal") || text.includes("清真")) {
    const halal = payload.stops.filter((s) => s.tags.includes("halal")).slice(0, 2).map((s) => s.name);
    return halal.length ? `可以，这条线里你可先看 ${halal.join("、")}。` : "这批点里 halal 选项不多，我可下一轮重排专门换成 halal-first。";
  }
  return `我建议先照 ${modeLabel(payload.mode)} 走到中段，再看天气加一个临时点。你更想吃东西、拍照，还是先休息？`;
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as ChatPayload;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ reply: localAnswer(payload.message, payload) });
    }

    const client = new OpenAI({ apiKey });
    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content:
            "You are TravelBah local friend guide in Tawau. Keep replies short, practical, friendly and direct. Avoid corporate tone. Ask max one clarifying question if needed."
        },
        {
          role: "user",
          content: `Trip: ${payload.origin} -> ${payload.destination}; mode=${modeLabel(payload.mode)}; stops=${payload.stops
            .map((s) => s.name)
            .join(", ")}. User asks: ${payload.message}`
        }
      ]
    });

    return NextResponse.json({ reply: completion.choices[0]?.message?.content ?? localAnswer(payload.message, payload) });
  } catch (error) {
    return NextResponse.json({ reply: "我先帮你稳住路线，稍后再继续问我也可以。" }, { status: 200 });
  }
}
