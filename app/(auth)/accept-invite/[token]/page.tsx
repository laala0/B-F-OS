import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent } from "@/components/ui/card";
import { AcceptInviteForm } from "./accept-invite-form";

export default async function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const tokenIsValidUuid = z.string().uuid().safeParse(token).success;

  const invite = tokenIsValidUuid
    ? await (async () => {
        const admin = createAdminClient();
        const { data } = await admin
          .from("invites")
          .select("email, accepted_at, revoked_at, expires_at")
          .eq("token", token)
          .single();
        return data;
      })()
    : null;

  const isValid =
    tokenIsValidUuid &&
    invite &&
    !invite.accepted_at &&
    !invite.revoked_at &&
    new Date(invite.expires_at) > new Date();

  if (!isValid || !invite) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="font-medium text-neutral-900">
            This invite link is invalid or has expired.
          </p>
          <p className="mt-2 text-sm text-neutral-500">
            Ask whoever invited you to send a new one.
          </p>
        </CardContent>
      </Card>
    );
  }

  return <AcceptInviteForm token={token} email={invite.email} />;
}
