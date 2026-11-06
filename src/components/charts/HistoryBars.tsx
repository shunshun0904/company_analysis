"use client";

import { useMemo } from "react";
import EChart from "@/components/EChart";
import { getCompany, getIndustry } from "@/lib/data";
import { T, tooltipBase, axisLabel, splitLine, hexA } from "@/lib/chartTheme";
import { fmtYen } from "@/lib/format";

/** 1社の5期推移（売上 or 純利益）。2つの指標は1つのグラフに重ねず、別々のグラフで表示する。 */
export default function HistoryBars({ code, metric, height = 280 }: { code: string; metric: "revenue" | "netIncome"; height?: number }) {
  const c = getCompany(code)!;
  const ind = getIndustry(c.industry)!;
  const option = useMemo(() => {
    const pts = c.history.map((h) => ({ fy: h.fy.replace(/^20(\d\d)年(\d+)月期$/, "$1/$2期"), full: h.fy, v: h[metric] }));
    const last = pts.length - 1;
    return {
      grid: { left: 8, right: 12, top: 30, bottom: 8, containLabel: true },
      tooltip: {
        ...tooltipBase,
        trigger: "axis",
        axisPointer: { type: "shadow", shadowStyle: { color: "rgba(255,255,255,0.04)" } },
        formatter: (ps: { dataIndex: number }[]) => {
          const p = pts[ps[0].dataIndex];
          return `<b>${p.full}</b><br/>${metric === "revenue" ? c.revenueLabel : "純利益"} ${p.v === null ? "—" : fmtYen(p.v)}`;
        },
      },
      xAxis: {
        type: "category",
        data: pts.map((p) => p.fy),
        axisLine: { lineStyle: { color: T.axis } },
        axisTick: { show: false },
        axisLabel,
      },
      yAxis: {
        type: "value",
        splitLine,
        axisLabel: { ...axisLabel, formatter: (v: number) => (Math.abs(v) >= 1 || v === 0 ? `${v}兆` : `${Math.round(v * 10000)}億`) },
      },
      series: [
        {
          type: "bar",
          barMaxWidth: 24,
          data: pts.map((p, i) =>
            p.v === null
              ? null
              : {
                  value: +(p.v / 1_000_000).toFixed(4),
                  itemStyle: {
                    color: i === last ? ind.color : hexA(ind.color, 0.45),
                    borderRadius: p.v >= 0 ? [4, 4, 0, 0] : [0, 0, 4, 4],
                    shadowBlur: i === last ? 16 : 0,
                    shadowColor: hexA(ind.glow, 0.6),
                  },
                  label: {
                    show: i === last || i === 0,
                    position: p.v >= 0 ? "top" : "bottom",
                    color: i === last ? T.textPrimary : T.textMuted,
                    fontFamily: T.font,
                    fontWeight: i === last ? 700 : 400,
                    fontSize: 11,
                    formatter: () => fmtYen(p.v as number),
                  },
                },
          ),
          animationDuration: 900,
        },
      ],
    };
  }, [c, ind, metric]);

  return <EChart option={option} height={height} ariaLabel={`${c.short}の${metric === "revenue" ? "売上" : "純利益"}の5期推移`} />;
}
