"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";
import type { Profile, Company, Sale } from "@/lib/database.types";
import Navbar from "../components/Navbar";

function PlusIcon() {
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
      <path d="M5 12h14" />
      <path d="M12 5v14" />
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
      className="h-4 w-4"
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
      className="h-4 w-4"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function EyeIcon() {
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
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function PencilIcon() {
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
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
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
      className="h-8 w-8"
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
  const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString("en-US", options)} - ${end.toLocaleDateString("en-US", options)}`;
}

function getSaleStatus(sale: Sale): { label: string; color: string } {
  const now = new Date();
  const start = new Date(sale.start_date);
  const end = new Date(sale.end_date);

  if (!sale.is_published) {
    return { label: "Draft", color: "bg-gray-100 text-gray-700" };
  }
  if (now < start) {
    return { label: "Upcoming", color: "bg-blue-100 text-blue-700" };
  }
  if (now >= start && now <= end) {
    return { label: "Active", color: "bg-green-100 text-green-700" };
  }
  return { label: "Ended", color: "bg-gray-100 text-gray-600" };
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    async function loadUserData() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push("/signin");
        return;
      }

      setUser(session.user);

      // Get profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      const typedProfile = profileData as Profile | null;
      if (!typedProfile) {
        setLoading(false);
        return;
      }

      setProfile(typedProfile);

      // If not a company user, redirect to home
      if (typedProfile.user_type !== "company") {
        router.push("/");
        return;
      }

      // Get company if exists
      const { data: companyData } = await supabase
        .from("companies")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      const typedCompany = companyData as Company | null;
      if (typedCompany) {
        setCompany(typedCompany);

        // Fetch company's sales
        const { data: salesData } = await supabase
          .from("sales")
          .select("*")
          .eq("company_id", typedCompany.id)
          .order("created_at", { ascending: false });

        if (salesData) {
          setSales(salesData as Sale[]);
        }
      }

      setLoading(false);
    }

    loadUserData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7]">
        <Navbar />
        <div className="flex items-center justify-center py-24">
          <div className="text-[#6B7280]">Loading...</div>
        </div>
      </div>
    );
  }

  const activeSales = sales.filter((s) => {
    const now = new Date();
    const end = new Date(s.end_date);
    return s.is_published && now <= end;
  }).length;

  const totalSales = sales.length;
  const publishedSales = sales.filter((s) => s.is_published).length;

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-[#2D3B2D] sm:text-3xl">
              Dashboard
            </h1>
            <p className="mt-1 text-[#6B7280]">
              Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}
            </p>
          </div>

          <Link
            href="/list/company/create"
            className="inline-flex items-center justify-center gap-2 bg-[#2D3B2D] px-5 py-3 text-sm font-medium uppercase tracking-wide text-white transition-opacity hover:opacity-90"
          >
            <PlusIcon />
            New Listing
          </Link>
        </div>

        {/* Stats */}
        {company && (
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="border border-[#E5E5E5] bg-white p-5">
              <p className="text-sm font-medium uppercase tracking-wide text-[#6B7280]">
                Total Listings
              </p>
              <p className="mt-2 font-serif text-3xl font-bold text-[#2D3B2D]">
                {totalSales}
              </p>
            </div>
            <div className="border border-[#E5E5E5] bg-white p-5">
              <p className="text-sm font-medium uppercase tracking-wide text-[#6B7280]">
                Published
              </p>
              <p className="mt-2 font-serif text-3xl font-bold text-[#2D3B2D]">
                {publishedSales}
              </p>
            </div>
            <div className="border border-[#E5E5E5] bg-white p-5">
              <p className="text-sm font-medium uppercase tracking-wide text-[#6B7280]">
                Active Now
              </p>
              <p className="mt-2 font-serif text-3xl font-bold text-green-600">
                {activeSales}
              </p>
            </div>
          </div>
        )}

        {/* Company Setup CTA */}
        {!company && (
          <div className="mt-8 border border-[#E5E5E5] bg-white p-8 text-center">
            <h2 className="font-serif text-xl font-bold text-[#2D3B2D]">
              Set Up Your Company
            </h2>
            <p className="mx-auto mt-2 max-w-md text-[#6B7280]">
              Create your company profile to start listing estate sales and reach buyers in your area.
            </p>
            <Link
              href="/list/company"
              className="mt-6 inline-block bg-[#2D3B2D] px-6 py-3 text-sm font-medium uppercase tracking-wide text-white transition-opacity hover:opacity-90"
            >
              Create Company Profile
            </Link>
          </div>
        )}

        {/* Sales List */}
        {company && (
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-[#2D3B2D]">
                Your Listings
              </h2>
            </div>

            {sales.length === 0 ? (
              <div className="mt-4 border border-dashed border-[#E5E5E5] bg-white p-12 text-center">
                <p className="text-[#6B7280]">
                  No listings yet. Create your first sale to get started.
                </p>
                <Link
                  href="/list/company/create"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#2D3B2D] hover:opacity-70"
                >
                  <PlusIcon />
                  Create Listing
                </Link>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {sales.map((sale) => {
                  const status = getSaleStatus(sale);
                  return (
                    <div
                      key={sale.id}
                      className="border border-[#E5E5E5] bg-white transition-shadow hover:shadow-md"
                    >
                      <div className="flex flex-col sm:flex-row">
                        {/* Image */}
                        <div className="aspect-[4/3] w-full flex-shrink-0 bg-[#E5E5E5] sm:aspect-square sm:w-40">
                          {sale.photos && sale.photos.length > 0 ? (
                            <img
                              src={sale.photos[0]}
                              alt={sale.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[#B8A88A]">
                              <ImageIcon />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
                          <div>
                            <div className="flex items-start justify-between gap-3">
                              <h3 className="font-medium text-[#2D3B2D]">
                                {sale.title}
                              </h3>
                              <span
                                className={`shrink-0 rounded px-2 py-1 text-xs font-medium ${status.color}`}
                              >
                                {status.label}
                              </span>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[#6B7280]">
                              <span className="flex items-center gap-1.5">
                                <CalendarIcon />
                                {formatDateRange(sale.start_date, sale.end_date)}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <MapPinIcon />
                                {sale.city}, {sale.state}
                              </span>
                            </div>
                          </div>

                          <div className="mt-4 flex items-center gap-3">
                            <Link
                              href={`/sales/${sale.id}`}
                              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#2D3B2D] hover:opacity-70"
                            >
                              <EyeIcon />
                              View
                            </Link>
                            <span className="text-[#E5E5E5]">|</span>
                            <Link
                              href={`/dashboard/sales/${sale.id}/edit`}
                              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#2D3B2D] hover:opacity-70"
                            >
                              <PencilIcon />
                              Edit
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
