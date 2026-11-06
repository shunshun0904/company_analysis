import Link from "next/link";
import { ALL, INDUSTRIES, DATA_META } from "@/lib/data";
import { fmtYen } from "@/lib/format";
import CountUp from "@/components/CountUp";
import IndustryCard from "@/components/IndustryCard";
import { SectionTitle } from "@/components/ui";
import MarketCapTreemap from "@/components/charts/MarketCapTreemap";
import OverallRanking from "@/components/charts/OverallRanking";
import RoeScatter from "@/components/charts/RoeScatter";
import IndustryScale from "@/components/charts/IndustryScale";

export default function Home() {
  const totalMc = ALL.reduce((s, c) => s + c.marketCap, 0);
  const totalRev = ALL.reduce((s, c) => s + c.revenue, 0);
  const totalNi = ALL.reduce((s, c) => s + c.netIncome, 0);
  const topMc = [...ALL].sort((a, b) => b.marketCap - a.marketCap)[0];
  const topNi = [...ALL].sort((a, b) => b.netIncome - a.netIncome)[0];
  const top2 = [...ALL].sort((a, b) => b.marketCap - a.marketCap).slice(0, 2);
  const top2Share = (((top2[0].marketCap + top2[1].marketCap) / totalMc) * 100).toFixed(1);

  return (
    <>
      {/* HERO */}
      <section className="relative pb-10 pt-10 sm:pt-16">
        <div className="rise">
          <span className="chip">
            <span className="pulse-glow h-1.5 w-1.5 rounded-full bg-[#3dff8a]" aria-hidden />
            2026年3月期決算 ／ 時価総額は{DATA_META.marketCapAsOf}
          </span>
          <h1 className="mt-5 text-[40px] font-black leading-[1.1] tracking-tight sm:text-6xl">
            数字で見る、
            <br />
            <span className="neon-text">業界のリアル。</span>
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-ink-2">
            IT・通信、総合商社、自動車、メガバンク・金融。就活で気になる{ALL.length}社の
            「規模」「稼ぐ力」「市場からの評価」を、ランキングとグラフでひと目で比べられます。
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="#industries"
              className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#0d0e19] shadow-[0_0_30px_-6px_rgba(92,225,255,.8)] transition hover:shadow-[0_0_40px_-4px_rgba(92,225,255,1)]"
            >
              業界ランキングを見る
            </a>
            <Link href="/compare/" className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-bold transition hover:border-white/50 hover:bg-white/5">
              企業を比較する →
            </Link>
          </div>
        </div>

        <div className="rise mt-10 grid gap-3 sm:grid-cols-3" style={{ animationDelay: "120ms" }}>
          <div className="card card-accent p-5 sm:col-span-2" style={{ ["--accent" as string]: "#5ce1ff", ["--glow" as string]: "#5ce1ff" }}>
            <p className="text-xs text-ink-3">掲載{ALL.length}社の時価総額合計</p>
            <p className="mt-1 flex items-baseline gap-2">
              <CountUp value={totalMc / 1_000_000} decimals={1} className="text-6xl font-bold tracking-tight sm:text-7xl" />
              <span className="text-xl text-ink-2">兆円</span>
            </p>
            <p className="mt-2 text-xs text-ink-3">
              最大は<span className="mx-1 font-semibold text-ink">{topMc.short}</span>の{fmtYen(topMc.marketCap)}。
              純利益トップは<span className="mx-1 font-semibold text-ink">{topNi.short}</span>の{fmtYen(topNi.netIncome)}。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-1">
            <div className="card p-4">
              <p className="text-xs text-ink-3">売上合計</p>
              <p className="mt-1 text-2xl font-bold">{fmtYen(totalRev)}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-ink-3">純利益合計</p>
              <p className="mt-1 text-2xl font-bold">{fmtYen(totalNi)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* INDUSTRIES */}
      <section id="industries" className="scroll-mt-24 py-8">
        <SectionTitle eyebrow="INDUSTRIES" title="4つの業界をのぞいてみる" lead="カードを選ぶと、業界内のランキング・シェア・推移を詳しく見られます。" />
        <div className="grid gap-4 sm:grid-cols-2">
          {INDUSTRIES.map((i) => (
            <IndustryCard key={i.id} id={i.id} />
          ))}
        </div>
      </section>

      {/* TREEMAP */}
      <section className="py-8">
        <SectionTitle
          eyebrow="MARKET CAP MAP"
          title="時価総額マップ"
          lead={`タイルの大きさが時価総額（株式市場がつけた会社の値段）。上位2社の${top2[0].short}と${top2[1].short}だけで、掲載${ALL.length}社合計の${top2Share}%を占めます。タイルを押すと企業ページへ。`}
        />
        <div className="card p-3 sm:p-4">
          <MarketCapTreemap height={520} />
        </div>
      </section>

      {/* RANKING */}
      <section className="py-8">
        <SectionTitle eyebrow="RANKING" title="全業界ランキング TOP10" lead="指標を切り替えると順位が入れ替わります。会社の「大きさ」と「稼ぐ力」は必ずしも一致しません。" />
        <div className="card p-4 sm:p-5">
          <OverallRanking />
        </div>
      </section>

      {/* SCALE */}
      <section className="py-8">
        <SectionTitle
          eyebrow="INDUSTRY SCALE"
          title="業界の規模くらべ"
          lead="掲載企業の合計で見た業界の大きさです（業界全体の市場規模ではありません）。金融の売上は経常収益等の合計です。"
        />
        <div className="grid gap-4 md:grid-cols-3">
          <IndustryScale metric="marketCap" title="時価総額合計" />
          <IndustryScale metric="revenue" title="売上合計（業界規模）" />
          <IndustryScale metric="netIncome" title="純利益合計" />
        </div>
      </section>

      {/* SCATTER */}
      <section className="py-8">
        <SectionTitle
          eyebrow="EARNING POWER"
          title="稼ぐ力 × 市場の評価"
          lead="右に行くほど時価総額が大きく、上に行くほど自己資本を効率よく利益に変えている（ROEが高い）会社です。凡例を押すと業界ごとに表示を切り替えられます。"
        />
        <div className="card p-4 sm:p-5">
          <RoeScatter />
        </div>
      </section>

      {/* CTA */}
      <section className="py-10">
        <div
          className="card card-accent relative overflow-hidden p-6 sm:p-10"
          style={{ ["--accent" as string]: "#ff7fb5", ["--glow" as string]: "#ff7fb5" }}
        >
          <div className="pointer-events-none absolute -bottom-24 -right-10 h-64 w-64 rounded-full bg-[#ff7fb5] opacity-20 blur-3xl" aria-hidden />
          <p className="text-[11px] tracking-[0.22em] text-ink-3">COMPARE</p>
          <h2 className="mt-1 text-2xl font-bold sm:text-3xl">気になる3社を、横に並べて比べよう。</h2>
          <p className="mt-2 max-w-xl text-sm text-ink-2">業界をまたいだ比較もOK。規模・市場評価・収益性・資本効率・成長性の5軸レーダーで違いが見えます。</p>
          <Link href="/compare/" className="mt-6 inline-block rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#0d0e19]">
            比較ページへ →
          </Link>
        </div>
      </section>
    </>
  );
}
