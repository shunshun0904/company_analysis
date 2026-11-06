"use client";

import { useMemo, useState } from "react";
import RankingBars, { type ValueFormat } from "./RankingBars";
import MetricTabs from "./MetricTabs";
import { ALL, INDUSTRIES, getIndustry, type CompanyWithMetrics } from "@/lib/data";
import { IndustryDot } from "@/components/ui";

type Key = "marketCap" | "revenue" | "netIncome" | "roe";
const TABS: { key: Key; label: string; format: ValueFormat }[] = [
  { key: "marketCap", label: "時価総額", format: "yen" },
  { key: "netIncome", label: "純利益", format: "yen" },
  { key: "revenue", label: "売上", format: "yen" },
  { key: "roe", label: "ROE", format: "pct" },
];

export default function OverallRanking({ top = 10 }: { top?: number }) {
  const [key, setKey] = useState<Key>("marketCap");
  const tab = TABS.find((t) => t.key === key)!;
  const items = useMemo(
    () =>
      [...ALL]
        .sort((a, b) => (b[key] as number) - (a[key] as number))
        .slice(0, top)
        .map((c: CompanyWithMetrics) => {
          const ind = getIndustry(c.industry)!;
          return { code: c.code, label: c.short, value: c[key] as number, color: ind.color, sub: ind.name };
        }),
    [key, top],
  );

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <MetricTabs tabs={TABS} value={key} onChange={setKey} label="ランキングの指標" />
        <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-2" aria-label="凡例">
          {INDUSTRIES.map((i) => (
            <li key={i.id} className="flex items-center gap-1.5">
              <IndustryDot color={i.color} />
              {i.name}
            </li>
          ))}
        </ul>
      </div>
      <RankingBars items={items} format={tab.format} ariaLabel={`全業界の${tab.label}ランキング上位${top}社`} />
      {key === "revenue" && (
        <p className="mt-2 text-xs text-ink-3">※ 金融は経常収益等を売上として比較しています（会計上の定義が異なります）。</p>
      )}
    </div>
  );
}
