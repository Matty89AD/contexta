import { redirect } from "next/navigation";
import { createClient, getServiceRoleClient } from "@/lib/supabase/server";
import AdminSidebar from "@/components/admin/AdminSidebar";

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
      <main className="flex-1 overflow-auto p-6 bg-zinc-50 dark:bg-zinc-950">
        {children}
      </main>
    </div>
  );
}
