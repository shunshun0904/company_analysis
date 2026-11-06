import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { INDUSTRIES, companiesOf, getIndustry, industryTotals, type IndustryId } from "@/lib/data";
import { fmtYen, fmtPct, splitYen } from "@/lib/format";
import { SectionTitle } from "@/components/ui";
import IndustryRanking from "@/components/charts/IndustryRanking";
import MarketCapTreemap from "@/components/charts/MarketCapTreemap";
import BubbleChart from "@/components/charts/BubbleChart";
import TrendChart from "@/components/charts/TrendChart";
import CompanyTable from "@/components/CompanyTable";

export const dynamicParams = false;

export function generateStaticParams() {
  return INDUSTRIES.map((i) => ({ id: i.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const ind = getIndustry(id);
  return { title: ind ? `${ind.name}業界ランキング` : "業界" };
}

export default async function IndustryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ind = getIndustry(id);
  if (!ind) notFound();
  const iid = ind.id as IndustryId;
  const t = industryTotals(iid);
  const list = companiesOf(iid);
  const equity = list.reduce((s, c) => s + c.equity, 0);
  const industryRoe = (t.netIncome / equity) * 100;
  const by = <K extends "marketCap" | "netIncome" | "roe" | "growth">(k: K) =>
    [...list].filter((c) => c[k] !== null).sort((a, b) => (b[k] as number) - (a[k] as number))[0];
  const highlights = [
    { label: "時価総額 No.1", c: by("marketCap"), v: fmtYen(by("marketCap").marketCap) },
    { label: "純利益 No.1", c: by("netIncome"), v: fmtYen(by("netIncome").netIncome) },
    { label: "ROE No.1", c: by("roe"), v: fmtPct(by("roe").roe) },
    {
      label: iid === "finance" ? "純利益成長 No.1" : "売上成長 No.1",
      c: by("growth"),
      v: `年率${fmtPct(by("growth").growth)}`,
    },
  ];
  const mc = splitYen(t.marketCap);
  const style = { ["--accent" as string]: ind.color, ["--glow" as string]: ind.glow };

  return (
    <>
      <nav className="pt-6 text-xs text-ink-3" aria-label="パンくずリスト">
        <Link href="/" className="hover:text-ink">ホーム</Link>
        <span className="mx-2">/</span>
        <span className="text-ink-2">{ind.name}</span>
      </nav>

      <header className="relative pb-6 pt-6">
        <div className="pointer-events-none absolute -left-10 -top-10 h-56 w-56 rounded-full opacity-25 blur-3xl" style={{ background: ind.glow }} aria-hidden />
        <p className="relative text-[11px] font-medium tracking-[0.28em] text-ink-3">{ind.nameEn}</p>
        <h1 className="relative mt-1 flex items-center gap-3 text-4xl font-black tracking-tight sm:text-5xl">
          <span className="h-4 w-4 rounded-full" style={{ background: ind.color, boxShadow: `0 0 18px ${ind.glow}` }} aria-hidden />
          {ind.name}
        </h1>
        <p className="relative mt-2 text-sm text-ink-2">{ind.tagline}（掲載{t.count}社）</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-4">
        <div className="card card-accent p-5 sm:col-span-2" style={style}>
          <p className="text-xs text-ink-3">時価総額合計</p>
          <p className="mt-1 flex items-baseline gap-1">
            <span className="text-5xl font-bold tracking-tight">{mc.value}</span>
            <span className="text-lg text-ink-2">{mc.unit}</span>
          </p>
          <div className="glow-line mt-4" aria-hidden />
        </div>
        <div className="card p-5">
          <p className="text-xs text-ink-3">業界規模（売上合計）</p>
          <p className="mt-1 text-2xl font-bold">{fmtYen(t.revenue)}</p>
          <p className="mt-1 text-[11px] text-ink-3">掲載企業の合計{iid === "finance" ? "（経常収益等）" : ""}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-ink-3">純利益合計 ／ 業界ROE</p>
          <p className="mt-1 text-2xl font-bold">{fmtYen(t.netIncome)}</p>
          <p className="mt-1 text-[11px] text-ink-3">ROE {fmtPct(industryRoe)}（合計純利益÷合計自己資本）</p>
        </div>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="業界のトップ企業">
        {highlights.map((h) => (
          <Link key={h.label} href={`/company/${h.c.code}/`} className="card group p-4 transition hover:border-white/20">
            <p className="text-[11px] text-ink-3">👑 {h.label}</p>
            <p className="mt-1 truncate text-lg font-bold group-hover:underline">{h.c.short}</p>
            <p className="text-sm text-ink-2">{h.v}</p>
          </Link>
        ))}
      </section>

      <section className="mt-10 grid gap-4 lg:grid-cols-5">
        <div className="card p-4 sm:p-5 lg:col-span-3">
          <SectionTitle eyebrow="RANKING" title="業界内ランキング" accent={ind.color} />
          <IndustryRanking industry={iid} />
        </div>
        <div className="card p-4 sm:p-5 lg:col-span-2">
          <SectionTitle eyebrow="SHARE" title="時価総額シェア" lead="面積が時価総額。掲載企業の中での割合です。" accent={ind.color} />
          <MarketCapTreemap industry={iid} height={400} />
        </div>
      </section>

      <section className="mt-10">
        <SectionTitle
          eyebrow="POSITIONING"
          title="規模 × 収益性マップ"
          lead={`横が${iid === "finance" ? "経常収益等" : "売上"}、縦が純利益率、円の大きさが時価総額。右上ほど「大きくて、よく稼ぐ」会社です。`}
          accent={ind.color}
        />
        <div className="card p-4 sm:p-5">
          <BubbleChart industry={iid} />
        </div>
      </section>

      <section className="mt-10">
        <SectionTitle eyebrow="TREND" title="5期の推移" lead="企業名を押すと、その会社の線が強調されます。" accent={ind.color} />
        <div className="card p-4 sm:p-5">
          <TrendChart industry={iid} />
        </div>
      </section>

      <section className="mt-10">
        <SectionTitle eyebrow="TABLE" title="指標一覧" lead="見出しを押すと並べ替えられます。" accent={ind.color} />
        <div className="card p-4 sm:p-5">
          <CompanyTable industry={iid} />
        </div>
      </section>

      <section className="mt-10">
        <SectionTitle eyebrow="COMPANIES" title="企業ページへ" accent={ind.color} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {[...list]
            .sort((a, b) => b.marketCap - a.marketCap)
            .map((c) => (
              <Link
                key={c.code}
                href={`/company/${c.code}/`}
                className="card card-accent group p-4 transition hover:-translate-y-0.5"
                style={style}
              >
                <p className="text-[11px] text-ink-3">{c.code}</p>
                <p className="truncate font-bold group-hover:underline">{c.short}</p>
                <p className="mt-2 text-xs text-ink-3">時価総額</p>
                <p className="text-sm font-semibold">{fmtYen(c.marketCap)}</p>
              </Link>
            ))}
        </div>
        <p className="mt-6 text-xs leading-relaxed text-ink-3">
          ※「業界規模」は掲載企業の合計であり、業界全体の市場規模ではありません。財務は連結・各社の直近期（{list[0].fiscalPeriod}ほか）。
        </p>
      </section>
    </>
  );
}
