"use client";

import { GoogleMap, Marker } from "@react-google-maps/api";
import { useCallback, useRef } from "react";
import { MapProvider, defaultMapOptions } from "./Map";

interface LocationMapProps {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  lat?: number;
  lng?: number;
  className?: string;
}

// Hardcoded coordinates for Texas cities (fallback)
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  "Austin, TX": { lat: 30.2672, lng: -97.7431 },
  "Round Rock, TX": { lat: 30.5083, lng: -97.6789 },
  "Cedar Park, TX": { lat: 30.5052, lng: -97.8203 },
  "Georgetown, TX": { lat: 30.6333, lng: -97.6778 },
  "Pflugerville, TX": { lat: 30.4394, lng: -97.62 },
};

function getCoords(props: LocationMapProps): { lat: number; lng: number } {
  if (props.lat && props.lng) {
    return { lat: props.lat, lng: props.lng };
  }

  const cityKey = `${props.city}, ${props.state}`;
  const baseCoords = CITY_COORDS[cityKey] || { lat: 30.2672, lng: -97.7431 };

  // Add small offset based on address hash for variation
  const hash = props.address.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
  const latOffset = ((hash % 50) - 25) * 0.001;
  const lngOffset = (((hash * 7) % 50) - 25) * 0.001;

  return {
    lat: baseCoords.lat + latOffset,
    lng: baseCoords.lng + lngOffset,
  };
}

function LocationMapInner(props: LocationMapProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const coords = getCoords(props);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const openInGoogleMaps = () => {
    const query = encodeURIComponent(
      `${props.address}, ${props.city}, ${props.state} ${props.zipCode}`
    );
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
  };

  return (
    <div className={props.className || "h-[300px] w-full"}>
      <div className="relative h-full w-full">
        <GoogleMap
          mapContainerClassName="w-full h-full"
          center={coords}
          zoom={15}
          onLoad={onMapLoad}
          options={{
            ...defaultMapOptions,
            zoomControl: false,
          }}
        >
          <Marker
            position={coords}
            icon={{
              path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z",
              fillColor: "#2D3B2D",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
              scale: 1.8,
              anchor: new google.maps.Point(12, 22),
            }}
          />
        </GoogleMap>

        {/* Open in Google Maps button */}
        <button
          onClick={openInGoogleMaps}
          className="absolute bottom-3 right-3 bg-white px-3 py-2 text-xs font-medium text-[#2D3B2D] shadow-md transition-opacity hover:opacity-80"
        >
          Open in Google Maps
        </button>
      </div>
    </div>
  );
}

export default function LocationMap(props: LocationMapProps) {
  return (
    <MapProvider>
      <LocationMapInner {...props} />
    </MapProvider>
  );
}
