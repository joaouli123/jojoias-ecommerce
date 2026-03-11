import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Sidebar } from "@/components/admin/sidebar";
import { isStaffRole } from "@/lib/admin-permissions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Protect admin routes
  if (!session || !isStaffRole(session.user.role)) {
    redirect("/login");
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar role={session.user.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="hidden h-16 shrink-0 items-center justify-end border-b bg-white px-8 md:flex">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="font-medium">{session.user.name}</span>
            <span className="rounded bg-gray-100 px-2 py-1 text-xs font-semibold uppercase text-gray-500">{session.user.role}</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
