"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import type { Profile, Sale, SaleInsert } from "@/lib/database.types";
import { uploadSalePhotos, uploadSaleVideo } from "@/lib/storage";
import Navbar from "../../components/Navbar";

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

function VideoIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8">
      <path d="m22 8-6 4 6 4V8Z" />
      <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
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

export default function AdminCreateSalePage() {
  const router = useRouter();
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

  // File state
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [heroIndex, setHeroIndex] = useState<number>(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();

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

      setLoading(false);
    }

    checkAuth();
  }, [router]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: File[] = [];
    const newPreviews: string[] = [];
    Array.from(files).forEach((file) => {
      newFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    });

    setPhotoFiles([...photoFiles, ...newFiles]);
    setPhotoPreviews([...photoPreviews, ...newPreviews]);
  };

  const removePhoto = (index: number) => {
    const newFiles = [...photoFiles];
    newFiles.splice(index, 1);
    setPhotoFiles(newFiles);

    const newPreviews = [...photoPreviews];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setPhotoPreviews(newPreviews);

    if (index === heroIndex) {
      setHeroIndex(0);
    } else if (index < heroIndex) {
      setHeroIndex(heroIndex - 1);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const removeVideo = () => {
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoFile(null);
    setVideoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent, publish: boolean = false) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const supabase = createBrowserSupabaseClient();

    // Create sale (no company_id for admin-created sales)
    const saleToInsert: SaleInsert = {
      company_id: null,
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
      photos: [],
      video_url: null,
      is_published: false,
      is_featured: isFeatured,
      seller_name: sellerName || null,
      seller_email: sellerEmail || null,
      seller_phone: sellerPhone || null,
    };

    const { data: saleData, error: insertError } = await supabase
      .from("sales")
      .insert(saleToInsert as never)
      .select()
      .single() as { data: Sale | null; error: Error | null };

    if (insertError || !saleData) {
      setError(insertError?.message || "Failed to create listing");
      setSubmitting(false);
      return;
    }

    // Upload files
    let photoUrls: string[] = [];
    let videoUrl: string | null = null;

    if (photoFiles.length > 0) {
      const orderedFiles = [...photoFiles];
      if (heroIndex > 0) {
        const [heroFile] = orderedFiles.splice(heroIndex, 1);
        orderedFiles.unshift(heroFile);
      }

      const photoResult = await uploadSalePhotos(supabase, orderedFiles, saleData.id);
      photoUrls = photoResult.urls;
      if (photoResult.errors.length > 0) {
        setError(`Some photos failed: ${photoResult.errors.join(", ")}`);
        setSubmitting(false);
        return;
      }
    }

    if (videoFile) {
      videoUrl = await uploadSaleVideo(supabase, videoFile, saleData.id);
      if (!videoUrl) {
        setError("Video failed to upload");
        setSubmitting(false);
        return;
      }
    }

    // Update with file URLs
    const { error: updateError } = await supabase
      .from("sales")
      .update({
        photos: photoUrls,
        video_url: videoUrl,
        is_published: publish,
      } as never)
      .eq("id", saleData.id);

    if (updateError) {
      setError("Files uploaded but update failed");
      setSubmitting(false);
      return;
    }

    router.push("/admin");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDFBF7]">
        <div className="text-[#6B7280]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <Navbar />

      <main className="px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-2xl">
          <Link href="/admin" className="inline-flex items-center text-sm text-[#6B7280] hover:text-[#2D3B2D]">
            <ArrowLeftIcon />
            Back to Admin
          </Link>

          <h1 className="mt-6 font-serif text-2xl font-bold text-[#2D3B2D] sm:text-3xl">
            Create Sale (Admin)
          </h1>
          <p className="mt-2 text-[#6B7280]">
            Add any estate sale to the platform
          </p>

          {error && (
            <div className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={(e) => handleSubmit(e, true)} className="mt-8 space-y-6">
            {/* Sale Title */}
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
                className="mt-2 w-full border border-[#E5E5E5] bg-white px-4 py-3 text-[#2D3B2D] placeholder:text-[#6B7280] focus:border-[#2D3B2D] focus:outline-none"
                placeholder="e.g., Vintage Furniture & Collectibles Estate Sale"
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
                className="mt-2 w-full border border-[#E5E5E5] bg-white px-4 py-3 text-[#2D3B2D] placeholder:text-[#6B7280] focus:border-[#2D3B2D] focus:outline-none"
                placeholder="Describe the items available..."
              />
            </div>

            {/* Seller Info */}
            <div className="border-t border-[#E5E5E5] pt-6">
              <h3 className="text-sm font-medium uppercase tracking-wide text-[#2D3B2D]">Seller Information</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="sellerName" className="block text-sm text-[#6B7280]">Name</label>
                  <input
                    id="sellerName"
                    type="text"
                    value={sellerName}
                    onChange={(e) => setSellerName(e.target.value)}
                    className="mt-1 w-full border border-[#E5E5E5] bg-white px-3 py-2 text-[#2D3B2D] focus:border-[#2D3B2D] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="sellerEmail" className="block text-sm text-[#6B7280]">Email</label>
                  <input
                    id="sellerEmail"
                    type="email"
                    value={sellerEmail}
                    onChange={(e) => setSellerEmail(e.target.value)}
                    className="mt-1 w-full border border-[#E5E5E5] bg-white px-3 py-2 text-[#2D3B2D] focus:border-[#2D3B2D] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="sellerPhone" className="block text-sm text-[#6B7280]">Phone</label>
                  <input
                    id="sellerPhone"
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
                className="mt-2 w-full border border-[#E5E5E5] bg-white px-4 py-3 text-[#2D3B2D] placeholder:text-[#6B7280] focus:border-[#2D3B2D] focus:outline-none"
                placeholder="1234 Main Street"
              />
            </div>

            {/* City, State, Zip */}
            <div className="grid gap-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="city" className="block text-sm font-medium uppercase tracking-wide text-[#2D3B2D]">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  id="city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  className="mt-2 w-full border border-[#E5E5E5] bg-white px-4 py-3 text-[#2D3B2D] focus:border-[#2D3B2D] focus:outline-none"
                />
              </div>
              <div className="sm:col-span-1">
                <label htmlFor="state" className="block text-sm font-medium uppercase tracking-wide text-[#2D3B2D]">
                  State <span className="text-red-500">*</span>
                </label>
                <select
                  id="state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="mt-2 w-full border border-[#E5E5E5] bg-white px-4 py-3 text-[#2D3B2D] focus:border-[#2D3B2D] focus:outline-none"
                >
                  {US_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="zipCode" className="block text-sm font-medium uppercase tracking-wide text-[#2D3B2D]">
                  Zip Code <span className="text-red-500">*</span>
                </label>
                <input
                  id="zipCode"
                  type="text"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  required
                  pattern="[0-9]{5}"
                  className="mt-2 w-full border border-[#E5E5E5] bg-white px-4 py-3 text-[#2D3B2D] focus:border-[#2D3B2D] focus:outline-none"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium uppercase tracking-wide text-[#2D3B2D]">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="mt-2 w-full border border-[#E5E5E5] bg-white px-4 py-3 text-[#2D3B2D] focus:border-[#2D3B2D] focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium uppercase tracking-wide text-[#2D3B2D]">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="endDate"
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
                <label htmlFor="startTime" className="block text-sm font-medium uppercase tracking-wide text-[#2D3B2D]">
                  Start Time <span className="text-red-500">*</span>
                </label>
                <input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="mt-2 w-full border border-[#E5E5E5] bg-white px-4 py-3 text-[#2D3B2D] focus:border-[#2D3B2D] focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="endTime" className="block text-sm font-medium uppercase tracking-wide text-[#2D3B2D]">
                  End Time <span className="text-red-500">*</span>
                </label>
                <input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="mt-2 w-full border border-[#E5E5E5] bg-white px-4 py-3 text-[#2D3B2D] focus:border-[#2D3B2D] focus:outline-none"
                />
              </div>
            </div>

            {/* Featured Toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="featured"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="h-4 w-4 border-gray-300 text-[#2D3B2D] focus:ring-[#2D3B2D]"
              />
              <label htmlFor="featured" className="text-sm text-[#2D3B2D]">
                Mark as Featured Sale
              </label>
            </div>

            {/* Photos Upload */}
            <div>
              <label className="block text-sm font-medium uppercase tracking-wide text-[#2D3B2D]">Photos</label>
              <p className="mt-1 text-sm text-[#6B7280]">Click the star to set the hero image.</p>

              {photoPreviews.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {photoPreviews.map((url, index) => (
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
                        onClick={() => removePhoto(index)}
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
                  <p className="mt-2 text-sm text-[#6B7280]">Click to upload photos</p>
                </div>
                <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
              </label>
            </div>

            {/* Video Upload */}
            <div>
              <label className="block text-sm font-medium uppercase tracking-wide text-[#2D3B2D]">
                Video <span className="text-xs text-[#6B7280] normal-case">(optional)</span>
              </label>

              {videoPreview && (
                <div className="mt-3 relative inline-block">
                  <video src={videoPreview} className="h-48 w-auto" controls />
                  <button type="button" onClick={removeVideo} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center bg-black/60 text-white">
                    <XIcon />
                  </button>
                </div>
              )}

              {!videoPreview && (
                <label className="mt-3 flex cursor-pointer items-center justify-center border-2 border-dashed border-[#E5E5E5] bg-white px-6 py-8 hover:border-[#2D3B2D]">
                  <div className="text-center">
                    <div className="mx-auto text-[#B8A88A]"><VideoIcon /></div>
                    <p className="mt-2 text-sm text-[#6B7280]">Click to upload video</p>
                  </div>
                  <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
                </label>
              )}
            </div>

            {/* Submit */}
            <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:gap-4">
              <button
                type="button"
                onClick={(e) => handleSubmit(e, false)}
                disabled={submitting}
                className="flex-1 border border-[#2D3B2D] bg-white px-6 py-3 text-sm font-medium uppercase tracking-wide text-[#2D3B2D] hover:opacity-70 disabled:opacity-50"
              >
                Save as Draft
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-[#2D3B2D] px-6 py-3 text-sm font-medium uppercase tracking-wide text-white hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "Publishing..." : "Publish"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
