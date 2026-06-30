import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_CATEGORIES } from "@/types/db";

export async function ensureDefaultCategories(
  supabase: SupabaseClient,
  userId: string
) {
  const { count } = await supabase
    .from("categories")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (count && count > 0) return;

  const rows = DEFAULT_CATEGORIES.map((category) => ({
    user_id: userId,
    name: category.name,
    type: category.type,
    color: category.color,
    is_default: true,
  }));

  await supabase.from("categories").insert(rows);
}
