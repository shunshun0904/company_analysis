import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ALL, DATA_META, companiesOf, getCompany, getIndustry, radarScores, rankIn, RADAR_AXES } from "@/lib/data";
import { fmtYen, fmtPct, fmtTimes, splitYen } from "@/lib/format";
import { RankBadge, SectionTitle } from "@/components/ui";
import HistoryBars from "@/components/charts/HistoryBars";
import RadarScore from "@/components/charts/RadarScore";
import PeerBars from "@/components/charts/PeerBars";

export const dynamicParams = false;

export function generateStaticParams() {
  return ALL.map((c) => ({ code: c.code }));
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  const c = getCompany(code);
  return { title: c ? `${c.name}（${c.code}）の業績・時価総額` : "企業" };
}

function niChange(prev: number, last: number): string {
  if (prev < 0 && last >= 0) return "黒字転換";
  if (prev >= 0 && last < 0) return "赤字転落";
  if (prev < 0 && last < 0) return "赤字継続";
  const pct = ((last - prev) / prev) * 100;
  return `前期比 ${pct >= 0 ? "+" : "−"}${Math.abs(pct).toFixed(1)}%`;
}

export default async function CompanyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const c = getCompany(code);
  if (!c) notFound();
  const ind = getIndustry(c.industry)!;
  const peers = companiesOf(c.industry);
  const style = { ["--accent" as string]: ind.color, ["--glow" as string]: ind.glow };
  const prevNi = c.history[c.history.length - 2]?.netIncome;
  const scores = radarScores(c);
  const avg = RADAR_AXES.map((_, i) => Math.round(peers.reduce((s, p) => s + radarScores(p)[i], 0) / peers.length));
  const hasRevHistory = c.history.filter((h) => h.revenue !== null).length >= 3;
  const mc = splitYen(c.marketCap);
  const others = [...peers].filter((p) => p.code !== c.code).sort((a, b) => b.marketCap - a.marketCap);

  const tiles = [
    { label: c.revenueLabel === "収益合計（金融費用控除後）" ? "収益合計（純額）" : c.revenueLabel, value: fmtYen(c.revenue) + (c.revenueApprox ? "*" : ""), sub: c.fiscalPeriod },
    {
      label: "純利益",
      value: fmtYen(c.netIncome),
      sub: prevNi !== undefined ? niChange(prevNi, c.netIncome) : c.fiscalPeriod,
      tone: c.netIncome < 0 ? "neg" : undefined,
    },
    { label: "純利益率", value: fmtPct(c.margin), sub: "純利益÷売上" },
    { label: "ROE", value: fmtPct(c.roe), sub: "純利益÷自己資本" },
    { label: "PER", value: fmtTimes(c.per), sub: c.per === null ? "赤字のため算出せず" : "時価総額÷純利益" },
    { label: "PBR", value: fmtTimes(c.pbr, 2), sub: "時価総額÷自己資本" },
  ];

  return (
    <>
      <nav className="pt-6 text-xs text-ink-3" aria-label="パンくずリスト">
        <Link href="/" className="hover:text-ink">ホーム</Link>
        <span className="mx-2">/</span>
        <Link href={`/industry/${ind.id}/`} className="hover:text-ink">{ind.name}</Link>
        <span className="mx-2">/</span>
        <span className="text-ink-2">{c.short}</span>
      </nav>

      <header className="relative pb-6 pt-6">
        <div className="pointer-events-none absolute -left-10 -top-6 h-56 w-56 rounded-full opacity-25 blur-3xl" style={{ background: ind.glow }} aria-hidden />
        <div className="relative flex flex-wrap items-center gap-2 text-xs text-ink-3">
          <Link href={`/industry/${ind.id}/`} className="chip hover:text-ink">
            <span className="h-2 w-2 rounded-full" style={{ background: ind.color }} aria-hidden />
            {ind.name}
          </Link>
          <span className="chip">証券コード {c.code}</span>
          <span className="chip">{c.fiscalPeriod}</span>
        </div>
        <h1 className="relative mt-3 text-3xl font-black tracking-tight sm:text-5xl">{c.name}</h1>
        <p className="relative mt-2 text-sm text-ink-2">{c.description}</p>
        <div className="relative mt-4 flex flex-wrap gap-2">
          <RankBadge rank={rankIn(peers, c, "marketCap")} label="時価総額" color={ind.color} />
          <RankBadge rank={rankIn(peers, c, "revenue")} label="売上" color={ind.color} />
          <RankBadge rank={rankIn(peers, c, "netIncome")} label="純利益" color={ind.color} />
          <RankBadge rank={rankIn(peers, c, "roe")} label="ROE" color={ind.color} />
        </div>
      </header>

      <section className="grid gap-3 lg:grid-cols-3">
        <div className="card card-accent p-5" style={style}>
          <p className="text-xs text-ink-3">時価総額</p>
          <p className="mt-1 flex items-baseline gap-1">
            <span className="text-5xl font-bold tracking-tight">{mc.value}</span>
            <span className="text-lg text-ink-2">{mc.unit}</span>
          </p>
          <p className="mt-2 text-xs text-ink-3">
            掲載{ALL.length}社中 {[...ALL].sort((a, b) => b.marketCap - a.marketCap).findIndex((x) => x.code === c.code) + 1}位
            {c.price ? ` ／ 株価 ${c.price.toLocaleString("ja-JP")}円` : ""}
          </p>
          <div className="glow-line mt-4" aria-hidden />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:col-span-2">
          {tiles.map((t) => (
            <div key={t.label} className="card p-4">
              <p className="text-xs text-ink-3">{t.label}</p>
              <p className={`mt-1 text-xl font-bold ${t.tone === "neg" ? "text-[#e66767]" : ""}`}>{t.value}</p>
              <p className="mt-0.5 text-[11px] text-ink-3">{t.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {c.notes.length > 0 && (
        <section className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-ink-2">
          <p className="mb-1 text-xs font-bold text-ink-3">ポイント・注記</p>
          <ul className="list-disc space-y-1 pl-5">
            {c.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <SectionTitle eyebrow="PERFORMANCE" title="業績の推移（直近5期）" accent={ind.color} />
        <div className={`grid gap-4 ${hasRevHistory ? "md:grid-cols-2" : ""}`}>
          {hasRevHistory && (
            <div className="card p-4 sm:p-5">
              <h3 className="text-sm font-bold">{c.revenueLabel}</h3>
              <HistoryBars code={c.code} metric="revenue" />
            </div>
          )}
          <div className="card p-4 sm:p-5">
            <h3 className="text-sm font-bold">純利益（親会社株主に帰属）</h3>
            <HistoryBars code={c.code} metric="netIncome" />
          </div>
        </div>
        {!hasRevHistory && (
          <p className="mt-2 text-xs text-ink-3">※ 金融機関の{c.revenueLabel}は最新期のみ掲載しています。</p>
        )}
      </section>

      <section className="mt-10 grid gap-4 lg:grid-cols-2">
        <div className="card p-4 sm:p-5">
          <SectionTitle
            eyebrow="5-AXIS SCORE"
            title="5軸スコア"
            lead={`掲載${ALL.length}社の中での位置（0〜100、100が最上位）。グレーは${ind.name}の平均。`}
            accent={ind.color}
          />
          <ul className="mb-1 flex gap-4 text-xs text-ink-2" aria-label="凡例">
            <li className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded" style={{ background: ind.color }} aria-hidden />
              {c.short}
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded bg-[#8b8a99]" aria-hidden />
              {ind.name}平均
            </li>
          </ul>
          <RadarScore
            series={[
              { name: `${ind.name}平均`, color: "#8b8a99", values: avg, reference: true },
              { name: c.short, color: ind.color, values: scores },
            ]}
            ariaLabel={`${c.short}の5軸スコア：${RADAR_AXES.map((a, i) => `${a.name}${scores[i]}`).join("、")}`}
          />
          <dl className="mt-2 grid grid-cols-5 gap-1 text-center text-[11px]">
            {RADAR_AXES.map((a, i) => (
              <div key={a.name}>
                <dt className="text-ink-3">{a.name}</dt>
                <dd className="text-base font-bold">{scores[i]}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="card p-4 sm:p-5">
          <SectionTitle eyebrow="PEERS" title="同業他社の中での位置" lead="自社のみ色付きで表示しています。" accent={ind.color} />
          <PeerBars code={c.code} />
        </div>
      </section>

      <section className="mt-10 flex flex-wrap items-center gap-3">
        <Link
          href={`/compare/?c=${c.code}${others[0] ? "," + others[0].code : ""}`}
          className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#0d0e19] shadow-[0_0_30px_-8px_rgba(255,255,255,.7)]"
        >
          {c.short}を他社と比較する →
        </Link>
        <Link href={`/industry/${ind.id}/`} className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-bold hover:bg-white/5">
          {ind.name}のランキングへ
        </Link>
      </section>

      <section className="mt-10">
        <p className="mb-3 text-xs text-ink-3">同じ業界の企業</p>
        <div className="flex flex-wrap gap-2">
          {others.map((o) => (
            <Link key={o.code} href={`/company/${o.code}/`} className="chip hover:text-ink">
              {o.short}
              <span className="text-ink-3">{fmtYen(o.marketCap)}</span>
            </Link>
          ))}
        </div>
        <p className="mt-6 text-xs leading-relaxed text-ink-3">
          {c.revenueApprox ? "* 億円単位の公表・報道値から換算。" : ""}
          財務は連結（{c.fiscalPeriod}まで）、時価総額は{DATA_META.marketCapAsOf}ベース。平均年収・従業員数は今後追加予定です。
        </p>
      </section>
    </>
  );
}
