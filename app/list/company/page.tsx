"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";
import type { Company, CompanyInsert } from "@/lib/database.types";
import Navbar from "../../components/Navbar";

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

const SERVICE_AREA_OPTIONS = [
  "Austin, TX",
  "Dallas, TX",
  "Houston, TX",
  "San Antonio, TX",
  "Fort Worth, TX",
  "Round Rock, TX",
  "Cedar Park, TX",
  "Georgetown, TX",
  "Pflugerville, TX",
  "Leander, TX",
];

export default function ListCompanyPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [serviceAreas, setServiceAreas] = useState<string[]>([]);
  const [serviceAreaInput, setServiceAreaInput] = useState("");

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    async function checkAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        // Not logged in, redirect to signin with return URL
        router.push("/signin?redirect=/list/company");
        return;
      }

      setUser(session.user);

      // Check if company profile exists
      const { data: companyData } = await supabase
        .from("companies")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (companyData) {
        // Company exists, redirect to create sale
        router.push("/list/company/create");
        return;
      }

      // Pre-fill email from user
      setEmail(session.user.email || "");
      setLoading(false);
    }

    checkAuth();
  }, [router]);

  const addServiceArea = (area: string) => {
    if (area && !serviceAreas.includes(area)) {
      setServiceAreas([...serviceAreas, area]);
    }
    setServiceAreaInput("");
  };

  const removeServiceArea = (area: string) => {
    setServiceAreas(serviceAreas.filter((a) => a !== area));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError(null);
    setSubmitting(true);

    const supabase = createBrowserSupabaseClient();

    const companyToInsert: CompanyInsert = {
      user_id: user.id,
      company_name: companyName,
      description: description || null,
      phone: phone || null,
      email: email || null,
      website: website || null,
      service_areas: serviceAreas,
    };

    const { error: insertError } = await supabase.from("companies").insert(companyToInsert as never);

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    // Redirect to create sale
    router.push("/list/company/create");
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

      <main className="px-4 py-8 sm:px-6 sm:py-12 md:py-16">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/list"
            className="inline-flex items-center text-sm text-[#6B7280] hover:text-[#2D3B2D]"
          >
            <ArrowLeftIcon />
            Back
          </Link>

          <h1 className="mt-6 font-serif text-2xl font-bold text-[#2D3B2D] sm:text-3xl">
            Set Up Your Company
          </h1>
          <p className="mt-2 text-[#6B7280]">
            Create your company profile to start listing estate sales.
          </p>

          {error && (
            <div className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {/* Company Name */}
            <div>
              <label
                htmlFor="companyName"
                className="block text-sm font-medium uppercase tracking-wide text-[#2D3B2D]"
              >
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                className="mt-2 w-full border border-[#E5E5E5] bg-white px-4 py-3 text-[#2D3B2D] placeholder:text-[#6B7280] focus:border-[#2D3B2D] focus:outline-none"
                placeholder="Your Company Name"
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium uppercase tracking-wide text-[#2D3B2D]"
              >
                Company Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="mt-2 w-full border border-[#E5E5E5] bg-white px-4 py-3 text-[#2D3B2D] placeholder:text-[#6B7280] focus:border-[#2D3B2D] focus:outline-none"
                placeholder="Tell customers about your company and experience..."
              />
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium uppercase tracking-wide text-[#2D3B2D]"
              >
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="mt-2 w-full border border-[#E5E5E5] bg-white px-4 py-3 text-[#2D3B2D] placeholder:text-[#6B7280] focus:border-[#2D3B2D] focus:outline-none"
                placeholder="(555) 555-5555"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium uppercase tracking-wide text-[#2D3B2D]"
              >
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-2 w-full border border-[#E5E5E5] bg-white px-4 py-3 text-[#2D3B2D] placeholder:text-[#6B7280] focus:border-[#2D3B2D] focus:outline-none"
                placeholder="contact@yourcompany.com"
              />
            </div>

            {/* Website */}
            <div>
              <label
                htmlFor="website"
                className="block text-sm font-medium uppercase tracking-wide text-[#2D3B2D]"
              >
                Website <span className="text-[#6B7280] text-xs normal-case">(optional)</span>
              </label>
              <input
                id="website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="mt-2 w-full border border-[#E5E5E5] bg-white px-4 py-3 text-[#2D3B2D] placeholder:text-[#6B7280] focus:border-[#2D3B2D] focus:outline-none"
                placeholder="https://www.yourcompany.com"
              />
            </div>

            {/* Service Areas */}
            <div>
              <label
                className="block text-sm font-medium uppercase tracking-wide text-[#2D3B2D]"
              >
                Service Areas
              </label>
              <p className="mt-1 text-sm text-[#6B7280]">
                Select the areas where you conduct estate sales.
              </p>

              {/* Selected areas */}
              {serviceAreas.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {serviceAreas.map((area) => (
                    <span
                      key={area}
                      className="inline-flex items-center gap-1 bg-[#2D3B2D] px-3 py-1 text-sm text-white"
                    >
                      {area}
                      <button
                        type="button"
                        onClick={() => removeServiceArea(area)}
                        className="hover:opacity-70"
                      >
                        <XIcon />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Area selector */}
              <div className="mt-3 flex gap-2">
                <select
                  value={serviceAreaInput}
                  onChange={(e) => setServiceAreaInput(e.target.value)}
                  className="flex-1 border border-[#E5E5E5] bg-white px-4 py-3 text-[#2D3B2D] focus:border-[#2D3B2D] focus:outline-none"
                >
                  <option value="">Select an area...</option>
                  {SERVICE_AREA_OPTIONS.filter((a) => !serviceAreas.includes(a)).map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => addServiceArea(serviceAreaInput)}
                  disabled={!serviceAreaInput}
                  className="border border-[#2D3B2D] bg-white px-4 py-3 text-sm font-medium uppercase tracking-wide text-[#2D3B2D] transition-opacity hover:opacity-70 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Logo Upload - placeholder for now */}
            <div>
              <label
                className="block text-sm font-medium uppercase tracking-wide text-[#2D3B2D]"
              >
                Company Logo <span className="text-[#6B7280] text-xs normal-case">(optional)</span>
              </label>
              <div className="mt-2 flex items-center justify-center border-2 border-dashed border-[#E5E5E5] bg-white px-6 py-10">
                <div className="text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-[#B8A88A]"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <p className="mt-2 text-sm text-[#6B7280]">
                    Logo upload coming soon
                  </p>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#2D3B2D] px-6 py-3 text-sm font-medium uppercase tracking-wide text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "Setting up..." : "Continue"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
