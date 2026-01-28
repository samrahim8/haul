"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import type { Profile, Sale } from "@/lib/database.types";
import { uploadSalePhotos, uploadSaleVideo } from "@/lib/storage";
import Navbar from "../../../components/Navbar";

function ArrowLeftIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 h-4 w-4 inline-block">
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function StarIcon({ filled }: { filled?: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

export default function AdminEditSalePage() {
  const router = useRouter();
  const params = useParams();
  const saleId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("TX");
  const [zipCode, setZipCode] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("16:00");
  const [sellerName, setSellerName] = useState("");
  const [sellerEmail, setSellerEmail] = useState("");
  const [sellerPhone, setSellerPhone] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  // Photo state
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [newPhotoFiles, setNewPhotoFiles] = useState<File[]>([]);
  const [newPhotoPreviews, setNewPhotoPreviews] = useState<string[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    async function loadSale() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push("/signin");
        return;
      }

      // Check super admin
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

      // Load sale
      const { data: saleData, error: saleError } = await supabase
        .from("sales")
        .select("*")
        .eq("id", saleId)
        .single();

      const typedSale = saleData as Sale | null;
      if (saleError || !typedSale) {
        setError("Sale not found");
        setLoading(false);
        return;
      }

      // Populate form
      setTitle(typedSale.title);
      setDescription(typedSale.description || "");
      setAddress(typedSale.address);
      setCity(typedSale.city);
      setState(typedSale.state);
      setZipCode(typedSale.zip_code);
      setStartDate(typedSale.start_date);
      setEndDate(typedSale.end_date);
      setStartTime(typedSale.start_time || "09:00");
      setEndTime(typedSale.end_time || "16:00");
      setSellerName(typedSale.seller_name || "");
      setSellerEmail(typedSale.seller_email || "");
      setSellerPhone(typedSale.seller_phone || "");
      setIsFeatured(typedSale.is_featured);
      setIsPublished(typedSale.is_published);
      setExistingPhotos(typedSale.photos || []);

      setLoading(false);
    }

    loadSale();
  }, [router, saleId]);

  const handleNewPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const addedFiles: File[] = [];
    const addedPreviews: string[] = [];
    Array.from(files).forEach((file) => {
      addedFiles.push(file);
      addedPreviews.push(URL.createObjectURL(file));
    });

    setNewPhotoFiles([...newPhotoFiles, ...addedFiles]);
    setNewPhotoPreviews([...newPhotoPreviews, ...addedPreviews]);
  };

  const removeExistingPhoto = (index: number) => {
    const updated = [...existingPhotos];
    updated.splice(index, 1);
    setExistingPhotos(updated);

    if (index === heroIndex) setHeroIndex(0);
    else if (index < heroIndex) setHeroIndex(heroIndex - 1);
  };

  const removeNewPhoto = (index: number) => {
    const totalExisting = existingPhotos.length;
    const adjustedIndex = index - totalExisting;

    const updatedFiles = [...newPhotoFiles];
    updatedFiles.splice(adjustedIndex, 1);
    setNewPhotoFiles(updatedFiles);

    const updatedPreviews = [...newPhotoPreviews];
    URL.revokeObjectURL(updatedPreviews[adjustedIndex]);
    updatedPreviews.splice(adjustedIndex, 1);
    setNewPhotoPreviews(updatedPreviews);

    if (index === heroIndex) setHeroIndex(0);
    else if (index < heroIndex) setHeroIndex(heroIndex - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const supabase = createBrowserSupabaseClient();

    // Upload new photos if any
    let allPhotos = [...existingPhotos];

    if (newPhotoFiles.length > 0) {
      const result = await uploadSalePhotos(supabase, newPhotoFiles, saleId);
      allPhotos = [...allPhotos, ...result.urls];
    }

    // Reorder so hero is first
    if (heroIndex > 0 && heroIndex < allPhotos.length) {
      const [hero] = allPhotos.splice(heroIndex, 1);
      allPhotos.unshift(hero);
    }

    const { error: updateError } = await supabase
      .from("sales")
      .update({
        title,
        description: description || null,
        address,
        city,
        state,
        zip_code: zipCode,
        start_date: startDate,
        end_date: endDate,
        start_time: startTime,
        end_time: endTime,
        seller_name: sellerName || null,
        seller_email: sellerEmail || null,
        seller_phone: sellerPhone || null,
        is_featured: isFeatured,
        is_published: isPublished,
        photos: allPhotos,
      } as never)
      .eq("id", saleId);

    if (updateError) {
      setError(updateError.message);
      setSubmitting(false);
      return;
    }

    router.push("/admin");
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this sale? This cannot be undone.")) return;

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.from("sales").delete().eq("id", saleId);

    if (error) {
      alert("Failed to delete: " + error.message);
    } else {
      router.push("/admin");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDFBF7]">
        <div className="text-[#6B7280]">Loading...</div>
      </div>
    );
  }

  const allPhotos = [...existingPhotos, ...newPhotoPreviews];

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <Navbar />

      <main className="px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-2xl">
          <Link href="/admin" className="inline-flex items-center text-sm text-[#6B7280] hover:text-[#2D3B2D]">
            <ArrowLeftIcon />
            Back to Admin
          </Link>

          <div className="mt-6 flex items-center justify-between">
            <h1 className="font-serif text-2xl font-bold text-[#2D3B2D] sm:text-3xl">
              Edit Sale
            </h1>
            <button
              onClick={handleDelete}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Delete Sale
            </button>
          </div>

          {error && (
            <div className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium uppercase tracking-wide text-[#2D3B2D]">
                Sale Title <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="mt-2 w-full border border-[#E5E5E5] bg-white px-4 py-3 text-[#2D3B2D] focus:border-[#2D3B2D] focus:outline-none"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium uppercase tracking-wide text-[#2D3B2D]">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="mt-2 w-full border border-[#E5E5E5] bg-white px-4 py-3 text-[#2D3B2D] focus:border-[#2D3B2D] focus:outline-none"
              />
            </div>

            {/* Seller Info */}
            <div className="border-t border-[#E5E5E5] pt-6">
              <h3 className="text-sm font-medium uppercase tracking-wide text-[#2D3B2D]">Seller Information</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm text-[#6B7280]">Name</label>
                  <input
                    type="text"
                    value={sellerName}
                    onChange={(e) => setSellerName(e.target.value)}
                    className="mt-1 w-full border border-[#E5E5E5] bg-white px-3 py-2 text-[#2D3B2D] focus:border-[#2D3B2D] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#6B7280]">Email</label>
                  <input
                    type="email"
                    value={sellerEmail}
                    onChange={(e) => setSellerEmail(e.target.value)}
                    className="mt-1 w-full border border-[#E5E5E5] bg-white px-3 py-2 text-[#2D3B2D] focus:border-[#2D3B2D] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#6B7280]">Phone</label>
                  <input
                    type="tel"
                    value={sellerPhone}
                    onChange={(e) => setSellerPhone(e.target.value)}
                    className="mt-1 w-full border border-[#E5E5E5] bg-white px-3 py-2 text-[#2D3B2D] focus:border-[#2D3B2D] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium uppercase tracking-wide text-[#2D3B2D]">
                Street Address <span className="text-red-500">*</span>
              </label>
              <input
                id="address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                className="mt-2 w-full border border-[#E5E5E5] bg-white px-4 py-3 text-[#2D3B2D] focus:border-[#2D3B2D] focus:outline-none"
              />
            </div>

            {/* City/State/Zip */}
            <div className="grid gap-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium uppercase tracking-wide text-[#2D3B2D]">City *</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  className="mt-2 w-full border border-[#E5E5E5] bg-white px-4 py-3 text-[#2D3B2D] focus:border-[#2D3B2D] focus:outline-none"
                />
              </div>
              <div className="sm:col-span-1">
                <label className="block text-sm font-medium uppercase tracking-wide text-[#2D3B2D]">State *</label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="mt-2 w-full border border-[#E5E5E5] bg-white px-4 py-3 text-[#2D3B2D] focus:border-[#2D3B2D] focus:outline-none"
                >
                  {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium uppercase tracking-wide text-[#2D3B2D]">Zip *</label>
                <input
                  type="text"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  required
                  className="mt-2 w-full border border-[#E5E5E5] bg-white px-4 py-3 text-[#2D3B2D] focus:border-[#2D3B2D] focus:outline-none"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium uppercase tracking-wide text-[#2D3B2D]">Start Date *</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="mt-2 w-full border border-[#E5E5E5] bg-white px-4 py-3 text-[#2D3B2D] focus:border-[#2D3B2D] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium uppercase tracking-wide text-[#2D3B2D]">End Date *</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="mt-2 w-full border border-[#E5E5E5] bg-white px-4 py-3 text-[#2D3B2D] focus:border-[#2D3B2D] focus:outline-none"
                />
              </div>
            </div>

            {/* Times */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium uppercase tracking-wide text-[#2D3B2D]">Start Time *</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="mt-2 w-full border border-[#E5E5E5] bg-white px-4 py-3 text-[#2D3B2D] focus:border-[#2D3B2D] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium uppercase tracking-wide text-[#2D3B2D]">End Time *</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="mt-2 w-full border border-[#E5E5E5] bg-white px-4 py-3 text-[#2D3B2D] focus:border-[#2D3B2D] focus:outline-none"
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm text-[#2D3B2D]">Published</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm text-[#2D3B2D]">Featured</span>
              </label>
            </div>

            {/* Photos */}
            <div>
              <label className="block text-sm font-medium uppercase tracking-wide text-[#2D3B2D]">Photos</label>

              {allPhotos.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {allPhotos.map((url, index) => (
                    <div key={index} className="group relative aspect-square">
                      <img src={url} alt="" className={`h-full w-full object-cover ${index === heroIndex ? "ring-2 ring-[#B8A88A]" : ""}`} />
                      <button
                        type="button"
                        onClick={() => setHeroIndex(index)}
                        className={`absolute left-1 top-1 flex h-6 w-6 items-center justify-center ${index === heroIndex ? "bg-[#B8A88A] text-white" : "bg-black/60 text-white opacity-0 group-hover:opacity-100"}`}
                      >
                        <StarIcon filled={index === heroIndex} />
                      </button>
                      <button
                        type="button"
                        onClick={() => index < existingPhotos.length ? removeExistingPhoto(index) : removeNewPhoto(index)}
                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center bg-black/60 text-white opacity-0 group-hover:opacity-100"
                      >
                        <XIcon />
                      </button>
                      {index === heroIndex && (
                        <div className="absolute bottom-0 left-0 right-0 bg-[#B8A88A] px-2 py-1 text-center text-xs font-medium text-white">Hero</div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <label className="mt-3 flex cursor-pointer items-center justify-center border-2 border-dashed border-[#E5E5E5] bg-white px-6 py-8 hover:border-[#2D3B2D]">
                <div className="text-center">
                  <div className="mx-auto text-[#B8A88A]"><ImageIcon /></div>
                  <p className="mt-2 text-sm text-[#6B7280]">Add more photos</p>
                </div>
                <input type="file" accept="image/*" multiple onChange={handleNewPhotoUpload} className="hidden" />
              </label>
            </div>

            {/* Submit */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#2D3B2D] px-6 py-3 text-sm font-medium uppercase tracking-wide text-white hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
