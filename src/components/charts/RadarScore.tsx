"use client";

import { useMemo } from "react";
import EChart from "@/components/EChart";
import { RADAR_AXES } from "@/lib/data";
import { T, tooltipBase, hexA, dot } from "@/lib/chartTheme";

export interface RadarSeries {
  name: string;
  color: string;
  values: number[];
  /** 平均などの参照系列は点線ではなく、細い無彩色で控えめに表示 */
  reference?: boolean;
}

/** 5軸の偏差値的スコア（全掲載企業29社の中でのパーセンタイル。100＝最上位） */
export default function RadarScore({ series, height = 360, ariaLabel }: { series: RadarSeries[]; height?: number; ariaLabel: string }) {
  const option = useMemo(
    () => ({
      tooltip: {
        ...tooltipBase,
        trigger: "item",
        formatter: (p: { name: string; value: number[]; color: string }) =>
          `${dot(p.color)}<b>${p.name}</b><br/>` +
          RADAR_AXES.map((a, i) => `${a.name}：${p.value[i]}<span style="color:${T.textMuted}">（${a.hint}）</span>`).join("<br/>"),
      },
      radar: {
        radius: "68%",
        center: ["50%", "54%"],
        indicator: RADAR_AXES.map((a) => ({ name: a.name, max: 100, min: 0 })),
        splitNumber: 4,
        axisName: { color: T.textSecondary, fontFamily: T.font, fontSize: 12 },
        splitLine: { lineStyle: { color: T.grid } },
        splitArea: { areaStyle: { color: ["rgba(255,255,255,0.015)", "rgba(255,255,255,0.03)"] } },
        axisLine: { lineStyle: { color: T.axis } },
      },
      series: [
        {
          type: "radar",
          symbol: "circle",
          symbolSize: 8,
          data: series.map((s) => ({
            name: s.name,
            value: s.values,
            lineStyle: {
              color: s.reference ? T.textMuted : s.color,
              width: s.reference ? 1.5 : 2,
              shadowBlur: s.reference ? 0 : 14,
              shadowColor: s.reference ? "transparent" : hexA(s.color, 0.8),
            },
            itemStyle: { color: s.reference ? T.textMuted : s.color, borderColor: T.surface, borderWidth: 2 },
            areaStyle: { color: s.reference ? "rgba(255,255,255,0.04)" : hexA(s.color, 0.14) },
          })),
          animationDuration: 900,
        },
      ],
    }),
    [series],
  );

  return <EChart option={option} height={height} ariaLabel={ariaLabel} notMerge />;
}
