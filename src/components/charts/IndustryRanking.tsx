"use client";

import { useMemo, useState } from "react";
import RankingBars, { type ValueFormat } from "./RankingBars";
import MetricTabs from "./MetricTabs";
import { ASCENDING, companiesOf, getIndustry, type IndustryId, type MetricKey } from "@/lib/data";

export const STUDENT_TABS: { key: MetricKey; label: string; format: ValueFormat; note?: string }[] = [
  { key: "avgSalary", label: "平均年収", format: "man", note: "有価証券報告書の平均年間給与（提出会社・賞与込み）。持株会社は少人数の本社社員の値です。" },
  { key: "startingSalary", label: "初任給", format: "monthly", note: "就職サイト掲載の大卒初任給（月給）。年度・コースが会社ごとに異なるため、企業ページで条件を確認してください。" },
  { key: "avgAge", label: "平均年齢（若い順）", format: "age", note: "有価証券報告書の平均年齢（提出会社）。" },
  { key: "avgTenure", label: "平均勤続年数", format: "years", note: "長いほど社員が定着している目安。持株会社は出向元の勤続を通算する場合があります。" },
  { key: "employees", label: "従業員数", format: "people", note: "提出会社（単体）の従業員数。グループ全体ではありません。" },
  { key: "marketCap", label: "時価総額", format: "yen", note: "株式市場がつけた会社の値段。会社の規模・注目度の目安です。" },
  { key: "netIncome", label: "純利益", format: "yen" },
  { key: "revenue", label: "売上", format: "yen" },
  { key: "roe", label: "ROE", format: "pct", note: "ROE＝純利益÷自己資本。お金を効率よく利益に変えている度合い。" },
];

export default function IndustryRanking({ industry }: { industry: IndustryId }) {
  const ind = getIndustry(industry)!;
  const [key, setKey] = useState<MetricKey>("avgSalary");
  const tab = STUDENT_TABS.find((t) => t.key === key)!;

  const items = useMemo(() => {
    const asc = ASCENDING.includes(key);
    const list = companiesOf(industry).filter((c) => c[key] !== null);
    list.sort((a, b) => (asc ? (a[key] as number) - (b[key] as number) : (b[key] as number) - (a[key] as number)));
    return list.map((c) => ({
      code: c.code,
      label: c.short,
      value: c[key] as number,
      color: ind.color,
      sub:
        key === "startingSalary" && c.startPay
          ? `${c.startPay.entity}／${c.startPay.year}`
          : (key === "avgSalary" || key === "avgAge" || key === "avgTenure" || key === "employees") && c.workforce.holding
            ? "持株会社（提出会社）の数値"
            : undefined,
    }));
  }, [industry, key, ind.color]);

  const missing = companiesOf(industry).filter((c) => c[key] === null);

  return (
    <div>
      <div className="mb-3">
        <MetricTabs tabs={STUDENT_TABS} value={key} onChange={setKey} accent={ind.color} label="ランキングの指標" />
      </div>
      <RankingBars items={items} format={tab.format} ariaLabel={`${ind.name}の${tab.label}ランキング`} />
      <p className="mt-2 text-xs leading-relaxed text-ink-3">
        {tab.note ?? "棒をクリックすると企業ページへ移動します。"}
        {missing.length > 0 && ` 掲載なし：${missing.map((c) => c.short).join("、")}（確認できず）。`}
        {industry === "finance" && key === "revenue" && " 金融は経常収益等を売上として扱っています。"}
      </p>
    </div>
  );
}
