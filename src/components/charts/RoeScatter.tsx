"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import EChart from "@/components/EChart";
import { ALL, INDUSTRIES } from "@/lib/data";
import { T, tooltipBase, axisLabel, splitLine, dot } from "@/lib/chartTheme";
import { fmtYen, fmtPct } from "@/lib/format";

/** 市場評価（時価総額・対数軸）× 稼ぐ力（ROE）の散布図。色＝業界、名前はラベル（重なる分は自動で非表示）。 */
export default function RoeScatter({ height = 440 }: { height?: number }) {
  const router = useRouter();
  const option = useMemo(
    () => ({
      grid: { left: 8, right: 24, top: 44, bottom: 30, containLabel: true },
      legend: {
        top: 0,
        left: 0,
        icon: "circle",
        itemWidth: 9,
        itemHeight: 9,
        itemGap: 16,
        textStyle: { color: T.textSecondary, fontFamily: T.font, fontSize: 12 },
      },
      tooltip: {
        ...tooltipBase,
        trigger: "item",
        formatter: (p: { data: { name: string; code: string; mc: number; roe: number; ni: number }; color: string; seriesName: string }) =>
          `${dot(p.color)}<b>${p.data.name}</b><br/><span style="color:${T.textMuted}">${p.seriesName}</span><br/>時価総額 ${fmtYen(p.data.mc)}<br/>ROE ${fmtPct(p.data.roe)}<br/>純利益 ${fmtYen(p.data.ni)}`,
      },
      xAxis: {
        type: "log",
        name: "時価総額（兆円・対数）",
        nameLocation: "middle",
        nameGap: 28,
        nameTextStyle: { color: T.textMuted, fontFamily: T.font, fontSize: 11 },
        min: 0.4,
        max: 60,
        splitLine,
        axisLine: { lineStyle: { color: T.axis } },
        axisLabel: { ...axisLabel, formatter: (v: number) => `${v}` },
      },
      yAxis: {
        type: "value",
        name: "ROE（%）",
        nameTextStyle: { color: T.textMuted, fontFamily: T.font, fontSize: 11, align: "left" },
        splitLine,
        axisLine: { show: true, lineStyle: { color: T.axis } },
        axisLabel: { ...axisLabel, formatter: (v: number) => `${v}%` },
      },
      series: INDUSTRIES.map((ind) => ({
        name: ind.name,
        type: "scatter",
        symbolSize: 13,
        itemStyle: { color: ind.color, borderColor: T.surface, borderWidth: 2, shadowBlur: 14, shadowColor: ind.glow },
        emphasis: { scale: 1.5, focus: "series" },
        label: {
          show: true,
          position: "right",
          distance: 6,
          formatter: (p: { data: { name: string } }) => p.data.name,
          color: T.textSecondary,
          fontFamily: T.font,
          fontSize: 11,
        },
        labelLayout: { hideOverlap: true },
        data: ALL.filter((c) => c.industry === ind.id).map((c) => ({
          name: c.short,
          code: c.code,
          mc: c.marketCap,
          roe: c.roe,
          ni: c.netIncome,
          value: [c.marketCap / 1_000_000, +c.roe.toFixed(2)],
        })),
      })),
    }),
    [],
  );

  return (
    <EChart
      option={option}
      height={height}
      ariaLabel="横軸に時価総額、縦軸にROEをとった全掲載企業の散布図"
      onItemClick={(p) => {
        const d = p.data as { code?: string } | undefined;
        if (d?.code) router.push(`/company/${d.code}/`);
      }}
    />
  );
}
