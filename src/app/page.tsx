import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ensureDefaultCategories } from "@/lib/seedCategories";
import { formatWon } from "@/lib/format";
import { CategoryPieChart, type CategorySlice } from "@/components/CategoryPieChart";
import { MonthlyTrendChart, type MonthlyPoint } from "@/components/MonthlyTrendChart";
import { BudgetBar } from "@/components/BudgetBar";
import type { Budget, Category, TransactionWithCategory } from "@/types/db";

function monthKey(date: Date) {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  await ensureDefaultCategories(supabase, user.id);

  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const { data: recentTx } = await supabase
    .from("transactions")
    .select("*, category:categories(*)")
    .eq("user_id", user.id)
    .gte("occurred_at", sixMonthsAgo.toISOString())
    .order("occurred_at", { ascending: false });

  const transactions = (recentTx ?? []) as unknown as TransactionWithCategory[];

  const thisMonthTx = transactions.filter((t) => {
    const d = new Date(t.occurred_at);
    return d >= monthStart && d < nextMonthStart;
  });

  const thisMonthExpense = thisMonthTx
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const thisMonthIncome = thisMonthTx
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const categoryTotals = new Map<string, CategorySlice>();
  for (const t of thisMonthTx) {
    if (t.type !== "expense") continue;
    const name = t.category?.name ?? "미분류";
    const color = t.category?.color ?? "#9ca3af";
    const existing = categoryTotals.get(name);
    if (existing) existing.value += Number(t.amount);
    else categoryTotals.set(name, { name, value: Number(t.amount), color });
  }
  const pieData = Array.from(categoryTotals.values()).sort((a, b) => b.value - a.value);

  const monthlyMap = new Map<string, MonthlyPoint>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthlyMap.set(monthKey(d), { month: monthKey(d), expense: 0, income: 0 });
  }
  for (const t of transactions) {
    const key = monthKey(new Date(t.occurred_at));
    const point = monthlyMap.get(key);
    if (!point) continue;
    if (t.type === "expense") point.expense += Number(t.amount);
    else point.income += Number(t.amount);
  }
  const trendData = Array.from(monthlyMap.values());

  const recentFive = transactions.slice(0, 5);

  // Budget data for this month
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const { data: budgetsRaw } = await supabase
    .from("budgets")
    .select("*")
    .eq("user_id", user.id)
    .eq("month", monthStr);
  const { data: categoriesRaw } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", user.id);

  const budgets = (budgetsRaw ?? []) as Budget[];
  const allCategories = (categoriesRaw ?? []) as Category[];
  const catMap = new Map(allCategories.map((c) => [c.id, c]));
  const spentByCategory = new Map<string | null, number>();
  for (const t of thisMonthTx) {
    if (t.type !== "expense") continue;
    const k = t.category_id;
    spentByCategory.set(k, (spentByCategory.get(k) ?? 0) + Number(t.amount));
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">이번 달 대시보드</h1>
        <Link href="/transactions" className="text-sm text-blue-600 hover:underline">
          거래 내역 전체 보기 →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">이번 달 지출</p>
          <p className="mt-1 text-xl font-bold text-red-600">{formatWon(thisMonthExpense)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">이번 달 수입</p>
          <p className="mt-1 text-xl font-bold text-green-600">{formatWon(thisMonthIncome)}</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold text-gray-700">카테고리별 지출 (이번 달)</h2>
        <CategoryPieChart data={pieData} />
        {pieData.length > 0 && (
          <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
            {pieData.map((c) => (
              <li key={c.name} className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: c.color }}
                  />
                  {c.name}
                </span>
                <span>{formatWon(c.value)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {budgets.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">예산 현황</h2>
            <Link href="/budget" className="text-xs text-blue-600 hover:underline">
              예산 관리 →
            </Link>
          </div>
          <div className="space-y-4">
            {budgets.map((b) => {
              const cat = b.category_id ? catMap.get(b.category_id) : null;
              const spent = b.category_id
                ? (spentByCategory.get(b.category_id) ?? 0)
                : thisMonthExpense;
              return (
                <BudgetBar
                  key={b.id}
                  label={cat?.name ?? "전체 지출"}
                  color={cat?.color ?? "#6b7280"}
                  spent={spent}
                  budget={Number(b.amount)}
                />
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold text-gray-700">최근 6개월 추이</h2>
        <MonthlyTrendChart data={trendData} />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">최근 거래</h2>
          <Link href="/transactions" className="text-xs text-blue-600 hover:underline">
            더보기
          </Link>
        </div>
        {recentFive.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">아직 기록된 거래가 없습니다.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {recentFive.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-2 text-sm">
                <span className="truncate text-gray-700">{t.merchant}</span>
                <span
                  className={t.type === "expense" ? "text-red-600" : "text-green-600"}
                >
                  {t.type === "expense" ? "-" : "+"}
                  {formatWon(Number(t.amount))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
