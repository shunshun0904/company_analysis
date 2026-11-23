import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { INDUSTRIES, codeShort, companiesOf, getIndustry, industryTotals, median, normUniv, type IndustryId } from "@/lib/data";
import { fmtYen, fmtPct, fmtMan, fmtMonthly, fmtAge } from "@/lib/format";
import { SectionTitle } from "@/components/ui";
import IndustryRanking from "@/components/charts/IndustryRanking";
import MarketCapTreemap from "@/components/charts/MarketCapTreemap";
import SalaryAgeScatter from "@/components/charts/SalaryAgeScatter";
import HiringHeatmap from "@/components/charts/HiringHeatmap";
import TrendChart from "@/components/charts/TrendChart";
import CompanyTable from "@/components/CompanyTable";
import PopularityMatrix from "@/components/PopularityMatrix";
import CompanyLogo from "@/components/CompanyLogo";
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
  // ROE は純利益と自己資本がそろう会社だけで計算する
  const finList = list.filter((c) => c.netIncome !== null && c.equity !== null);
  const equity = finList.reduce((s, c) => s + (c.equity as number), 0);
  const industryRoe = equity ? (finList.reduce((s, c) => s + (c.netIncome as number), 0) / equity) * 100 : null;
  const by = <K extends "marketCap" | "netIncome" | "avgSalary" | "startingSalary">(k: K) =>
    [...list].filter((c) => c[k] !== null).sort((a, b) => (b[k] as number) - (a[k] as number))[0];
  const youngest = [...list].filter((c) => c.avgAge !== null).sort((a, b) => a.avgAge! - b.avgAge!)[0];
  const highlights = [
    { label: "平均年収 No.1", c: by("avgSalary"), v: (c: (typeof list)[number]) => fmtMan(c.avgSalary) },
    { label: "初任給 No.1", c: by("startingSalary"), v: (c: (typeof list)[number]) => fmtMonthly(c.startingSalary) },
    { label: "平均年齢が最も若い", c: youngest, v: (c: (typeof list)[number]) => fmtAge(c.avgAge) },
    { label: "時価総額 No.1", c: by("marketCap"), v: (c: (typeof list)[number]) => fmtYen(c.marketCap) },
  ].filter((h) => h.c !== undefined);
  const salMed = median(list.map((c) => c.avgSalary));
  const startMed = median(list.map((c) => c.startingSalary));
  const holdingCount = list.filter((c) => c.workforce?.holding).length;
  const withPay = list.filter((c) => c.workforce !== null);
  const noPay = withPay.length === 0;
  const noPayList = list.filter((c) => c.workforce === null);
  const hasMcap = list.some((c) => c.marketCap !== null);
  const hasTrend = list.some((c) => c.history.length >= 2);
  // 業界内で就職者数の合計が多い大学（大学通信の上位掲載分）
  const univSum = new Map<string, number>();
  for (const c of list) for (const h of c.hiring) for (const [u, n] of h.top) univSum.set(normUniv(u), (univSum.get(normUniv(u)) ?? 0) + n);
  const topUnivs = [...univSum.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  const hiringCount = list.filter((c) => c.hiring.some((h) => h.top.length > 0)).length;
  const firstFy = list.find((c) => c.fiscalPeriod)?.fiscalPeriod;
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

      {noPay ? (
        <section className="grid gap-3 sm:grid-cols-4">
          <div className="card card-accent p-5 sm:col-span-2" style={style}>
            <p className="text-xs text-ink-3">平均年収・業績</p>
            <p className="mt-1 text-5xl font-bold tracking-tight text-ink-2">非公開</p>
            <p className="mt-2 text-[11px] leading-relaxed text-ink-3">
              掲載{t.count}社はいずれも日本で上場しておらず、有価証券報告書がないため、平均年収・初任給（月給）・業績は公開されていません。
              このページでは、大学別の就職者数・世間ウケ・代表者を比べられます。
            </p>
            <div className="glow-line mt-3" aria-hidden />
          </div>
          <div className="card p-5 sm:col-span-2">
            <p className="text-xs text-ink-3">就職者数の合計が多い大学（{hiringCount}社の上位掲載分）</p>
            <ol className="mt-2 space-y-1">
              {topUnivs.map(([u, n], i) => (
                <li key={u} className="flex items-baseline justify-between gap-3">
                  <Link href={`/university/?u=${encodeURIComponent(u)}`} className="font-bold hover:underline">
                    {i + 1}. {u}
                  </Link>
                  <span className="tabular text-sm text-ink-2">{n.toLocaleString("ja-JP")}人</span>
                </li>
              ))}
            </ol>
            <p className="mt-2 text-[11px] text-ink-3">大学通信の2025年春の調査（マッキンゼー・BCGは同社の記事で紹介された人数）。</p>
          </div>
        </section>
      ) : (
        <section className="grid gap-3 sm:grid-cols-4">
          <div className="card card-accent p-5 sm:col-span-2" style={style}>
            <p className="text-xs text-ink-3">平均年収（{withPay.length}社の中央値）</p>
            <p className="mt-1 text-5xl font-bold tracking-tight">{fmtMan(salMed)}</p>
            <p className="mt-2 text-[11px] text-ink-3">
              有価証券報告書の平均年間給与（提出会社）。{holdingCount > 0 ? `うち${holdingCount}社は持株会社の値。` : ""}
              {noPayList.length > 0 ? `${noPayList.map((c) => c.short).join("・")}は日本で上場しておらず非公開のため含みません。` : ""}
            </p>
            <div className="glow-line mt-3" aria-hidden />
          </div>
          <div className="card p-5">
            <p className="text-xs text-ink-3">大卒初任給（中央値）</p>
            <p className="mt-1 text-2xl font-bold">{fmtMonthly(startMed)}</p>
            <p className="mt-1 text-[11px] text-ink-3">就職サイト・採用ページ掲載の月給</p>
          </div>
          <div className="card p-5">
            <p className="text-xs text-ink-3">業界規模（売上合計）</p>
            <p className="mt-1 text-2xl font-bold">{fmtYen(t.revenue)}</p>
            <p className="mt-1 text-[11px] text-ink-3">
              純利益合計 {fmtYen(t.netIncome)}・業界ROE {fmtPct(industryRoe)}
              {t.finCount < t.count ? `（業績がわかる${t.finCount}社）` : ""}
            </p>
          </div>
        </section>
      )}

      {highlights.length > 0 && (
        <section className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="業界のトップ企業">
          {highlights.map((h) => (
            <Link key={h.label} href={`/company/${h.c!.code}/`} className="card group p-4 transition hover:border-white/20">
              <p className="text-[11px] text-ink-3">👑 {h.label}</p>
              <p className="mt-1 truncate text-lg font-bold group-hover:underline">{h.c!.short}</p>
              <p className="text-sm text-ink-2">{h.v(h.c!)}</p>
            </Link>
          ))}
        </section>
      )}

      {!noPay && (
        <section className={`mt-10 grid gap-4 ${hasMcap ? "lg:grid-cols-5" : ""}`}>
          <div className={`card p-4 sm:p-5 ${hasMcap ? "lg:col-span-3" : ""}`}>
            <SectionTitle eyebrow="RANKING" title="業界内ランキング" accent={ind.color} />
            <IndustryRanking industry={iid} />
          </div>
          {hasMcap && (
            <div className="card p-4 sm:p-5 lg:col-span-2">
              <SectionTitle eyebrow="SCALE" title="会社の規模（時価総額）" lead="面積が時価総額。掲載企業のうち日本で上場している会社の中での割合です。" accent={ind.color} />
              <MarketCapTreemap industry={iid} height={400} />
            </div>
          )}
        </section>
      )}

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
          lead="結婚相手（20〜59歳）・親世代・就活生（文系／理系、東大・京大生）が選んだ人気ランキングでの順位。公開されている調査の順位で、サイト独自の点数ではありません。"
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

      {!noPay && (
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
      )}

      {hasTrend && (
        <section className="mt-10">
          <SectionTitle eyebrow="TREND" title="業績の推移（5期）" lead="会社が伸びているかを確認しましょう。企業名を押すと、その会社の線が強調されます。" accent={ind.color} />
          <div className="card p-4 sm:p-5">
            <TrendChart industry={iid} />
          </div>
        </section>
      )}

      {!noPay && (
        <section className="mt-10">
          <SectionTitle eyebrow="TABLE" title="指標一覧" lead="見出しを押すと並べ替えられます。" accent={ind.color} />
          <div className="card p-4 sm:p-5">
            <CompanyTable industry={iid} />
          </div>
        </section>
      )}

      <section className="mt-10">
        <SectionTitle
          eyebrow="PRESIDENT"
          title="社長（代表者）と出身大学"
          lead="上場企業は有価証券報告書の役員の状況、日本で上場していない会社は公式サイト・報道で確認できた代表者です。出身大学は確認できた人のみ。"
          accent={ind.color}
        />
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => (
            <Link key={c.code} href={`/company/${c.code}/`} className="card group flex items-start justify-between gap-3 p-3.5 transition hover:border-white/20">
              <span className="flex min-w-0 items-start gap-2.5">
                <CompanyLogo company={c} size="sm" className="mt-0.5" />
                <span className="min-w-0">
                  <span className="block text-[11px] text-ink-3">{c.short}</span>
                  <span className="block truncate font-bold group-hover:underline">{c.ceo?.name ?? "未確認"}</span>
                  {c.ceo && <span className="block truncate text-[11px] text-ink-3">{c.ceo.title}</span>}
                </span>
              </span>
              <span className={`shrink-0 text-right text-xs ${c.ceo?.univ ? "font-semibold text-ink" : "text-ink-3"}`}>
                {c.ceo?.univ ?? "出身大学 未確認"}
                {c.ceo?.weak && <span className="block text-[10px] font-normal text-[#c98500]">報道1件</span>}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <SectionTitle eyebrow="COMPANIES" title="企業ページへ" accent={ind.color} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {[...list]
            .sort((a, b) => (b.avgSalary ?? -1) - (a.avgSalary ?? -1))
            .map((c) => (
              <Link
                key={c.code}
                href={`/company/${c.code}/`}
                className="card card-accent group p-4 transition hover:-translate-y-0.5"
                style={style}
              >
                <div className="flex items-center gap-2.5">
                  <CompanyLogo company={c} size="sm" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-ink-3">{codeShort(c)}</p>
                    <p className="truncate font-bold group-hover:underline">{c.short}</p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-ink-3">平均年収 ／ 初任給</p>
                <p className="text-sm font-semibold">
                  {c.workforce === null ? <span className="text-ink-3">非公開</span> : fmtMan(c.avgSalary)} ／{" "}
                  {c.startingSalary === null ? <span className="text-ink-3">{c.workforce === null ? "非公開" : "—"}</span> : fmtMonthly(c.startingSalary)}
                </p>
              </Link>
            ))}
        </div>
        <p className="mt-6 text-xs leading-relaxed text-ink-3">
          {firstFy
            ? `※「業界規模」は掲載企業のうち業績がわかる会社の合計であり、業界全体の市場規模ではありません。財務は連結・各社の直近期（${firstFy}ほか）。`
            : "※ 掲載している会社は日本で上場していないため、業績・時価総額は掲載していません。"}
          {list.some((c) => c.listing === "delisted") && ` ${list.filter((c) => c.listing === "delisted").map((c) => `${c.short}：${c.listingNote}`).join("。")}。`}
        </p>
      </section>
    </>
  );
}
