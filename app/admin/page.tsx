"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import type { Profile, Sale } from "@/lib/database.types";
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

function TrashIcon() {
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
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
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

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 ${filled ? "text-yellow-500" : "text-gray-400"}`}
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
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

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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

export default function AdminPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    async function loadData() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/signin");
        return;
      }

      // Check if user is super admin
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      const typedProfile = profileData as Profile | null;
      if (!typedProfile?.is_super_admin) {
        router.push("/");
        return;
      }

      setProfile(typedProfile);

      // Load all sales
      const { data: salesData } = await supabase
        .from("sales")
        .select("*")
        .order("created_at", { ascending: false });

      if (salesData) {
        setSales(salesData as Sale[]);
      }

      setLoading(false);
    }

    loadData();
  }, [router]);

  const handleDelete = async (saleId: string) => {
    if (!confirm("Are you sure you want to delete this sale?")) return;

    setDeleting(saleId);
    const supabase = createBrowserSupabaseClient();

    const { error } = await supabase.from("sales").delete().eq("id", saleId);

    if (error) {
      alert("Failed to delete sale: " + error.message);
    } else {
      setSales(sales.filter((s) => s.id !== saleId));
    }

    setDeleting(null);
  };

  const toggleFeatured = async (sale: Sale) => {
    const supabase = createBrowserSupabaseClient();

    const { error } = await supabase
      .from("sales")
      .update({ is_featured: !sale.is_featured } as never)
      .eq("id", sale.id);

    if (error) {
      alert("Failed to update: " + error.message);
    } else {
      setSales(
        sales.map((s) =>
          s.id === sale.id ? { ...s, is_featured: !s.is_featured } : s
        )
      );
    }
  };

  const togglePublished = async (sale: Sale) => {
    const supabase = createBrowserSupabaseClient();

    const { error } = await supabase
      .from("sales")
      .update({ is_published: !sale.is_published } as never)
      .eq("id", sale.id);

    if (error) {
      alert("Failed to update: " + error.message);
    } else {
      setSales(
        sales.map((s) =>
          s.id === sale.id ? { ...s, is_published: !s.is_published } : s
        )
      );
    }
  };

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

  const featuredSales = sales.filter((s) => s.is_featured).length;

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-[#2D3B2D] sm:text-3xl">
              Admin Dashboard
            </h1>
            <p className="mt-1 text-[#6B7280]">
              Manage all sales across the platform
            </p>
          </div>

          <Link
            href="/admin/create"
            className="inline-flex items-center justify-center gap-2 bg-[#2D3B2D] px-5 py-3 text-sm font-medium uppercase tracking-wide text-white transition-opacity hover:opacity-90"
          >
            <PlusIcon />
            New Sale
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          <div className="border border-[#E5E5E5] bg-white p-5">
            <p className="text-sm font-medium uppercase tracking-wide text-[#6B7280]">
              Total Sales
            </p>
            <p className="mt-2 font-serif text-3xl font-bold text-[#2D3B2D]">
              {sales.length}
            </p>
          </div>
          <div className="border border-[#E5E5E5] bg-white p-5">
            <p className="text-sm font-medium uppercase tracking-wide text-[#6B7280]">
              Published
            </p>
            <p className="mt-2 font-serif text-3xl font-bold text-[#2D3B2D]">
              {sales.filter((s) => s.is_published).length}
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
          <div className="border border-[#E5E5E5] bg-white p-5">
            <p className="text-sm font-medium uppercase tracking-wide text-[#6B7280]">
              Featured
            </p>
            <p className="mt-2 font-serif text-3xl font-bold text-yellow-600">
              {featuredSales}
            </p>
          </div>
        </div>

        {/* Sales List */}
        <div className="mt-8">
          <h2 className="font-serif text-xl font-bold text-[#2D3B2D]">
            All Sales
          </h2>

          {sales.length === 0 ? (
            <div className="mt-4 border border-dashed border-[#E5E5E5] bg-white p-12 text-center">
              <p className="text-[#6B7280]">
                No sales yet. Create your first one.
              </p>
            </div>
          ) : (
            <div className="mt-4 overflow-hidden border border-[#E5E5E5] bg-white">
              <table className="min-w-full divide-y divide-[#E5E5E5]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#6B7280]">
                      Sale
                    </th>
                    <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#6B7280] sm:table-cell">
                      Location
                    </th>
                    <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#6B7280] md:table-cell">
                      Dates
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#6B7280]">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-[#6B7280]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E5]">
                  {sales.map((sale) => {
                    const status = getSaleStatus(sale);
                    return (
                      <tr key={sale.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 flex-shrink-0 bg-[#E5E5E5]">
                              {sale.photos && sale.photos.length > 0 ? (
                                <img
                                  src={sale.photos[0]}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[#B8A88A]">
                                  <ImageIcon />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-[#2D3B2D]">
                                {sale.title}
                              </p>
                              {sale.seller_name && (
                                <p className="text-xs text-[#6B7280]">
                                  by {sale.seller_name}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="hidden px-4 py-4 text-sm text-[#6B7280] sm:table-cell">
                          {sale.city}, {sale.state}
                        </td>
                        <td className="hidden px-4 py-4 text-sm text-[#6B7280] md:table-cell">
                          {formatDate(sale.start_date)} - {formatDate(sale.end_date)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded px-2 py-1 text-xs font-medium ${status.color}`}
                            >
                              {status.label}
                            </span>
                            {sale.is_featured && (
                              <StarIcon filled={true} />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => toggleFeatured(sale)}
                              className="p-1.5 text-[#6B7280] hover:text-yellow-500"
                              title={sale.is_featured ? "Unfeature" : "Feature"}
                            >
                              <StarIcon filled={sale.is_featured} />
                            </button>
                            <button
                              onClick={() => togglePublished(sale)}
                              className={`rounded px-2 py-1 text-xs font-medium ${
                                sale.is_published
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {sale.is_published ? "Published" : "Draft"}
                            </button>
                            <Link
                              href={`/sales/${sale.id}`}
                              className="p-1.5 text-[#6B7280] hover:text-[#2D3B2D]"
                              title="View"
                            >
                              <EyeIcon />
                            </Link>
                            <Link
                              href={`/admin/edit/${sale.id}`}
                              className="p-1.5 text-[#6B7280] hover:text-[#2D3B2D]"
                              title="Edit"
                            >
                              <PencilIcon />
                            </Link>
                            <button
                              onClick={() => handleDelete(sale.id)}
                              disabled={deleting === sale.id}
                              className="p-1.5 text-[#6B7280] hover:text-red-600 disabled:opacity-50"
                              title="Delete"
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
