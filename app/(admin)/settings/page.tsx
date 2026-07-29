import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompanyForm } from "@/components/settings/company-form";

export default async function SettingsPage() {
  const user = await requireRole("admin");
  const supabase = await createClient();
  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("id", user.profile.company_id)
    .single();

  if (!company) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-neutral-900">Settings</h1>
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-base font-medium">Company</CardTitle>
        </CardHeader>
        <CardContent>
          <CompanyForm company={company} />
        </CardContent>
      </Card>
    </div>
  );
}
