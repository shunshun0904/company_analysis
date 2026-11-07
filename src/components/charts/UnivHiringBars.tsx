"use client";

import RankingBars from "./RankingBars";
import { getCompany, getIndustry, normUniv } from "@/lib/data";

/** 1社の大学別就職者数（大学通信の上位掲載分）。グループ会社ごとに表示 */
export default function UnivHiringBars({ code }: { code: string }) {
  const c = getCompany(code)!;
  const ind = getIndustry(c.industry)!;
  if (c.hiring.length === 0) return <p className="text-sm text-ink-3">大学別の就職者数は確認できませんでした。</p>;
  return (
    <div className="grid gap-5">
      {c.hiring.map((h) => {
        const rows = h.top.length ? h.top : (h.univSide ?? []);
        return (
          <div key={h.entity}>
            <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
              <h4 className="text-sm font-bold">
                {h.entity}
                <span className="ml-2 text-xs font-normal text-ink-3">{h.year}年春の就職者数</span>
              </h4>
              {h.url && (
                <a href={h.url} target="_blank" rel="noopener noreferrer" className="text-xs text-ink-3 underline underline-offset-4 hover:text-ink">
                  出典：大学通信 ↗
                </a>
              )}
            </div>
            {rows.length > 0 ? (
              <RankingBars
                items={rows.map(([u, n]) => ({ code: c.code, label: normUniv(u).replace(/大学$/, "大"), value: n, color: ind.color, sub: h.entity }))}
                format="people"
                ariaLabel={`${h.entity}の大学別就職者数`}
                rowHeight={30}
                linkToCompany={false}
                compact
              />
            ) : null}
            {h.note && <p className="mt-1 text-xs text-ink-3">※ {h.note}</p>}
          </div>
        );
      })}
    </div>
  );
}
