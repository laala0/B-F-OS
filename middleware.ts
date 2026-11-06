import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { CAPABILITY_PATH, FORM2FINISH_HOST } from "@/lib/domain/form2finish";

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

// The Form2Finish public sheet needs no session, so it skips the auth round trip.
// Its domain opens on the sheet; /login and everything behind it work as usual.
const MARKETING_PATHS = [CAPABILITY_PATH, "/form2finish-capability.pdf"];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const onFormToFinish = request.headers.get("host") === FORM2FINISH_HOST;
  if (path === "/" && onFormToFinish) {
    const url = request.nextUrl.clone();
    url.pathname = CAPABILITY_PATH;
    return NextResponse.rewrite(url);
  }
  // Logging in here lands on the content dashboard, not the crew's admin console.
  if (path === "/dashboard" && onFormToFinish) {
    const url = request.nextUrl.clone();
    url.pathname = "/content";
    return NextResponse.redirect(url);
  }
  if (MARKETING_PATHS.includes(path)) return NextResponse.next();

  const { supabaseResponse, user } = await updateSession(request);

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
