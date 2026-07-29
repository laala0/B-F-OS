import { requireRole } from "@/lib/auth/guards";
import { AdminSidebar } from "@/components/shared/admin-sidebar";
import { UserMenu } from "@/components/shared/user-menu";
import { RoleBadge } from "@/components/shared/role-badge";

// Dense desktop console — this is where admins live day to day.
export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireRole("admin");

  return (
    <div className="flex h-full flex-1">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-end gap-3 border-b border-neutral-200 bg-white px-6">
          <RoleBadge role={user.profile.role} />
          <UserMenu
            firstName={user.profile.first_name}
            lastName={user.profile.last_name}
            email={user.email}
            avatarUrl={user.profile.avatar_url}
          />
        </header>
        <main className="flex-1 overflow-y-auto bg-neutral-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
