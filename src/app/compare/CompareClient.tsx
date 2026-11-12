"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ALL, INDUSTRIES, getCompany, getIndustry, radarScores, RADAR_AXES, type CompanyWithMetrics } from "@/lib/data";
import { COMPARE_COLORS } from "@/lib/chartTheme";
import { fmtYen, fmtPct, fmtMan, fmtMonthly, fmtAge, fmtYears, fmtPeople } from "@/lib/format";
import RadarScore from "@/components/charts/RadarScore";
import RankingBars, { type ValueFormat } from "@/components/charts/RankingBars";
import { MOTE_SURVEYS, SURVEYS, popOf } from "@/lib/popularity";

const DEFAULT = ["7203", "8058", "8306"];
const SLOTS = 3;

const METRICS: { key: keyof CompanyWithMetrics; label: string; format: ValueFormat }[] = [
  { key: "avgSalary", label: "平均年収（提出会社）", format: "man" },
  { key: "startingSalary", label: "大卒初任給（月給）", format: "monthly" },
  { key: "avgAge", label: "平均年齢", format: "age" },
  { key: "avgTenure", label: "平均勤続年数", format: "years" },
  { key: "marketCap", label: "時価総額", format: "yen" },
  { key: "netIncome", label: "純利益", format: "yen" },
];

