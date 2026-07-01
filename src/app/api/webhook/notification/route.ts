/**
 * POST /api/webhook/notification
 *
 * Receives a raw notification from the Android app, parses it,
 * auto-classifies the category, and inserts a transaction row.
 *
 * Auth: Bearer token in Authorization header (WEBHOOK_SECRET env var).
 *
 * Request body (JSON):
 * {
 *   userId: string;        // Supabase user UUID
 *   rawText: string;       // full notification text as received on device
 *   packageName?: string;  // optional: Android app package for debugging
 *   deviceTime?: string;   // optional: ISO timestamp from device (fallback)
 * }
 *
 * Response 200: { ok: true, transactionId: string }
 * Response 400: { ok: false, error: string }
 * Response 401: { ok: false, error: "Unauthorized" }
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseNotification } from "@/lib/notificationParser";
import { lookupCategoryForMerchant, learnMerchantCategory } from "@/lib/merchantMapping";
import { classifyMerchantWithAI } from "@/lib/aiClassifier";

// Service-role client (bypasses RLS) — only used server-side in this route
function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Supabase service role not configured");
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export async function POST(request: Request) {
  // ── 1. Auth ───────────────────────────────────────────────────────────
  const authHeader = request.headers.get("Authorization") ?? "";
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // ── 2. Parse body ─────────────────────────────────────────────────────
  let body: { userId?: string; rawText?: string; deviceTime?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { userId, rawText, deviceTime } = body;
  if (!userId || !rawText) {
    return NextResponse.json({ ok: false, error: "userId and rawText are required" }, { status: 400 });
  }

  // ── 3. Parse notification text ────────────────────────────────────────
  const parsed = parseNotification(rawText);
  if (!parsed) {
    return NextResponse.json(
      { ok: false, error: "Notification text did not match any known card/bank format" },
      { status: 400 }
    );
  }

  // Use device-provided timestamp as fallback if parser couldn't extract one
  const occurredAt = parsed.occurredAt ?? (deviceTime ? new Date(deviceTime) : new Date());

  // ── 4. Category lookup: mapping table → AI fallback ───────────────────
  const supabase = createServiceClient();

  let categoryId = await lookupCategoryForMerchant(supabase, userId, parsed.merchant);

  if (!categoryId) {
    const ai = await classifyMerchantWithAI(supabase, userId, parsed.merchant, parsed.type);
    categoryId = ai.categoryId;
    // learnMerchantCategory is already called inside classifyMerchantWithAI on success
  }

  // Ensure the looked-up category belongs to the right transaction type;
  // if type mismatches (e.g., income category on an expense), clear it.
  if (categoryId) {
    const { data: cat } = await supabase
      .from("categories")
      .select("type")
      .eq("id", categoryId)
      .maybeSingle();
    if (cat && cat.type !== parsed.type) {
      categoryId = null;
    }
  }

  // ── 5. Insert transaction ─────────────────────────────────────────────
  const { data: tx, error } = await supabase
    .from("transactions")
    .insert({
      user_id: userId,
      type: parsed.type,
      amount: parsed.amount,
      merchant: parsed.merchant,
      payment_method: parsed.paymentMethod,
      category_id: categoryId,
      occurred_at: occurredAt.toISOString(),
      source: "notification",
      raw_notification: rawText,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  // Reinforce merchant mapping with confirmed category
  if (categoryId) {
    await learnMerchantCategory(supabase, userId, parsed.merchant, categoryId);
  }

  return NextResponse.json({ ok: true, transactionId: tx.id });
}
