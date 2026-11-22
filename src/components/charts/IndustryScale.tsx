"use client";

import { useMemo } from "react";
import RankingBars from "./RankingBars";
import { INDUSTRIES, industryTotals } from "@/lib/data";

type Key = "revenue" | "marketCap" | "netIncome";

/** 業界合計の比較。指標ごとに1つずつ並べる（スモールマルチプル）ので軸は常に1本 */
export default function IndustryScale({ metric, title }: { metric: Key; title: string }) {
  const items = useMemo(
    () =>
      INDUSTRIES.map((i) => industryTotals(i.id))
        // 業績・時価総額がない業界（外資コンサル）は除く
        .filter((t) => t.finCount > 0 && t[metric] !== 0)
        .map((t) => ({ code: t.industry.id, label: t.industry.name, value: t[metric], color: t.industry.color }))
        .sort((a, b) => b.value - a.value),
    [metric],
  );
  return (
    <div className="card p-4">
      <h3 className="mb-1 text-sm font-bold">{title}</h3>
      <RankingBars items={items} format="yen" ariaLabel={`業界別の${title}`} rowHeight={40} linkToCompany={false} compact labelWidth={112} />
    </div>
  );
}
