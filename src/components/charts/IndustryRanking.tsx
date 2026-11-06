"use client";

import { useMemo, useState } from "react";
import RankingBars, { type ValueFormat } from "./RankingBars";
import MetricTabs from "./MetricTabs";
import { companiesOf, getIndustry, type IndustryId, type MetricKey } from "@/lib/data";

const TABS: { key: MetricKey; label: string; format: ValueFormat; note?: string }[] = [
  { key: "marketCap", label: "時価総額", format: "yen" },
  { key: "revenue", label: "売上", format: "yen" },
  { key: "netIncome", label: "純利益", format: "yen" },
  { key: "roe", label: "ROE", format: "pct", note: "ROE＝純利益÷期末自己資本（簡易計算）" },
  { key: "margin", label: "純利益率", format: "pct", note: "純利益率＝純利益÷売上" },
  { key: "per", label: "PER（割安順）", format: "times", note: "PER＝時価総額÷純利益。赤字企業は対象外。低いほど利益に対して割安" },
];

export default function IndustryRanking({ industry }: { industry: IndustryId }) {
  const ind = getIndustry(industry)!;
  const [key, setKey] = useState<MetricKey>("marketCap");
  const tab = TABS.find((t) => t.key === key)!;

  const items = useMemo(() => {
    const list = companiesOf(industry).filter((c) => c[key] !== null);
    list.sort((a, b) =>
      key === "per" ? (a.per as number) - (b.per as number) : (b[key] as number) - (a[key] as number),
    );
    return list.map((c) => ({ code: c.code, label: c.short, value: c[key] as number, color: ind.color }));
  }, [industry, key, ind.color]);

  return (
    <div>
      <div className="mb-3">
        <MetricTabs tabs={TABS} value={key} onChange={setKey} accent={ind.color} label="ランキングの指標" />
      </div>
      <RankingBars items={items} format={tab.format} ariaLabel={`${ind.name}の${tab.label}ランキング`} />
      <p className="mt-2 text-xs text-ink-3">
        {tab.note ?? "棒をクリックすると企業ページへ移動します。"}
        {industry === "finance" && (key === "revenue" || key === "margin") && " ※ 金融は経常収益等を売上として扱っています。"}
      </p>
    </div>
  );
}
