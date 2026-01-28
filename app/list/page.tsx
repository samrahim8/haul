"use client";

import Link from "next/link";
import Navbar from "../components/Navbar";

function BuildingIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-12 w-12 text-[#B8A88A]"
    >
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" />
      <path d="M16 6h.01" />
      <path d="M12 6h.01" />
      <path d="M12 10h.01" />
      <path d="M12 14h.01" />
      <path d="M16 10h.01" />
      <path d="M16 14h.01" />
      <path d="M8 10h.01" />
      <path d="M8 14h.01" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-12 w-12 text-[#B8A88A]"
    >
      <circle cx="12" cy="8" r="5" />
      <path d="M20 21a8 8 0 0 0-16 0" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="ml-1 h-4 w-4 inline-block"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

export default function ListPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <Navbar />

      <main className="px-4 py-12 sm:px-6 sm:py-16 md:py-20 lg:py-24">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <h1 className="text-center font-serif text-3xl font-bold text-[#2D3B2D] sm:text-4xl md:text-5xl">
            List Your Sale
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-center text-base text-[#6B7280] sm:mt-6 sm:text-lg">
            Choose how you&apos;d like to list your estate sale with Haul.
          </p>

          {/* Cards */}
          <div className="mt-10 grid gap-6 sm:mt-12 md:grid-cols-2 md:gap-8">
            {/* Professional Liquidator Card */}
            <div className="border border-[#E5E5E5] bg-white p-6 sm:p-8">
              <div className="flex flex-col items-center text-center">
                <BuildingIcon />
                <h2 className="mt-5 text-base font-bold uppercase tracking-wide text-[#2D3B2D]">
                  Professional Liquidator
                </h2>
                <p className="mt-3 text-sm text-[#6B7280] sm:text-base">
                  For established estate sale companies representing their clients.
                  List sales under your company&apos;s trusted brand.
                </p>
                <Link
                  href="/list/company"
                  className="mt-6 inline-flex items-center text-sm font-medium uppercase tracking-wide text-[#2D3B2D] hover:opacity-70"
                >
                  Get Started
                  <ArrowRightIcon />
                </Link>
              </div>
            </div>

            {/* Private Seller Card */}
            <div className="border border-[#E5E5E5] bg-white p-6 sm:p-8">
              <div className="flex flex-col items-center text-center">
                <PersonIcon />
                <h2 className="mt-5 text-base font-bold uppercase tracking-wide text-[#2D3B2D]">
                  Private Seller
                </h2>
                <p className="mt-3 text-sm text-[#6B7280] sm:text-base">
                  For individuals hosting their own estate sale.
                  Perfect for one-time DIY sales without professional representation.
                </p>
                <Link
                  href="/list/private"
                  className="mt-6 inline-flex items-center text-sm font-medium uppercase tracking-wide text-[#2D3B2D] hover:opacity-70"
                >
                  Get Started
                  <ArrowRightIcon />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
