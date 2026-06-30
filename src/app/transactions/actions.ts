"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { learnMerchantCategory } from "@/lib/merchantMapping";

export interface TransactionFormState {
  error: string | null;
}

function parseTransactionFields(formData: FormData) {
  const type = String(formData.get("type"));
  const amount = Number(formData.get("amount"));
  const merchant = String(formData.get("merchant") ?? "").trim();
  const categoryId = String(formData.get("category_id") ?? "") || null;
  const memo = String(formData.get("memo") ?? "").trim() || null;
  const paymentMethod = String(formData.get("payment_method") ?? "").trim() || null;
  const occurredAt = String(formData.get("occurred_at") ?? "");

  if (!merchant) throw new Error("가맹점/내역을 입력해 주세요.");
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("금액을 올바르게 입력해 주세요.");
  if (type !== "expense" && type !== "income") throw new Error("거래 유형이 올바르지 않습니다.");

  return {
    type: type as "expense" | "income",
    amount,
    merchant,
    category_id: categoryId,
    memo,
    payment_method: paymentMethod,
    occurred_at: occurredAt ? new Date(occurredAt).toISOString() : new Date().toISOString(),
  };
}

export async function createTransaction(
  _prevState: TransactionFormState,
  formData: FormData
): Promise<TransactionFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  let fields;
  try {
    fields = parseTransactionFields(formData);
  } catch (err) {
    return { error: (err as Error).message };
  }

  const { error } = await supabase.from("transactions").insert({
    ...fields,
    user_id: user.id,
    source: "manual",
  });

  if (error) return { error: error.message };

  if (fields.category_id) {
    await learnMerchantCategory(supabase, user.id, fields.merchant, fields.category_id);
  }

  revalidatePath("/transactions");
  revalidatePath("/");
  return { error: null };
}

export async function updateTransaction(
  id: string,
  _prevState: TransactionFormState,
  formData: FormData
): Promise<TransactionFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  let fields;
  try {
    fields = parseTransactionFields(formData);
  } catch (err) {
    return { error: (err as Error).message };
  }

  const { error } = await supabase
    .from("transactions")
    .update(fields)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  if (fields.category_id) {
    await learnMerchantCategory(supabase, user.id, fields.merchant, fields.category_id);
  }

  revalidatePath("/transactions");
  revalidatePath("/");
  return { error: null };
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("transactions").delete().eq("id", id).eq("user_id", user.id);

  revalidatePath("/transactions");
  revalidatePath("/");
}
