import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { INDUSTRIES, companiesOf, getIndustry, industryTotals, median, type IndustryId } from "@/lib/data";
import { fmtYen, fmtPct, fmtMan, fmtMonthly, fmtAge } from "@/lib/format";
import { SectionTitle } from "@/components/ui";
import IndustryRanking from "@/components/charts/IndustryRanking";
import MarketCapTreemap from "@/components/charts/MarketCapTreemap";
import SalaryAgeScatter from "@/components/charts/SalaryAgeScatter";
import HiringHeatmap from "@/components/charts/HiringHeatmap";
import TrendChart from "@/components/charts/TrendChart";
import CompanyTable from "@/components/CompanyTable";
import PopularityMatrix from "@/components/PopularityMatrix";
import { MOTE_SURVEYS, SURVEYS } from "@/lib/popularity";

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
  const by = <K extends "marketCap" | "netIncome" | "avgSalary" | "startingSalary">(k: K) =>
    [...list].filter((c) => c[k] !== null).sort((a, b) => (b[k] as number) - (a[k] as number))[0];
  const youngest = [...list].sort((a, b) => a.avgAge - b.avgAge)[0];
  const highlights = [
    { label: "平均年収 No.1", c: by("avgSalary"), v: fmtMan(by("avgSalary").avgSalary) },
    { label: "初任給 No.1", c: by("startingSalary"), v: fmtMonthly(by("startingSalary").startingSalary) },
    { label: "平均年齢が最も若い", c: youngest, v: fmtAge(youngest.avgAge) },
    { label: "時価総額 No.1", c: by("marketCap"), v: fmtYen(by("marketCap").marketCap) },
  ];
  const salMed = median(list.map((c) => c.avgSalary));
  const startMed = median(list.map((c) => c.startingSalary).filter((x): x is number => x !== null));
  const holdingCount = list.filter((c) => c.workforce.holding).length;
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
          <p className="text-xs text-ink-3">平均年収（{t.count}社の中央値）</p>
          <p className="mt-1 text-5xl font-bold tracking-tight">{fmtMan(salMed)}</p>
          <p className="mt-2 text-[11px] text-ink-3">
            有価証券報告書の平均年間給与（提出会社）。{holdingCount > 0 ? `うち${holdingCount}社は持株会社の値。` : ""}
          </p>
          <div className="glow-line mt-3" aria-hidden />
        </div>
        <div className="card p-5">
          <p className="text-xs text-ink-3">大卒初任給（中央値）</p>
          <p className="mt-1 text-2xl font-bold">{fmtMonthly(startMed)}</p>
          <p className="mt-1 text-[11px] text-ink-3">就職サイト掲載の月給</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-ink-3">業界規模（売上合計）</p>
          <p className="mt-1 text-2xl font-bold">{fmtYen(t.revenue)}</p>
          <p className="mt-1 text-[11px] text-ink-3">
            純利益合計 {fmtYen(t.netIncome)}・業界ROE {fmtPct(industryRoe)}
          </p>
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
          <SectionTitle eyebrow="SCALE" title="会社の規模（時価総額）" lead="面積が時価総額。掲載企業の中での割合です。" accent={ind.color} />
          <MarketCapTreemap industry={iid} height={400} />
        </div>
      </section>

      <section className="mt-10">
        <SectionTitle
          eyebrow="UNIVERSITY"
          title="どの大学から入っている？"
          lead="大学通信の2025年春の就職者数（各社の上位に掲載された大学）。色が濃いほど人数が多く、空欄は上位に掲載がないことを示します（0人とは限りません）。"
          accent={ind.color}
        />
        <div className="card p-4 sm:p-5">
          <HiringHeatmap industry={iid} />
        </div>
      </section>

      <section className="mt-10">
        <SectionTitle
          eyebrow="REPUTATION"
          title="世間ウケ"
          lead="結婚相手（20〜59歳）・親世代・就活生（文系／理系）が選んだ人気ランキングでの順位。公開されている調査の順位で、サイト独自の点数ではありません。"
          accent={ind.color}
        />
        <div className="card p-4 sm:p-5">
          <PopularityMatrix companies={list} color={ind.color} />
          <p className="mt-1 text-[11px] leading-relaxed text-ink-3">
            出典：
            {SURVEYS.map((s, i) => (
              <span key={s.id}>
                {i > 0 && "／"}
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-ink">
                  {s.tab}：{s.name}（{s.publisher}・{s.published}発表）
                </a>
              </span>
            ))}
          </p>
        </div>
      </section>

      <section className="mt-10">
        <SectionTitle
          eyebrow="MOTE"
          title="モテる会社"
          lead="女性・男性それぞれが「結婚相手の勤務先」に選んだ順位（2025年調査）と、「合コンしたい会社」の順位（2019年調査）。公開されている調査の順位です。"
          accent={ind.color}
        />
        <div className="card p-4 sm:p-5">
          <PopularityMatrix companies={list} color={ind.color} surveys={MOTE_SURVEYS} caption="各社のモテる会社ランキングでの順位" />
          <p className="mt-1 text-[11px] leading-relaxed text-ink-3">
            出典：
            {MOTE_SURVEYS.map((s, i) => (
              <span key={s.id}>
                {i > 0 && "／"}
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-ink">
                  {s.tab}：{s.name}（{s.publisher}・{s.published}発表）
                </a>
              </span>
            ))}
          </p>
        </div>
      </section>

      <section className="mt-10">
        <SectionTitle
          eyebrow="SALARY × AGE"
          title="平均年収 × 平均年齢マップ"
          lead="横が平均年齢、縦が平均年収、円の大きさが従業員数（提出会社）。左上ほど「若いのに年収が高い」会社です。"
          accent={ind.color}
        />
        <div className="card p-4 sm:p-5">
          <SalaryAgeScatter industry={iid} />
        </div>
      </section>

      <section className="mt-10">
        <SectionTitle eyebrow="TREND" title="業績の推移（5期）" lead="会社が伸びているかを確認しましょう。企業名を押すと、その会社の線が強調されます。" accent={ind.color} />
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
            .sort((a, b) => b.avgSalary - a.avgSalary)
            .map((c) => (
              <Link
                key={c.code}
                href={`/company/${c.code}/`}
                className="card card-accent group p-4 transition hover:-translate-y-0.5"
                style={style}
              >
                <p className="text-[11px] text-ink-3">{c.code}</p>
                <p className="truncate font-bold group-hover:underline">{c.short}</p>
                <p className="mt-2 text-xs text-ink-3">平均年収 ／ 初任給</p>
                <p className="text-sm font-semibold">
                  {fmtMan(c.avgSalary)} ／ {fmtMonthly(c.startingSalary)}
                </p>
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
