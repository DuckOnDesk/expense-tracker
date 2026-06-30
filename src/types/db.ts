export type TransactionType = "expense" | "income";
export type TransactionSource = "manual" | "notification";

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string | null;
  is_default: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string | null;
  type: TransactionType;
  amount: number;
  merchant: string;
  memo: string | null;
  payment_method: string | null;
  occurred_at: string;
  source: TransactionSource;
  raw_notification: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionWithCategory extends Transaction {
  category: Category | null;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string | null;
  month: string;
  amount: number;
  created_at: string;
}

export const DEFAULT_CATEGORIES: Array<{
  name: string;
  type: TransactionType;
  color: string;
}> = [
  { name: "식비", type: "expense", color: "#f97316" },
  { name: "카페/간식", type: "expense", color: "#d97706" },
  { name: "교통", type: "expense", color: "#3b82f6" },
  { name: "쇼핑", type: "expense", color: "#ec4899" },
  { name: "문화/여가", type: "expense", color: "#8b5cf6" },
  { name: "의료/건강", type: "expense", color: "#10b981" },
  { name: "주거/통신", type: "expense", color: "#64748b" },
  { name: "교육", type: "expense", color: "#0ea5e9" },
  { name: "경조사/회비", type: "expense", color: "#a855f7" },
  { name: "기타", type: "expense", color: "#6b7280" },
  { name: "급여", type: "income", color: "#16a34a" },
  { name: "용돈/기타수입", type: "income", color: "#22c55e" },
];
