"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { companiesOf, getIndustry, type CompanyWithMetrics, type IndustryId } from "@/lib/data";
import { fmtYen, fmtPct, fmtTimes } from "@/lib/format";

type Col = { key: keyof CompanyWithMetrics; label: string; fmt: (c: CompanyWithMetrics) => string; asc?: boolean };

const COLS: Col[] = [
  { key: "marketCap", label: "時価総額", fmt: (c) => fmtYen(c.marketCap) },
  { key: "revenue", label: "売上", fmt: (c) => fmtYen(c.revenue) },
  { key: "netIncome", label: "純利益", fmt: (c) => fmtYen(c.netIncome) },
  { key: "margin", label: "純利益率", fmt: (c) => fmtPct(c.margin) },
  { key: "roe", label: "ROE", fmt: (c) => fmtPct(c.roe) },
  { key: "per", label: "PER", fmt: (c) => fmtTimes(c.per), asc: true },
  { key: "pbr", label: "PBR", fmt: (c) => fmtTimes(c.pbr, 2), asc: true },
];

/** チャートと同じ数値を表でも読めるようにする（並べ替え可） */
export default function CompanyTable({ industry }: { industry: IndustryId }) {
  const ind = getIndustry(industry)!;
  const [sort, setSort] = useState<{ key: keyof CompanyWithMetrics; dir: 1 | -1 }>({ key: "marketCap", dir: -1 });
  const rows = useMemo(() => {
    const list = [...companiesOf(industry)];
    list.sort((a, b) => {
      const av = a[sort.key] as number | null;
      const bv = b[sort.key] as number | null;
      if (av === null) return 1;
      if (bv === null) return -1;
      return (av - bv) * sort.dir;
    });
    return list;
  }, [industry, sort]);

  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <caption className="sr-only">{ind.name}の主要指標一覧</caption>
        <thead>
          <tr className="border-b border-white/10 text-left text-xs text-ink-3">
            <th scope="col" className="py-2.5 pr-3 font-medium">企業</th>
            {COLS.map((col) => {
              const active = sort.key === col.key;
              return (
                <th key={String(col.key)} scope="col" className="py-2.5 pl-3 text-right font-medium" aria-sort={active ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
                  <button
                    className={`inline-flex items-center gap-1 hover:text-ink ${active ? "text-ink" : ""}`}
                    onClick={() =>
                      setSort((s) => (s.key === col.key ? { key: col.key, dir: (s.dir * -1) as 1 | -1 } : { key: col.key, dir: col.asc ? 1 : -1 }))
                    }
                  >
                    {col.label}
                    <span aria-hidden className="text-[10px]">{active ? (sort.dir === 1 ? "▲" : "▼") : "↕"}</span>
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="tabular">
          {rows.map((c) => (
            <tr key={c.code} className="border-b border-white/5 transition hover:bg-white/[0.03]">
              <th scope="row" className="py-2.5 pr-3 text-left font-medium">
                <Link href={`/company/${c.code}/`} className="flex items-center gap-2 hover:underline">
                  <span className="h-2 w-2 rounded-full" style={{ background: ind.color }} aria-hidden />
                  {c.short}
                  <span className="text-xs font-normal text-ink-3">{c.code}</span>
                </Link>
              </th>
              {COLS.map((col) => (
                <td key={String(col.key)} className={`py-2.5 pl-3 text-right ${col.key === "netIncome" && c.netIncome < 0 ? "text-[#e66767]" : "text-ink-2"}`}>
                  {col.fmt(c)}
                  {col.key === "revenue" && c.revenueApprox && <span className="text-ink-3">*</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.some((c) => c.revenueApprox) && (
        <p className="mt-2 text-xs text-ink-3">* 億円単位の公表・報道値から換算</p>
      )}
    </div>
  );
}
