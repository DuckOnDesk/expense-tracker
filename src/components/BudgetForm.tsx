"use client";

import { useActionState } from "react";
import { upsertBudget, type BudgetFormState } from "@/app/budget/actions";
import type { Category } from "@/types/db";

const initialState: BudgetFormState = { error: null };

export function BudgetForm({
  categories,
  defaultMonth,
}: {
  categories: Category[];
  defaultMonth: string; // "YYYY-MM"
}) {
  const [state, formAction, pending] = useActionState(upsertBudget, initialState);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">월</label>
        <input
          name="month"
          type="month"
          required
          defaultValue={defaultMonth}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">카테고리</label>
        <select
          name="category_id"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">전체 (총 예산)</option>
          {categories
            .filter((c) => c.type === "expense")
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">예산 금액</label>
        <input
          name="amount"
          type="number"
          min={0}
          step={1000}
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          placeholder="500000"
        />
      </div>

      {state.error && (
        <p className="text-sm text-red-600 sm:col-span-3">{state.error}</p>
      )}

      <div className="sm:col-span-3">
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "저장 중..." : "예산 저장"}
        </button>
      </div>
    </form>
  );
}
