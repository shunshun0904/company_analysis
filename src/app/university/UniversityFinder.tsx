"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ALL, INDUSTRIES, getCompany, getIndustry, univIndex } from "@/lib/data";
import RankingBars from "@/components/charts/RankingBars";
import { IndustryDot } from "@/components/ui";

const DEFAULT_UNIV = "早稲田大学";

export default function UniversityFinder() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const index = useMemo(() => univIndex(), []);
  const options = useMemo(
    () =>
      [...index.entries()]
        .map(([u, rows]) => ({ u, total: rows.reduce((s, r) => s + r.count, 0), n: new Set(rows.map((r) => r.code)).size }))
        .sort((a, b) => b.n - a.n || b.total - a.total),
    [index],
  );
  const selected = params.get("u") && index.has(params.get("u")!) ? params.get("u")! : DEFAULT_UNIV;
  const rows = useMemo(() => [...(index.get(selected) ?? [])].sort((a, b) => b.count - a.count), [index, selected]);
  const ceos = ALL.filter((c) => c.ceo.univ === selected);
  const total = rows.reduce((s, r) => s + r.count, 0);

  return (
    <div>
      <div className="card card-accent p-4 sm:p-5" style={{ ["--accent" as string]: "#5ce1ff", ["--glow" as string]: "#5ce1ff" }}>
        <label htmlFor="univ" className="text-xs text-ink-3">
          あなたの大学を選んでください（掲載{ALL.length}社の大学別データに登場する{options.length}校）
        </label>
        <select
          id="univ"
          value={selected}
          onChange={(e) => router.replace(`${pathname}?u=${encodeURIComponent(e.target.value)}`, { scroll: false })}
          className="mt-2 w-full rounded-xl border border-white/15 bg-[#0d0e19] px-3 py-3 text-base text-ink outline-none focus:border-white/40"
        >
          {options.map((o) => (
            <option key={o.u} value={o.u}>
              {o.u}（{o.n}社に登場）
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-xs text-ink-3">就職者がいる掲載企業</p>
          <p className="mt-1 text-3xl font-bold">
            {new Set(rows.map((r) => r.code)).size}
            <span className="ml-1 text-sm font-normal text-ink-2">社</span>
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-ink-3">就職者数の合計（上位掲載分）</p>
          <p className="mt-1 text-3xl font-bold">
            {total.toLocaleString("ja-JP")}
            <span className="ml-1 text-sm font-normal text-ink-2">人</span>
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-ink-3">この大学出身の社長</p>
          <p className="mt-1 text-3xl font-bold">
            {ceos.length}
            <span className="ml-1 text-sm font-normal text-ink-2">人</span>
          </p>
        </div>
      </div>

      <div className="card mt-4 p-4 sm:p-5">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold">{selected}からの就職者数</h2>
          <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-2" aria-label="凡例">
            {INDUSTRIES.map((i) => (
              <li key={i.id} className="flex items-center gap-1.5">
                <IndustryDot color={i.color} />
                {i.name}
              </li>
            ))}
          </ul>
        </div>
        {rows.length > 0 ? (
          <RankingBars
            items={rows.map((r) => {
              const c = getCompany(r.code)!;
              const ind = getIndustry(c.industry)!;
              const label = r.entity === c.short || r.entity === c.name ? c.short : r.entity;
              return { code: r.code, label, value: r.count, color: ind.color, sub: `${ind.name}／${r.year}年春${r.univSide ? "（大学側の掲載）" : ""}` };
            })}
            format="people"
            ariaLabel={`${selected}から掲載企業への就職者数`}
            rowHeight={34}
          />
        ) : (
          <p className="text-sm text-ink-3">データがありません。</p>
        )}
        <p className="mt-2 text-xs leading-relaxed text-ink-3">
          出典：大学通信「企業ごとの大学別就職者数」（2025年春）。各社のページで<strong className="font-semibold text-ink-2">上位に掲載された大学のみ</strong>を集計しているため、
          ここに出ない会社にも就職者がいる可能性があります。グループ会社を含む場合があります。棒を押すと企業ページへ。
        </p>
      </div>

      {ceos.length > 0 && (
        <div className="card mt-4 p-4 sm:p-5">
          <h2 className="text-lg font-bold">{selected}出身の社長</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {ceos.map((c) => (
              <li key={c.code}>
                <Link href={`/company/${c.code}/`} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 px-3 py-2.5 hover:bg-white/5">
                  <span>
                    <span className="font-bold">{c.ceo.name}</span>
                    <span className="ml-2 text-xs text-ink-3">{c.short}</span>
                  </span>
                  <span className="text-right text-xs text-ink-3">{c.ceo.detail}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
