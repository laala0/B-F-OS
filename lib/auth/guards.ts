import "server-only";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser, type CurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { Project, UserRole } from "@/types/database";

// Call at the top of any (admin) or (field) layout/page/action. Not a
// replacement for RLS — a bug here fails open to "no data" (RLS still
// blocks the query), not open to another company's data.
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(...roles: UserRole[]): Promise<CurrentUser> {
  const user = await requireUser();
  if (!roles.includes(user.profile.role)) {
    redirect("/today");
  }
  return user;
}

// Call at the top of any project-scoped route (`[projectId]/...`) instead
// of hand-rolling a `select().eq("id", projectId).single()` + notFound().
// Admins see every project in their company (RLS: projects_select_admin);
// employees only see projects they're assigned to (RLS:
// projects_select_assigned). This mirrors that same "visibility follows
// assignment" rule at the app layer — same belt-and-suspenders reasoning
// as requireUser above — so an unassigned employee gets a 404 instead of
// depending solely on RLS silently returning nothing.
export async function requireProjectAccess(
  projectId: string,
  requireAssignment: boolean = true
): Promise<{ user: CurrentUser; project: Project }> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .is("deleted_at", null)
    .single();

  if (!project) notFound();

  // If requireAssignment is false, allow any user in the company to access
  // (used for media/document uploads where assignment isn't required).
  if (requireAssignment && user.profile.role !== "admin") {
    const { data: assignment } = await supabase
      .from("project_assignments")
      .select("id")
      .eq("project_id", projectId)
      .eq("profile_id", user.id)
      .maybeSingle();

    if (!assignment) notFound();
  }

  // For non-admin users with requireAssignment=false, verify company access.
  if (!requireAssignment && user.profile.role !== "admin") {
    if (project.company_id !== user.profile.company_id) notFound();
  }

  return { user, project };
}
