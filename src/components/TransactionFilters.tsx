"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Category } from "@/types/db";

export function TransactionFilters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [q, setQ] = useState(searchParams.get("q") ?? "");

  const pushParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams, startTransition]
  );

  // debounce keyword search
  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (q === current) return;
    const timeout = setTimeout(() => pushParams({ q: q || null }), 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const type = searchParams.get("type") ?? "";
  const categoryId = searchParams.get("category_id") ?? "";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const min = searchParams.get("min") ?? "";
  const max = searchParams.get("max") ?? "";

  const hasActiveFilters = Boolean(type || categoryId || from || to || min || max || q);

  return (
    <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="가맹점/메모 검색 (예: 올리브영)"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <select
          value={type}
          onChange={(e) => pushParams({ type: e.target.value || null })}
          className="rounded-lg border border-gray-300 px-2 py-2 text-sm"
        >
          <option value="">전체 유형</option>
          <option value="expense">지출</option>
          <option value="income">수입</option>
        </select>

        <select
          value={categoryId}
          onChange={(e) => pushParams({ category_id: e.target.value || null })}
          className="rounded-lg border border-gray-300 px-2 py-2 text-sm"
        >
          <option value="">전체 카테고리</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={from}
          onChange={(e) => pushParams({ from: e.target.value || null })}
          className="rounded-lg border border-gray-300 px-2 py-2 text-sm"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => pushParams({ to: e.target.value || null })}
          className="rounded-lg border border-gray-300 px-2 py-2 text-sm"
        />

        <input
          type="number"
          value={min}
          onChange={(e) => pushParams({ min: e.target.value || null })}
          placeholder="최소 금액"
          className="rounded-lg border border-gray-300 px-2 py-2 text-sm"
        />
        <input
          type="number"
          value={max}
          onChange={(e) => pushParams({ max: e.target.value || null })}
          placeholder="최대 금액"
          className="rounded-lg border border-gray-300 px-2 py-2 text-sm"
        />
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={() => {
            setQ("");
            router.push(pathname);
          }}
          className="text-xs text-gray-500 hover:text-red-600"
        >
          필터 초기화
        </button>
      )}
    </div>
  );
}
