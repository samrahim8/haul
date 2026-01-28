"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/lib/database.types";

function MenuIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

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

function ChevronDownIcon() {
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
      <path d="m6 9 6 6 6-6" />
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
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
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

function LayoutDashboardIcon() {
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
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  );
}

function SettingsIcon() {
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
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function LogOutIcon() {
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
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  );
}

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
      className="h-4 w-4"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    let isMounted = true;

    // Fallback timeout to ensure loading never gets stuck
    const timeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn("Navbar: Loading timeout reached, forcing loaded state");
        setLoading(false);
      }
    }, 5000);

    async function loadUser() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Session error:", sessionError);
        }

        if (!isMounted) return;
        setUser(session?.user ?? null);

        if (session?.user) {
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (profileError) {
            console.error("Profile fetch error:", profileError);
          }

          if (isMounted) {
            setProfile(profileData as Profile | null);
          }
        }
      } catch (err) {
        console.error("Navbar auth error:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;

      try {
        setUser(session?.user ?? null);
        if (session?.user) {
          // Small delay to ensure database is consistent after auth changes
          await new Promise(resolve => setTimeout(resolve, 100));

          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (profileError) {
            console.error("Profile fetch on auth change error:", profileError);
          }

          if (isMounted) {
            setProfile(profileData as Profile | null);
          }
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error("Navbar auth state change error:", err);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  // Close account menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setAccountMenuOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    setMobileMenuOpen(false);
    setAccountMenuOpen(false);
    router.push("/");
  };

  const isCompany = profile?.user_type === "company";

  return (
    <nav className="border-b border-[#2D3B2D] bg-white">
      <div className="flex items-center justify-between px-4 py-4 sm:px-6 md:px-12 lg:px-20">
        <Link
          href="/"
          className="font-serif text-xl tracking-[0.15em] text-[#2D3B2D] sm:text-2xl"
        >
          HAUL
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-6 md:flex">
          <Link
            href="/sales"
            className="text-sm text-[#2D3B2D] hover:opacity-70"
          >
            Discover Sales
          </Link>

          {loading ? (
            <div className="h-9 w-9 animate-pulse rounded-full bg-[#E5E5E5]" />
          ) : user ? (
            <div className="relative" ref={accountMenuRef}>
              <button
                onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                className="flex items-center gap-2 rounded-full border border-[#E5E5E5] px-3 py-2 text-[#2D3B2D] transition-colors hover:border-[#2D3B2D]"
              >
                <UserIcon />
                <ChevronDownIcon />
              </button>

              {/* Account Dropdown */}
              {accountMenuOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-56 border border-[#E5E5E5] bg-white py-2 shadow-lg">
                  {/* User Info */}
                  <div className="border-b border-[#E5E5E5] px-4 pb-3 pt-1">
                    <p className="text-sm font-medium text-[#2D3B2D]">
                      {profile?.full_name || "Account"}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-[#6B7280]">
                      {user.email}
                    </p>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    {isCompany && (
                      <>
                        <Link
                          href="/dashboard"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#2D3B2D] hover:bg-[#FDFBF7]"
                        >
                          <LayoutDashboardIcon />
                          Dashboard
                        </Link>
                        <Link
                          href="/dashboard/company"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#2D3B2D] hover:bg-[#FDFBF7]"
                        >
                          <BuildingIcon />
                          Company Profile
                        </Link>
                        <Link
                          href="/list/company/create"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#2D3B2D] hover:bg-[#FDFBF7]"
                        >
                          <PlusIcon />
                          New Listing
                        </Link>
                      </>
                    )}
                    <Link
                      href="/account/settings"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#2D3B2D] hover:bg-[#FDFBF7]"
                    >
                      <SettingsIcon />
                      Account Settings
                    </Link>
                  </div>

                  {/* Sign Out */}
                  <div className="border-t border-[#E5E5E5] pt-1">
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[#2D3B2D] hover:bg-[#FDFBF7]"
                    >
                      <LogOutIcon />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/signin"
              className="text-sm text-[#2D3B2D] hover:opacity-70"
            >
              Sign In
            </Link>
          )}

          <Link
            href="/list"
            className="bg-[#2D3B2D] px-5 py-2.5 text-sm font-medium uppercase tracking-wide text-white transition-opacity hover:opacity-90"
          >
            List a Sale
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-[#2D3B2D] md:hidden"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-[#E5E5E5] bg-white md:hidden">
          <div className="px-4 py-4">
            <Link
              href="/sales"
              className="block py-3 text-[#2D3B2D] hover:opacity-70"
            >
              Discover Sales
            </Link>

            {!loading && user && (
              <>
                <div className="border-t border-[#E5E5E5] py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
                    Account
                  </p>
                </div>
                {isCompany && (
                  <>
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-3 py-3 text-[#2D3B2D] hover:opacity-70"
                    >
                      <LayoutDashboardIcon />
                      Dashboard
                    </Link>
                    <Link
                      href="/dashboard/company"
                      className="flex items-center gap-3 py-3 text-[#2D3B2D] hover:opacity-70"
                    >
                      <BuildingIcon />
                      Company Profile
                    </Link>
                    <Link
                      href="/list/company/create"
                      className="flex items-center gap-3 py-3 text-[#2D3B2D] hover:opacity-70"
                    >
                      <PlusIcon />
                      New Listing
                    </Link>
                  </>
                )}
                <Link
                  href="/account/settings"
                  className="flex items-center gap-3 py-3 text-[#2D3B2D] hover:opacity-70"
                >
                  <SettingsIcon />
                  Account Settings
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 py-3 text-[#2D3B2D] hover:opacity-70"
                >
                  <LogOutIcon />
                  Sign Out
                </button>
              </>
            )}

            {!loading && !user && (
              <Link
                href="/signin"
                className="block py-3 text-[#2D3B2D] hover:opacity-70"
              >
                Sign In
              </Link>
            )}

            <div className="pt-3">
              <Link
                href="/list"
                className="block bg-[#2D3B2D] px-5 py-3 text-center text-sm font-medium uppercase tracking-wide text-white"
              >
                List a Sale
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
