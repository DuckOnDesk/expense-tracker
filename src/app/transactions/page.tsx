import { createClient } from "@/lib/supabase/server";
import { ensureDefaultCategories } from "@/lib/seedCategories";
import { formatWon } from "@/lib/format";
import { AddTransactionPanel } from "@/components/AddTransactionPanel";
import { TransactionFilters } from "@/components/TransactionFilters";
import { TransactionRow } from "@/components/TransactionRow";
import type { Category, TransactionWithCategory } from "@/types/db";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  await ensureDefaultCategories(supabase, user.id);

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", user.id)
    .order("type")
    .order("name");

  let query = supabase
    .from("transactions")
    .select("*, category:categories(*)")
    .eq("user_id", user.id)
    .order("occurred_at", { ascending: false });

  const get = (key: string) => {
    const v = params[key];
    return Array.isArray(v) ? v[0] : v;
  };

  const q = get("q");
  const type = get("type");
  const categoryId = get("category_id");
  const from = get("from");
  const to = get("to");
  const min = get("min");
  const max = get("max");

  if (q) query = query.ilike("merchant", `%${q}%`);
  if (type) query = query.eq("type", type);
  if (categoryId) query = query.eq("category_id", categoryId);
  if (from) query = query.gte("occurred_at", new Date(from).toISOString());
  if (to) {
    const toEnd = new Date(to);
    toEnd.setDate(toEnd.getDate() + 1);
    query = query.lt("occurred_at", toEnd.toISOString());
  }
  if (min) query = query.gte("amount", Number(min));
  if (max) query = query.lte("amount", Number(max));

  const { data: transactions, error } = await query.limit(200);

  const list = (transactions ?? []) as unknown as TransactionWithCategory[];
  const categoryList = (categories ?? []) as Category[];

  const totalExpense = list
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalIncome = list
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900">거래 내역</h1>

      <AddTransactionPanel categories={categoryList} />
      <TransactionFilters categories={categoryList} />

      <div className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4 text-sm">
        <span className="text-gray-500">
          조회 결과 {list.length}건
        </span>
        <span className="text-red-600">지출 합계 {formatWon(totalExpense)}</span>
        <span className="text-green-600">수입 합계 {formatWon(totalIncome)}</span>
      </div>

      {error && <p className="text-sm text-red-600">{error.message}</p>}

      <div className="space-y-2">
        {list.length === 0 && (
          <p className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-400">
            조건에 맞는 거래 내역이 없습니다.
          </p>
        )}
        {list.map((t) => (
          <TransactionRow key={t.id} transaction={t} categories={categoryList} />
        ))}
      </div>
    </div>
  );
}
