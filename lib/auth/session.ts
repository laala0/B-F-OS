import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export type CurrentUser = {
  id: string;
  email: string;
  profile: Profile;
};

// Wrapped in React's cache() so every server component/action in a single
// request shares one lookup instead of re-querying profiles per call site.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .is("deleted_at", null)
    .single();

  // Belt-and-suspenders with the RLS hardening in 0006_security_hardening.sql:
  // company_id()/is_admin() there already return NULL/false for a
  // non-active profile, so profiles_select would normally make this query
  // come back empty on its own. Checking status explicitly here means
  // this stays correct even if a future policy change reopens visibility
  // without anyone realizing it also reopens suspended-user access.
  if (!profile || profile.status !== "active") return null;

  return { id: user.id, email: user.email ?? profile.email, profile };
});
