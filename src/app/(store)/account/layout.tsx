import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AccountSidebar } from "@/components/account/account-sidebar";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <AccountSidebar userName={session.user.name} userEmail={session.user.email} />
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}