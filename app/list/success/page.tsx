"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../../components/Navbar";

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-12 w-12"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const saleId = searchParams.get("id");

  return (
    <div className="mx-auto max-w-lg text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#2D3B2D] text-white">
        <CheckIcon />
      </div>

      <h1 className="mt-6 font-serif text-2xl font-bold text-[#2D3B2D] sm:text-3xl">
        Listing Created
      </h1>
      <p className="mt-3 text-[#6B7280]">
        Your estate sale has been successfully submitted. You can manage your listing from your dashboard.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
        {saleId && (
          <Link
            href={`/sales/${saleId}`}
            className="inline-flex items-center justify-center border border-[#2D3B2D] bg-white px-6 py-3 text-sm font-medium uppercase tracking-wide text-[#2D3B2D] transition-opacity hover:opacity-70"
          >
            View Listing
          </Link>
        )}
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center bg-[#2D3B2D] px-6 py-3 text-sm font-medium uppercase tracking-wide text-white transition-opacity hover:opacity-90"
        >
          Go to Dashboard
        </Link>
      </div>

      <div className="mt-12 border-t border-[#E5E5E5] pt-8">
        <p className="text-sm text-[#6B7280]">
          Want to list another sale?
        </p>
        <Link
          href="/list"
          className="mt-2 inline-block text-sm font-medium text-[#2D3B2D] hover:opacity-70"
        >
          Create New Listing
        </Link>
      </div>
    </div>
  );
}

export default function ListSuccessPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <Navbar />

      <main className="px-4 py-12 sm:px-6 sm:py-16 md:py-24">
        <Suspense fallback={<div className="text-center text-[#6B7280]">Loading...</div>}>
          <SuccessContent />
        </Suspense>
      </main>
    </div>
  );
}