export default function CompareClient() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // スロット（色の持ち主）ごとに企業を保持する。1枠を変えても他の枠の色は変わらない
  const slots: (string | null)[] = useMemo(() => {
    const raw = params.get("c");
    const codes = raw ? raw.split(",").filter((x) => getCompany(x)) : DEFAULT;
    return Array.from({ length: SLOTS }, (_, i) => (codes[i] === "-" ? null : codes[i] ?? null));
  }, [params]);

  const setSlot = (i: number, code: string | null) => {
    const next = [...slots];
    next[i] = code;
    const q = next.map((x) => x ?? "-").join(",");
    router.replace(`${pathname}?c=${q}`, { scroll: false });
  };

  const picked = slots
    .map((code, i) => (code ? { c: getCompany(code)!, color: COMPARE_COLORS[i], slot: i } : null))
    .filter((x): x is { c: CompanyWithMetrics; color: string; slot: number } => !!x);

  return (
    <div>
      <div className="grid gap-3 md:grid-cols-3">
        {slots.map((code, i) => {
          const c = code ? getCompany(code) : null;
          const ind = c ? getIndustry(c.industry) : null;
          return (
            <div key={i} className="card relative p-4" style={{ borderColor: c ? COMPARE_COLORS[i] + "88" : undefined }}>
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs text-ink-3">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: COMPARE_COLORS[i], boxShadow: `0 0 10px ${COMPARE_COLORS[i]}` }} aria-hidden />
                  比較枠 {i + 1}
                </span>
                {c && (
                  <button onClick={() => setSlot(i, null)} className="text-xs text-ink-3 hover:text-ink" aria-label={`比較枠${i + 1}を空にする`}>
                    ✕ 外す
                  </button>
                )}
              </div>
              <label className="sr-only" htmlFor={`slot-${i}`}>比較枠{i + 1}の企業</label>
              <select
                id={`slot-${i}`}
                value={code ?? ""}
                onChange={(e) => setSlot(i, e.target.value || null)}
                className="w-full rounded-xl border border-white/15 bg-[#0d0e19] px-3 py-2.5 text-sm text-ink outline-none focus:border-white/40"
              >
                <option value="">企業を選ぶ…</option>
                {INDUSTRIES.map((ind) => (
                  <optgroup key={ind.id} label={ind.name}>
                    {ALL.filter((x) => x.industry === ind.id).map((x) => (
                      <option key={x.code} value={x.code} disabled={slots.includes(x.code) && x.code !== code}>
                        {x.short}（{x.code}）
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {c && ind && (
                <div className="mt-3">
                  <Link href={`/company/${c.code}/`} className="text-lg font-bold hover:underline">{c.name}</Link>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-3">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: ind.color }} aria-hidden />
                    {ind.name} ／ {c.fiscalPeriod}
                  </p>
                  <p className="mt-2 text-xs text-ink-3">平均年収 ／ 初任給</p>
                  <p className="text-2xl font-bold">
                    {fmtMan(c.avgSalary)}
                    <span className="mx-1 text-base text-ink-3">／</span>
                    {fmtMonthly(c.startingSalary)}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {picked.length === 0 ? (
        <p className="card mt-6 p-8 text-center text-sm text-ink-2">比較したい企業を選んでください。</p>
      ) : (
        <>
          <div className="mt-6 grid gap-4 lg:grid-cols-5">
            <div className="card p-4 sm:p-5 lg:col-span-2">
              <h2 className="text-lg font-bold">5軸スコア</h2>
              <p className="mt-1 text-xs text-ink-2">掲載{ALL.length}社の中での位置（0〜100）。</p>
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2" aria-label="凡例">
                {picked.map((p) => (
                  <li key={p.c.code} className="flex items-center gap-1.5">
                    <span className="h-0.5 w-4 rounded" style={{ background: p.color }} aria-hidden />
                    {p.c.short}
                  </li>
                ))}
              </ul>
              <RadarScore
                series={picked.map((p) => ({ name: p.c.short, color: p.color, values: radarScores(p.c) }))}
                ariaLabel={`選んだ企業の5軸スコアの比較`}
              />
              <p className="text-[11px] leading-relaxed text-ink-3">
                {RADAR_AXES.map((a) => `${a.name}＝${a.hint}`).join("／")}
              </p>
            </div>
            <div className="card overflow-x-auto p-4 sm:p-5 lg:col-span-3">
              <h2 className="text-lg font-bold">数字で比べる</h2>
              <table className="mt-3 w-full min-w-[420px] text-sm">
                <caption className="sr-only">選んだ企業の主要指標</caption>
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs text-ink-3">
                    <th scope="col" className="py-2 pr-3 font-medium">指標</th>
                    {picked.map((p) => (
                      <th key={p.c.code} scope="col" className="py-2 pl-3 text-right font-medium">
                        <span className="inline-flex items-center gap-1.5 text-ink">
                          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} aria-hidden />
                          {p.c.short}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="tabular">
                  {[
                    { label: "平均年収", f: (c: CompanyWithMetrics) => fmtMan(c.avgSalary) + (c.workforce.holding ? "†" : ""), v: (c: CompanyWithMetrics) => c.avgSalary },
                    { label: "大卒初任給", f: (c: CompanyWithMetrics) => fmtMonthly(c.startingSalary), v: (c: CompanyWithMetrics) => c.startingSalary },
                    { label: "平均年齢", f: (c: CompanyWithMetrics) => fmtAge(c.avgAge), v: () => null },
                    { label: "平均勤続年数", f: (c: CompanyWithMetrics) => fmtYears(c.avgTenure), v: (c: CompanyWithMetrics) => c.avgTenure },
                    { label: "従業員数（単体）", f: (c: CompanyWithMetrics) => fmtPeople(c.employees), v: (c: CompanyWithMetrics) => c.employees },
                    { label: "社長の出身大学", f: (c: CompanyWithMetrics) => c.ceo.univ ?? "未確認", v: () => null },
                    ...[...SURVEYS, ...MOTE_SURVEYS].map((s) => ({
                      label: `${s.group === "mote" ? "モテ" : "世間ウケ"}：${s.tab}`,
                      f: (c: CompanyWithMetrics) => {
                        const r = popOf(c.code)[s.id];
                        return r.rank !== null ? `${r.rank}位` : "圏外";
                      },
                      v: () => null,
                    })),
                    { label: "時価総額", f: (c: CompanyWithMetrics) => fmtYen(c.marketCap), v: (c: CompanyWithMetrics) => c.marketCap },
                    { label: "売上", f: (c: CompanyWithMetrics) => fmtYen(c.revenue), v: (c: CompanyWithMetrics) => c.revenue },
                    { label: "純利益", f: (c: CompanyWithMetrics) => fmtYen(c.netIncome), v: (c: CompanyWithMetrics) => c.netIncome },
                    { label: "ROE", f: (c: CompanyWithMetrics) => fmtPct(c.roe), v: (c: CompanyWithMetrics) => c.roe },
                    {
                      label: "成長率（4年・年率）",
                      f: (c: CompanyWithMetrics) => `${fmtPct(c.growth)}${c.growthBasis === "netIncome" ? "（純利益）" : ""}`,
                      v: (c: CompanyWithMetrics) => c.growth,
                    },
                  ].map((row) => {
                    const vals = picked.map((p) => row.v(p.c));
                    const best = vals.every((x) => x === null) ? null : Math.max(...vals.filter((x): x is number => x !== null));
                    return (
                      <tr key={row.label} className="border-b border-white/5">
                        <th scope="row" className="py-2.5 pr-3 text-left text-xs font-normal text-ink-3">{row.label}</th>
                        {picked.map((p, i) => (
                          <td key={p.c.code} className={`py-2.5 pl-3 text-right ${vals[i] !== null && vals[i] === best && picked.length > 1 ? "font-bold text-ink" : "text-ink-2"}`}>
                            {vals[i] !== null && vals[i] === best && picked.length > 1 && <span className="mr-1" aria-label="最大">★</span>}
                            {row.f(p.c)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="mt-2 text-[11px] text-ink-3">★は選んだ企業の中で最も大きい値。†は持株会社（本社の少人数の社員）の値。決算期：{picked.map((p) => `${p.c.short} ${p.c.fiscalPeriod}`).join("、")}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {METRICS.map((m) => (
              <div key={String(m.key)} className="card p-4">
                <h3 className="text-sm font-bold">{m.label}</h3>
                <RankingBars
                  items={picked.map((p) => ({ code: p.c.code, label: p.c.short, value: p.c[m.key] as number, color: p.color }))}
                  format={m.format}
                  ariaLabel={`選んだ企業の${m.label}`}
                  rowHeight={44}
                  compact
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
