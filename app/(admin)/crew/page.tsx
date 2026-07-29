import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RoleBadge } from "@/components/shared/role-badge";
import { InviteCrewDialog } from "@/components/crew/invite-crew-dialog";
import { RevokeInviteButton } from "@/components/crew/revoke-invite-button";

const STATUS_BADGE_CLASS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  invited: "bg-sky-100 text-sky-700",
  suspended: "bg-neutral-100 text-neutral-500",
};

export default async function CrewPage() {
  const user = await requireRole("admin");
  const supabase = await createClient();

  const [{ data: profiles }, { data: invites }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, first_name, last_name, email, role, status")
      .eq("company_id", user.profile.company_id)
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),
    supabase
      .from("invites")
      .select("id, email, role, expires_at, accepted_at, revoked_at")
      .eq("company_id", user.profile.company_id)
      .is("accepted_at", null)
      .is("revoked_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">Crew</h1>
        <InviteCrewDialog />
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(profiles ?? []).map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">
                  <Link href={`/crew/${p.id}`} className="hover:underline">
                    {p.first_name} {p.last_name}
                    {p.id === user.id ? (
                      <span className="ml-1.5 text-xs text-neutral-400">(you)</span>
                    ) : null}
                  </Link>
                </TableCell>
                <TableCell className="text-neutral-500">{p.email}</TableCell>
                <TableCell>
                  <RoleBadge role={p.role} />
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={STATUS_BADGE_CLASS[p.status]}
                  >
                    {p.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {invites && invites.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-neutral-900">
            Pending invites
          </p>
          <div className="rounded-lg border border-neutral-200 bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell>{invite.email}</TableCell>
                    <TableCell>
                      <RoleBadge role={invite.role} />
                    </TableCell>
                    <TableCell className="text-neutral-500">
                      {new Date(invite.expires_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <RevokeInviteButton inviteId={invite.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
