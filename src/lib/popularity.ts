import popJson from "@/data/popularity.json";
import { ALL, type CompanyWithMetrics } from "@/lib/data";

/** 世間ウケ・モテる会社：公開されている調査の順位（サイト独自の点数ではない） */
export type SurveyId = "marry" | "parent" | "bun" | "ri" | "todai" | "female" | "male" | "gokon";

export interface Survey {
  id: SurveyId;
  /** reputation=世間ウケ、mote=モテる会社 */
  group: "reputation" | "mote";
  /** 公表されている順位の範囲（「圏外」の意味） */
  depth: string;
  /** タブなどに出す短い名前 */
  tab: string;
  /** 誰が選んだか */
  who: string;
  name: string;
  publisher: string;
  published: string;
  period: string;
  target: string;
  sample: string;
  /** rate=回答率（％）、votes=得票数、rank=順位のみ公表（数値は非公表） */
  metric: "rate" | "votes" | "rank";
  top1: { name: string; value: number | null };
  url: string;
  pressUrl: string;
  note: string | null;
}

export interface PopRank {
  /** null = 公表された順位の範囲（Survey.depth）に入っていない */
  rank: number | null;
  value?: number;
  /** 調査上の名前が掲載企業名と違う場合（銀行・証券など主要子会社） */
  entity?: string;
  /** entity が持株会社の子会社（銀行・証券・保険の事業会社） */
  sub?: boolean;
  /** グループ会社の順位など補足 */
  group?: string;
}

const data = popJson as {
  surveys: Survey[];
  latestMarry: {
    name: string;
    published: string;
    period: string;
    sample: string;
    url: string;
    top: { rank: number; name: string; value: number; code: string | null }[];
  };
  latestByGender: {
    name: string;
    published: string;
    url: string;
    female: GenderTop[];
    male: GenderTop[];
  };
  ranks: Record<string, Partial<Record<SurveyId, PopRank>>>;
};

interface GenderTop {
  rank: number;
  name: string;
  value: number;
  code: string | null;
}

/** 世間ウケ（結婚相手・親・就活生） */
export const SURVEYS = data.surveys.filter((s) => s.group === "reputation");
/** モテる会社（女性・男性が選んだ、合コン） */
export const MOTE_SURVEYS = data.surveys.filter((s) => s.group === "mote");
export const LATEST_MARRY = data.latestMarry;
export const LATEST_BY_GENDER = data.latestByGender;

export function getSurvey(id: SurveyId): Survey {
  return data.surveys.find((s) => s.id === id)!;
}

/** 企業の調査ごとの順位（公表された範囲に入っていない調査は rank: null） */
export function popOf(code: string): Record<SurveyId, PopRank> {
  const r = data.ranks[code] ?? {};
  return Object.fromEntries(data.surveys.map((s) => [s.id, r[s.id] ?? { rank: null }])) as Record<SurveyId, PopRank>;
}

export function fmtPopValue(v: number, metric: Survey["metric"]): string {
  if (metric === "rank") return "";
  return metric === "rate" ? `${v.toFixed(1)}%` : `${v.toLocaleString("ja-JP")}票`;
}

/** 調査ごとに、公表された順位に入った掲載企業を順位順に（順位のみの調査は値なし） */
export function surveyRanking(id: SurveyId, list: CompanyWithMetrics[] = ALL) {
  const rankOnly = getSurvey(id).metric === "rank";
  return list
    .map((c) => ({ c, r: popOf(c.code)[id] }))
    .filter((x): x is { c: CompanyWithMetrics; r: PopRank & { rank: number } } => x.r.rank !== null && (rankOnly || x.r.value !== undefined))
    .sort((a, b) => a.r.rank - b.r.rank || a.c.code.localeCompare(b.c.code));
}
