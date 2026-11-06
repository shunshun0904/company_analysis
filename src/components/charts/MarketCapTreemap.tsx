"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import EChart from "@/components/EChart";
import { ALL, INDUSTRIES, companiesOf, type IndustryId } from "@/lib/data";
import { T, tooltipBase, dot } from "@/lib/chartTheme";
import { fmtYen } from "@/lib/format";

interface Node {
  name: string;
  value: number;
  code?: string;
  industryName?: string;
  color?: string;
  children?: Node[];
  itemStyle?: Record<string, unknown>;
}

/**
 * 時価総額マップ。industry を渡すとその業界だけ、無ければ全業界を業界ごとにまとめて表示する。
 * タイルの面積＝時価総額。色は業界（識別）で、企業名と金額は常にラベルで併記する。
 */
export default function MarketCapTreemap({ industry, height = 460 }: { industry?: IndustryId; height?: number }) {
  const router = useRouter();
  const total = useMemo(
    () => (industry ? companiesOf(industry) : ALL).reduce((s, c) => s + c.marketCap, 0),
    [industry],
  );

  const option = useMemo(() => {
    const inds = industry ? INDUSTRIES.filter((i) => i.id === industry) : INDUSTRIES;
    const data: Node[] = inds.map((ind) => ({
      name: ind.name,
      value: companiesOf(ind.id).reduce((s, c) => s + c.marketCap, 0),
      color: ind.color,
      itemStyle: { color: ind.color },
      children: companiesOf(ind.id)
        .sort((a, b) => b.marketCap - a.marketCap)
        .map((c) => ({
          name: c.short,
          value: c.marketCap,
          code: c.code,
          industryName: ind.name,
          color: ind.color,
          itemStyle: { color: ind.color },
        })),
    }));
    const single = !!industry;
    return {
      tooltip: {
        ...tooltipBase,
        formatter: (p: { data: Node; treePathInfo: unknown[] }) => {
          const d = p.data;
          const share = ((d.value / total) * 100).toFixed(1);
          if (d.children) return `<b>${d.name}</b><br/>時価総額合計 ${fmtYen(d.value)}<br/><span style="color:${T.textMuted}">シェア ${share}%</span>`;
          return `${dot(d.color ?? "#fff")}<b>${d.name}</b>${single ? "" : `<br/><span style="color:${T.textMuted}">${d.industryName}</span>`}<br/>時価総額 ${fmtYen(d.value)}<br/><span style="color:${T.textMuted}">${single ? "業界内" : "掲載企業内"}シェア ${share}%</span>`;
        },
      },
      series: [
        {
          type: "treemap",
          roam: false,
          nodeClick: false,
          breadcrumb: { show: false },
          width: "100%",
          height: "100%",
          top: 0,
          left: 0,
          squareRatio: 0.9,
          data: single ? data[0].children : data,
          label: {
            show: true,
            fontFamily: T.font,
            color: "#ffffff",
            fontSize: 13,
            fontWeight: 700,
            lineHeight: 18,
            overflow: "truncate",
            formatter: (p: { data: Node }) => `${p.data.name}\n{v|${fmtYen(p.data.value)}}`,
            rich: { v: { fontSize: 11, fontWeight: 400, color: "rgba(255,255,255,0.85)", fontFamily: T.font } },
          },
          upperLabel: {
            show: !single,
            height: 26,
            color: T.textPrimary,
            fontFamily: T.font,
            fontWeight: 700,
            fontSize: 12,
            formatter: (p: { data: Node }) => `${p.data.name}  ${fmtYen(p.data.value)}`,
          },
          itemStyle: { borderColor: T.surface, borderWidth: 2, gapWidth: 2, borderRadius: 6 },
          // levels[0] はルート（表示しない）、[1] が業界、[2] が企業
          levels: single
            ? [
                { upperLabel: { show: false }, itemStyle: { borderWidth: 0, gapWidth: 2 } },
                { itemStyle: { borderColor: T.surface, borderWidth: 2, gapWidth: 2, borderRadius: 6 } },
              ]
            : [
                { upperLabel: { show: false }, itemStyle: { borderWidth: 0, gapWidth: 6 } },
                {
                  upperLabel: { show: true },
                  itemStyle: { borderColor: T.surface, borderWidth: 3, gapWidth: 2, borderRadius: 8 },
                },
                {
                  upperLabel: { show: false },
                  itemStyle: { borderColor: T.surface, borderWidth: 2, gapWidth: 2, borderRadius: 6 },
                },
              ],
          emphasis: { itemStyle: { shadowBlur: 24, shadowColor: "rgba(255,255,255,0.35)" } },
          animationDuration: 900,
        },
      ],
    };
  }, [industry, total]);

  return (
    <EChart
      option={option}
      height={height}
      ariaLabel={industry ? "業界内の時価総額シェアを面積で表したマップ" : "掲載全企業の時価総額を業界別に面積で表したマップ"}
      onItemClick={(p) => {
        const d = p.data as Node | undefined;
        if (d?.code) router.push(`/company/${d.code}/`);
      }}
    />
  );
}
