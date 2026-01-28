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
      className="h-4 w-4 text-[#B8A88A]"
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
      className="h-4 w-4 text-[#B8A88A]"
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

function SalesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryParam = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [sales, setSales] = useState<SaleWithCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);

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
        {/* Sales List */}
        <div className="flex-1 px-4 py-4 sm:px-6 sm:py-6 md:px-12 lg:px-12 lg:py-8">
          <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="font-serif text-xl font-bold text-[#2D3B2D] sm:text-2xl">
              {sales.length} {sales.length === 1 ? "Sale" : "Sales"} near {displayLocation}
            </h1>
            <select className="w-full border border-[#E5E5E5] bg-white px-3 py-2 text-sm text-[#2D3B2D] focus:border-[#2D3B2D] focus:outline-none sm:w-auto">
              <option>Sort by: Date</option>
              <option>Sort by: Distance</option>
              <option>Sort by: Newest</option>
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
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-1">
            {sales.map((sale) => (
              <Link
                key={sale.id}
                href={`/sales/${sale.id}`}
                className={`block border bg-white transition-all hover:shadow-lg ${
                  selectedSaleId === sale.id
                    ? "border-[#2D3B2D] shadow-lg"
                    : "border-[#E5E5E5]"
                }`}
                onMouseEnter={() => setSelectedSaleId(sale.id)}
                onMouseLeave={() => setSelectedSaleId(null)}
              >
                {/* Image */}
                <div className="relative aspect-[16/9] w-full bg-[#E5E5E5]">
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
                        className="h-12 w-12"
                      >
                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                        <circle cx="9" cy="9" r="2" />
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                      </svg>
                    </div>
                  )}
                  {sale.is_featured && (
                    <div className="absolute top-3 left-3 bg-[#B8A88A] px-2 py-1 text-xs font-medium uppercase tracking-wide text-white">
                      Featured
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5">
                  <h2 className="font-serif text-lg font-bold uppercase tracking-wide text-[#2D3B2D] sm:text-xl">
                    {sale.title}
                  </h2>

                  <div className="mt-4 space-y-3">
                    {/* Date & Time */}
                    <div className="flex items-start gap-3">
                      <CalendarIcon />
                      <div>
                        <p className="font-medium text-[#2D3B2D]">
                          {formatDateRange(sale.start_date, sale.end_date)}
                        </p>
                        {sale.start_time && sale.end_time && (
                          <p className="text-sm text-[#6B7280]">
                            {formatTime(sale.start_time)} - {formatTime(sale.end_time)} daily
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-start gap-3">
                      <MapPinIcon />
                      <div>
                        <p className="font-medium text-[#2D3B2D]">{sale.address}</p>
                        <p className="text-sm text-[#6B7280]">
                          {sale.city}, {sale.state} {sale.zip_code}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Hosted By */}
                  <div className="mt-4 border-t border-[#E5E5E5] pt-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
                      Hosted by
                    </p>
                    <p className="mt-1 font-medium text-[#2D3B2D]">
                      {sale.company_name}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          )}
        </div>

        {/* Map */}
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
