import Link from "next/link";
import { ALL, INDUSTRIES, DATA_META, univTotals } from "@/lib/data";
import { fmtMonthly, fmtAge } from "@/lib/format";
import CountUp from "@/components/CountUp";
import IndustryCard from "@/components/IndustryCard";
import { SectionTitle } from "@/components/ui";
import MarketCapTreemap from "@/components/charts/MarketCapTreemap";
import OverallRanking from "@/components/charts/OverallRanking";
import SalaryAgeScatter from "@/components/charts/SalaryAgeScatter";
import IndustryScale from "@/components/charts/IndustryScale";
import CeoUnivChart from "@/components/charts/CeoUnivChart";
import UnivTotalsChart from "@/components/charts/UnivTotalsChart";
import PopularityRanking from "@/components/charts/PopularityRanking";
import { LATEST_BY_GENDER, LATEST_MARRY, MOTE_SURVEYS } from "@/lib/popularity";

export default function Home() {
  const topSalary = [...ALL].sort((a, b) => b.avgSalary - a.avgSalary)[0];
  const topStart = [...ALL].filter((c) => c.startingSalary !== null).sort((a, b) => b.startingSalary! - a.startingSalary!)[0];
  const youngest = [...ALL].sort((a, b) => a.avgAge - b.avgAge)[0];
  const topUniv = univTotals()[0];

  return (
    <>
      {/* HERO */}
      <section className="relative pb-10 pt-10 sm:pt-16">
        <div className="rise">
          <span className="chip" style={{ whiteSpace: "normal" }}>
            <span className="pulse-glow h-1.5 w-1.5 shrink-0 rounded-full bg-[#3dff8a]" aria-hidden />
            就活生のための企業研究 ／ 有価証券報告書（2026年3月期）・2027年卒の採用情報ほか
          </span>
          <h1 className="mt-5 text-[40px] font-black leading-[1.1] tracking-tight sm:text-6xl">
            数字で見る、
            <br />
            <span className="neon-text">会社のリアル。</span>
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-ink-2">
            年収・初任給・大学別の就職者数・社長の出身大学・世間ウケ・モテる会社から、業績や会社の規模まで。
            IT・通信、総合商社、自動車、メガバンク・金融の{ALL.length}社を、グラフでひと目で比べられます。
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/university/"
              className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#0d0e19] shadow-[0_0_30px_-6px_rgba(92,225,255,.8)] transition hover:shadow-[0_0_40px_-4px_rgba(92,225,255,1)]"
            >
              自分の大学から探す
            </Link>
            <a href="#ranking" className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-bold transition hover:border-white/50 hover:bg-white/5">
              年収・初任給ランキング
            </a>
            <a href="#reputation" className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-bold transition hover:border-white/50 hover:bg-white/5">
              世間ウケ
            </a>
            <a href="#mote" className="rounded-full border border-[#c084fc]/50 px-5 py-2.5 text-sm font-bold transition hover:border-[#c084fc] hover:bg-[#c084fc]/10">
              モテる会社
            </a>
            <Link href="/compare/" className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-bold transition hover:border-white/50 hover:bg-white/5">
              企業を比較する →
            </Link>
          </div>
        </div>

        <div className="rise mt-10 grid gap-3 sm:grid-cols-3" style={{ animationDelay: "120ms" }}>
          <Link
            href={`/company/${topSalary.code}/`}
            className="card card-accent block p-5 transition hover:-translate-y-0.5 sm:col-span-2"
            style={{ ["--accent" as string]: "#5ce1ff", ["--glow" as string]: "#5ce1ff" }}
          >
            <p className="text-xs text-ink-3">平均年収が最も高い会社 ／ {topSalary.short}</p>
            <p className="mt-1 flex items-baseline gap-2">
              <CountUp value={Math.round(topSalary.avgSalary / 10000)} className="text-6xl font-bold tracking-tight sm:text-7xl" />
              <span className="text-xl text-ink-2">万円</span>
            </p>
            <p className="mt-2 text-xs text-ink-3">
              平均年齢{fmtAge(topSalary.avgAge)}・有価証券報告書（{topSalary.fiscalPeriod}）の平均年間給与（賞与込み）
            </p>
          </Link>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-1">
            <Link href={`/company/${topStart.code}/`} className="card block p-4 hover:border-white/20">
              <p className="text-xs text-ink-3">初任給トップ</p>
              <p className="mt-1 text-2xl font-bold">{fmtMonthly(topStart.startingSalary)}</p>
              <p className="text-[11px] text-ink-3">
                {topStart.short}（{topStart.startPay ? topStart.startPay.year : ""}）
              </p>
            </Link>
            <Link href={`/company/${youngest.code}/`} className="card block p-4 hover:border-white/20">
              <p className="text-xs text-ink-3">平均年齢が最も若い</p>
              <p className="mt-1 text-2xl font-bold">{fmtAge(youngest.avgAge)}</p>
              <p className="text-[11px] text-ink-3">{youngest.short}</p>
            </Link>
          </div>
        </div>
      </section>

      {/* RANKING */}
      <section id="ranking" className="scroll-mt-24 py-8">
        <SectionTitle
          eyebrow="RANKING"
          title="全業界ランキング TOP10"
          lead="平均年収・初任給・平均年齢から、会社の規模や利益まで。タブで指標を切り替えられます。棒を押すと企業ページへ。"
        />
        <div className="card p-4 sm:p-5">
          <OverallRanking />
        </div>
      </section>

      {/* UNIVERSITY */}
      <section className="py-8">
        <SectionTitle
          eyebrow="UNIVERSITY"
          title="どの大学から入っている？"
          lead={`掲載${ALL.length}社（グループ会社を含む）への就職者数の合計が多い大学です。最多は${topUniv.univ}の${topUniv.total.toLocaleString("ja-JP")}人。大学通信の2025年春の調査で、各社の上位に掲載された大学のみを集計しています。`}
          accent="#199e70"
        />
        <div className="grid gap-4 lg:grid-cols-5">
          <div className="card p-4 sm:p-5 lg:col-span-3">
            <UnivTotalsChart />
          </div>
          <div className="card p-4 sm:p-5 lg:col-span-2">
            <h3 className="text-base font-bold">社長の出身大学</h3>
            <p className="mb-2 mt-1 text-xs text-ink-2">公式資料や報道で確認できた社長のみ。棒にカーソルを合わせると会社名が出ます。</p>
            <CeoUnivChart />
          </div>
        </div>
      </section>

      {/* REPUTATION */}
      <section id="reputation" className="scroll-mt-24 py-8">
        <SectionTitle
          eyebrow="REPUTATION"
          title="世間ウケがいい会社は？"
          lead="「この会社の人と結婚したい」「子どもに勤めてほしい」「就職したい」——結婚相手・親・就活生、3つの目線の人気ランキングです。いずれも公開されている調査の順位をそのまま載せており、サイト独自の点数ではありません。"
          accent="#ff7fb5"
        />
        <div className="grid gap-4 lg:grid-cols-5">
          <div className="card p-4 sm:p-5 lg:col-span-3">
            <PopularityRanking />
          </div>
          <div
            className="card card-accent p-4 sm:p-5 lg:col-span-2"
            style={{ ["--accent" as string]: "#ff7fb5", ["--glow" as string]: "#ff7fb5" }}
          >
            <p className="text-[11px] tracking-[0.18em] text-ink-3">LATEST</p>
            <h3 className="mt-1 text-base font-bold">最新版「結婚したい」ランキング TOP8</h3>
            <p className="mt-1 text-xs text-ink-2">
              {LATEST_MARRY.name}（リスクモンスター・{LATEST_MARRY.published}発表、{LATEST_MARRY.sample}）。トヨタ自動車が公務員を抑えて1位になりました。
            </p>
            <ol className="mt-3 space-y-1.5">
              {LATEST_MARRY.top.map((t) => {
                const mine = t.code !== null;
                const body = (
                  <>
                    <span className={`w-7 shrink-0 text-right font-bold tabular ${mine ? "text-ink" : "text-ink-3"}`}>{t.rank}位</span>
                    <span className={`flex-1 ${mine ? "font-bold text-ink" : "text-ink-2"}`}>{t.name}</span>
                    <span className="tabular text-xs text-ink-3">{t.value.toFixed(1)}%</span>
                  </>
                );
                return (
                  <li key={t.rank + t.name}>
                    {mine ? (
                      <Link href={`/company/${t.code}/`} className="flex items-center gap-3 rounded-lg border border-[#ff7fb5]/40 bg-[#ff7fb5]/10 px-2.5 py-1.5 text-sm hover:bg-[#ff7fb5]/20">
                        {body}
                      </Link>
                    ) : (
                      <div className="flex items-center gap-3 px-2.5 py-1.5 text-sm">{body}</div>
                    )}
                  </li>
                );
              })}
            </ol>
            <p className="mt-3 text-[11px] leading-relaxed text-ink-3">
              色付きは掲載企業。回答率は複数回答。9位以下は文字で公開されていないため、グラフの「結婚相手として」は全順位がわかる第15回の結果です。
              <a href={LATEST_MARRY.url} target="_blank" rel="noopener noreferrer" className="ml-1 underline underline-offset-4 hover:text-ink">
                出典 ↗
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* MOTE */}
      <section id="mote" className="scroll-mt-24 py-8">
        <SectionTitle
          eyebrow="MOTE"
          title="モテる会社はどこ？"
          lead="異性から「この会社の人と結婚したい」「合コンしたい」と思われている会社です。女性・男性それぞれが結婚相手の勤務先に選んだ会社（2025年調査）と、合コンしたい会社（2019年調査）の順位を、公開調査のまま載せています。"
          accent="#c084fc"
        />
        <div className="grid gap-4 lg:grid-cols-5">
          <div className="card p-4 sm:p-5 lg:col-span-3">
            <PopularityRanking surveys={MOTE_SURVEYS} accent="#c084fc" />
          </div>
          <div
            className="card card-accent p-4 sm:p-5 lg:col-span-2"
            style={{ ["--accent" as string]: "#c084fc", ["--glow" as string]: "#c084fc" }}
          >
            <p className="text-[11px] tracking-[0.18em] text-ink-3">LATEST</p>
            <h3 className="mt-1 text-base font-bold">最新版：男女別の上位</h3>
            <p className="mt-1 text-xs text-ink-2">
              {LATEST_BY_GENDER.name}（リスクモンスター・{LATEST_BY_GENDER.published}発表）。女性が選んだ1位はトヨタ自動車でした。
            </p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <GenderTop title="女性が選んだ" rows={LATEST_BY_GENDER.female} />
              <GenderTop title="男性が選んだ" rows={LATEST_BY_GENDER.male} />
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-ink-3">
              色付きは掲載企業。回答率は複数回答。男女別は上位4〜5位までしか文字で公開されていないため、グラフの「女性が選んだ」「男性が選んだ」は上位約20社がわかる第15回の結果です。
              <a href={LATEST_BY_GENDER.url} target="_blank" rel="noopener noreferrer" className="ml-1 underline underline-offset-4 hover:text-ink">
                出典 ↗
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* INDUSTRIES */}
      <section id="industries" className="scroll-mt-24 py-8">
        <SectionTitle eyebrow="INDUSTRIES" title="4つの業界をのぞいてみる" lead="カードを選ぶと、業界内の年収・初任給・大学別の就職者数・業績を詳しく見られます。" />
        <div className="grid gap-4 sm:grid-cols-2">
          {INDUSTRIES.map((i) => (
            <IndustryCard key={i.id} id={i.id} />
          ))}
        </div>
      </section>

      {/* SALARY x AGE */}
      <section className="py-8">
        <SectionTitle
          eyebrow="SALARY × AGE"
          title="平均年収 × 平均年齢マップ"
          lead="右に行くほど社員の平均年齢が高く、上に行くほど平均年収が高い会社です。同じ年収でも、左にある会社ほど若い社員が多いことになります。金融の持株会社は本社の少人数の社員の値なので注意。"
        />
        <div className="card p-4 sm:p-5">
          <SalaryAgeScatter />
        </div>
      </section>

      {/* SCALE */}
      <section className="py-8">
        <SectionTitle
          eyebrow="COMPANY SCALE"
          title="会社の規模マップ"
          lead="タイルの大きさが時価総額（株式市場がつけた会社の値段）。会社の大きさ・注目度の目安です。タイルを押すと企業ページへ。"
        />
        <div className="card p-3 sm:p-4">
          <MarketCapTreemap height={480} />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <IndustryScale metric="revenue" title="業界規模（売上合計）" />
          <IndustryScale metric="netIncome" title="純利益合計" />
          <IndustryScale metric="marketCap" title="時価総額合計" />
        </div>
        <p className="mt-2 text-xs text-ink-3">※ 業界規模は掲載企業の合計で、業界全体の市場規模ではありません。金融の売上は経常収益等の合計です。</p>
      </section>

      {/* CTA */}
      <section className="py-10">
        <div
          className="card card-accent relative overflow-hidden p-6 sm:p-10"
          style={{ ["--accent" as string]: "#ff7fb5", ["--glow" as string]: "#ff7fb5" }}
        >
          <div className="pointer-events-none absolute -bottom-24 -right-10 h-64 w-64 rounded-full bg-[#ff7fb5] opacity-20 blur-3xl" aria-hidden />
          <p className="text-[11px] tracking-[0.22em] text-ink-3">COMPARE</p>
          <h2 className="mt-1 text-2xl font-bold sm:text-3xl">志望企業を3社まで、横に並べて比べよう。</h2>
          <p className="mt-2 max-w-xl text-sm text-ink-2">年収・初任給・平均年齢・社長の出身大学から、業績まで。業界をまたいだ比較もできます。</p>
          <Link href="/compare/" className="mt-6 inline-block rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#0d0e19]">
            比較ページへ →
          </Link>
        </div>
        <p className="mt-6 text-xs text-ink-3">
          時価総額は{DATA_META.marketCapAsOf}。平均年収（有価証券報告書）・初任給（就職サイト）・大学別就職者数（大学通信）・社長の出身大学（公式資料・報道）の出典は「データについて」に記載しています。
        </p>
      </section>
    </>
  );
}

function GenderTop({ title, rows }: { title: string; rows: { rank: number; name: string; value: number; code: string | null }[] }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-bold text-ink-2">{title}</p>
      <ol className="space-y-1">
        {rows.map((t) => {
          const body = (
            <>
              <span className={`w-7 shrink-0 text-right font-bold tabular ${t.code ? "text-ink" : "text-ink-3"}`}>{t.rank}位</span>
              <span className={`flex-1 ${t.code ? "font-bold text-ink" : "text-ink-2"}`}>{t.name}</span>
              <span className="tabular text-xs text-ink-3">{t.value.toFixed(1)}%</span>
            </>
          );
          return (
            <li key={t.rank + t.name}>
              {t.code ? (
                <Link href={`/company/${t.code}/`} className="flex items-center gap-3 rounded-lg border border-[#c084fc]/40 bg-[#c084fc]/10 px-2.5 py-1.5 text-sm hover:bg-[#c084fc]/20">
                  {body}
                </Link>
              ) : (
                <div className="flex items-center gap-3 px-2.5 py-1.5 text-sm">{body}</div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
