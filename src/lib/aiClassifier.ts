/**
 * AI-based category classification fallback.
 * Called only for merchants not found in the merchant_category_map table.
 * Result is cached back into the mapping table so the same merchant is never
 * sent to the API twice.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Category } from "@/types/db";
import { learnMerchantCategory } from "./merchantMapping";

interface ClassifyResult {
  categoryId: string | null;
  categoryName: string;
}

export async function classifyMerchantWithAI(
  supabase: SupabaseClient,
  userId: string,
  merchant: string,
  transactionType: "expense" | "income"
): Promise<ClassifyResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { categoryId: null, categoryName: "미분류" };

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, type")
    .eq("user_id", userId)
    .eq("type", transactionType);

  const cats = (categories ?? []) as Pick<Category, "id" | "name" | "type">[];
  if (cats.length === 0) return { categoryId: null, categoryName: "미분류" };

  const categoryList = cats.map((c) => c.name).join(", ");

  const prompt = `당신은 가계부 카테고리 분류 전문가입니다.
가맹점명을 보고 아래 카테고리 목록 중 가장 적합한 것을 딱 하나만 골라 카테고리명만 답하세요. 다른 말은 하지 마세요.

카테고리 목록: ${categoryList}

가맹점명: ${merchant}
거래 유형: ${transactionType === "expense" ? "지출" : "수입"}`;

  let chosen: string | null = null;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 32,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (res.ok) {
      const data = await res.json();
      chosen = (data.content?.[0]?.text ?? "").trim();
    }
  } catch {
    // network / API error — fall through to uncategorized
  }

  const matched = cats.find((c) => c.name === chosen);
  if (matched) {
    await learnMerchantCategory(supabase, userId, merchant, matched.id);
    return { categoryId: matched.id, categoryName: matched.name };
  }

  return { categoryId: null, categoryName: "미분류" };
}
