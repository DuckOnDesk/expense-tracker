/**
 * Korean card/bank notification text parser.
 *
 * Each pattern covers a specific issuer's push-notification format.
 * Returns null when no pattern matches — caller should handle gracefully.
 */

export interface ParsedNotification {
  type: "expense" | "income";
  amount: number;
  merchant: string;
  paymentMethod: string;
  occurredAt: Date;
}

interface Pattern {
  issuer: string;
  regex: RegExp;
  extract: (m: RegExpMatchArray) => Omit<ParsedNotification, "occurredAt"> | null;
}

// Helpers
const parseAmount = (raw: string): number =>
  Number(raw.replace(/,/g, "").replace(/원/g, "").trim());

const parseKoreanDate = (raw: string): Date | null => {
  // "25/07/01 14:30" or "2025-07-01 14:30" or "07/01 14:30"
  const now = new Date();
  const m1 = raw.match(/(\d{2,4})[\/\-](\d{2})[\/\-](\d{2})\s+(\d{2}):(\d{2})/);
  if (m1) {
    const [, y, mo, d, h, mi] = m1;
    const year = y.length === 2 ? 2000 + Number(y) : Number(y);
    return new Date(year, Number(mo) - 1, Number(d), Number(h), Number(mi));
  }
  const m2 = raw.match(/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})/);
  if (m2) {
    const [, mo, d, h, mi] = m2;
    return new Date(now.getFullYear(), Number(mo) - 1, Number(d), Number(h), Number(mi));
  }
  return null;
};

