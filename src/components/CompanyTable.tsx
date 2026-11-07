"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { companiesOf, getIndustry, type CompanyWithMetrics, type IndustryId } from "@/lib/data";
import { fmtYen, fmtPct, fmtMan, fmtMonthly, fmtAge, fmtYears, fmtPeople } from "@/lib/format";

type Col = { key: keyof CompanyWithMetrics; label: string; fmt: (c: CompanyWithMetrics) => string; asc?: boolean };

const COLS: Col[] = [
  { key: "avgSalary", label: "平均年収", fmt: (c) => fmtMan(c.avgSalary) + (c.workforce.holding ? "†" : "") },
  { key: "startingSalary", label: "初任給", fmt: (c) => fmtMonthly(c.startingSalary) },
  { key: "avgAge", label: "平均年齢", fmt: (c) => fmtAge(c.avgAge), asc: true },
  { key: "avgTenure", label: "勤続年数", fmt: (c) => fmtYears(c.avgTenure) },
  { key: "employees", label: "従業員数", fmt: (c) => fmtPeople(c.employees) },
  { key: "marketCap", label: "時価総額", fmt: (c) => fmtYen(c.marketCap) },
  { key: "revenue", label: "売上", fmt: (c) => fmtYen(c.revenue) + (c.revenueApprox ? "*" : "") },
  { key: "netIncome", label: "純利益", fmt: (c) => fmtYen(c.netIncome) },
  { key: "roe", label: "ROE", fmt: (c) => fmtPct(c.roe) },
];

/** チャートと同じ数値を表でも読めるようにする（並べ替え可） */
export default function CompanyTable({ industry }: { industry: IndustryId }) {
  const ind = getIndustry(industry)!;
  const [sort, setSort] = useState<{ key: keyof CompanyWithMetrics; dir: 1 | -1 }>({ key: "avgSalary", dir: -1 });
  const list = companiesOf(industry);
  const rows = useMemo(() => {
    const l = [...companiesOf(industry)];
    l.sort((a, b) => {
      const av = a[sort.key] as number | null;
      const bv = b[sort.key] as number | null;
      if (av === null) return 1;
      if (bv === null) return -1;
      return (av - bv) * sort.dir;
    });
    return l;
  }, [industry, sort]);

  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <table className="w-full min-w-[860px] border-collapse text-sm">
        <caption className="sr-only">{ind.name}の主要指標一覧</caption>
        <thead>
          <tr className="border-b border-white/10 text-left text-xs text-ink-3">
            <th scope="col" className="sticky left-0 bg-[#181a2b] py-2.5 pr-3 font-medium">企業</th>
            {COLS.map((col) => {
              const active = sort.key === col.key;
              return (
                <th key={String(col.key)} scope="col" className="py-2.5 pl-3 text-right font-medium" aria-sort={active ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
                  <button
                    className={`inline-flex items-center gap-1 whitespace-nowrap hover:text-ink ${active ? "text-ink" : ""}`}
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
              <th scope="row" className="sticky left-0 bg-[#181a2b] py-2.5 pr-3 text-left font-medium">
                <Link href={`/company/${c.code}/`} className="flex items-center gap-2 whitespace-nowrap hover:underline">
                  <span className="h-2 w-2 rounded-full" style={{ background: ind.color }} aria-hidden />
                  {c.short}
                </Link>
              </th>
              {COLS.map((col) => (
                <td key={String(col.key)} className={`whitespace-nowrap py-2.5 pl-3 text-right ${col.key === "netIncome" && c.netIncome < 0 ? "text-[#e66767]" : "text-ink-2"}`}>
                  {col.fmt(c)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs leading-relaxed text-ink-3">
        平均年収・平均年齢・勤続年数・従業員数は有価証券報告書の提出会社（単体）の値。
        {list.some((c) => c.workforce.holding) && " † は持株会社の値（本社の少人数の社員）。"}
        {list.some((c) => c.revenueApprox) && " * は億円単位の報道値から換算。"}
        初任給は就職サイトの掲載値で、年度・コースは企業ページに記載。
      </p>
    </div>
  );
}
