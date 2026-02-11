import { NextRequest, NextResponse } from "next/server";
import { chooseSurpriseDrop, searchPoisAlongRoute } from "@/lib/scoring";
import { geocode, route } from "@/lib/maps";
import { openingLine, strategyLine } from "@/lib/prompt";
import { ContextEvent, RoutePlan, TravelLanguage, TravelMode } from "@/lib/types";
import { normalizeLanguage } from "@/lib/i18n";

type PlanPayload = {
  origin: string;
  destination: string;
  mode: TravelMode;
  event?: ContextEvent;
  language?: TravelLanguage;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PlanPayload;
    const event = body.event ?? null;
    const language = normalizeLanguage(body.language);

    const [originCoord, destinationCoord] = await Promise.all([geocode(body.origin), geocode(body.destination)]);
    const routeData = await route(originCoord, destinationCoord, body.mode);

    const stops = searchPoisAlongRoute(routeData.polyline, body.mode, event);
    const plan: RoutePlan = {
      originName: body.origin,
      destinationName: body.destination,
      origin: originCoord,
      destination: destinationCoord,
      polyline: routeData.polyline,
      etaMinutes: routeData.etaMinutes,
      distanceKm: routeData.distanceKm,
      aiIntro: openingLine(body.mode, body.origin, body.destination, language),
      strategy: strategyLine(body.mode, event, language),
      stops,
      surpriseDrop: undefined
    };

    plan.surpriseDrop = chooseSurpriseDrop(plan, body.mode);
    return NextResponse.json(plan);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to build plan" },
      { status: 500 }
    );
  }
}
