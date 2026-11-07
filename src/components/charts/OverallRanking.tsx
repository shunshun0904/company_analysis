"use client";

import { useMemo, useState } from "react";
import RankingBars, { type ValueFormat } from "./RankingBars";
import MetricTabs from "./MetricTabs";
import { ALL, ASCENDING, INDUSTRIES, getIndustry, type MetricKey } from "@/lib/data";
import { IndustryDot } from "@/components/ui";

const TABS: { key: MetricKey; label: string; format: ValueFormat; note: string }[] = [
  { key: "avgSalary", label: "平均年収", format: "man", note: "有価証券報告書の平均年間給与（提出会社）。金融の持株会社は本社社員の値で、銀行など主要子会社より高めに出ます。" },
  { key: "startingSalary", label: "初任給", format: "monthly", note: "就職サイト掲載の大卒初任給（月給）。年度・コース・手当の含み方が会社ごとに異なります。" },
  { key: "avgAge", label: "平均年齢が若い", format: "age", note: "有価証券報告書の平均年齢（提出会社）。" },
  { key: "marketCap", label: "時価総額", format: "yen", note: "株式市場がつけた会社の値段（会社の規模・注目度の目安）。" },
  { key: "netIncome", label: "純利益", format: "yen", note: "直近期の純利益（親会社株主に帰属）。" },
];

export default function OverallRanking({ top = 10 }: { top?: number }) {
  const [key, setKey] = useState<MetricKey>("avgSalary");
  const tab = TABS.find((t) => t.key === key)!;
  const items = useMemo(() => {
    const asc = ASCENDING.includes(key);
    return ALL.filter((c) => c[key] !== null)
      .sort((a, b) => (asc ? (a[key] as number) - (b[key] as number) : (b[key] as number) - (a[key] as number)))
      .slice(0, top)
      .map((c) => {
        const ind = getIndustry(c.industry)!;
        return { code: c.code, label: c.short, value: c[key] as number, color: ind.color, sub: ind.name };
      });
  }, [key, top]);

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
      <p className="mt-2 text-xs leading-relaxed text-ink-3">※ {tab.note}</p>
    </div>
  );
}
