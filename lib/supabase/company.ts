import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { todayInTimezone } from "@/lib/domain/reports";

// Cached per-request like getCurrentUser in lib/auth/session.ts — every
// page that needs the company's timezone shares one companies lookup
// instead of re-querying per call site.
export const getCompanyTimezone = cache(
  async (companyId: string): Promise<string> => {
    const supabase = await createClient();
    const { data: company } = await supabase
      .from("companies")
      .select("timezone")
      .eq("id", companyId)
      .single();
    return company?.timezone ?? "America/Vancouver";
  }
);

// "Today" in the company's timezone — the only correct definition of
// "today" for overdue checks. The server's own clock/timezone (UTC on
// Vercel) would flip a day over hours before it actually ends locally.
export async function getCompanyToday(companyId: string): Promise<string> {
  return todayInTimezone(await getCompanyTimezone(companyId));
}
