import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Coarse gate only: logged in or not. Which of (admin)/(field) a route
// belongs to isn't visible here (route groups are stripped from the URL),
// so role-based access is enforced per-layout via requireRole() — see
// app/(admin)/layout.tsx and app/(field)/layout.tsx. That split is the
// actual authorization boundary; this just keeps anonymous requests out.
const PUBLIC_PREFIXES = [
  "/login",
  "/signup",
  "/accept-invite",
  "/reset-password",
  "/auth/callback",
];

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
