"use client";

import { GoogleMap, Marker } from "@react-google-maps/api";
import { useCallback, useRef, useEffect, useState } from "react";
import { MapProvider, defaultMapOptions } from "./Map";

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  lat?: number;
  lng?: number;
}

// Default fallback coordinates (Austin, TX)
const DEFAULT_COORDS = { lat: 30.2672, lng: -97.7431 };

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function DirectionsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <polygon points="3 11 22 2 13 21 11 13 3 11" />
    </svg>
  );
}

function MapModalInner(props: MapModalProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number }>(
    props.lat && props.lng ? { lat: props.lat, lng: props.lng } : DEFAULT_COORDS
  );
  const [isGeocoding, setIsGeocoding] = useState(true);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // Geocode the address when modal opens
  useEffect(() => {
    if (!props.isOpen) return;
    if (props.lat && props.lng) {
      setCoords({ lat: props.lat, lng: props.lng });
      setIsGeocoding(false);
      return;
    }

    const geocoder = new google.maps.Geocoder();
    const fullAddress = `${props.address}, ${props.city}, ${props.state} ${props.zipCode}`;

    geocoder.geocode({ address: fullAddress }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        const location = results[0].geometry.location;
        setCoords({ lat: location.lat(), lng: location.lng() });
      }
      setIsGeocoding(false);
    });
  }, [props.isOpen, props.address, props.city, props.state, props.zipCode, props.lat, props.lng]);

  // Pan map to new coordinates when geocoding completes
  useEffect(() => {
    if (mapRef.current && !isGeocoding) {
      mapRef.current.panTo(coords);
    }
  }, [coords, isGeocoding]);

  const getDirections = () => {
    const query = encodeURIComponent(
      `${props.address}, ${props.city}, ${props.state} ${props.zipCode}`
    );
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${query}`, "_blank");
  };

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        props.onClose();
      }
    };

    if (props.isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [props.isOpen, props.onClose]);

  if (!props.isOpen) return null;

  const fullAddress = `${props.address}, ${props.city}, ${props.state} ${props.zipCode}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={props.onClose}
      />

      {/* Modal */}
      <div className="relative z-10 mx-4 w-full max-w-3xl overflow-hidden bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-3">
          <div>
            <h2 className="font-serif text-xl font-bold uppercase text-[#2D3B2D]">
              {props.title}
            </h2>
            <p className="mt-1 text-sm text-[#6B7280]">{fullAddress}</p>
          </div>
          <button
            onClick={props.onClose}
            className="ml-4 flex-shrink-0 text-[#6B7280] transition-colors hover:text-[#2D3B2D]"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Map */}
        <div className="h-[400px] w-full sm:h-[450px]">
          <GoogleMap
            mapContainerClassName="w-full h-full"
            center={coords}
            zoom={15}
            onLoad={onMapLoad}
            options={{
              ...defaultMapOptions,
              zoomControl: true,
            }}
          >
            <Marker
              position={coords}
              icon={{
                path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z",
                fillColor: "#4A90D9",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2,
                scale: 2,
                anchor: new google.maps.Point(12, 22),
              }}
            />
          </GoogleMap>
        </div>

        {/* Get Directions Button */}
        <div className="p-4">
          <button
            onClick={getDirections}
            className="flex w-full items-center justify-center gap-2 bg-[#2D3B2D] py-4 text-sm font-semibold uppercase tracking-wide text-white transition-opacity hover:opacity-90"
          >
            <DirectionsIcon />
            Get Directions
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MapModal(props: MapModalProps) {
  if (!props.isOpen) return null;

  return (
    <MapProvider>
      <MapModalInner {...props} />
    </MapProvider>
  );
}
