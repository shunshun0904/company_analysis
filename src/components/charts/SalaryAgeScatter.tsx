"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import EChart from "@/components/EChart";
import { ALL, INDUSTRIES, companiesOf, getIndustry, type IndustryId } from "@/lib/data";
import { T, tooltipBase, axisLabel, splitLine, hexA, dot } from "@/lib/chartTheme";
import { fmtMan, fmtAge, fmtYears, fmtPeople } from "@/lib/format";

/**
 * 横軸＝平均年齢、縦軸＝平均年収（有価証券報告書・提出会社）。
 * industry を渡すと1業界（円の大きさ＝従業員数）、無ければ全業界（色＝業界）。
 */
export default function SalaryAgeScatter({ industry, height = 440 }: { industry?: IndustryId; height?: number }) {
  const router = useRouter();
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const option = useMemo(() => {
    const inds = industry ? INDUSTRIES.filter((i) => i.id === industry) : INDUSTRIES;
    const pool = industry ? companiesOf(industry) : ALL;
    const maxEmp = Math.max(...pool.map((c) => c.employees));
    return {
      grid: { left: 8, right: 28, top: industry ? 30 : 48, bottom: 30, containLabel: true },
      legend: industry
        ? undefined
        : {
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
        formatter: (p: { data: { code: string }; color: string }) => {
          const c = ALL.find((x) => x.code === p.data.code)!;
          const w = c.workforce;
          return `${dot(getIndustry(c.industry)!.color)}<b>${c.short}</b>${w.holding ? `<br/><span style="color:${T.textMuted}">持株会社（提出会社）の数値</span>` : ""}<br/>平均年収 ${fmtMan(w.avgSalary)}<br/>平均年齢 ${fmtAge(w.avgAge)}<br/>平均勤続 ${fmtYears(w.avgTenure)}<br/>従業員数 ${fmtPeople(w.employees)}`;
        },
      },
      xAxis: {
        type: "value",
        name: "平均年齢（歳）",
        nameLocation: "middle",
        nameGap: 28,
        nameTextStyle: { color: T.textMuted, fontFamily: T.font, fontSize: 11 },
        scale: true,
        splitLine,
        axisLine: { lineStyle: { color: T.axis } },
        axisLabel: { ...axisLabel, formatter: (v: number) => `${v}` },
      },
      yAxis: {
        type: "value",
        name: "平均年収（万円）",
        nameTextStyle: { color: T.textMuted, fontFamily: T.font, fontSize: 11, align: "left" },
        scale: true,
        splitLine,
        axisLine: { show: true, lineStyle: { color: T.axis } },
        axisLabel: { ...axisLabel, formatter: (v: number) => v.toLocaleString("ja-JP") },
      },
      series: inds.map((ind) => ({
        name: ind.name,
        type: "scatter",
        data: companiesOf(ind.id).map((c) => ({
          name: c.short,
          code: c.code,
          value: [c.avgAge, Math.round(c.avgSalary / 10000)],
          symbolSize: industry ? (narrow ? 10 : 14) + Math.sqrt(c.employees / maxEmp) * (narrow ? 34 : 50) : 13,
        })),
        itemStyle: {
          color: industry ? hexA(ind.color, 0.72) : ind.color,
          borderColor: T.surface,
          borderWidth: 2,
          shadowBlur: 16,
          shadowColor: hexA(ind.glow, 0.55),
        },
        emphasis: { focus: "series", scale: 1.3 },
        label: {
          show: true,
          position: industry ? "top" : "right",
          distance: 5,
          formatter: (p: { name: string }) => p.name,
          color: industry ? T.textPrimary : T.textSecondary,
          fontFamily: T.font,
          fontSize: narrow ? 10 : 11,
        },
        labelLayout: { hideOverlap: true },
        animationDuration: 1000,
      })),
    };
  }, [industry, narrow]);

  return (
    <EChart
      option={option}
      height={height}
      ariaLabel={industry ? "業界内の平均年齢と平均年収の散布図" : "全掲載企業の平均年齢と平均年収の散布図"}
      onItemClick={(p) => {
        const d = p.data as { code?: string } | undefined;
        if (d?.code) router.push(`/company/${d.code}/`);
      }}
    />
  );
}
