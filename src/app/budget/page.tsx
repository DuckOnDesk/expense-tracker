import { createClient } from "@/lib/supabase/server";
import { ensureDefaultCategories } from "@/lib/seedCategories";
import { formatWon } from "@/lib/format";
import { BudgetForm } from "@/components/BudgetForm";
import { BudgetBar } from "@/components/BudgetBar";
import { deleteBudget } from "./actions";
import type { Budget, Category } from "@/types/db";

function thisMonthStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default async function BudgetPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  await ensureDefaultCategories(supabase, user.id);

  const month = thisMonthStr();
  const monthDate = `${month}-01`;

  const [{ data: budgetsRaw }, { data: categoriesRaw }, { data: txRaw }] = await Promise.all([
    supabase
      .from("budgets")
      .select("*")
      .eq("user_id", user.id)
      .eq("month", monthDate),
    supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id)
      .order("type").order("name"),
    supabase
      .from("transactions")
      .select("category_id, amount, type")
      .eq("user_id", user.id)
      .eq("type", "expense")
      .gte("occurred_at", new Date(monthDate).toISOString())
      .lt("occurred_at", new Date(`${month.slice(0, 7)}`
        .replace(/-(\d+)$/, (_, m) => {
          const next = Number(m) + 1;
          return next > 12 ? `-01` : `-${String(next).padStart(2, "0")}`;
        }) + "-01").toISOString()),
  ]);

  const budgets = (budgetsRaw ?? []) as Budget[];
  const categories = (categoriesRaw ?? []) as Category[];

  // Compute spending per category
  const spentByCategory = new Map<string | null, number>();
  let totalSpent = 0;
  for (const tx of txRaw ?? []) {
    const key = tx.category_id as string | null;
    spentByCategory.set(key, (spentByCategory.get(key) ?? 0) + Number(tx.amount));
    totalSpent += Number(tx.amount);
  }

  const totalBudget = budgets.find((b) => b.category_id === null);
  const catBudgets = budgets.filter((b) => b.category_id !== null);

  const catMap = new Map(categories.map((c) => [c.id, c]));

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900">예산 관리</h1>

      {/* 예산 설정 폼 */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-4 text-sm font-semibold text-gray-700">예산 추가/수정</h2>
        <BudgetForm categories={categories} defaultMonth={month} />
      </div>

      {/* 이번 달 예산 현황 */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-4 text-sm font-semibold text-gray-700">
          {month.replace("-", "년 ")}월 예산 현황
        </h2>

        {budgets.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">
            설정된 예산이 없습니다. 위에서 예산을 추가하세요.
          </p>
        ) : (
          <div className="space-y-5">
            {/* 총 예산 */}
            {totalBudget && (
              <div className="pb-4 border-b border-gray-100">
                <BudgetBar
                  label="전체 지출"
                  color="#6b7280"
                  spent={totalSpent}
                  budget={Number(totalBudget.amount)}
                />
                <div className="mt-1 flex justify-end">
                  <form action={deleteBudget.bind(null, totalBudget.id)}>
                    <button type="submit" className="text-xs text-gray-400 hover:text-red-500">
                      삭제
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* 카테고리별 예산 */}
            {catBudgets.map((b) => {
              const cat = catMap.get(b.category_id!);
              if (!cat) return null;
              const spent = spentByCategory.get(b.category_id) ?? 0;
              return (
                <div key={b.id}>
                  <BudgetBar
                    label={cat.name}
                    color={cat.color}
                    spent={spent}
                    budget={Number(b.amount)}
                  />
                  <div className="mt-1 flex items-center justify-between text-xs text-gray-400">
                    <span>잔여 {formatWon(Math.max(Number(b.amount) - spent, 0))}</span>
                    <form action={deleteBudget.bind(null, b.id)}>
                      <button type="submit" className="hover:text-red-500">삭제</button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
