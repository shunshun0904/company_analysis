import popJson from "@/data/popularity.json";
import { ALL, type CompanyWithMetrics } from "@/lib/data";

/** 世間ウケ：公開されている調査の順位（サイト独自の点数ではない） */
export type SurveyId = "marry" | "parent" | "bun" | "ri";

export interface Survey {
  id: SurveyId;
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
  /** rate=回答率（％）、votes=得票数 */
  metric: "rate" | "votes";
  top1: { name: string; value: number };
  url: string;
  pressUrl: string;
  note: string | null;
}

export interface PopRank {
  /** null = 公表された上位100位に入っていない */
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
  ranks: Record<string, Partial<Record<SurveyId, PopRank>>>;
};

export const SURVEYS = data.surveys;
export const LATEST_MARRY = data.latestMarry;

export function getSurvey(id: SurveyId): Survey {
  return SURVEYS.find((s) => s.id === id)!;
}

/** 企業の調査ごとの順位（上位100位に入っていない調査は rank: null） */
export function popOf(code: string): Record<SurveyId, PopRank> {
  const r = data.ranks[code] ?? {};
  return {
    marry: r.marry ?? { rank: null },
    parent: r.parent ?? { rank: null },
    bun: r.bun ?? { rank: null },
    ri: r.ri ?? { rank: null },
  };
}

export function fmtPopValue(v: number, metric: Survey["metric"]): string {
  return metric === "rate" ? `${v.toFixed(1)}%` : `${v.toLocaleString("ja-JP")}票`;
}

/** 調査ごとに、上位100位に入った掲載企業を順位順に */
export function surveyRanking(id: SurveyId, list: CompanyWithMetrics[] = ALL) {
  return list
    .map((c) => ({ c, r: popOf(c.code)[id] }))
    .filter((x): x is { c: CompanyWithMetrics; r: PopRank & { rank: number; value: number } } => x.r.rank !== null && x.r.value !== undefined)
    .sort((a, b) => a.r.rank - b.r.rank || a.c.code.localeCompare(b.c.code));
}
