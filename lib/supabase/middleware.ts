import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

// Refreshes the auth session on every request. This has to live in
// middleware rather than a layout: Server Components can read cookies but
// can't write them, so an expiring session would never get renewed and
// users would be silently logged out mid-session.
//
// IMPORTANT: keep the `getUser()` call in here — Supabase's docs call this
// out specifically, and it's easy to "simplify" by mistake. `getUser()`
// revalidates the token against Supabase's servers; the cheaper-looking
// `getSession()` only reads the (possibly stale/tampered) cookie and must
// never be used to gate access.
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabaseResponse, user };
}
