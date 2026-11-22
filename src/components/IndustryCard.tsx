import Link from "next/link";
import { companiesOf, industryTotals, median, type IndustryId } from "@/lib/data";
import { fmtYen, fmtMan, fmtMonthly } from "@/lib/format";
import { Sparkline } from "@/components/ui";

export default function IndustryCard({ id }: { id: IndustryId }) {
  const t = industryTotals(id);
  const ind = t.industry;
  const list = companiesOf(id);
  const salMed = median(list.map((c) => c.avgSalary));
  const startMed = median(list.map((c) => c.startingSalary));
  const withSal = list.filter((c) => c.avgSalary !== null);
  const topSal = [...withSal].sort((a, b) => (b.avgSalary as number) - (a.avgSalary as number))[0];
  const noData = withSal.length === 0;
  const partial = !noData && withSal.length < list.length;
  return (
    <Link
      href={`/industry/${id}/`}
      className="card card-accent group block overflow-hidden p-5 transition duration-300 hover:-translate-y-1"
      style={{ ["--accent" as string]: ind.color, ["--glow" as string]: ind.glow }}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full opacity-25 blur-3xl transition group-hover:opacity-45"
        style={{ background: ind.glow }}
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium tracking-[0.24em] text-ink-3">{ind.nameEn}</p>
          <h3 className="mt-0.5 flex items-center gap-2 text-lg font-bold">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: ind.color, boxShadow: `0 0 12px ${ind.glow}` }} aria-hidden />
            {ind.name}
          </h3>
          <p className="mt-1 text-xs text-ink-2">{ind.tagline}</p>
        </div>
        <span className="chip shrink-0">{t.count}社</span>
      </div>

      {noData ? (
        <div className="relative mt-5">
          <p className="text-xs text-ink-3">平均年収・業績</p>
          <p className="text-3xl font-bold tracking-tight text-ink-2">非公開</p>
          <p className="mt-2 text-xs leading-relaxed text-ink-3">
            日本で上場していないため有価証券報告書がなく、年収・業績は公開されていません。大学別の就職者数・世間ウケ・代表者を比べられます。
          </p>
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="掲載している会社">
            {list.map((c) => (
              <li key={c.code} className="chip">
                {c.short}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <>
          <div className="relative mt-5 grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-ink-3">平均年収（中央値）</p>
              <p className="text-3xl font-bold tracking-tight">{fmtMan(salMed)}</p>
            </div>
            <div>
              <p className="text-xs text-ink-3">大卒初任給（中央値）</p>
              <p className="text-3xl font-bold tracking-tight">{fmtMonthly(startMed)}</p>
            </div>
          </div>
          {partial && <p className="relative mt-1 text-[11px] text-ink-3">年収は有価証券報告書がある{withSal.length}社の中央値（外資の日本法人などは非公開）</p>}

          <dl className="relative mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-ink-3">業界規模（売上合計）</dt>
              <dd className="font-semibold">{fmtYen(t.revenue)}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-3">時価総額合計</dt>
              <dd className="font-semibold">{fmtYen(t.marketCap)}</dd>
            </div>
          </dl>

          <div className="relative mt-4">
            <p className="mb-1 text-[11px] text-ink-3">純利益合計の推移（直近5期）</p>
            <Sparkline values={t.netIncomeHistory} color={ind.color} />
          </div>
        </>
      )}

      <div className="relative mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs">
        <span className="text-ink-3">
          {topSal ? (
            <>
              平均年収トップ <span className="ml-1 font-semibold text-ink">{topSal.short}</span>
            </>
          ) : (
            <>就職者数・世間ウケ・代表者を比較</>
          )}
        </span>
        <span className="text-ink-2 transition group-hover:translate-x-1 group-hover:text-ink">業界を見る →</span>
      </div>
    </Link>
  );
}
