"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface BudgetFormState {
  error: string | null;
}

export async function upsertBudget(
  _prev: BudgetFormState,
  formData: FormData
): Promise<BudgetFormState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const categoryId = String(formData.get("category_id") || "") || null;
  const month = String(formData.get("month") ?? "");
  const amount = Number(formData.get("amount"));

  if (!month) return { error: "월을 선택해 주세요." };
  if (!Number.isFinite(amount) || amount < 0) return { error: "금액을 올바르게 입력해 주세요." };

  const monthDate = `${month}-01`;

  const { error } = await supabase.from("budgets").upsert(
    { user_id: user.id, category_id: categoryId, month: monthDate, amount },
    { onConflict: "user_id,category_id,month" }
  );

  if (error) return { error: error.message };

  revalidatePath("/budget");
  revalidatePath("/");
  return { error: null };
}

export async function deleteBudget(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("budgets").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/budget");
  revalidatePath("/");
}
