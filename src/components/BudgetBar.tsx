import { formatWon } from "@/lib/format";

export function BudgetBar({
  label,
  color,
  spent,
  budget,
}: {
  label: string;
  color: string;
  spent: number;
  budget: number;
}) {
  const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const over = spent > budget && budget > 0;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-medium text-gray-700">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
          {label}
        </span>
        <span className={over ? "font-semibold text-red-600" : "text-gray-500"}>
          {formatWon(spent)} / {formatWon(budget)}
          {over && " ⚠ 초과"}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-2 rounded-full transition-all ${over ? "bg-red-500" : "bg-blue-500"}`}
          style={{ width: `${pct}%`, backgroundColor: over ? undefined : color }}
        />
      </div>
    </div>
  );
}
