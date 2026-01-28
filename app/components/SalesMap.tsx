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
}

interface SaleWithCoords extends Sale {
  coords?: { lat: number; lng: number };
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

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const startMonth = start.toLocaleDateString("en-US", { month: "short" });
  const startDay = start.getDate();
  const endDay = end.getDate();

  if (start.getMonth() === end.getMonth()) {
    return `${startMonth} ${startDay}-${endDay}`;
  }
  const endMonth = end.toLocaleDateString("en-US", { month: "short" });
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
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
  const [infoWindowSale, setInfoWindowSale] = useState<SaleWithCoords | null>(null);
  const [currentBounds, setCurrentBounds] = useState<MapBounds | null>(null);
  const [showSearchAreaButton, setShowSearchAreaButton] = useState(false);
  const initialBoundsSet = useRef(false);
  const [salesWithCoords, setSalesWithCoords] = useState<SaleWithCoords[]>([]);
  const geocodedIds = useRef<Set<string>>(new Set());

  const defaultCenter = center || { lat: 30.2672, lng: -97.7431 }; // Austin, TX

  // Geocode all sales when they load
  useEffect(() => {
    if (!sales.length) {
      setSalesWithCoords([]);
      return;
    }

    // Check if Google Maps is ready
    if (typeof google === "undefined" || !google.maps) {
      // Set sales without coords initially, geocode later
      setSalesWithCoords(sales.map(s => ({ ...s })));
      return;
    }

    const geocoder = new google.maps.Geocoder();
    const updatedSales: SaleWithCoords[] = [...sales.map(s => ({ ...s }))];
    let pendingCount = 0;

    sales.forEach((sale, index) => {
      // Skip if already geocoded
      if (geocodedIds.current.has(sale.id)) {
        const existing = salesWithCoords.find(s => s.id === sale.id);
        if (existing?.coords) {
          updatedSales[index].coords = existing.coords;
        }
        return;
      }

      // Skip if sale already has lat/lng
      if (sale.lat && sale.lng) {
        updatedSales[index].coords = { lat: sale.lat, lng: sale.lng };
        geocodedIds.current.add(sale.id);
        return;
      }

      pendingCount++;
      const address = `${sale.address}, ${sale.city}, ${sale.state} ${sale.zip_code}`;

      // Delay geocoding requests to avoid rate limiting
      setTimeout(() => {
        geocoder.geocode({ address }, (results, status) => {
          if (status === "OK" && results && results[0]) {
            const location = results[0].geometry.location;
            updatedSales[index].coords = {
              lat: location.lat(),
              lng: location.lng(),
            };
            geocodedIds.current.add(sale.id);
          } else {
            // Fallback: use city center
            geocoder.geocode({ address: `${sale.city}, ${sale.state}` }, (cityResults, cityStatus) => {
              if (cityStatus === "OK" && cityResults && cityResults[0]) {
                const loc = cityResults[0].geometry.location;
                // Add small offset based on sale ID to spread markers
                const hash = sale.id.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
                const latOffset = ((hash % 100) - 50) * 0.001;
                const lngOffset = (((hash * 7) % 100) - 50) * 0.001;
                updatedSales[index].coords = {
                  lat: loc.lat() + latOffset,
                  lng: loc.lng() + lngOffset,
                };
                geocodedIds.current.add(sale.id);
              }
              setSalesWithCoords([...updatedSales]);
            });
            return;
          }
          setSalesWithCoords([...updatedSales]);
        });
      }, index * 100); // Stagger requests by 100ms
    });

    // Set initial state immediately
    setSalesWithCoords(updatedSales);
  }, [sales]);

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
      const sale = salesWithCoords.find((s) => s.id === selectedSaleId);
      if (sale && sale.coords) {
        mapRef.current.panTo(sale.coords);
        setInfoWindowSale(sale);
      }
    }
  }, [selectedSaleId, salesWithCoords]);

  const handleMarkerClick = (sale: SaleWithCoords) => {
    setInfoWindowSale(sale);
    onSaleSelect?.(sale.id);

    if (sale.coords) {
      mapRef.current?.panTo(sale.coords);
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
      {salesWithCoords.map((sale) => {
        // Only render marker if we have coordinates
        if (!sale.coords) return null;

        const isSelected = selectedSaleId === sale.id;

        return (
          <Marker
            key={sale.id}
            position={sale.coords}
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

      {infoWindowSale && infoWindowSale.coords && (
        <InfoWindow
          position={infoWindowSale.coords}
          onCloseClick={() => {
            setInfoWindowSale(null);
            onSaleSelect?.(null);
          }}
          options={{
            pixelOffset: new google.maps.Size(0, -30),
          }}
        >
          <div className="max-w-[240px] p-1">
            <h3 className="font-serif text-sm font-bold text-[#2D3B2D] leading-tight">
              {infoWindowSale.title}
            </h3>
            <p className="mt-1 text-xs text-[#6B7280]">
              {infoWindowSale.company_name}
            </p>
            <p className="mt-1 text-xs text-[#6B7280]">
              {infoWindowSale.city}, {infoWindowSale.state}
            </p>
            <p className="mt-1 text-xs font-medium text-[#2D3B2D]">
              {formatDateRange(infoWindowSale.start_date, infoWindowSale.end_date)}
            </p>
            <Link
              href={`/sales/${infoWindowSale.id}`}
              className="mt-2 block text-xs font-medium text-[#2D3B2D] underline hover:opacity-70"
            >
              View Details
            </Link>
          </div>
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