const PATTERNS: Pattern[] = [
  // ── 신한카드 ────────────────────────────────────────────────────────────
  // "[신한카드] 승인 14,500원 스타벅스 25/07/01 14:30 일시불"
  {
    issuer: "신한카드",
    regex: /\[신한카드\]\s*승인\s*([\d,]+)원\s+(.+?)\s+(\d{2}\/\d{2}\/\d{2}\s+\d{2}:\d{2})/,
    extract: (m) => ({
      type: "expense",
      amount: parseAmount(m[1]),
      merchant: m[2].trim(),
      paymentMethod: "신한카드",
    }),
  },
  // ── 삼성카드 ────────────────────────────────────────────────────────────
  // "[삼성카드] 삼성카드(1234) 43,200원 올리브영 07/01 15:22"
  {
    issuer: "삼성카드",
    regex: /\[삼성카드\].*?(\d{2,4})\)\s*([\d,]+)원\s+(.+?)\s+(\d{2}\/\d{2}\s+\d{2}:\d{2})/,
    extract: (m) => ({
      type: "expense",
      amount: parseAmount(m[2]),
      merchant: m[3].trim(),
      paymentMethod: `삼성카드(${m[1]})`,
    }),
  },
  // ── KB국민카드 ──────────────────────────────────────────────────────────
  // "[KB국민카드] (1234) 22,000원 교촌치킨 승인 25/07/01 12:00"
  {
    issuer: "KB국민카드",
    regex: /\[KB국민카드\]\s*\((\d+)\)\s*([\d,]+)원\s+(.+?)\s*승인\s*(\d{2}\/\d{2}\/\d{2}\s+\d{2}:\d{2})/,
    extract: (m) => ({
      type: "expense",
      amount: parseAmount(m[2]),
      merchant: m[3].trim(),
      paymentMethod: `KB국민카드(${m[1]})`,
    }),
  },
  // ── 현대카드 ────────────────────────────────────────────────────────────
  // "[현대카드] M카드 1,500원 승인 지하철 25.07.01 08:15"
  {
    issuer: "현대카드",
    regex: /\[현대카드\]\s*(.+?)\s+([\d,]+)원\s*승인\s+(.+?)\s+(\d{2}\.\d{2}\.\d{2}\s+\d{2}:\d{2})/,
    extract: (m) => ({
      type: "expense",
      amount: parseAmount(m[2]),
      merchant: m[3].trim(),
      paymentMethod: `현대카드(${m[1].trim()})`,
    }),
  },
  // ── 롯데카드 ────────────────────────────────────────────────────────────
  // "[롯데카드] 승인 18,900원 쿠팡 2025-07-01 11:00"
  {
    issuer: "롯데카드",
    regex: /\[롯데카드\]\s*승인\s*([\d,]+)원\s+(.+?)\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})/,
    extract: (m) => ({
      type: "expense",
      amount: parseAmount(m[1]),
      merchant: m[2].trim(),
      paymentMethod: "롯데카드",
    }),
  },
  // ── 우리카드 ────────────────────────────────────────────────────────────
  // "[우리카드] (5678) 6,500원 승인 스타벅스 07/01 09:00"
  {
    issuer: "우리카드",
    regex: /\[우리카드\]\s*\((\d+)\)\s*([\d,]+)원\s*승인\s+(.+?)\s+(\d{2}\/\d{2}\s+\d{2}:\d{2})/,
    extract: (m) => ({
      type: "expense",
      amount: parseAmount(m[2]),
      merchant: m[3].trim(),
      paymentMethod: `우리카드(${m[1]})`,
    }),
  },
  // ── NH농협카드 ──────────────────────────────────────────────────────────
  // "[NH농협카드] NH농협카드(3456) 4,200원 GS25 07/01 07:30"
  {
    issuer: "NH농협카드",
    regex: /\[NH농협카드\].*?\((\d+)\)\s*([\d,]+)원\s+(.+?)\s+(\d{2}\/\d{2}\s+\d{2}:\d{2})/,
    extract: (m) => ({
      type: "expense",
      amount: parseAmount(m[2]),
      merchant: m[3].trim(),
      paymentMethod: `NH농협카드(${m[1]})`,
    }),
  },
  // ── 하나카드 ────────────────────────────────────────────────────────────
  // "[하나카드] 승인 15,000원 CGV 25/07/01 19:00"
  {
    issuer: "하나카드",
    regex: /\[하나카드\]\s*승인\s*([\d,]+)원\s+(.+?)\s+(\d{2}\/\d{2}\/\d{2}\s+\d{2}:\d{2})/,
    extract: (m) => ({
      type: "expense",
      amount: parseAmount(m[1]),
      merchant: m[2].trim(),
      paymentMethod: "하나카드",
    }),
  },
  // ── 카카오페이 ──────────────────────────────────────────────────────────
  // "[카카오페이] 43,200원 결제 올리브영 07/01 15:22"
  {
    issuer: "카카오페이",
    regex: /\[카카오페이\]\s*([\d,]+)원\s*결제\s+(.+?)\s+(\d{2}\/\d{2}\s+\d{2}:\d{2})/,
    extract: (m) => ({
      type: "expense",
      amount: parseAmount(m[1]),
      merchant: m[2].trim(),
      paymentMethod: "카카오페이",
    }),
  },
  // ── 네이버페이 ──────────────────────────────────────────────────────────
  // "[네이버페이] 18,900원이 결제되었습니다. 쿠팡 07/01 11:00"
  {
    issuer: "네이버페이",
    regex: /\[네이버페이\]\s*([\d,]+)원이?\s*결제.+?[.。]\s+(.+?)\s+(\d{2}\/\d{2}\s+\d{2}:\d{2})/,
    extract: (m) => ({
      type: "expense",
      amount: parseAmount(m[1]),
      merchant: m[2].trim(),
      paymentMethod: "네이버페이",
    }),
  },
  // ── 토스페이 ────────────────────────────────────────────────────────────
  // "[토스] 6,500원 결제 스타벅스 07/01 09:00"
  {
    issuer: "토스",
    regex: /\[토스\]\s*([\d,]+)원\s*결제\s+(.+?)\s+(\d{2}\/\d{2}\s+\d{2}:\d{2})/,
    extract: (m) => ({
      type: "expense",
      amount: parseAmount(m[1]),
      merchant: m[2].trim(),
      paymentMethod: "토스페이",
    }),
  },
  // ── 은행 입금 공통 ──────────────────────────────────────────────────────
  // "[신한은행] 입금 2,800,000원 급여 25/07/25 09:00"
  {
    issuer: "은행입금",
    regex: /\[(.+?)\]\s*입금\s*([\d,]+)원\s+(.+?)\s+(\d{2}\/\d{2}\/\d{2}\s+\d{2}:\d{2})/,
    extract: (m) => ({
      type: "income",
      amount: parseAmount(m[2]),
      merchant: m[3].trim(),
      paymentMethod: m[1].trim(),
    }),
  },
  // ── 은행 출금 공통 ──────────────────────────────────────────────────────
  // "[우리은행] 출금 22,000원 교촌치킨 25/07/01 12:00"
  {
    issuer: "은행출금",
    regex: /\[(.+?)\]\s*출금\s*([\d,]+)원\s+(.+?)\s+(\d{2}\/\d{2}\/\d{2}\s+\d{2}:\d{2})/,
    extract: (m) => ({
      type: "expense",
      amount: parseAmount(m[2]),
      merchant: m[3].trim(),
      paymentMethod: m[1].trim(),
    }),
  },
];

export function parseNotification(text: string): ParsedNotification | null {
  for (const p of PATTERNS) {
    const m = text.match(p.regex);
    if (!m) continue;

    const partial = p.extract(m);
    if (!partial) continue;
    if (!partial.merchant || partial.amount <= 0) continue;

    // find date group — last capture group that looks like a date
    const dateRaw = m[m.length - 1];
    const occurredAt = parseKoreanDate(dateRaw) ?? new Date();

    return { ...partial, occurredAt };
  }
  return null;
}
