import { auth } from "@/server/auth";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Middleware handles authentication and authorization
  // This component assumes user is already authorized to be here

  if (!session?.user) {
    // This should never happen due to middleware protection
    // But included for type safety
    return null;
  }

  return (
    <SidebarProvider>
      <AppSidebar user={session.user} />
      <main className="flex-1">
        <div className="flex h-14 items-center border-b px-4">
          <SidebarTrigger />
          <h1 className="ml-4 text-lg font-semibold">
            {session.user.company?.name ?? "Dashboard"}
          </h1>
        </div>
        <div className="p-6">{children}</div>
      </main>
    </SidebarProvider>
  );
}
