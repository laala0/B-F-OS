import { BrandMark } from "@/components/shared/brand-mark";
import { AdminNavLinks } from "@/components/shared/admin-nav";

// Persistent desktop rail. Below md, AdminMobileNav (a drawer) takes over —
// this dense multi-item nav has no business eating 60% of a phone screen.
export function AdminSidebar() {
  return (
    <nav className="hidden h-full w-60 shrink-0 flex-col gap-1 border-r border-sidebar-border bg-sidebar p-3 md:flex">
      <div className="mb-5 px-1 pt-1">
        <BrandMark size="sm" />
      </div>
      <AdminNavLinks />
    </nav>
  );
}
