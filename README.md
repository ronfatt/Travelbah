# TravelBah Tawau Investor Demo (MVP)

Next.js MVP for investor demo flow:
- Landing (`/`): origin/destination + mode
- Trip (`/trip`): map, AI guide, 3-6 stops, replan events, surprise drop
- Recap (`/recap`): memory card + share/download PNG

## Stack
- Next.js + Tailwind
- Mapbox GL JS
- OpenRouteService Directions API (with fallback)
- OpenAI API (with local fallback)
- Local Tawau POI seed (100 points)

## Run
```bash
npm install
npm run dev
```

Set env from `.env.example`.

## Demo script
1. Open `/`
2. Input `Tawau Airport` -> `Tawau Town`
3. Select `Food-first`
4. In `/trip`, click `🌧️ Rain`
5. Ask in chat: `有没有适合拍照的 sunset 点？`
6. Finish and open recap card, then Share or Download PNG
