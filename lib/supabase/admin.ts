import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Service-role client — bypasses RLS entirely. `import "server-only"` makes
// it a build error to import this from any client component, but it does
// NOT stop it from being called with attacker-controlled input on the
// server. Every call site must do its own auth/role check before using it;
// this client trusts you completely and checks nothing.
//
// Legitimate uses: bootstrap_company / accept_invite RPCs (no session
// exists yet), signed storage upload URLs, and cron jobs with no user
// session. Anything else almost certainly wants lib/supabase/server.ts
// instead, so RLS still applies.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
