"use client";

import { useActionState, useState } from "react";
import type { Category, Transaction } from "@/types/db";
import { createTransaction, updateTransaction, type TransactionFormState } from "@/app/transactions/actions";
import { toDateInputValue } from "@/lib/format";

const initialState: TransactionFormState = { error: null };

export function TransactionForm({
  categories,
  transaction,
  onDone,
}: {
  categories: Category[];
  transaction?: Transaction;
  onDone?: () => void;
}) {
  const isEdit = Boolean(transaction);
  const action = isEdit
    ? updateTransaction.bind(null, transaction!.id)
    : createTransaction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [type, setType] = useState<"expense" | "income">(transaction?.type ?? "expense");

  const filteredCategories = categories.filter((c) => c.type === type);

  return (
    <form
      action={async (formData) => {
        await formAction(formData);
        onDone?.();
      }}
      className="grid grid-cols-1 gap-3 sm:grid-cols-2"
    >
      <div className="flex gap-2 sm:col-span-2">
        <button
          type="button"
          onClick={() => setType("expense")}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
            type === "expense"
              ? "border-red-500 bg-red-50 text-red-600"
              : "border-gray-300 text-gray-500"
          }`}
        >
          지출
        </button>
        <button
          type="button"
          onClick={() => setType("income")}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
            type === "income"
              ? "border-green-500 bg-green-50 text-green-600"
              : "border-gray-300 text-gray-500"
          }`}
        >
          수입
        </button>
        <input type="hidden" name="type" value={type} />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">금액</label>
        <input
          name="amount"
          type="number"
          min={0}
          step="1"
          required
          defaultValue={transaction?.amount}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          placeholder="12000"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">가맹점/내역</label>
        <input
          name="merchant"
          type="text"
          required
          defaultValue={transaction?.merchant}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          placeholder="올리브영"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">카테고리</label>
        <select
          name="category_id"
          defaultValue={transaction?.category_id ?? ""}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">미분류</option>
          {filteredCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">결제 수단</label>
        <input
          name="payment_method"
          type="text"
          defaultValue={transaction?.payment_method ?? ""}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          placeholder="신한카드"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">일시</label>
        <input
          name="occurred_at"
          type="datetime-local"
          required
          defaultValue={
            transaction ? toDateInputValue(transaction.occurred_at) : toDateInputValue(new Date().toISOString())
          }
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="sm:col-span-2">
        <label className="mb-1 block text-xs font-medium text-gray-600">메모</label>
        <input
          name="memo"
          type="text"
          defaultValue={transaction?.memo ?? ""}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          placeholder="선택 입력"
        />
      </div>

      {state.error && <p className="text-sm text-red-600 sm:col-span-2">{state.error}</p>}

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "저장 중..." : isEdit ? "수정 저장" : "추가하기"}
        </button>
      </div>
    </form>
  );
}
