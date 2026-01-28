"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";
import type { Company } from "@/lib/database.types";
import { uploadCompanyLogo } from "@/lib/storage";
import Navbar from "@/app/components/Navbar";

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

function BuildingIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="h-16 w-16"
    >
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
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

function PhoneIcon() {
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
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function MailIcon() {
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
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function GlobeIcon() {
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
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
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

export default function CompanyProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form state
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [serviceAreas, setServiceAreas] = useState("");

  // Logo state
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push("/signin");
        return;
      }

      setUser(session.user);

      const { data: companyData } = await supabase
        .from("companies")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (companyData) {
        const c = companyData as Company;
        setCompany(c);
        setCompanyName(c.company_name);
        setDescription(c.description || "");
        setPhone(c.phone || "");
        setEmail(c.email || "");
        setWebsite(c.website || "");
        setServiceAreas(c.service_areas?.join(", ") || "");
        setLogoUrl(c.logo_url || null);
      }

      setLoading(false);
    }

    loadData();
  }, [router]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Cleanup previous preview
    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const removeLogo = () => {
    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
      setLogoPreview(null);
    }
    setLogoFile(null);
    setLogoUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !company) return;

    setSaving(true);
    setSuccess(false);

    const supabase = createBrowserSupabaseClient();

    // Upload logo if a new one was selected
    let finalLogoUrl = logoUrl;
    if (logoFile) {
      const uploadedUrl = await uploadCompanyLogo(supabase, logoFile, company.id);
      if (uploadedUrl) {
        finalLogoUrl = uploadedUrl;
      }
    }

    const { error } = await supabase
      .from("companies")
      .update({
        company_name: companyName,
        description: description || null,
        phone: phone || null,
        email: email || null,
        website: website || null,
        logo_url: finalLogoUrl,
        service_areas: serviceAreas
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      } as never)
      .eq("id", company.id);

    setSaving(false);

    if (!error) {
      setLogoUrl(finalLogoUrl);
      setLogoFile(null);
      if (logoPreview) {
        URL.revokeObjectURL(logoPreview);
        setLogoPreview(null);
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
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

  if (!company) {
    return (
      <div className="min-h-screen bg-[#FDFBF7]">
        <Navbar />
        <div className="mx-auto max-w-2xl px-4 py-12 text-center sm:px-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#E5E5E5] text-[#6B7280]">
            <BuildingIcon />
          </div>
          <h1 className="mt-6 font-serif text-2xl font-bold text-[#2D3B2D]">
            No Company Profile
          </h1>
          <p className="mt-2 text-[#6B7280]">
            You haven't set up a company profile yet.
          </p>
          <Link
            href="/list/company"
            className="mt-6 inline-block bg-[#2D3B2D] px-6 py-3 text-sm font-medium uppercase tracking-wide text-white transition-opacity hover:opacity-90"
          >
            Create Company Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#2D3B2D]"
        >
          <ArrowLeftIcon />
          Back to Dashboard
        </Link>

        <div className="mt-8">
          <h1 className="font-serif text-2xl font-bold text-[#2D3B2D] sm:text-3xl">
            Company Profile
          </h1>
          <p className="mt-2 text-[#6B7280]">
            Manage your company information visible to buyers.
          </p>
        </div>

        {success && (
          <div className="mt-6 border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            Profile updated successfully.
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          {/* Company Logo Section */}
          <div className="border border-[#E5E5E5] bg-white p-6">
            <h2 className="font-serif text-lg font-bold text-[#2D3B2D]">
              Company Logo
            </h2>
            <div className="mt-4 flex items-center gap-6">
              {/* Logo Preview */}
              <div className="relative h-24 w-24 flex-shrink-0">
                {logoPreview || logoUrl ? (
                  <>
                    <img
                      src={logoPreview || logoUrl || ""}
                      alt="Company logo"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
                      title="Remove logo"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </>
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#E5E5E5] text-[#6B7280]">
                    <BuildingIcon />
                  </div>
                )}
              </div>
              <div>
                <label className="cursor-pointer border border-[#2D3B2D] bg-white px-4 py-2 text-sm font-medium text-[#2D3B2D] transition-opacity hover:opacity-70">
                  {logoPreview || logoUrl ? "Change Logo" : "Upload Logo"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>
                <p className="mt-2 text-xs text-[#6B7280]">
                  PNG, JPG up to 2MB. Recommended 400x400px.
                </p>
                {logoPreview && (
                  <p className="mt-1 text-xs text-green-600">
                    New logo selected - save to apply
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Basic Info Section */}
          <div className="border border-[#E5E5E5] bg-white p-6">
            <h2 className="font-serif text-lg font-bold text-[#2D3B2D]">
              Basic Information
            </h2>

            <div className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="companyName"
                  className="block text-sm font-medium text-[#2D3B2D]"
                >
                  Company Name
                </label>
                <input
                  id="companyName"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  className="mt-2 w-full border border-[#E5E5E5] bg-white px-4 py-3 text-[#2D3B2D] placeholder:text-[#6B7280] focus:border-[#2D3B2D] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-[#2D3B2D]"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="mt-2 w-full border border-[#E5E5E5] bg-white px-4 py-3 text-[#2D3B2D] placeholder:text-[#6B7280] focus:border-[#2D3B2D] focus:outline-none"
                  placeholder="Tell buyers about your company..."
                />
              </div>
            </div>
          </div>

          {/* Contact Info Section */}
          <div className="border border-[#E5E5E5] bg-white p-6">
            <h2 className="font-serif text-lg font-bold text-[#2D3B2D]">
              Contact Information
            </h2>

            <div className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="phone"
                  className="flex items-center gap-2 text-sm font-medium text-[#2D3B2D]"
                >
                  <PhoneIcon />
                  Phone
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-2 w-full border border-[#E5E5E5] bg-white px-4 py-3 text-[#2D3B2D] placeholder:text-[#6B7280] focus:border-[#2D3B2D] focus:outline-none"
                  placeholder="(555) 555-5555"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="flex items-center gap-2 text-sm font-medium text-[#2D3B2D]"
                >
                  <MailIcon />
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full border border-[#E5E5E5] bg-white px-4 py-3 text-[#2D3B2D] placeholder:text-[#6B7280] focus:border-[#2D3B2D] focus:outline-none"
                  placeholder="contact@company.com"
                />
              </div>

              <div>
                <label
                  htmlFor="website"
                  className="flex items-center gap-2 text-sm font-medium text-[#2D3B2D]"
                >
                  <GlobeIcon />
                  Website
                </label>
                <input
                  id="website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="mt-2 w-full border border-[#E5E5E5] bg-white px-4 py-3 text-[#2D3B2D] placeholder:text-[#6B7280] focus:border-[#2D3B2D] focus:outline-none"
                  placeholder="https://www.example.com"
                />
              </div>
            </div>
          </div>

          {/* Service Areas Section */}
          <div className="border border-[#E5E5E5] bg-white p-6">
            <h2 className="font-serif text-lg font-bold text-[#2D3B2D]">
              Service Areas
            </h2>

            <div className="mt-6">
              <label
                htmlFor="serviceAreas"
                className="flex items-center gap-2 text-sm font-medium text-[#2D3B2D]"
              >
                <MapPinIcon />
                Cities / Regions
              </label>
              <input
                id="serviceAreas"
                type="text"
                value={serviceAreas}
                onChange={(e) => setServiceAreas(e.target.value)}
                className="mt-2 w-full border border-[#E5E5E5] bg-white px-4 py-3 text-[#2D3B2D] placeholder:text-[#6B7280] focus:border-[#2D3B2D] focus:outline-none"
                placeholder="Austin, Round Rock, Cedar Park"
              />
              <p className="mt-2 text-xs text-[#6B7280]">
                Separate multiple areas with commas
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#2D3B2D] px-8 py-3 text-sm font-medium uppercase tracking-wide text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
