"use client";

import { GoogleMap, Marker } from "@react-google-maps/api";
import { useState, useCallback, useRef, useEffect } from "react";
import { MapProvider, defaultMapOptions } from "./Map";
import Link from "next/link";

function CalendarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-[#B8A88A]">
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-[#B8A88A]">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

interface Sale {
  id: string;
  title: string;
  company_name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  start_date: string;
  end_date: string;
  lat?: number;
  lng?: number;
  photos?: string[];
  is_featured?: boolean;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface SalesMapProps {
  sales: Sale[];
  selectedSaleId?: string | null;
  onSaleSelect?: (saleId: string | null) => void;
  center?: { lat: number; lng: number };
  onBoundsChange?: (bounds: MapBounds) => void;
  onSearchArea?: (bounds: MapBounds) => void;
  showSearchButton?: boolean;
}

// Cache for geocoded coordinates
const coordsCache: Record<string, { lat: number; lng: number }> = {};

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const startDay = start.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const endDay = end.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  return `${startDay} — ${endDay}`;
}

function SalesMapInner({
  sales,
  selectedSaleId,
  onSaleSelect,
  center,
  onSearchArea,
  showSearchButton = true,
}: SalesMapProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [infoWindowSale, setInfoWindowSale] = useState<Sale | null>(null);
  const [currentBounds, setCurrentBounds] = useState<MapBounds | null>(null);
  const [showSearchAreaButton, setShowSearchAreaButton] = useState(false);
  const initialBoundsSet = useRef(false);
  const [saleCoords, setSaleCoords] = useState<Record<string, { lat: number; lng: number }>>({});
  const geocodingInProgress = useRef<Set<string>>(new Set());

  const defaultCenter = center || { lat: 30.2672, lng: -97.7431 }; // Austin, TX fallback

  // Geocode all sales when component mounts or sales change
  useEffect(() => {
    if (!sales.length) return;
    if (typeof google === "undefined" || !google.maps) return;

    const geocoder = new google.maps.Geocoder();
    const newCoords: Record<string, { lat: number; lng: number }> = {};

    // First pass: use cached coords
    sales.forEach((sale) => {
      const cacheKey = `${sale.address}-${sale.city}-${sale.state}-${sale.zip_code}`;
      if (coordsCache[cacheKey]) {
        newCoords[sale.id] = coordsCache[cacheKey];
      }
    });

    // Set cached coords immediately
    if (Object.keys(newCoords).length > 0) {
      setSaleCoords(prev => ({ ...prev, ...newCoords }));
    }

    // Second pass: geocode missing coords
    sales.forEach((sale, index) => {
      const cacheKey = `${sale.address}-${sale.city}-${sale.state}-${sale.zip_code}`;

      // Skip if already cached or in progress
      if (coordsCache[cacheKey] || geocodingInProgress.current.has(sale.id)) {
        return;
      }

      geocodingInProgress.current.add(sale.id);

      // Stagger requests to avoid rate limiting
      setTimeout(() => {
        const address = `${sale.address}, ${sale.city}, ${sale.state} ${sale.zip_code}`;

        geocoder.geocode({ address }, (results, status) => {
          geocodingInProgress.current.delete(sale.id);

          if (status === "OK" && results && results[0]) {
            const location = results[0].geometry.location;
            const coords = { lat: location.lat(), lng: location.lng() };
            coordsCache[cacheKey] = coords;
            setSaleCoords(prev => ({ ...prev, [sale.id]: coords }));
          } else {
            // Fallback: geocode just city/state
            geocoder.geocode({ address: `${sale.city}, ${sale.state}` }, (cityResults, cityStatus) => {
              if (cityStatus === "OK" && cityResults && cityResults[0]) {
                const loc = cityResults[0].geometry.location;
                // Add offset based on sale ID to spread markers
                const hash = sale.id.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
                const latOffset = ((hash % 100) - 50) * 0.002;
                const lngOffset = (((hash * 7) % 100) - 50) * 0.002;
                const coords = { lat: loc.lat() + latOffset, lng: loc.lng() + lngOffset };
                coordsCache[cacheKey] = coords;
                setSaleCoords(prev => ({ ...prev, [sale.id]: coords }));
              }
            });
          }
        });
      }, index * 150); // 150ms between requests
    });
  }, [sales]); // Only depend on sales, not saleCoords

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const handleBoundsChanged = useCallback(() => {
    if (!mapRef.current) return;

    const bounds = mapRef.current.getBounds();
    if (!bounds) return;

    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    const newBounds: MapBounds = {
      north: ne.lat(),
      south: sw.lat(),
      east: ne.lng(),
      west: sw.lng(),
    };

    setCurrentBounds(newBounds);

    // Don't show button on initial load
    if (!initialBoundsSet.current) {
      initialBoundsSet.current = true;
      return;
    }

    // Show "Search this area" button when user pans/zooms
    if (showSearchButton && onSearchArea) {
      setShowSearchAreaButton(true);
    }
  }, [showSearchButton, onSearchArea]);

  const handleSearchArea = () => {
    if (currentBounds && onSearchArea) {
      onSearchArea(currentBounds);
      setShowSearchAreaButton(false);
    }
  };

  // Pan to selected sale when it changes
  useEffect(() => {
    if (selectedSaleId && mapRef.current) {
      const coords = saleCoords[selectedSaleId];
      if (coords) {
        mapRef.current.panTo(coords);
        const sale = sales.find((s) => s.id === selectedSaleId);
        if (sale) setInfoWindowSale(sale);
      }
    }
  }, [selectedSaleId, sales, saleCoords]);

  const handleMarkerClick = (sale: Sale) => {
    setInfoWindowSale(sale);
    onSaleSelect?.(sale.id);

    const coords = saleCoords[sale.id];
    if (coords) {
      mapRef.current?.panTo(coords);
    }
  };

  // Count sales with coords (visible on map)
  const visibleSalesCount = Object.keys(saleCoords).length;

  return (
    <div className="relative w-full h-full">
      {/* Sales count badge */}
      {visibleSalesCount > 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white/95 backdrop-blur px-4 py-2 shadow-lg border border-[#E5E5E5] text-sm font-medium text-[#2D3B2D]">
          {visibleSalesCount} {visibleSalesCount === 1 ? "sale" : "sales"} in view
        </div>
      )}

      {/* Search this area button */}
      {showSearchAreaButton && (
        <button
          onClick={handleSearchArea}
          className="absolute top-16 left-1/2 -translate-x-1/2 z-10 bg-white px-4 py-2 shadow-lg border border-[#E5E5E5] text-sm font-medium text-[#2D3B2D] hover:bg-[#FDFBF7] transition-colors"
        >
          Search this area
        </button>
      )}

      <GoogleMap
        mapContainerClassName="w-full h-full"
        center={defaultCenter}
        zoom={11}
        onLoad={onMapLoad}
        onIdle={handleBoundsChanged}
        options={defaultMapOptions}
        onClick={() => {
          setInfoWindowSale(null);
          onSaleSelect?.(null);
        }}
      >
        {sales.map((sale) => {
          const coords = saleCoords[sale.id];
          if (!coords) return null;

          const isSelected = selectedSaleId === sale.id;

          return (
            <Marker
              key={sale.id}
              position={coords}
              onClick={() => handleMarkerClick(sale)}
              icon={{
                path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z",
                fillColor: isSelected ? "#B8A88A" : "#2D3B2D",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2,
                scale: isSelected ? 1.8 : 1.5,
                anchor: new google.maps.Point(12, 22),
              }}
              zIndex={isSelected ? 1000 : 1}
            />
          );
        })}
      </GoogleMap>

      {/* Slide-up card */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-20 transform transition-transform duration-300 ease-out ${
          infoWindowSale ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {infoWindowSale && (
          <div className="bg-white border-t border-[#E5E5E5] shadow-[0_-4px_20px_rgba(0,0,0,0.15)] rounded-t-xl">
            {/* Close button */}
            <button
              onClick={() => {
                setInfoWindowSale(null);
                onSaleSelect?.(null);
              }}
              className="absolute top-4 right-4 p-1 text-[#6B7280] hover:text-[#2D3B2D] transition-colors"
            >
              <XIcon />
            </button>

            {/* Card content */}
            <div className="p-4 flex gap-4">
              {/* Thumbnail */}
              <div className="h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden bg-[#E5E5E5]">
                {infoWindowSale.photos && infoWindowSale.photos.length > 0 ? (
                  <img
                    src={infoWindowSale.photos[0]}
                    alt={infoWindowSale.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-[#B8A88A]">
                    <MapPinIcon />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-serif text-lg font-bold text-[#2D3B2D] leading-tight truncate pr-8">
                  {infoWindowSale.title}
                </h3>
                <div className="mt-2 flex items-center gap-2 text-sm text-[#6B7280]">
                  <CalendarIcon />
                  <span>{formatDateRange(infoWindowSale.start_date, infoWindowSale.end_date)}</span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-sm text-[#6B7280]">
                  <MapPinIcon />
                  <span>{infoWindowSale.city}, {infoWindowSale.state}</span>
                </div>
              </div>
            </div>

            {/* View Sale button */}
            <div className="px-4 pb-4">
              <Link
                href={`/sales/${infoWindowSale.id}`}
                className="flex items-center justify-center gap-2 w-full bg-[#2D3B2D] py-3 text-sm font-medium text-white hover:opacity-90 transition-opacity"
              >
                View Sale
                <ArrowRightIcon />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SalesMap(props: SalesMapProps) {
  return (
    <MapProvider>
      <SalesMapInner {...props} />
    </MapProvider>
  );
}
