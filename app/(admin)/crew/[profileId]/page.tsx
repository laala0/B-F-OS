import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/crew/profile-form";
import { ProfileRoleSelect } from "@/components/crew/profile-role-select";
import { SuspendProfileButton } from "@/components/crew/suspend-profile-button";
import { EmploymentRecordForm } from "@/components/crew/employment-record-form";

export default async function CrewMemberPage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;
  const user = await requireRole("admin");
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .eq("company_id", user.profile.company_id)
    .is("deleted_at", null)
    .single();

  if (!profile) notFound();

  const { data: employmentRecord } = await supabase
    .from("employment_records")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();

  const isSelf = profile.id === user.id;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">
          {profile.first_name} {profile.last_name}
        </h1>
        {!isSelf ? (
          <div className="flex items-center gap-2">
            <ProfileRoleSelect profileId={profile.id} role={profile.role} />
            <SuspendProfileButton profileId={profile.id} status={profile.status} />
          </div>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm profile={profile} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            Wage &amp; employment
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Only admins can see this — employees never can, even each
            other&apos;s.
          </p>
        </CardHeader>
        <CardContent>
          <EmploymentRecordForm profileId={profile.id} record={employmentRecord} />
        </CardContent>
      </Card>
    </div>
  );
}
