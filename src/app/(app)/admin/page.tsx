import Link from "next/link";
import { AdminControlCenter } from "@/components/dashboard/admin-control-center";
import { requireSession } from "@/lib/auth-session";
import { getUserRole, listAdminUserAccessItems } from "@/lib/user-access";

export default async function AdminPage() {
  const session = await requireSession("/login?next=/admin");
  const role = await getUserRole(session.user.id);

  if (role !== "admin") {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.1em] text-[#4e5f56]">
          <Link
            href="/dashboard"
            className="rounded-full border border-[#d2c2ac] bg-[#f4e9d7] px-2.5 py-1 transition hover:border-[#bfab8f] hover:text-[#31433a]"
          >
            Dashboard
          </Link>
          <span>/</span>
          <span>Admin</span>
        </div>

        <article className="fc-card rounded-xl border border-[#d6c8b2] p-5 sm:p-6">
          <h1 className="font-display text-3xl tracking-tight text-[#23362f]">
            Admin only
          </h1>
          <p className="mt-2 text-sm leading-7 fc-text-muted">
            This page is only available to accounts with the admin role.
          </p>
        </article>
      </section>
    );
  }

  const users = await listAdminUserAccessItems();

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.1em] text-[#4e5f56]">
        <Link
          href="/dashboard"
          className="rounded-full border border-[#d2c2ac] bg-[#f4e9d7] px-2.5 py-1 transition hover:border-[#bfab8f] hover:text-[#31433a]"
        >
          Dashboard
        </Link>
        <span>/</span>
        <span>Admin panel</span>
      </div>

      <AdminControlCenter initialUsers={users} currentUserId={session.user.id} />
    </section>
  );
}
