"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import EChart from "@/components/EChart";
import { companiesOf, getIndustry, type IndustryId } from "@/lib/data";
import { T, tooltipBase, axisLabel, splitLine, hexA, dot } from "@/lib/chartTheme";
import { fmtYen, fmtPct } from "@/lib/format";

/** 横軸＝売上、縦軸＝純利益率、円の大きさ＝時価総額 */
export default function BubbleChart({ industry, height = 420 }: { industry: IndustryId; height?: number }) {
  const router = useRouter();
  const ind = getIndustry(industry)!;
  const list = useMemo(() => companiesOf(industry), [industry]);
  // 狭い画面では円を小さくして重なりを減らす
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const option = useMemo(() => {
    const maxMc = Math.max(...list.map((c) => c.marketCap));
    return {
      grid: { left: 8, right: 36, top: 36, bottom: 30, containLabel: true },
      tooltip: {
        ...tooltipBase,
        trigger: "item",
        formatter: (p: { dataIndex: number }) => {
          const c = list[p.dataIndex];
          return `${dot(ind.color)}<b>${c.short}</b><br/>${c.revenueLabel} ${fmtYen(c.revenue)}<br/>純利益率 ${fmtPct(c.margin)}<br/>時価総額 ${fmtYen(c.marketCap)}`;
        },
      },
      xAxis: {
        type: "value",
        name: industry === "finance" ? "経常収益等（兆円）" : "売上（兆円）",
        nameLocation: "middle",
        nameGap: 28,
        nameTextStyle: { color: T.textMuted, fontFamily: T.font, fontSize: 11 },
        splitLine,
        min: 0,
        boundaryGap: ["0%", "10%"],
        axisLine: { lineStyle: { color: T.axis } },
        axisLabel: { ...axisLabel, formatter: (v: number) => `${+v.toFixed(2)}` },
      },
      yAxis: {
        type: "value",
        name: "純利益率（%）",
        nameTextStyle: { color: T.textMuted, fontFamily: T.font, fontSize: 11, align: "left" },
        splitLine,
        boundaryGap: ["12%", "22%"],
        axisLine: { show: true, lineStyle: { color: T.axis } },
        axisLabel: { ...axisLabel, formatter: (v: number) => `${+v.toFixed(1)}%` },
      },
      series: [
        {
          type: "scatter",
          data: list.map((c) => ({
            name: c.short,
            value: [+(c.revenue / 1_000_000).toFixed(3), +c.margin.toFixed(2)],
            symbolSize: (narrow ? 10 : 14) + Math.sqrt(c.marketCap / maxMc) * (narrow ? 34 : 58),
          })),
          itemStyle: {
            color: hexA(ind.color, 0.72),
            borderColor: T.surface,
            borderWidth: 2,
            shadowBlur: 20,
            shadowColor: hexA(ind.glow, 0.55),
          },
          emphasis: { itemStyle: { color: ind.color } },
          label: {
            show: true,
            position: "top",
            distance: 4,
            fontSize: narrow ? 11 : 12,
            formatter: (p: { name: string }) => p.name,
            color: T.textPrimary,
            fontFamily: T.font,
          },
          labelLayout: { hideOverlap: true },
          animationDuration: 1000,
        },
      ],
    };
  }, [list, ind, industry, narrow]);

  return (
    <EChart
      option={option}
      height={height}
      ariaLabel={`${ind.name}の売上と純利益率、時価総額のバブルチャート`}
      onItemClick={(p) => {
        const c = list.find((x) => x.short === p.name);
        if (c) router.push(`/company/${c.code}/`);
      }}
    />
  );
}
