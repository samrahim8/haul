"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Navbar from "@/app/components/Navbar";
import SalesMap, { MapBounds } from "@/app/components/SalesMap";
import { SearchMapProvider } from "@/app/components/Map";
import LocationAutocomplete from "@/app/components/LocationAutocomplete";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { Sale, Company } from "@/lib/database.types";

type SaleWithCompany = Sale & {
  company: Company | null;
  company_name: string;
};

function CalendarIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5 flex-shrink-0 text-[#B8A88A] sm:h-4 sm:w-4"
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5 flex-shrink-0 text-[#B8A88A] sm:h-4 sm:w-4"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const startDay = start.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const endDay = end.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  return `${startDay} — ${endDay}`;
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function MapIcon() {
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
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" x2="9" y1="3" y2="18" />
      <line x1="15" x2="15" y1="6" y2="21" />
    </svg>
  );
}

function ListIcon() {
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
      <line x1="8" x2="21" y1="6" y2="6" />
      <line x1="8" x2="21" y1="12" y2="12" />
      <line x1="8" x2="21" y1="18" y2="18" />
      <line x1="3" x2="3.01" y1="6" y2="6" />
      <line x1="3" x2="3.01" y1="12" y2="12" />
      <line x1="3" x2="3.01" y1="18" y2="18" />
    </svg>
  );
}

function SalesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryParam = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [sales, setSales] = useState<SaleWithCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [showMobileMap, setShowMobileMap] = useState(false);

  useEffect(() => {
    setSearchQuery(queryParam);
  }, [queryParam]);

  // Geocode the search query to center the map
  useEffect(() => {
    if (!queryParam) {
      setMapCenter(null);
      return;
    }

    // Wait for Google Maps to load
    if (typeof google === "undefined" || !google.maps) {
      const timer = setTimeout(() => {
        // Retry after Google Maps loads
        if (typeof google !== "undefined" && google.maps) {
          geocodeLocation(queryParam);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }

    geocodeLocation(queryParam);

    function geocodeLocation(query: string) {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode(
        { address: `${query}, USA` },
        (results, status) => {
          if (status === "OK" && results && results[0]) {
            const location = results[0].geometry.location;
            setMapCenter({
              lat: location.lat(),
              lng: location.lng(),
            });
          }
        }
      );
    }
  }, [queryParam]);

  useEffect(() => {
    async function fetchSales() {
      setLoading(true);
      const supabase = createBrowserSupabaseClient();

      let query = supabase
        .from("sales")
        .select(`
          *,
          company:companies(*)
        `)
        .eq("is_published", true)
        .order("start_date", { ascending: true });

      // Filter by city or zip if search query provided
      if (queryParam) {
        query = query.or(`city.ilike.%${queryParam}%,zip_code.ilike.%${queryParam}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching sales:", error);
        setSales([]);
      } else {
        // Transform data to include company_name
        const salesData = (data || []) as (Sale & { company: Company | null })[];
        const transformedSales = salesData.map((sale) => ({
          ...sale,
          company_name: sale.company?.company_name || sale.seller_name || "Private Seller",
        }));
        setSales(transformedSales);
      }
      setLoading(false);
    }

    fetchSales();
  }, [queryParam]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/sales?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handlePlaceSelect = (place: {
    city: string | null;
    state: string | null;
    zipCode: string | null;
    query: string;
  }) => {
    if (place.query) {
      router.push(`/sales?q=${encodeURIComponent(place.query)}`);
    }
  };

  const handleSearchArea = (bounds: MapBounds) => {
    // Get the center of the bounds
    const centerLat = (bounds.north + bounds.south) / 2;
    const centerLng = (bounds.east + bounds.west) / 2;

    // Reverse geocode to get location name
    if (typeof google !== "undefined" && google.maps) {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode(
        { location: { lat: centerLat, lng: centerLng } },
        (results, status) => {
          if (status === "OK" && results && results[0]) {
            // Find city or locality from address components
            const addressComponents = results[0].address_components;
            let city = "";

            for (const component of addressComponents) {
              if (component.types.includes("locality")) {
                city = component.long_name;
                break;
              } else if (component.types.includes("administrative_area_level_2")) {
                city = component.long_name;
              }
            }

            if (city) {
              setSearchQuery(city);
              router.push(`/sales?q=${encodeURIComponent(city)}`);
            }
          }
        }
      );
    }
  };

  const displayLocation = queryParam || "your area";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-[#6B7280]">Loading sales...</div>
      </div>
    );
  }

  return (
    <>

      {/* Search Bar */}
      <div className="border-b border-[#E5E5E5] bg-white px-4 py-4 sm:px-6 md:px-12 lg:px-20">
        <div className="mx-auto max-w-2xl">
          <SearchMapProvider>
            <form onSubmit={handleSearch}>
              <LocationAutocomplete
                value={searchQuery}
                onChange={setSearchQuery}
                onPlaceSelect={handlePlaceSelect}
                placeholder="Enter city or zip code"
                showIcon={true}
                showButton={true}
                onSubmit={handleSearch}
              />
            </form>
          </SearchMapProvider>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row">
        {/* Mobile Map View */}
        {showMobileMap && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="h-full w-full">
              <SalesMap
                sales={sales}
                selectedSaleId={selectedSaleId}
                onSaleSelect={setSelectedSaleId}
                center={mapCenter || undefined}
                onSearchArea={handleSearchArea}
                showSearchButton={true}
              />
            </div>
            {/* Back to List Button */}
            <button
              onClick={() => setShowMobileMap(false)}
              className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white px-4 py-2.5 shadow-lg border border-[#E5E5E5] text-sm font-medium text-[#2D3B2D]"
            >
              <ListIcon />
              List View
            </button>
          </div>
        )}

        {/* Sales List */}
        <div className={`flex-1 px-4 py-4 sm:px-6 sm:py-6 md:px-12 lg:px-12 lg:py-8 ${showMobileMap ? 'hidden lg:block' : ''}`}>
          <div className="mb-4 flex items-center justify-between gap-3 sm:mb-6">
            <h1 className="font-serif text-lg font-bold text-[#2D3B2D] sm:text-2xl">
              {sales.length} {sales.length === 1 ? "Sale" : "Sales"} <span className="hidden sm:inline">near {displayLocation}</span>
            </h1>
            <select className="border border-[#E5E5E5] bg-white px-2 py-1.5 text-xs text-[#2D3B2D] focus:border-[#2D3B2D] focus:outline-none sm:px-3 sm:py-2 sm:text-sm">
              <option>Date</option>
              <option>Distance</option>
              <option>Newest</option>
            </select>
          </div>

          {sales.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-[#6B7280]">No sales found in this area.</p>
              <p className="mt-2 text-sm text-[#6B7280]">
                Try searching for a different city or zip code.
              </p>
            </div>
          ) : (
          <div className="space-y-3 pb-20 sm:space-y-4 lg:pb-0">
            {sales.map((sale) => (
              <Link
                key={sale.id}
                href={`/sales/${sale.id}`}
                className={`block border bg-white transition-all hover:shadow-md active:scale-[0.99] ${
                  selectedSaleId === sale.id
                    ? "border-[#2D3B2D] shadow-md"
                    : "border-[#E5E5E5]"
                }`}
                onMouseEnter={() => setSelectedSaleId(sale.id)}
                onMouseLeave={() => setSelectedSaleId(null)}
              >
                <div className="flex">
                  {/* Image */}
                  <div className="relative h-32 w-28 flex-shrink-0 bg-[#E5E5E5] sm:h-40 sm:w-40">
                    {sale.photos && sale.photos.length > 0 ? (
                      <img
                        src={sale.photos[0]}
                        alt={sale.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#B8A88A]">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          className="h-8 w-8 sm:h-10 sm:w-10"
                        >
                          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                          <circle cx="9" cy="9" r="2" />
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                        </svg>
                      </div>
                    )}
                    {sale.is_featured && (
                      <div className="absolute top-2 left-2 bg-[#B8A88A] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
                        Featured
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col justify-between p-3 sm:p-4">
                    <div>
                      <h2 className="font-serif text-sm font-bold uppercase tracking-wide text-[#2D3B2D] line-clamp-2 leading-tight sm:text-base sm:line-clamp-1">
                        {sale.title}
                      </h2>

                      <div className="mt-2 flex items-center gap-1.5 text-xs text-[#2D3B2D] sm:text-sm sm:gap-2">
                        <CalendarIcon />
                        <span className="font-medium">
                          {formatDateRange(sale.start_date, sale.end_date)}
                        </span>
                      </div>

                      {sale.start_time && sale.end_time && (
                        <p className="mt-0.5 pl-5 text-[10px] text-[#6B7280] sm:pl-6 sm:text-xs">
                          {formatTime(sale.start_time)} - {formatTime(sale.end_time)} daily
                        </p>
                      )}

                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[#6B7280] sm:mt-2 sm:text-sm sm:gap-2">
                        <MapPinIcon />
                        <span>{sale.city}, {sale.state}</span>
                      </div>
                    </div>

                    <div className="mt-2 text-[10px] text-[#6B7280] sm:text-xs">
                      <span className="uppercase tracking-wide">Hosted by</span>{" "}
                      <span className="font-medium text-[#2D3B2D]">{sale.company_name}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          )}
        </div>

        {/* Mobile Map Toggle Button */}
        {!showMobileMap && sales.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 lg:hidden">
            <button
              onClick={() => setShowMobileMap(true)}
              className="flex items-center gap-2 bg-[#2D3B2D] px-5 py-3 shadow-lg text-sm font-medium text-white rounded-full"
            >
              <MapIcon />
              Map View
            </button>
          </div>
        )}

        {/* Map (Desktop) */}
        <div className="hidden h-[calc(100vh-140px)] w-full flex-shrink-0 lg:block lg:w-[45%] lg:sticky lg:top-0">
          <SalesMap
            sales={sales}
            selectedSaleId={selectedSaleId}
            onSaleSelect={setSelectedSaleId}
            center={mapCenter || undefined}
            onSearchArea={handleSearchArea}
            showSearchButton={true}
          />
        </div>
      </div>
    </>
  );
}

export default function SalesPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <Navbar />
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20">
            <div className="text-[#6B7280]">Loading...</div>
          </div>
        }
      >
        <SalesContent />
      </Suspense>
    </div>
  );
}
