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
  price: number | null;
  history: HistoryPoint[];
  notes: string[];
  avgSalary: number | null;
  employees: number | null;
}

export interface Metrics {
  roe: number;
  per: number | null;
  pbr: number;
  margin: number;
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
    per: c.netIncome > 0 ? c.marketCap / c.netIncome : null,
    pbr: c.marketCap / c.equity,
    margin: (c.netIncome / c.revenue) * 100,
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

export type MetricKey = "marketCap" | "revenue" | "netIncome" | "roe" | "margin" | "per";

export const METRIC_LABEL: Record<MetricKey, string> = {
  marketCap: "時価総額",
  revenue: "売上",
  netIncome: "純利益",
  roe: "ROE",
  margin: "純利益率",
  per: "PER",
};

/** 業界内の順位（1始まり）。PERは低い順、それ以外は高い順。値が無い場合は null */
export function rankIn(list: CompanyWithMetrics[], c: CompanyWithMetrics, key: MetricKey): number | null {
  const val = (x: CompanyWithMetrics) => x[key] as number | null;
  if (val(c) === null) return null;
  const valid = list.filter((x) => val(x) !== null);
  const sorted = [...valid].sort((a, b) =>
    key === "per" ? (val(a)! - val(b)!) : (val(b)! - val(a)!),
  );
  return sorted.findIndex((x) => x.code === c.code) + 1;
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
