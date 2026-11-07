import companiesJson from "@/data/companies.json";
import meta from "@/data/meta.json";

export type IndustryId = "it" | "trading" | "auto" | "finance";

export interface Industry {
  id: IndustryId;
  name: string;
  nameEn: string;
  /** データ系列の色（色覚シミュレーションで検証済み・常にラベルと併用） */
  color: string;
  /** 装飾用（グロー・グラデーション）の明るいトーン。データの符号化には使わない */
  glow: string;
  tagline: string;
}

export interface HistoryPoint {
  fy: string;
  /** 百万円。金融は経常収益等の取得できた期のみ */
  revenue: number | null;
  /** 百万円（親会社株主に帰属する当期純利益） */
  netIncome: number;
}

export interface Company {
  code: string;
  name: string;
  short: string;
  industry: IndustryId;
  description: string;
  fiscalPeriod: string;
  revenueLabel: string;
  revenue: number;
  revenueApprox: boolean;
  netIncome: number;
  equity: number;
  marketCap: number;
  history: HistoryPoint[];
  notes: string[];
  workforce: Workforce;
  /** 初任給の掲載情報（metrics の startingSalary は金額のみ） */
  startPay: StartingSalary | null;
  startPayNote?: string | null;
  hiring: Hiring[];
  ceo: Ceo;
}

/** 有価証券報告書「従業員の状況」（提出会社） */
export interface Workforce {
  asOf: string;
  employees: number;
  avgAge: number;
  avgTenure: number;
  /** 円 */
  avgSalary: number;
  ageText: string | null;
  tenureText: string | null;
  /** 持株会社（提出会社）の数値か */
  holding: boolean;
  note: string | null;
  sub: { name: string; employees: number; age: number; tenure: number; salary: number } | null;
  edinetDoc: string;
}

/** 就職サイトに掲載された初任給（月給・円） */
export interface StartingSalary {
  entity: string;
  amount: number;
  amountMax: number | null;
  grad: number | null;
  year: string;
  course: string;
  url: string | null;
  weak: boolean | null;
  fixedOvertime: boolean | null;
  check: string | null;
}

/** 大学通信「企業ごとの大学別就職者数」 */
export interface Hiring {
  entity: string;
  year: number;
  url: string | null;
  top: [string, number][];
  note: string | null;
  univSide: [string, number][] | null;
}

export interface Ceo {
  name: string;
  title: string;
  univ: string | null;
  detail: string | null;
  src: string | null;
  url: string | null;
  weak: boolean | null;
  note: string | null;
}

export interface Metrics {
  roe: number;
  margin: number;
  avgSalary: number;
  startingSalary: number | null;
  avgAge: number;
  avgTenure: number;
  employees: number;
  /** 成長性：非金融は売上の4年CAGR、金融は純利益の4年CAGR（%） */
  growth: number | null;
  growthBasis: "revenue" | "netIncome";
}

export type CompanyWithMetrics = Company & Metrics;

export const INDUSTRIES: Industry[] = [
  {
    id: "it",
    name: "IT・通信",
    nameEn: "IT & TELECOM",
    color: "#1aa3c4",
    glow: "#5ce1ff",
    tagline: "通信インフラからITサービス、ネットまで",
  },
  {
    id: "trading",
    name: "総合商社",
    nameEn: "TRADING HOUSES",
    color: "#c98500",
    glow: "#ffc24d",
    tagline: "資源・食料・インフラを世界でつなぐ",
  },
  {
    id: "auto",
    name: "自動車",
    nameEn: "AUTOMOTIVE",
    color: "#d55181",
    glow: "#ff7fb5",
    tagline: "ものづくりの主役、EV・ソフトウェアへの転換期",
  },
  {
    id: "finance",
    name: "メガバンク・金融",
    nameEn: "FINANCE",
    color: "#008300",
    glow: "#3dff8a",
    tagline: "金利上昇を追い風に、大手銀行の利益が大きく伸びる",
  },
];

