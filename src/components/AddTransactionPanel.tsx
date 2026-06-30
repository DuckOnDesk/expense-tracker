"use client";

import { useState } from "react";
import type { Category } from "@/types/db";
import { TransactionForm } from "./TransactionForm";

export function AddTransactionPanel({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left text-sm font-semibold text-blue-600"
      >
        {open ? "− 거래 추가 닫기" : "+ 새 거래 추가"}
      </button>
      {open && (
        <div className="mt-4">
          <TransactionForm categories={categories} onDone={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
