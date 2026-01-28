"use client";

import { useLoadScript } from "@react-google-maps/api";
import { ReactNode } from "react";

const libraries: ("places" | "geometry")[] = ["places"];

interface MapProviderProps {
  children: ReactNode;
}

export function MapProvider({ children }: MapProviderProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  if (loadError) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#E5E5E5] text-[#6B7280]">
        <p>Error loading maps</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#E5E5E5] text-[#6B7280]">
        <p>Loading map...</p>
      </div>
    );
  }

  return <>{children}</>;
}

// A lighter provider that always renders children but loads Google Maps in the background
// Use this for search inputs where we want the UI visible immediately
export function SearchMapProvider({ children }: MapProviderProps) {
  useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  // Always render children - autocomplete will initialize when API is ready
  return <>{children}</>;
}

// Custom map styles to match Haul's aesthetic
export const mapStyles = [
  {
    featureType: "all",
    elementType: "geometry",
    stylers: [{ color: "#f5f5f5" }],
  },
  {
    featureType: "all",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6B7280" }],
  },
  {
    featureType: "all",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#E5E5E5" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#c9d6df" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#e5e5e5" }],
  },
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
];

// Default map options
export const defaultMapOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  styles: mapStyles,
};

// Custom marker icon SVG path (map pin shape)
export const markerIcon = {
  path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z",
  fillColor: "#2D3B2D",
  fillOpacity: 1,
  strokeColor: "#ffffff",
  strokeWeight: 2,
  scale: 1.5,
  anchor: { x: 12, y: 22 } as google.maps.Point,
};

export const selectedMarkerIcon = {
  ...markerIcon,
  fillColor: "#B8A88A",
  scale: 1.8,
};
