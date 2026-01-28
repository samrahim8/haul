"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/lib/database.types";
import Navbar from "@/app/components/Navbar";

function UserIcon() {
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
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21a8 8 0 0 0-16 0" />
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

function KeyIcon() {
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
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="m21 2-9.6 9.6" />
      <path d="m15.5 7.5 3 3L22 7l-3-3" />
    </svg>
  );
}

function ShieldIcon() {
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
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
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

export default function AccountSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push("/signin");
        return;
      }

      setUser(session.user);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profileData) {
        const p = profileData as Profile;
        setProfile(p);
        setFullName(p.full_name || "");
      }

      setLoading(false);
    }

    loadData();
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setSuccess(false);
    setError(null);

    const supabase = createBrowserSupabaseClient();

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName || null,
      } as never)
      .eq("id", user.id);

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  const handleSignOut = async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push("/");
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

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#2D3B2D] sm:text-3xl">
            Account Settings
          </h1>
          <p className="mt-2 text-[#6B7280]">
            Manage your account preferences and security.
          </p>
        </div>

        {success && (
          <div className="mt-6 border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            Settings updated successfully.
          </div>
        )}

        {error && (
          <div className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="mt-8 space-y-8">
          {/* Profile Section */}
          <form onSubmit={handleUpdateProfile} className="border border-[#E5E5E5] bg-white p-6">
            <div className="flex items-center gap-3">
              <UserIcon />
              <h2 className="font-serif text-lg font-bold text-[#2D3B2D]">
                Profile
              </h2>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-[#2D3B2D]"
                >
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-2 w-full border border-[#E5E5E5] bg-white px-4 py-3 text-[#2D3B2D] placeholder:text-[#6B7280] focus:border-[#2D3B2D] focus:outline-none"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2D3B2D]">
                  Account Type
                </label>
                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-[#E5E5E5] px-3 py-1 text-sm text-[#2D3B2D]">
                    {profile?.user_type === "company" ? "Company" : "Buyer"}
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#2D3B2D] px-6 py-2.5 text-sm font-medium uppercase tracking-wide text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </form>

          {/* Email Section */}
          <div className="border border-[#E5E5E5] bg-white p-6">
            <div className="flex items-center gap-3">
              <MailIcon />
              <h2 className="font-serif text-lg font-bold text-[#2D3B2D]">
                Email Address
              </h2>
            </div>

            <div className="mt-6">
              <p className="text-sm text-[#6B7280]">Current email</p>
              <p className="mt-1 font-medium text-[#2D3B2D]">{user?.email}</p>

              <button
                type="button"
                className="mt-4 border border-[#E5E5E5] bg-white px-4 py-2 text-sm font-medium text-[#2D3B2D] transition-colors hover:border-[#2D3B2D]"
              >
                Change Email
              </button>
            </div>
          </div>

          {/* Password Section */}
          <div className="border border-[#E5E5E5] bg-white p-6">
            <div className="flex items-center gap-3">
              <KeyIcon />
              <h2 className="font-serif text-lg font-bold text-[#2D3B2D]">
                Password
              </h2>
            </div>

            <div className="mt-6">
              <p className="text-sm text-[#6B7280]">
                Update your password to keep your account secure.
              </p>

              <button
                type="button"
                className="mt-4 border border-[#E5E5E5] bg-white px-4 py-2 text-sm font-medium text-[#2D3B2D] transition-colors hover:border-[#2D3B2D]"
              >
                Change Password
              </button>
            </div>
          </div>

          {/* Security Section */}
          <div className="border border-[#E5E5E5] bg-white p-6">
            <div className="flex items-center gap-3">
              <ShieldIcon />
              <h2 className="font-serif text-lg font-bold text-[#2D3B2D]">
                Security
              </h2>
            </div>

            <div className="mt-6">
              <p className="text-sm text-[#6B7280]">
                Signed in as <span className="font-medium text-[#2D3B2D]">{user?.email}</span>
              </p>

              <button
                type="button"
                onClick={handleSignOut}
                className="mt-4 border border-[#E5E5E5] bg-white px-4 py-2 text-sm font-medium text-[#2D3B2D] transition-colors hover:border-[#2D3B2D]"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="border border-red-200 bg-white p-6">
            <div className="flex items-center gap-3 text-red-600">
              <TrashIcon />
              <h2 className="font-serif text-lg font-bold">
                Danger Zone
              </h2>
            </div>

            <div className="mt-6">
              <p className="text-sm text-[#6B7280]">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>

              <button
                type="button"
                className="mt-4 border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:border-red-600 hover:bg-red-50"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