export const DATA_META = meta as {
  marketCapAsOf: string;
  updatedAt: string;
  sources: { label: string; detail: string }[];
  verified: { company: string; items: string; source: string }[];
};

export const COMPANIES: Company[] = companiesJson as Company[];

export function getIndustry(id: string): Industry | undefined {
  return INDUSTRIES.find((i) => i.id === id);
}

function cagr(first: number, last: number, years: number): number | null {
  if (first <= 0 || last <= 0 || years <= 0) return null;
  return (Math.pow(last / first, 1 / years) - 1) * 100;
}

export function withMetrics(c: Company): CompanyWithMetrics {
  const h = c.history;
  const firstRev = h[0]?.revenue;
  const lastRev = h[h.length - 1]?.revenue;
  const isFinance = c.industry === "finance";
  const growth = !isFinance && firstRev && lastRev
    ? cagr(firstRev, lastRev, h.length - 1)
    : cagr(h[0].netIncome, h[h.length - 1].netIncome, h.length - 1);
  return {
    ...c,
    roe: (c.netIncome / c.equity) * 100,
    margin: (c.netIncome / c.revenue) * 100,
    avgSalary: c.workforce.avgSalary,
    startingSalary: c.startPay?.amount ?? null,
    avgAge: c.workforce.avgAge,
    avgTenure: c.workforce.avgTenure,
    employees: c.workforce.employees,
    growth,
    growthBasis: isFinance ? "netIncome" : "revenue",
  };
}

export const ALL: CompanyWithMetrics[] = COMPANIES.map(withMetrics);

export function companiesOf(id: IndustryId): CompanyWithMetrics[] {
  return ALL.filter((c) => c.industry === id);
}

export function getCompany(code: string): CompanyWithMetrics | undefined {
  return ALL.find((c) => c.code === code);
}

export interface IndustryTotals {
  industry: Industry;
  count: number;
  revenue: number;
  marketCap: number;
  netIncome: number;
  /** 最新期を末尾にした5期分の純利益合計（決算月の違いは考慮せず、各社の直近5期を並べて合算） */
  netIncomeHistory: number[];
  top: CompanyWithMetrics;
}

export function industryTotals(id: IndustryId): IndustryTotals {
  const list = companiesOf(id);
  const n = Math.max(...list.map((c) => c.history.length));
  const hist = Array.from({ length: n }, (_, i) =>
    list.reduce((s, c) => s + (c.history[c.history.length - n + i]?.netIncome ?? 0), 0),
  );
  return {
    industry: getIndustry(id)!,
    count: list.length,
    revenue: list.reduce((s, c) => s + c.revenue, 0),
    marketCap: list.reduce((s, c) => s + c.marketCap, 0),
    netIncome: list.reduce((s, c) => s + c.netIncome, 0),
    netIncomeHistory: hist,
    top: [...list].sort((a, b) => b.marketCap - a.marketCap)[0],
  };
}

export type MetricKey =
  | "marketCap"
  | "revenue"
  | "netIncome"
  | "roe"
  | "margin"
  | "avgSalary"
  | "startingSalary"
  | "avgAge"
  | "avgTenure"
  | "employees";

export const METRIC_LABEL: Record<MetricKey, string> = {
  marketCap: "時価総額",
  revenue: "売上",
  netIncome: "純利益",
  roe: "ROE",
  margin: "純利益率",
  avgSalary: "平均年収",
  startingSalary: "初任給",
  avgAge: "平均年齢",
  avgTenure: "平均勤続年数",
  employees: "従業員数",
};

/** 低いほど上位とする指標（若い順） */
export const ASCENDING: MetricKey[] = ["avgAge"];

