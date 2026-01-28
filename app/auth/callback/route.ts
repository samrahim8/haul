import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Get user profile to check user_type
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("id", data.user.id)
        .single();

      const userType = (profile as { user_type: string } | null)?.user_type;

      // Redirect based on user type
      if (userType === "company") {
        return NextResponse.redirect(new URL("/dashboard", requestUrl.origin));
      }
    }
  }

  // Default redirect to home
  return NextResponse.redirect(new URL("/", requestUrl.origin));
}
