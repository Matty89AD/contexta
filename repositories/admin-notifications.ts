/**
 * Admin notifications repository — Epic 19.
 * All functions expect a service-role Supabase client (bypasses RLS).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminNotification, AdminNotificationType } from "@/lib/db/types";

export interface NotificationCreate {
  type: AdminNotificationType;
  title: string;
  body?: string | null;
  link_url?: string | null;
}

export async function createNotification(
  supabase: SupabaseClient,
  data: NotificationCreate
): Promise<AdminNotification> {
  const { data: row, error } = await supabase
    .from("admin_notifications")
    .insert({
      type: data.type,
      title: data.title,
      body: data.body ?? null,
      link_url: data.link_url ?? null,
    })
    .select()
    .single();
  if (error) throw new Error(`Failed to create notification: ${error.message}`);
  return row as AdminNotification;
}

export async function listUnreadNotifications(
  supabase: SupabaseClient
): Promise<AdminNotification[]> {
  const { data, error } = await supabase
    .from("admin_notifications")
    .select("*")
    .eq("is_read", false)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(`Failed to list notifications: ${error.message}`);
  return (data ?? []) as AdminNotification[];
}

export async function listRecentNotifications(
  supabase: SupabaseClient
): Promise<AdminNotification[]> {
  const { data, error } = await supabase
    .from("admin_notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(`Failed to list notifications: ${error.message}`);
  return (data ?? []) as AdminNotification[];
}

export async function markAllRead(supabase: SupabaseClient): Promise<void> {
  const { error } = await supabase
    .from("admin_notifications")
    .update({ is_read: true })
    .eq("is_read", false);
  if (error) throw new Error(`Failed to mark all read: ${error.message}`);
}

export async function markRead(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase
    .from("admin_notifications")
    .update({ is_read: true })
    .eq("id", id);
  if (error) throw new Error(`Failed to mark read: ${error.message}`);
}
