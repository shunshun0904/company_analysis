"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import EChart from "@/components/EChart";
import MetricTabs from "./MetricTabs";
import { ALL, INDUSTRIES, getIndustry } from "@/lib/data";
import { SURVEYS, fmtPopValue, getSurvey, surveyRanking, type SurveyId } from "@/lib/popularity";
import { T, tooltipBase, axisLabel, hexA, dot } from "@/lib/chartTheme";
import { IndustryDot } from "@/components/ui";

interface Row {
  code: string | null;
  label: string;
  name: string;
  entity?: string;
  rank: number;
  value: number;
  color: string;
  reference?: boolean;
}

/**
 * 世間ウケ：調査ごとの順位（掲載企業のうち上位100位に入った会社）。
 * 棒の長さ＝その調査の回答率または得票数。先頭のグレーの棒は調査全体の1位（参考）。
 */
export default function PopularityRanking() {
  const router = useRouter();
  const [id, setId] = useState<SurveyId>("marry");
  const s = getSurvey(id);

  const rows = useMemo<Row[]>(() => {
    const list = surveyRanking(id).map(({ c, r }) => ({
      code: c.code,
      label: `${r.rank}位  ${c.short}`,
      name: c.name,
      entity: r.entity,
      rank: r.rank,
      value: r.value,
      color: getIndustry(c.industry)!.color,
    }));
    const ref: Row = {
      code: null,
      label: `1位  ${s.top1.name}`,
      name: `${s.top1.name}（調査全体の1位・参考）`,
      rank: 1,
      value: s.top1.value,
      color: T.muted,
      reference: true,
    };
    return list[0]?.rank === 1 ? list : [ref, ...list];
  }, [id, s]);

  const option = useMemo(
    () => ({
      grid: { left: 8, right: 64, top: 8, bottom: 8, containLabel: true },
      tooltip: {
        ...tooltipBase,
        trigger: "item",
        formatter: (p: { dataIndex: number }) => {
          const r = rows[p.dataIndex];
          return `${dot(r.color)}<b>${r.name}</b>${r.entity ? `<br/><span style="color:${T.textMuted}">調査上の名前：${r.entity}</span>` : ""}<br/>${r.rank}位・${fmtPopValue(r.value, s.metric)}`;
        },
      },
      xAxis: { type: "value", show: false },
      yAxis: {
        type: "category",
        inverse: true,
        data: rows.map((r) => r.label),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: T.axis } },
        axisLabel: {
          ...axisLabel,
          fontSize: 12,
          width: 128,
          overflow: "truncate",
          formatter: (v: string, i: number) => (rows[i]?.reference ? `{ref|${v}}` : `{co|${v}}`),
          rich: {
            co: { color: T.textSecondary, fontFamily: T.font, fontSize: 12 },
            ref: { color: T.textMuted, fontFamily: T.font, fontSize: 12 },
          },
        },
      },
      series: [
        {
          type: "bar",
          barMaxWidth: 18,
          barCategoryGap: "40%",
          data: rows.map((r) => ({
            value: r.value,
            itemStyle: {
              color: r.reference ? "transparent" : r.color,
              borderColor: r.reference ? T.textMuted : undefined,
              borderType: r.reference ? "dashed" : undefined,
              borderWidth: r.reference ? 1 : 0,
              borderRadius: [0, 4, 4, 0],
              shadowBlur: r.reference ? 0 : 14,
              shadowColor: r.reference ? "transparent" : hexA(r.color, 0.55),
            },
            label: {
              show: true,
              position: "right",
              color: r.reference ? T.textMuted : T.textPrimary,
              fontFamily: T.font,
              fontSize: 12,
              fontWeight: r.reference ? 400 : 600,
              formatter: () => fmtPopValue(r.value, s.metric),
            },
          })),
          animationDuration: 900,
          animationEasing: "cubicOut",
          animationDurationUpdate: 700,
        },
      ],
    }),
    [rows, s],
  );

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <MetricTabs tabs={SURVEYS.map((x) => ({ key: x.id, label: x.tab }))} value={id} onChange={setId} accent="#ff7fb5" label="調査の切り替え" />
        <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-2" aria-label="凡例">
          {INDUSTRIES.map((i) => (
            <li key={i.id} className="flex items-center gap-1.5">
              <IndustryDot color={i.color} />
              {i.name}
            </li>
          ))}
          <li className="flex items-center gap-1.5">
            <span className="h-2.5 w-3 rounded-sm border border-dashed border-[#8b8a99]" aria-hidden />
            調査全体の1位（参考）
          </li>
        </ul>
      </div>
      <p className="mb-2 text-xs text-ink-2">
        <b className="text-ink">{s.who}</b>が選んだ順位（{s.publisher}・{s.published}発表、{s.sample}）。棒は{s.metric === "rate" ? "回答率" : "得票数"}。掲載{ALL.length}社のうち上位100位に入った{rows.filter((r) => !r.reference).length}社を表示。
      </p>
      <EChart
        option={option}
        height={Math.max(180, rows.length * 34 + 24)}
        ariaLabel={`${s.name}での掲載企業の順位`}
        notMerge
        onItemClick={(p) => {
          const r = rows.find((x) => x.label === p.name);
          if (r?.code) router.push(`/company/${r.code}/`);
        }}
      />
      <p className="mt-2 text-xs leading-relaxed text-ink-3">
        ※ 出典：
        <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-ink">
          {s.name} ↗
        </a>
        。銀行・証券・保険は調査上の名前（三菱UFJ銀行など）の順位をグループの欄に載せています。{s.note}
      </p>
    </div>
  );
}
