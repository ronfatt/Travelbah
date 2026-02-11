"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import type { Poi } from "@/lib/types";

type Props = {
  polyline: [number, number][];
  origin: [number, number];
  destination: [number, number];
  stops: Poi[];
};

export function MapView({ polyline, origin, destination, stops }: Props) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  useEffect(() => {
    if (!token || !containerRef.current) return;
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    mapboxgl.accessToken = token;
    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: origin,
      zoom: 10
    });

    mapRef.current.on("load", () => {
      if (!mapRef.current) return;

      mapRef.current.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: { type: "LineString", coordinates: polyline },
          properties: {}
        }
      });
      mapRef.current.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        paint: { "line-color": "#F59E0B", "line-width": 5 }
      });

      const createMarkerElement = (kind: "origin" | "destination" | "stop", delayMs = 0) => {
        const el = document.createElement("div");
        el.className = `travelbah-marker travelbah-marker--${kind}`;
        el.style.animationDelay = `${delayMs}ms`;
        return el;
      };

      const originMarker = new mapboxgl.Marker({ element: createMarkerElement("origin", 0) }).setLngLat(origin).addTo(mapRef.current);
      const destinationMarker = new mapboxgl.Marker({ element: createMarkerElement("destination", 180) }).setLngLat(destination).addTo(mapRef.current);
      markersRef.current = [originMarker, destinationMarker];
      stops.forEach((stop, idx) => {
        const marker = new mapboxgl.Marker({ element: createMarkerElement("stop", 280 + idx * 45) })
          .setLngLat([stop.lng, stop.lat])
          .addTo(mapRef.current!);
        markersRef.current.push(marker);
      });

      const bounds = new mapboxgl.LngLatBounds();
      [origin, destination, ...polyline].forEach((coord) => bounds.extend(coord));
      mapRef.current.fitBounds(bounds, { padding: 36 });
    });

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [token, origin, destination, polyline, stops]);

  if (!token) {
    return (
      <div className="flex h-full min-h-[380px] items-center justify-center rounded-2xl border border-dashed border-border bg-card/30 p-6 text-center text-sm text-text-secondary">
        Set `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` to render the live map. Demo logic still works without it.
      </div>
    );
  }

  return <div ref={containerRef} className="h-full min-h-[380px] overflow-hidden rounded-2xl shadow-card" />;
}
