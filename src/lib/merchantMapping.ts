import type { SupabaseClient } from "@supabase/supabase-js";

const normalize = (merchant: string) => merchant.trim().toLowerCase();

export async function lookupCategoryForMerchant(
  supabase: SupabaseClient,
  userId: string,
  merchant: string
): Promise<string | null> {
  const { data } = await supabase
    .from("merchant_category_map")
    .select("category_id")
    .eq("user_id", userId)
    .eq("merchant", normalize(merchant))
    .maybeSingle();

  return data?.category_id ?? null;
}

export async function learnMerchantCategory(
  supabase: SupabaseClient,
  userId: string,
  merchant: string,
  categoryId: string
) {
  const key = normalize(merchant);
  const { data: existing } = await supabase
    .from("merchant_category_map")
    .select("id, category_id, match_count")
    .eq("user_id", userId)
    .eq("merchant", key)
    .maybeSingle();

  if (!existing) {
    await supabase.from("merchant_category_map").insert({
      user_id: userId,
      merchant: key,
      category_id: categoryId,
      match_count: 1,
    });
    return;
  }

  if (existing.category_id === categoryId) {
    await supabase
      .from("merchant_category_map")
      .update({ match_count: existing.match_count + 1, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
  } else {
    // user re-categorized this merchant differently; switch the learned mapping
    await supabase
      .from("merchant_category_map")
      .update({ category_id: categoryId, match_count: 1, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
  }
}
