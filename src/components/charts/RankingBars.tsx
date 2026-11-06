"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import EChart from "@/components/EChart";
import { T, tooltipBase, axisLabel, splitLine, hexA, dot } from "@/lib/chartTheme";
import { fmtYen, fmtPct, fmtTimes } from "@/lib/format";

export type ValueFormat = "yen" | "pct" | "times";

export interface BarItem {
  code: string;
  label: string;
  value: number;
  color: string;
  /** ツールチップに添える補足（業界名など） */
  sub?: string;
  /** 強調しない（同業比較で自社以外をグレーにする時など） */
  dim?: boolean;
}

export function formatValue(v: number, f: ValueFormat): string {
  if (f === "yen") return fmtYen(v);
  if (f === "pct") return fmtPct(v);
  return fmtTimes(v, Math.abs(v) < 10 ? 2 : 1);
}

interface Props {
  items: BarItem[];
  format: ValueFormat;
  ariaLabel: string;
  /** 並べ替え済みの items をそのまま上から表示する */
  rowHeight?: number;
  linkToCompany?: boolean;
  /** 小さなグラフ用：目盛りを省き、値は棒の先端ラベルで読む */
  compact?: boolean;
  labelWidth?: number;
}

export default function RankingBars({
  items,
  format,
  ariaLabel,
  rowHeight = 38,
  linkToCompany = true,
  compact = false,
  labelWidth = 96,
}: Props) {
  const router = useRouter();
  const hasNeg = items.some((i) => i.value < 0);
  const height = Math.max(compact ? 120 : 160, items.length * rowHeight + (compact ? 16 : 40));

  const option = useMemo(() => {
    const scale = format === "yen" ? 1_000_000 : 1;
    return {
      grid: { left: 8, right: 86, top: 8, bottom: 8, containLabel: true },
      tooltip: {
        ...tooltipBase,
        trigger: "item",
        formatter: (p: { dataIndex: number }) => {
          const it = items[p.dataIndex];
          return `${dot(it.color)}<b>${it.label}</b>${it.sub ? `<br/><span style="color:${T.textMuted}">${it.sub}</span>` : ""}<br/>${formatValue(it.value, format)}`;
        },
      },
      xAxis: {
        type: "value",
        splitLine: compact ? { show: false } : splitLine,
        axisLabel: {
          show: !compact,
          ...axisLabel,
          formatter: (v: number) => (format === "yen" ? `${v}兆` : format === "pct" ? `${v}%` : `${v}倍`),
        },
        axisLine: { show: hasNeg, lineStyle: { color: T.axis } },
      },
      yAxis: {
        type: "category",
        inverse: true,
        data: items.map((i) => i.label),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: T.axis } },
        axisLabel: { ...axisLabel, color: T.textSecondary, fontSize: 12, width: labelWidth, overflow: "truncate" },
      },
      series: [
        {
          type: "bar",
          barMaxWidth: 18,
          barCategoryGap: "40%",
          data: items.map((i) => ({
            value: +(i.value / scale).toFixed(4),
            itemStyle: {
              color: i.dim ? T.muted : i.color,
              borderRadius: i.value >= 0 ? [0, 4, 4, 0] : [4, 0, 0, 4],
              shadowBlur: i.dim ? 0 : 14,
              shadowColor: i.dim ? "transparent" : hexA(i.color, 0.55),
            },
            label: {
              show: true,
              position: i.value >= 0 ? "right" : "left",
              color: i.dim ? T.textMuted : T.textPrimary,
              fontFamily: T.font,
              fontSize: 12,
              fontWeight: i.dim ? 400 : 600,
              formatter: () => formatValue(i.value, format),
            },
          })),
          animationDuration: 900,
          animationEasing: "cubicOut",
          animationDurationUpdate: 700,
        },
      ],
    };
  }, [items, format, hasNeg, compact, labelWidth]);

  return (
    <EChart
      option={option}
      height={height}
      ariaLabel={ariaLabel}
      notMerge
      onItemClick={(p) => {
        if (!linkToCompany) return;
        const it = items.find((x) => x.label === p.name);
        if (it) router.push(`/company/${it.code}/`);
      }}
    />
  );
}
