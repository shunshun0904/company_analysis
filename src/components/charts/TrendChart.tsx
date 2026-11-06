"use client";

import { useMemo, useState } from "react";
import EChart from "@/components/EChart";
import MetricTabs from "./MetricTabs";
import { companiesOf, getIndustry, type IndustryId } from "@/lib/data";
import { T, tooltipBase, axisLabel, splitLine, hexA, dot } from "@/lib/chartTheme";
import { fmtYen } from "@/lib/format";

type Key = "revenue" | "netIncome";

/**
 * 業界内の5期推移。選んだ1社を業界色で強調し、他社はグレーで背景に置く（色を増やさず比較する）。
 * x軸は各社の直近5期を並べたもの。12月決算の企業は同じ並び順に揃えて表示する。
 */
export default function TrendChart({ industry, height = 380 }: { industry: IndustryId; height?: number }) {
  const ind = getIndustry(industry)!;
  const list = useMemo(() => [...companiesOf(industry)].sort((a, b) => b.marketCap - a.marketCap), [industry]);
  const isFinance = industry === "finance";
  const [key, setKey] = useState<Key>(isFinance ? "netIncome" : "revenue");
  const [focus, setFocus] = useState(list[0].code);

  const marchLabels = useMemo(() => {
    const ref = list.find((c) => c.fiscalPeriod.includes("3月期")) ?? list[0];
    return ref.history.map((h) => h.fy.replace(/^20(\d\d)年(\d+)月期$/, "$1/$2期"));
  }, [list]);
  const hasDec = list.some((c) => c.fiscalPeriod.includes("12月期"));

  const option = useMemo(() => {
    const series = list.map((c) => {
      const on = c.code === focus;
      const vals = c.history.map((h) => (h[key] === null ? null : +((h[key] as number) / 1_000_000).toFixed(4)));
      return {
        name: c.short,
        type: "line",
        data: vals,
        z: on ? 10 : 2,
        symbol: "circle",
        symbolSize: on ? 8 : 5,
        showSymbol: on,
        lineStyle: {
          width: on ? 2.5 : 1.5,
          color: on ? ind.color : T.muted,
          shadowBlur: on ? 14 : 0,
          shadowColor: on ? hexA(ind.glow, 0.7) : "transparent",
          cap: "round",
          join: "round",
        },
        itemStyle: { color: on ? ind.color : T.muted, borderColor: T.surface, borderWidth: 2 },
        areaStyle: on ? { color: hexA(ind.color, 0.1) } : undefined,
        endLabel: {
          show: on,
          formatter: () => `${c.short}`,
          color: T.textPrimary,
          fontFamily: T.font,
          fontWeight: 700,
          fontSize: 12,
        },
        emphasis: { disabled: true },
      };
    });
    return {
      grid: { left: 8, right: 90, top: 16, bottom: 8, containLabel: true },
      tooltip: {
        ...tooltipBase,
        trigger: "axis",
        axisPointer: { type: "line", lineStyle: { color: T.axis } },
        formatter: (ps: { seriesName: string; dataIndex: number; value: number | null }[]) => {
          const idx = ps[0]?.dataIndex ?? 0;
          const rows = [...ps]
            .filter((p) => p.value !== null && p.value !== undefined)
            .sort((a, b) => (b.value as number) - (a.value as number))
            .map((p) => {
              const c = list.find((x) => x.short === p.seriesName)!;
              const on = c.code === focus;
              const fy = c.history[idx]?.fy ?? "";
              return `<div style="display:flex;justify-content:space-between;gap:16px;${on ? "font-weight:700" : ""}"><span>${dot(on ? ind.color : T.muted)}${c.short}<span style="color:${T.textMuted};font-weight:400"> ${fy}</span></span><span>${fmtYen((p.value as number) * 1_000_000)}</span></div>`;
            })
            .join("");
          return rows || "データなし";
        },
      },
      xAxis: {
        type: "category",
        data: marchLabels,
        boundaryGap: false,
        axisLine: { lineStyle: { color: T.axis } },
        axisTick: { show: false },
        axisLabel,
      },
      yAxis: {
        type: "value",
        splitLine,
        axisLabel: { ...axisLabel, formatter: (v: number) => `${v}兆` },
      },
      series,
    };
  }, [list, key, focus, ind, marchLabels]);

  return (
    <div>
      <div className="mb-3 flex flex-col gap-2">
        {!isFinance && (
          <MetricTabs
            tabs={[
              { key: "revenue" as Key, label: "売上" },
              { key: "netIncome" as Key, label: "純利益" },
            ]}
            value={key}
            onChange={setKey}
            accent={ind.color}
            label="推移の指標"
          />
        )}
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="強調する企業">
          {list.map((c) => {
            const on = c.code === focus;
            return (
              <button
                key={c.code}
                onClick={() => setFocus(c.code)}
                aria-pressed={on}
                className="chip transition hover:text-ink"
                style={on ? { borderColor: ind.color, color: "#f0efec", background: hexA(ind.color, 0.16) } : undefined}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: on ? ind.color : T.muted }} aria-hidden />
                {c.short}
              </button>
            );
          })}
        </div>
      </div>
      <EChart option={option} height={height} ariaLabel={`${ind.name}各社の${key === "revenue" ? "売上" : "純利益"}の5期推移`} />
      <p className="mt-2 text-xs text-ink-3">
        {isFinance ? "金融は純利益（親会社株主に帰属）の推移を表示しています。" : "連結・各社の直近5期。"}
        {hasDec && " 楽天グループは12月決算のため、同じ並び順の各期（2021年12月期〜2025年12月期）を表示しています。"}
      </p>
    </div>
  );
}
