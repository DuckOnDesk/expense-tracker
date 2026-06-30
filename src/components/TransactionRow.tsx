"use client";

import { useState } from "react";
import type { Category, TransactionWithCategory } from "@/types/db";
import { formatDate, formatWon } from "@/lib/format";
import { deleteTransaction } from "@/app/transactions/actions";
import { TransactionForm } from "./TransactionForm";

export function TransactionRow({
  transaction,
  categories,
}: {
  transaction: TransactionWithCategory;
  categories: Category[];
}) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (editing) {
    return (
      <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4">
        <TransactionForm
          categories={categories}
          transaction={transaction}
          onDone={() => setEditing(false)}
        />
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="mt-2 text-xs text-gray-500 hover:text-gray-700"
        >
          취소
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-3 min-w-0">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: transaction.category?.color ?? "#9ca3af" }}
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-900">
            {transaction.merchant}
          </p>
          <p className="truncate text-xs text-gray-500">
            {formatDate(transaction.occurred_at)} · {transaction.category?.name ?? "미분류"}
            {transaction.payment_method ? ` · ${transaction.payment_method}` : ""}
            {transaction.source === "notification" ? " · 알림 자동기록" : ""}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <span
          className={`text-sm font-semibold ${
            transaction.type === "expense" ? "text-red-600" : "text-green-600"
          }`}
        >
          {transaction.type === "expense" ? "-" : "+"}
          {formatWon(transaction.amount)}
        </span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-xs text-gray-400 hover:text-blue-600"
        >
          수정
        </button>
        {deleting ? (
          <span className="flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => deleteTransaction(transaction.id)}
              className="text-red-600 hover:underline"
            >
              삭제확인
            </button>
            <button
              type="button"
              onClick={() => setDeleting(false)}
              className="text-gray-400 hover:underline"
            >
              취소
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setDeleting(true)}
            className="text-xs text-gray-400 hover:text-red-600"
          >
            삭제
          </button>
        )}
      </div>
    </div>
  );
}
