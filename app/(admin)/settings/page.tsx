import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
  const user = await requireRole("admin");
  const supabase = await createClient();
  const { data: company } = await supabase
    .from("companies")
    .select("name, timezone, default_holdback_pct")
    .eq("id", user.profile.company_id)
    .single();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-neutral-900">Settings</h1>
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-base font-medium">Company</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between border-b border-neutral-100 py-2">
            <span className="text-neutral-500">Name</span>
            <span className="font-medium text-neutral-900">
              {company?.name}
            </span>
          </div>
          <div className="flex justify-between border-b border-neutral-100 py-2">
            <span className="text-neutral-500">Timezone</span>
            <span className="font-medium text-neutral-900">
              {company?.timezone}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-neutral-500">Default holdback</span>
            <span className="font-medium text-neutral-900">
              {company?.default_holdback_pct}%
            </span>
          </div>
          <p className="pt-2 text-neutral-400">
            Editing these, plus GST number and logo, ships alongside crew
            management in Phase 1.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
