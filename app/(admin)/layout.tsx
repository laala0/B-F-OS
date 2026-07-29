import { requireRole } from "@/lib/auth/guards";
import { AdminSidebar } from "@/components/shared/admin-sidebar";
import { AdminMobileNav } from "@/components/shared/admin-mobile-nav";
import { UserMenu } from "@/components/shared/user-menu";
import { RoleBadge } from "@/components/shared/role-badge";
import { BrandMark } from "@/components/shared/brand-mark";

// Dense desktop console with a full-width layout — this is where admins
// live day to day. Collapses to a drawer nav below md (see AdminMobileNav).
export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireRole("admin");

  return (
    <div className="flex h-full flex-1">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-1 md:hidden">
            <AdminMobileNav />
            <BrandMark size="sm" showWordmark={false} className="pl-1" />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <RoleBadge role={user.profile.role} />
            <UserMenu
              firstName={user.profile.first_name}
              lastName={user.profile.last_name}
              email={user.email}
              avatarUrl={user.profile.avatar_url}
            />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-muted/40 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
