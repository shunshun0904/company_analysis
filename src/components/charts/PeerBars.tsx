"use client";

import { useMemo, useState } from "react";
import RankingBars, { type ValueFormat } from "./RankingBars";
import MetricTabs from "./MetricTabs";
import { companiesOf, getCompany, getIndustry, type MetricKey } from "@/lib/data";

const TABS: { key: MetricKey; label: string; format: ValueFormat }[] = [
  { key: "marketCap", label: "時価総額", format: "yen" },
  { key: "revenue", label: "売上", format: "yen" },
  { key: "netIncome", label: "純利益", format: "yen" },
  { key: "roe", label: "ROE", format: "pct" },
];

/** 同業他社の中での位置。対象企業だけ業界色、他社はグレー（強調による比較） */
export default function PeerBars({ code }: { code: string }) {
  const c = getCompany(code)!;
  const ind = getIndustry(c.industry)!;
  const [key, setKey] = useState<MetricKey>("marketCap");
  const tab = TABS.find((t) => t.key === key)!;
  const items = useMemo(
    () =>
      [...companiesOf(c.industry)]
        .sort((a, b) => (b[key] as number) - (a[key] as number))
        .map((x) => ({ code: x.code, label: x.short, value: x[key] as number, color: ind.color, dim: x.code !== code })),
    [c.industry, key, code, ind.color],
  );
  return (
    <div>
      <div className="mb-3">
        <MetricTabs tabs={TABS} value={key} onChange={setKey} accent={ind.color} label="比較する指標" />
      </div>
      <RankingBars items={items} format={tab.format} ariaLabel={`${ind.name}の中での${c.short}の${tab.label}の位置`} rowHeight={34} />
    </div>
  );
}
