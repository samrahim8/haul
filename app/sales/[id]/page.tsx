"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import MapModal from "@/app/components/MapModal";
import Navbar from "@/app/components/Navbar";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { Sale, Company } from "@/lib/database.types";

type SaleWithCompany = Sale & {
  company: Company | null;
  company_name: string;
};

function ArrowLeftIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}

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
      className="h-5 w-5 flex-shrink-0 text-[#B8A88A]"
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
      className="h-5 w-5 flex-shrink-0 text-[#B8A88A]"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function HeartIcon() {
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
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

function ShareIcon() {
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
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" x2="12" y1="2" y2="15" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="h-16 w-16 text-[#B8A88A]"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const formatOptions: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
  };

  const startFormatted = start.toLocaleDateString("en-US", formatOptions);
  const endFormatted = end.toLocaleDateString("en-US", formatOptions);

  return `${startFormatted} — ${endFormatted}`;
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

export default function SaleDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [sale, setSale] = useState<SaleWithCompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [mapModalOpen, setMapModalOpen] = useState(false);

  useEffect(() => {
    async function fetchSale() {
      setLoading(true);
      const supabase = createBrowserSupabaseClient();

      const { data, error } = await supabase
        .from("sales")
        .select(`
          *,
          company:companies(*)
        `)
        .eq("id", id)
        .single();

      if (error || !data) {
        console.error("Error fetching sale:", error);
        setSale(null);
      } else {
        const saleData = data as Sale & { company: Company | null };
        setSale({
          ...saleData,
          company_name: saleData.company?.company_name || saleData.seller_name || "Private Seller",
        });
      }
      setLoading(false);
    }

    fetchSale();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDFBF7]">
        <div className="text-[#6B7280]">Loading...</div>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDFBF7]">
        <div className="text-center">
          <h1 className="font-serif text-2xl font-bold text-[#2D3B2D]">
            Sale Not Found
          </h1>
          <Link
            href="/sales"
            className="mt-4 inline-block text-[#2D3B2D] underline"
          >
            Back to sales
          </Link>
        </div>
      </div>
    );
  }

  const photoCount = sale.photos.length;
  const timeRange = `${formatTime(sale.start_time)} - ${formatTime(sale.end_time)} daily`;

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <Navbar />

      {/* Back Link - Mobile */}
      <div className="px-4 py-3 lg:hidden">
        <Link
          href="/sales"
          className="inline-flex items-center gap-2 text-sm text-[#6B7280]"
        >
          <ArrowLeftIcon />
          Back
        </Link>
      </div>

      {/* Main Content */}
      <main className="lg:px-12 lg:py-8 xl:px-20">
        {/* Desktop Back Link */}
        <div className="mb-6 hidden lg:block">
          <Link
            href="/sales"
            className="inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#2D3B2D]"
          >
            <ArrowLeftIcon />
            Back to sales
          </Link>
        </div>

        <div className="lg:flex lg:gap-8">
          {/* Left Column - Image & About */}
          <div className="lg:w-[60%]">
            {/* Hero Image */}
            <div className="relative aspect-[4/3] w-full bg-[#E5E5E5] lg:overflow-hidden">
              {photoCount > 0 ? (
                <img
                  src={sale.photos[currentImageIndex]}
                  alt={`${sale.title} - Photo ${currentImageIndex + 1}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <ImageIcon />
                </div>
              )}

              {/* Featured Badge */}
              {sale.is_featured && (
                <div className="absolute left-3 top-3 bg-[#2D3B2D] px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-white lg:left-4 lg:top-4">
                  Featured
                </div>
              )}

              {/* Photo Count */}
              {photoCount > 0 && (
                <div className="absolute bottom-3 right-3 bg-black/60 px-2.5 py-1 text-xs font-medium text-white lg:bottom-4 lg:right-4">
                  {photoCount} photo{photoCount !== 1 ? "s" : ""}
                </div>
              )}

              {/* Carousel Navigation */}
              {photoCount > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? photoCount - 1 : prev - 1))}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 p-3 text-white active:bg-black/80 lg:left-4 lg:p-2 lg:hover:bg-black/80"
                    aria-label="Previous photo"
                  >
                    <ArrowLeftIcon />
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev === photoCount - 1 ? 0 : prev + 1))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rotate-180 bg-black/60 p-3 text-white active:bg-black/80 lg:right-4 lg:p-2 lg:hover:bg-black/80"
                    aria-label="Next photo"
                  >
                    <ArrowLeftIcon />
                  </button>
                  <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2 lg:bottom-4 lg:gap-1.5">
                    {sale.photos.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`h-2.5 w-2.5 rounded-full transition-colors lg:h-2 lg:w-2 ${
                          index === currentImageIndex
                            ? "bg-white"
                            : "bg-white/50"
                        }`}
                        aria-label={`View photo ${index + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Mobile: Sale Info */}
            <div className="px-4 py-5 lg:hidden">
              {/* Title */}
              <h1 className="font-serif text-xl uppercase leading-tight text-[#2D3B2D]">
                {sale.title}
              </h1>

              {/* Date & Time */}
              <div className="mt-4 flex items-start gap-3">
                <CalendarIcon />
                <div>
                  <p className="font-medium text-[#2D3B2D]">
                    {formatDateRange(sale.start_date, sale.end_date)}
                  </p>
                  <p className="mt-0.5 text-sm text-[#6B7280]">{timeRange}</p>
                </div>
              </div>

              {/* Address */}
              <div className="mt-4 flex items-start gap-3">
                <MapPinIcon />
                <div>
                  <p className="font-medium text-[#2D3B2D]">{sale.address}</p>
                  <p className="text-sm text-[#6B7280]">
                    {sale.city}, {sale.state} {sale.zip_code}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => setMapModalOpen(true)}
                  className="flex-1 bg-[#2D3B2D] py-3.5 text-center text-sm font-semibold uppercase tracking-wide text-white active:opacity-90"
                >
                  View on Map
                </button>
                <button className="flex h-12 w-12 items-center justify-center border border-[#E5E5E5] bg-white text-[#6B7280] active:bg-gray-50">
                  <HeartIcon />
                </button>
                <button className="flex h-12 w-12 items-center justify-center border border-[#E5E5E5] bg-white text-[#6B7280] active:bg-gray-50">
                  <ShareIcon />
                </button>
              </div>
            </div>

            {/* About This Sale */}
            <div className="border-t border-[#E5E5E5] px-4 py-5 lg:border-t-0 lg:px-0 lg:pt-8">
              <h2 className="font-serif text-lg font-bold text-[#2D3B2D] lg:text-xl">
                About This Sale
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#6B7280] lg:mt-4 lg:text-base">
                {sale.description || "No description provided."}
              </p>
            </div>
          </div>

          {/* Right Column - Details Card (Desktop only) */}
          <div className="hidden lg:block lg:w-[40%]">
            <div className="sticky top-8 border border-[#E5E5E5] bg-white p-6">
              {/* Title */}
              <h1 className="font-serif text-2xl uppercase leading-tight text-[#2D3B2D]">
                {sale.title}
              </h1>

              {/* Date & Time */}
              <div className="mt-6 flex items-start gap-3">
                <CalendarIcon />
                <div>
                  <p className="font-medium text-[#2D3B2D]">
                    {formatDateRange(sale.start_date, sale.end_date)}
                  </p>
                  <p className="mt-0.5 text-sm text-[#6B7280]">{timeRange}</p>
                </div>
              </div>

              {/* Address */}
              <div className="mt-5 flex items-start gap-3">
                <MapPinIcon />
                <div>
                  <p className="font-medium text-[#2D3B2D]">{sale.address}</p>
                  <p className="text-sm text-[#6B7280]">
                    {sale.city}, {sale.state} {sale.zip_code}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => setMapModalOpen(true)}
                  className="flex-1 bg-[#2D3B2D] py-3 text-center text-sm font-semibold uppercase tracking-wide text-white transition-opacity hover:opacity-90"
                >
                  View on Map
                </button>
                <button className="flex h-[46px] w-[46px] items-center justify-center border border-[#E5E5E5] bg-white text-[#6B7280] transition-colors hover:border-[#2D3B2D] hover:text-[#2D3B2D]">
                  <HeartIcon />
                </button>
                <button className="flex h-[46px] w-[46px] items-center justify-center border border-[#E5E5E5] bg-white text-[#6B7280] transition-colors hover:border-[#2D3B2D] hover:text-[#2D3B2D]">
                  <ShareIcon />
                </button>
              </div>

              {/* Company Info */}
              <div className="mt-6 border-t border-[#E5E5E5] pt-5">
                <p className="text-xs uppercase tracking-wide text-[#6B7280]">
                  Hosted by
                </p>
                <p className="mt-1 font-medium text-[#2D3B2D]">
                  {sale.company_name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Map Modal */}
      <MapModal
        isOpen={mapModalOpen}
        onClose={() => setMapModalOpen(false)}
        title={sale.title}
        address={sale.address}
        city={sale.city}
        state={sale.state}
        zipCode={sale.zip_code}
      />
    </div>
  );
}
