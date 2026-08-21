import { createClient } from "@/lib/supabase/server";
import type { AppSettings } from "@/lib/types";

/** The single site-wide settings row (welcome video URL, etc). */
export async function getAppSettings(): Promise<AppSettings | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("app_settings")
    .select("*")
    .eq("id", true)
    .single<AppSettings>();

  return data ?? null;
}
