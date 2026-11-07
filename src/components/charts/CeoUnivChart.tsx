"use client";

import { useMemo } from "react";
import EChart from "@/components/EChart";
import { ALL, ceoUnivCounts, getCompany } from "@/lib/data";
import { T, tooltipBase, axisLabel, hexA } from "@/lib/chartTheme";

const COLOR = "#3987e5";

/** 社長の出身大学（確認できた人のみ）。1系列なので1色、ツールチップに会社名 */
export default function CeoUnivChart() {
  const data = useMemo(() => ceoUnivCounts(), []);
  const option = useMemo(
    () => ({
      grid: { left: 8, right: 40, top: 4, bottom: 4, containLabel: true },
      tooltip: {
        ...tooltipBase,
        formatter: (p: { dataIndex: number }) => {
          const d = data[p.dataIndex];
          return `<b>${d.univ}</b>（${d.codes.length}人）<br/>` + d.codes.map((code) => {
            const c = getCompany(code)!;
            return `${c.short}：${c.ceo.name}${c.ceo.weak ? "（報道1件）" : ""}`;
          }).join("<br/>");
        },
      },
      xAxis: { type: "value", show: false, max: Math.max(...data.map((d) => d.codes.length)) + 0.5 },
      yAxis: {
        type: "category",
        inverse: true,
        data: data.map((d) => d.univ),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: T.axis } },
        axisLabel: { ...axisLabel, color: T.textSecondary, fontSize: 12 },
      },
      series: [
        {
          type: "bar",
          barMaxWidth: 16,
          data: data.map((d) => d.codes.length),
          itemStyle: { color: COLOR, borderRadius: [0, 4, 4, 0], shadowBlur: 12, shadowColor: hexA(COLOR, 0.6) },
          label: {
            show: true,
            position: "right",
            color: T.textPrimary,
            fontFamily: T.font,
            fontWeight: 600,
            formatter: (p: { value: number }) => `${p.value}人`,
          },
          animationDuration: 900,
        },
      ],
    }),
    [data],
  );
  const unknown = ALL.filter((c) => !c.ceo.univ);
  return (
    <div>
      <EChart option={option} height={data.length * 30 + 20} ariaLabel="掲載企業の社長の出身大学（確認できた人のみ）" />
      <p className="mt-2 text-xs leading-relaxed text-ink-3">
        確認できた{ALL.length - unknown.length}人の内訳（大学院のみ判明の人は大学院の大学で集計）。
        未確認：{unknown.map((c) => c.short).join("、")}。
      </p>
    </div>
  );
}