/** 業界内の順位（1始まり）。値が無い場合は null */
export function rankIn(list: CompanyWithMetrics[], c: CompanyWithMetrics, key: MetricKey): number | null {
  const val = (x: CompanyWithMetrics) => x[key] as number | null;
  if (val(c) === null) return null;
  const asc = ASCENDING.includes(key);
  const valid = list.filter((x) => val(x) !== null);
  const sorted = [...valid].sort((a, b) => (asc ? val(a)! - val(b)! : val(b)! - val(a)!));
  return sorted.findIndex((x) => x.code === c.code) + 1;
}

/** 大学名の表記ゆれをそろえる（大学通信の「早稲田大」→「早稲田大学」） */
export function normUniv(name: string): string {
  return name.endsWith("大") ? name + "学" : name;
}

export interface UnivHire {
  code: string;
  entity: string;
  count: number;
  url: string | null;
  year: number;
  /** 企業別ページではなく大学側のページの値 */
  univSide: boolean;
}

/** 大学 → 各社への就職者数（大学通信の上位掲載分のみ） */
export function univIndex(): Map<string, UnivHire[]> {
  const m = new Map<string, UnivHire[]>();
  for (const c of ALL) {
    for (const h of c.hiring) {
      const rows: [string, number, boolean][] = [
        ...h.top.map(([u, n]) => [u, n, false] as [string, number, boolean]),
        ...(h.univSide ?? []).map(([u, n]) => [u, n, true] as [string, number, boolean]),
      ];
      for (const [u, n, side] of rows) {
        const key = normUniv(u);
        const arr = m.get(key) ?? [];
        if (!arr.some((x) => x.code === c.code && x.entity === h.entity)) {
          arr.push({ code: c.code, entity: h.entity, count: n, url: h.url, year: h.year, univSide: side });
        }
        m.set(key, arr);
      }
    }
  }
  return m;
}

/** 社長の出身大学ごとの人数（確認できた人のみ） */
export function ceoUnivCounts(): { univ: string; codes: string[] }[] {
  const m = new Map<string, string[]>();
  for (const c of ALL) {
    if (!c.ceo.univ) continue;
    m.set(c.ceo.univ, [...(m.get(c.ceo.univ) ?? []), c.code]);
  }
  return [...m.entries()].map(([univ, codes]) => ({ univ, codes })).sort((a, b) => b.codes.length - a.codes.length);
}

/** 全掲載企業の中でのパーセンタイル（0-100）。レーダーチャート用 */
export function percentile(key: (c: CompanyWithMetrics) => number | null, c: CompanyWithMetrics): number {
  const v = key(c);
  const vals = ALL.map(key).filter((x): x is number => x !== null);
  if (v === null || vals.length < 2) return 0;
  const lower = vals.filter((x) => x < v).length;
  return Math.round((lower / (vals.length - 1)) * 100);
}

export const RADAR_AXES: { name: string; key: (c: CompanyWithMetrics) => number | null; hint: string }[] = [
  { name: "規模", key: (c) => c.revenue, hint: "売上（金融は経常収益等）" },
  { name: "市場評価", key: (c) => c.marketCap, hint: "時価総額" },
  { name: "収益性", key: (c) => c.margin, hint: "純利益率" },
  { name: "資本効率", key: (c) => c.roe, hint: "ROE" },
  { name: "成長性", key: (c) => c.growth, hint: "4年CAGR（非金融は売上・金融は純利益）" },
];

export function radarScores(c: CompanyWithMetrics): number[] {
  return RADAR_AXES.map((a) => percentile(a.key, c));
}

export function median(values: number[]): number | null {
  const v = values.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (v.length === 0) return null;
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}

/** 大学ごとの就職者数の合計（大学通信の上位掲載分・企業別ページの値のみ） */
export function univTotals(): { univ: string; total: number; companies: number }[] {
  return [...univIndex().entries()]
    .map(([univ, rows]) => {
      const r = rows.filter((x) => !x.univSide);
      return { univ, total: r.reduce((s, x) => s + x.count, 0), companies: new Set(r.map((x) => x.code)).size };
    })
    .filter((x) => x.total > 0)
    .sort((a, b) => b.total - a.total);
}
