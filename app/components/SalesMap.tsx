"use client";

import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { useState, useCallback, useRef, useEffect } from "react";
import { MapProvider, defaultMapOptions } from "./Map";
import Link from "next/link";

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

  return (
    <div className="relative w-full h-full">
      {/* Search this area button */}
      {showSearchAreaButton && (
        <button
          onClick={handleSearchArea}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white px-4 py-2 shadow-lg border border-[#E5E5E5] text-sm font-medium text-[#2D3B2D] hover:bg-[#FDFBF7] transition-colors"
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

          // Don't render marker until we have coordinates
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

        {infoWindowSale && saleCoords[infoWindowSale.id] && (
          <InfoWindow
            position={saleCoords[infoWindowSale.id]}
            onCloseClick={() => {
              setInfoWindowSale(null);
              onSaleSelect?.(null);
            }}
            options={{
              pixelOffset: new google.maps.Size(0, -30),
            }}
          >
            <Link
              href={`/sales/${infoWindowSale.id}`}
              className="block w-[260px] overflow-hidden"
              style={{ textDecoration: 'none' }}
            >
              {/* Thumbnail */}
              {infoWindowSale.photos && infoWindowSale.photos.length > 0 && (
                <div className="h-28 w-full">
                  <img
                    src={infoWindowSale.photos[0]}
                    alt={infoWindowSale.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              <div className="p-3">
                <h3 className="font-serif text-sm font-bold uppercase tracking-wide text-[#2D3B2D] leading-tight">
                  {infoWindowSale.title}
                </h3>

                <p className="mt-2 text-xs font-medium text-[#2D3B2D]">
                  {formatDateRange(infoWindowSale.start_date, infoWindowSale.end_date)}
                </p>

                <p className="mt-1 text-xs text-[#6B7280]">
                  {infoWindowSale.city}, {infoWindowSale.state}
                </p>

                <p className="mt-2 text-[10px] uppercase tracking-wide text-[#6B7280]">
                  Hosted by <span className="font-medium text-[#2D3B2D]">{infoWindowSale.company_name}</span>
                </p>
              </div>
            </Link>
          </InfoWindow>
        )}
      </GoogleMap>
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
