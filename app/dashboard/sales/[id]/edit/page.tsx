"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";
import type { Company, Sale } from "@/lib/database.types";
import { uploadSalePhotos, uploadSaleVideo } from "@/lib/storage";
import Navbar from "../../../../components/Navbar";

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
      className="mr-1 h-4 w-4 inline-block"
    >
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}

function XIcon() {
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
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function StarIcon({ filled }: { filled?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
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

function VideoIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="h-8 w-8"
    >
      <path d="m22 8-6 4 6 4V8Z" />
      <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
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

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

export default function EditSalePage() {
  const router = useRouter();
  const params = useParams();
  const saleId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  // Existing photos (URLs from database)
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [existingVideo, setExistingVideo] = useState<string | null>(null);

  // New files to upload
  const [newPhotoFiles, setNewPhotoFiles] = useState<File[]>([]);
  const [newPhotoPreviews, setNewPhotoPreviews] = useState<string[]>([]);
  const [newVideoFile, setNewVideoFile] = useState<File | null>(null);
  const [newVideoPreview, setNewVideoPreview] = useState<string | null>(null);

  // Hero index (0 = first existing photo, or relative to combined list)
  const [heroIndex, setHeroIndex] = useState<number>(0);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    async function loadSale() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push(`/signin?redirect=/dashboard/sales/${saleId}/edit`);
        return;
      }

      setUser(session.user);

      // Load company
      const { data: companyData } = await supabase
        .from("companies")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      const typedCompany = companyData as Company | null;
      if (!typedCompany) {
        router.push("/dashboard");
        return;
      }

      setCompany(typedCompany);

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

      // Verify ownership
      if (typedSale.company_id !== typedCompany.id) {
        setError("You don't have permission to edit this sale");
        setLoading(false);
        return;
      }

      const s = typedSale;
      setSale(s);

      // Populate form
      setTitle(s.title);
      setDescription(s.description || "");
      setAddress(s.address);
      setCity(s.city);
      setState(s.state);
      setZipCode(s.zip_code);
      setStartDate(s.start_date);
      setEndDate(s.end_date);
      setStartTime(s.start_time || "09:00");
      setEndTime(s.end_time || "16:00");
      setExistingPhotos(s.photos || []);
      setExistingVideo(s.video_url || null);

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

    // Adjust hero index
    if (index === heroIndex) {
      setHeroIndex(0);
    } else if (index < heroIndex) {
      setHeroIndex(heroIndex - 1);
    }
  };

  const removeNewPhoto = (index: number) => {
    const adjustedIndex = existingPhotos.length + index;

    const files = [...newPhotoFiles];
    files.splice(index, 1);
    setNewPhotoFiles(files);

    const previews = [...newPhotoPreviews];
    URL.revokeObjectURL(previews[index]);
    previews.splice(index, 1);
    setNewPhotoPreviews(previews);

    // Adjust hero index
    if (adjustedIndex === heroIndex) {
      setHeroIndex(0);
    } else if (adjustedIndex < heroIndex) {
      setHeroIndex(heroIndex - 1);
    }
  };

  const handleNewVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (newVideoPreview) {
      URL.revokeObjectURL(newVideoPreview);
    }

    setNewVideoFile(file);
    setNewVideoPreview(URL.createObjectURL(file));
    setExistingVideo(null); // Replace existing video
  };

  const removeExistingVideo = () => {
    setExistingVideo(null);
  };

  const removeNewVideo = () => {
    if (newVideoPreview) {
      URL.revokeObjectURL(newVideoPreview);
      setNewVideoPreview(null);
    }
    setNewVideoFile(null);
  };

  const totalPhotos = existingPhotos.length + newPhotoPreviews.length;

  const handleSubmit = async (e: React.FormEvent, publish: boolean) => {
    e.preventDefault();
    if (!user || !company || !sale) return;

    setError(null);
    setSubmitting(true);

    const supabase = createBrowserSupabaseClient();

    // Upload new photos if any
    let allPhotoUrls = [...existingPhotos];
    if (newPhotoFiles.length > 0) {
      const photoResult = await uploadSalePhotos(supabase, newPhotoFiles, sale.id);
      if (photoResult.errors.length > 0) {
        setError(`Some photos failed to upload: ${photoResult.errors.join(", ")}`);
        setSubmitting(false);
        return;
      }
      allPhotoUrls = [...allPhotoUrls, ...photoResult.urls];
    }

    // Reorder so hero is first
    if (heroIndex > 0 && heroIndex < allPhotoUrls.length) {
      const [heroUrl] = allPhotoUrls.splice(heroIndex, 1);
      allPhotoUrls.unshift(heroUrl);
    }

    // Handle video
    let videoUrl = existingVideo;
    if (newVideoFile) {
      const uploadedVideoUrl = await uploadSaleVideo(supabase, newVideoFile, sale.id);
      if (!uploadedVideoUrl) {
        setError("Video failed to upload. Please try again.");
        setSubmitting(false);
        return;
      }
      videoUrl = uploadedVideoUrl;
    }

    // Update sale
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
        photos: allPhotoUrls,
        video_url: videoUrl,
        is_published: publish,
      } as never)
      .eq("id", sale.id);

    if (updateError) {
      setError("Failed to update listing. Please try again.");
      setSubmitting(false);
      return;
    }

    router.push("/dashboard");
  };

  const handleDelete = async () => {
    if (!sale) return;

    setDeleting(true);
    const supabase = createBrowserSupabaseClient();

    const { error: deleteError } = await supabase
      .from("sales")
      .delete()
      .eq("id", sale.id);

    if (deleteError) {
      setError("Failed to delete listing. Please try again.");
      setDeleting(false);
      return;
    }

    router.push("/dashboard");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDFBF7]">
        <div className="text-[#6B7280]">Loading...</div>
      </div>
    );
  }

  if (error && !sale) {
    return (
      <div className="min-h-screen bg-[#FDFBF7]">
        <Navbar />
        <main className="px-4 py-8 sm:px-6 sm:py-12">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-red-600">{error}</p>
            <Link
              href="/dashboard"
              className="mt-4 inline-block text-[#2D3B2D] underline"
            >
              Return to Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <Navbar />

      <main className="px-4 py-8 sm:px-6 sm:py-12 md:py-16">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm text-[#6B7280] hover:text-[#2D3B2D]"
          >
            <ArrowLeftIcon />
            Back to Dashboard
          </Link>

          <div className="mt-6 flex items-start justify-between">
            <div>
              <h1 className="font-serif text-2xl font-bold text-[#2D3B2D] sm:text-3xl">
                Edit Listing
              </h1>
              <p className="mt-2 text-[#6B7280]">
                Update your sale details
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700"
            >
              <TrashIcon />
              Delete
            </button>
          </div>

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="mx-4 w-full max-w-md bg-white p-6">
                <h2 className="font-serif text-xl font-bold text-[#2D3B2D]">
                  Delete Listing?
                </h2>
                <p className="mt-2 text-[#6B7280]">
                  This action cannot be undone. The listing and all associated photos will be permanently deleted.
                </p>
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleting}
                    className="flex-1 border border-[#E5E5E5] bg-white px-4 py-2 text-sm font-medium text-[#2D3B2D] hover:bg-[#FDFBF7] disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {deleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={(e) => handleSubmit(e, sale?.is_published ?? false)} className="mt-8 space-y-6">
            {/* Sale Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium uppercase tracking-wide text-[#2D3B2D]"
              >
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
              <label
                htmlFor="description"
                className="block text-sm font-medium uppercase tracking-wide text-[#2D3B2D]"
              >
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="mt-2 w-full border border-[#E5E5E5] bg-white px-4 py-3 text-[#2D3B2D] placeholder:text-[#6B7280] focus:border-[#2D3B2D] focus:outline-none"
                placeholder="Describe the items available, highlights, and any special details..."
              />
            </div>

            {/* Address */}
            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium uppercase tracking-wide text-[#2D3B2D]"
              >
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
                <label
                  htmlFor="city"
                  className="block text-sm font-medium uppercase tracking-wide text-[#2D3B2D]"
                >
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  id="city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  className="mt-2 w-full border border-[#E5E5E5] bg-white px-4 py-3 text-[#2D3B2D] placeholder:text-[#6B7280] focus:border-[#2D3B2D] focus:outline-none"
                  placeholder="Austin"
                />
              </div>

              <div className="sm:col-span-1">
                <label
                  htmlFor="state"
                  className="block text-sm font-medium uppercase tracking-wide text-[#2D3B2D]"
                >
                  State <span className="text-red-500">*</span>
                </label>
                <select
                  id="state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  required
                  className="mt-2 w-full border border-[#E5E5E5] bg-white px-4 py-3 text-[#2D3B2D] focus:border-[#2D3B2D] focus:outline-none"
                >
                  {US_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="zipCode"
                  className="block text-sm font-medium uppercase tracking-wide text-[#2D3B2D]"
                >
                  Zip Code <span className="text-red-500">*</span>
                </label>
                <input
                  id="zipCode"
                  type="text"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  required
                  pattern="[0-9]{5}"
                  className="mt-2 w-full border border-[#E5E5E5] bg-white px-4 py-3 text-[#2D3B2D] placeholder:text-[#6B7280] focus:border-[#2D3B2D] focus:outline-none"
                  placeholder="78701"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="startDate"
                  className="block text-sm font-medium uppercase tracking-wide text-[#2D3B2D]"
                >
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
                <label
                  htmlFor="endDate"
                  className="block text-sm font-medium uppercase tracking-wide text-[#2D3B2D]"
                >
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
                <label
                  htmlFor="startTime"
                  className="block text-sm font-medium uppercase tracking-wide text-[#2D3B2D]"
                >
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
                <label
                  htmlFor="endTime"
                  className="block text-sm font-medium uppercase tracking-wide text-[#2D3B2D]"
                >
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

            {/* Photos */}
            <div>
              <label className="block text-sm font-medium uppercase tracking-wide text-[#2D3B2D]">
                Photos
              </label>
              <p className="mt-1 text-sm text-[#6B7280]">
                Click the star to set the hero image. {totalPhotos} photo{totalPhotos !== 1 ? "s" : ""} total.
              </p>

              {/* All Photos Grid */}
              {totalPhotos > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {/* Existing Photos */}
                  {existingPhotos.map((url, index) => (
                    <div key={`existing-${index}`} className="group relative aspect-square">
                      <img
                        src={url}
                        alt={`Photo ${index + 1}`}
                        className={`h-full w-full object-cover ${index === heroIndex ? "ring-2 ring-[#B8A88A]" : ""}`}
                      />
                      <button
                        type="button"
                        onClick={() => setHeroIndex(index)}
                        className={`absolute left-1 top-1 flex h-6 w-6 items-center justify-center ${
                          index === heroIndex
                            ? "bg-[#B8A88A] text-white"
                            : "bg-black/60 text-white opacity-0 group-hover:opacity-100"
                        } transition-opacity`}
                        title={index === heroIndex ? "Hero image" : "Set as hero image"}
                      >
                        <StarIcon filled={index === heroIndex} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeExistingPhoto(index)}
                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <XIcon />
                      </button>
                      {index === heroIndex && (
                        <div className="absolute bottom-0 left-0 right-0 bg-[#B8A88A] px-2 py-1 text-center text-xs font-medium text-white">
                          Hero
                        </div>
                      )}
                    </div>
                  ))}

                  {/* New Photos */}
                  {newPhotoPreviews.map((url, index) => {
                    const combinedIndex = existingPhotos.length + index;
                    return (
                      <div key={`new-${index}`} className="group relative aspect-square">
                        <img
                          src={url}
                          alt={`New photo ${index + 1}`}
                          className={`h-full w-full object-cover ${combinedIndex === heroIndex ? "ring-2 ring-[#B8A88A]" : ""}`}
                        />
                        <button
                          type="button"
                          onClick={() => setHeroIndex(combinedIndex)}
                          className={`absolute left-1 top-1 flex h-6 w-6 items-center justify-center ${
                            combinedIndex === heroIndex
                              ? "bg-[#B8A88A] text-white"
                              : "bg-black/60 text-white opacity-0 group-hover:opacity-100"
                          } transition-opacity`}
                          title={combinedIndex === heroIndex ? "Hero image" : "Set as hero image"}
                        >
                          <StarIcon filled={combinedIndex === heroIndex} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeNewPhoto(index)}
                          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <XIcon />
                        </button>
                        {combinedIndex === heroIndex && (
                          <div className="absolute bottom-0 left-0 right-0 bg-[#B8A88A] px-2 py-1 text-center text-xs font-medium text-white">
                            Hero
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-green-600/90 px-2 py-0.5 text-center text-xs text-white">
                          New
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Upload Area */}
              <label className="mt-3 flex cursor-pointer items-center justify-center border-2 border-dashed border-[#E5E5E5] bg-white px-6 py-8 transition-colors hover:border-[#2D3B2D]">
                <div className="text-center">
                  <div className="mx-auto text-[#B8A88A]">
                    <ImageIcon />
                  </div>
                  <p className="mt-2 text-sm text-[#6B7280]">
                    Click to add more photos
                  </p>
                  <p className="mt-1 text-xs text-[#6B7280]">
                    PNG, JPG up to 10MB each
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleNewPhotoUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Video */}
            <div>
              <label className="block text-sm font-medium uppercase tracking-wide text-[#2D3B2D]">
                Video <span className="text-[#6B7280] text-xs normal-case">(optional, 9:16 vertical)</span>
              </label>
              <p className="mt-1 text-sm text-[#6B7280]">
                Upload a vertical video walkthrough of the sale.
              </p>

              {/* Existing Video */}
              {existingVideo && !newVideoPreview && (
                <div className="mt-3 relative inline-block">
                  <video
                    src={existingVideo}
                    className="h-48 w-auto"
                    controls
                  />
                  <button
                    type="button"
                    onClick={removeExistingVideo}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center bg-black/60 text-white"
                  >
                    <XIcon />
                  </button>
                </div>
              )}

              {/* New Video Preview */}
              {newVideoPreview && (
                <div className="mt-3 relative inline-block">
                  <video
                    src={newVideoPreview}
                    className="h-48 w-auto"
                    controls
                  />
                  <button
                    type="button"
                    onClick={removeNewVideo}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center bg-black/60 text-white"
                  >
                    <XIcon />
                  </button>
                  <div className="absolute bottom-0 left-0 bg-green-600/90 px-2 py-0.5 text-xs text-white">
                    New
                  </div>
                </div>
              )}

              {/* Upload Area */}
              {!existingVideo && !newVideoPreview && (
                <label className="mt-3 flex cursor-pointer items-center justify-center border-2 border-dashed border-[#E5E5E5] bg-white px-6 py-8 transition-colors hover:border-[#2D3B2D]">
                  <div className="text-center">
                    <div className="mx-auto text-[#B8A88A]">
                      <VideoIcon />
                    </div>
                    <p className="mt-2 text-sm text-[#6B7280]">
                      Click to upload video
                    </p>
                    <p className="mt-1 text-xs text-[#6B7280]">
                      MP4, MOV up to 100MB
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleNewVideoUpload}
                    className="hidden"
                  />
                </label>
              )}

              {/* Replace video option */}
              {(existingVideo || newVideoPreview) && (
                <label className="mt-2 inline-flex cursor-pointer items-center text-sm text-[#6B7280] hover:text-[#2D3B2D]">
                  <span>Replace video</span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleNewVideoUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:gap-4">
              {sale?.is_published ? (
                <>
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, false)}
                    disabled={submitting}
                    className="flex-1 border border-[#2D3B2D] bg-white px-6 py-3 text-sm font-medium uppercase tracking-wide text-[#2D3B2D] transition-opacity hover:opacity-70 disabled:opacity-50"
                  >
                    Unpublish
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-[#2D3B2D] px-6 py-3 text-sm font-medium uppercase tracking-wide text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {submitting ? "Saving..." : "Save Changes"}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, false)}
                    disabled={submitting}
                    className="flex-1 border border-[#2D3B2D] bg-white px-6 py-3 text-sm font-medium uppercase tracking-wide text-[#2D3B2D] transition-opacity hover:opacity-70 disabled:opacity-50"
                  >
                    Save as Draft
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, true)}
                    disabled={submitting}
                    className="flex-1 bg-[#2D3B2D] px-6 py-3 text-sm font-medium uppercase tracking-wide text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {submitting ? "Publishing..." : "Publish Listing"}
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
