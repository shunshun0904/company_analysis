"use client";

import { useMemo } from "react";
import EChart from "@/components/EChart";
import { companiesOf, getIndustry, normUniv, type IndustryId } from "@/lib/data";
import { T, tooltipBase, axisLabel, hexA } from "@/lib/chartTheme";

/**
 * 業界 × 大学のヒートマップ（大学通信の上位掲載分）。
 * 色の濃さ＝就職者数（業界色の1色の明暗）。空欄＝上位に掲載なし（0人とは限らない）。
 */
export default function HiringHeatmap({ industry, univCount = 10 }: { industry: IndustryId; univCount?: number }) {
  const ind = getIndustry(industry)!;
  const { rows, cols, cells, max } = useMemo(() => {
    const entries = companiesOf(industry).flatMap((c) =>
      c.hiring
        .filter((h) => h.top.length > 0)
        .map((h) => ({ label: h.entity === c.short || h.entity === c.name ? c.short : `${c.short}（${h.entity}）`, top: h.top })),
    );
    const total = new Map<string, number>();
    for (const e of entries) for (const [u, n] of e.top) total.set(normUniv(u), (total.get(normUniv(u)) ?? 0) + n);
    const cols = [...total.entries()].sort((a, b) => b[1] - a[1]).slice(0, univCount).map(([u]) => u);
    const rows = entries.map((e) => e.label);
    const cells: [number, number, number][] = [];
    let max = 1;
    entries.forEach((e, y) => {
      for (const [u, n] of e.top) {
        const x = cols.indexOf(normUniv(u));
        if (x >= 0) {
          cells.push([x, y, n]);
          max = Math.max(max, n);
        }
      }
    });
    return { rows, cols, cells, max };
  }, [industry, univCount]);

  const option = useMemo(
    () => ({
      grid: { left: 8, right: 12, top: 8, bottom: 8, containLabel: true },
      tooltip: {
        ...tooltipBase,
        formatter: (p: { value: [number, number, number] }) =>
          `<b>${rows[p.value[1]]}</b><br/>${cols[p.value[0]].replace(/学$/, "")}：${p.value[2]}人`,
      },
      xAxis: {
        type: "category",
        data: cols.map((u) => u.replace(/大学$/, "大")),
        position: "bottom",
        axisTick: { show: false },
        axisLine: { lineStyle: { color: T.axis } },
        axisLabel: { ...axisLabel, color: T.textSecondary, rotate: 40, fontSize: 11 },
        splitArea: { show: false },
      },
      yAxis: {
        type: "category",
        data: rows,
        inverse: true,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: T.axis } },
        axisLabel: { ...axisLabel, color: T.textSecondary, fontSize: 11, width: 150, overflow: "truncate" },
      },
      visualMap: {
        min: 0,
        max,
        show: false,
        inRange: { color: [hexA(ind.color, 0.18), ind.color, ind.glow] },
      },
      series: [
        {
          type: "heatmap",
          data: cells,
          label: {
            show: true,
            color: "#ffffff",
            fontFamily: T.font,
            fontSize: 11,
            fontWeight: 600,
            textBorderColor: "rgba(0,0,0,0.45)",
            textBorderWidth: 2,
          },
          itemStyle: { borderColor: T.surface, borderWidth: 2, borderRadius: 4 },
          emphasis: { itemStyle: { shadowBlur: 12, shadowColor: ind.glow } },
        },
      ],
    }),
    [rows, cols, cells, max, ind],
  );

  if (rows.length === 0) return <p className="text-sm text-ink-3">この業界の大学別データは確認できませんでした。</p>;
  return (
    <EChart
      option={option}
      height={Math.max(200, rows.length * 34 + 80)}
      ariaLabel={`${ind.name}各社の大学別就職者数（上位掲載分）のヒートマップ`}
    />
  );
}
