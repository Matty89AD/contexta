import { redirect } from "next/navigation";
import { createClient, getServiceRoleClient } from "@/lib/supabase/server";
import AdminSidebar from "@/components/admin/AdminSidebar";
import NotificationBell from "@/components/admin/NotificationBell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  // Check is_admin using service role (bypasses RLS)
  const serviceClient = getServiceRoleClient();
  const { data: profile } = await serviceClient
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/");

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950">
        {/* Admin top bar with notification bell */}
        <div className="flex items-center justify-end px-4 py-1.5 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <NotificationBell userId={user.id} />
        </div>
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
