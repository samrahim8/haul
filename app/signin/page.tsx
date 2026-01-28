"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import GoogleIcon from "@/app/components/GoogleIcon";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    const supabase = createBrowserSupabaseClient();

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createBrowserSupabaseClient();

    const { data, error: signInError } = await supabase.auth.signInWithPassword(
      {
        email,
        password,
      }
    );

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Get user profile to check user_type
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("id", data.user.id)
        .single();

      // Redirect based on user type
      const userType = (profile as { user_type: string } | null)?.user_type;
      if (userType === "company") {
        router.push("/dashboard");
      } else {
        router.push("/");
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Navigation */}
      <nav className="border-b border-[#2D3B2D] bg-white">
        <div className="flex items-center justify-between px-4 py-4 sm:px-6 md:px-12 lg:px-20">
          <Link
            href="/"
            className="font-serif text-xl tracking-[0.15em] text-[#2D3B2D] sm:text-2xl"
          >
            HAUL
          </Link>
        </div>
      </nav>

      {/* Sign In Form */}
      <main className="flex flex-col items-center px-4 pt-10 pb-10 sm:px-6 sm:pt-16 sm:pb-16 md:pt-24">
        <div className="w-full max-w-md">
          <h1 className="text-center font-serif text-2xl font-bold text-[#2D3B2D] sm:text-3xl">
            Welcome Back
          </h1>
          <p className="mt-3 text-center text-sm text-[#6B7280] sm:text-base">
            Sign in to your Haul account
          </p>

          <div className="mt-8">
            {error && (
              <div className="mb-6 border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Google Sign In Button */}
            <button
              onClick={handleGoogleSignIn}
              type="button"
              className="flex w-full items-center justify-center gap-3 border border-[#E5E5E5] bg-white px-4 py-3 font-medium text-[#2D3B2D] transition-colors hover:bg-gray-50"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            {/* Divider */}
            <div className="my-6 flex items-center">
              <div className="flex-1 border-t border-[#E5E5E5]" />
              <span className="px-4 text-sm text-[#6B7280]">or</span>
              <div className="flex-1 border-t border-[#E5E5E5]" />
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSignIn} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium uppercase tracking-wide text-[#2D3B2D]"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-2 w-full border border-[#E5E5E5] bg-white px-4 py-3 text-[#2D3B2D] placeholder:text-[#6B7280] focus:border-[#2D3B2D] focus:outline-none"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium uppercase tracking-wide text-[#2D3B2D]"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-2 w-full border border-[#E5E5E5] bg-white px-4 py-3 text-[#2D3B2D] placeholder:text-[#6B7280] focus:border-[#2D3B2D] focus:outline-none"
                  placeholder="Your password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2D3B2D] px-4 py-3 font-medium uppercase tracking-wide text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          </div>

          <p className="mt-8 text-center text-sm text-[#6B7280]">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-[#2D3B2D] hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
