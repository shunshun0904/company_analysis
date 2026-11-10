import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ALL, DATA_META, companiesOf, getCompany, getIndustry, radarScores, rankIn, RADAR_AXES } from "@/lib/data";
import { fmtYen, fmtPct, fmtMan, fmtAge, fmtYears, fmtPeople } from "@/lib/format";
import { RankBadge, SectionTitle } from "@/components/ui";
import HistoryBars from "@/components/charts/HistoryBars";
import RadarScore from "@/components/charts/RadarScore";
import PeerBars from "@/components/charts/PeerBars";
import UnivHiringBars from "@/components/charts/UnivHiringBars";
import { LATEST_MARRY, SURVEYS, fmtPopValue, popOf } from "@/lib/popularity";

export const dynamicParams = false;

export function generateStaticParams() {
  return ALL.map((c) => ({ code: c.code }));
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  const c = getCompany(code);
  return { title: c ? `${c.name}の年収・初任給・採用大学・業績` : "企業" };
}

function niChange(prev: number, last: number): string {
  if (prev < 0 && last >= 0) return "黒字転換";
  if (prev >= 0 && last < 0) return "赤字転落";
  if (prev < 0 && last < 0) return "赤字継続";
  const pct = ((last - prev) / prev) * 100;
  return `前期比 ${pct >= 0 ? "+" : "−"}${Math.abs(pct).toFixed(1)}%`;
}

const yen = (v: number) => `${v.toLocaleString("ja-JP")}円`;

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
  const others = [...peers].filter((p) => p.code !== c.code).sort((a, b) => b.avgSalary - a.avgSalary);
  const w = c.workforce;
  const sp = c.startPay;
  const yuhoUrl = `https://disclosure2dl.edinet-fsa.go.jp/searchdocument/pdf/${w.edinetDoc}.pdf`;
  const pop = popOf(c.code);
  const latest = LATEST_MARRY.top.find((t) => t.code === c.code);

  const workTiles = [
    { label: "平均年齢", value: w.ageText ?? fmtAge(w.avgAge), sub: `業界${rankIn(peers, c, "avgAge")}位（若い順）` },
    { label: "平均勤続年数", value: w.tenureText ?? fmtYears(w.avgTenure), sub: `業界${rankIn(peers, c, "avgTenure")}位` },
    { label: "従業員数（単体）", value: fmtPeople(w.employees), sub: `${w.asOf.replace(/-/g, "/")}現在` },
  ];
  const bizTiles = [
    { label: "時価総額", value: fmtYen(c.marketCap), sub: `掲載${ALL.length}社中 ${[...ALL].sort((a, b) => b.marketCap - a.marketCap).findIndex((x) => x.code === c.code) + 1}位` },
    { label: c.revenueLabel === "収益合計（金融費用控除後）" ? "収益合計（純額）" : c.revenueLabel, value: fmtYen(c.revenue) + (c.revenueApprox ? "*" : ""), sub: c.fiscalPeriod },
    { label: "純利益", value: fmtYen(c.netIncome), sub: prevNi !== undefined ? niChange(prevNi, c.netIncome) : c.fiscalPeriod, neg: c.netIncome < 0 },
    { label: "ROE", value: fmtPct(c.roe), sub: "純利益÷自己資本" },
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
        </div>
        <h1 className="relative mt-3 text-3xl font-black tracking-tight sm:text-5xl">{c.name}</h1>
        <p className="relative mt-2 text-sm text-ink-2">{c.description}</p>
        <div className="relative mt-4 flex flex-wrap gap-2">
          <RankBadge rank={rankIn(peers, c, "avgSalary")} label="平均年収" color={ind.color} />
          <RankBadge rank={rankIn(peers, c, "startingSalary")} label="初任給" color={ind.color} />
          <RankBadge rank={rankIn(peers, c, "marketCap")} label="時価総額" color={ind.color} />
          <RankBadge rank={rankIn(peers, c, "netIncome")} label="純利益" color={ind.color} />
        </div>
      </header>

      {/* 働く人のデータ */}
      <section>
        <SectionTitle eyebrow="WORK & PAY" title="年収・初任給・働く人" accent={ind.color} />
        <div className="grid gap-3 lg:grid-cols-3">
          <div className="card card-accent p-5" style={style}>
            <p className="text-xs text-ink-3">平均年収{w.holding ? "（持株会社）" : ""}</p>
            <p className="mt-1 text-5xl font-bold tracking-tight">{fmtMan(w.avgSalary)}</p>
            <p className="mt-2 text-xs text-ink-3">
              掲載{ALL.length}社中 {[...ALL].sort((a, b) => b.avgSalary - a.avgSalary).findIndex((x) => x.code === c.code) + 1}位 ／ 有価証券報告書（{c.fiscalPeriod}）
            </p>
            <div className="glow-line mt-3" aria-hidden />
          </div>
          <div className="card p-5">
            <p className="text-xs text-ink-3">大卒初任給（月給）</p>
            {sp ? (
              <>
                <p className="mt-1 text-4xl font-bold tracking-tight">
                  {yen(sp.amount)}
                  {sp.amountMax && sp.amountMax !== sp.amount ? <span className="text-lg text-ink-2">〜</span> : null}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-ink-2">
                  {sp.entity}・{sp.course}
                  {sp.grad ? `／院卒 ${yen(sp.grad)}` : ""}
                </p>
                <p className="mt-1 text-[11px] text-ink-3">
                  {sp.year}
                  {sp.check ? `（${sp.check}）` : ""}
                  {sp.url && (
                    <>
                      {" "}
                      <a href={sp.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-ink">
                        出典 ↗
                      </a>
                    </>
                  )}
                </p>
                {(sp.weak || sp.fixedOvertime) && (
                  <p className="mt-1 text-[11px] text-[#c98500]">
                    ⚠ {sp.fixedOvertime ? "固定残業代を含む金額です。" : "掲載経路・年度の条件付きの参考値です。"}
                  </p>
                )}
              </>
            ) : (
              <p className="mt-2 text-sm text-ink-3">{c.startPayNote ?? "確認できませんでした"}</p>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
            {workTiles.map((t) => (
              <div key={t.label} className="card p-3 lg:p-4">
                <p className="text-[11px] text-ink-3">{t.label}</p>
                <p className="mt-0.5 text-lg font-bold">{t.value}</p>
                <p className="text-[10px] text-ink-3">{t.sub}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs leading-relaxed text-ink-2">
          平均年収・平均年齢・勤続年数・従業員数は
          <a href={yuhoUrl} target="_blank" rel="noopener noreferrer" className="mx-1 underline underline-offset-4 hover:text-ink">
            有価証券報告書（EDINET）↗
          </a>
          の「従業員の状況」（提出会社）より。
          {w.note && <span className="text-[#c98500]"> {w.note}。</span>}
          {w.sub && (
            <span>
              {" "}
              主要子会社の{w.sub.name}は、従業員{fmtPeople(w.sub.employees)}・平均年齢{fmtAge(w.sub.age)}・平均勤続{fmtYears(w.sub.tenure)}・平均年収
              <strong className="font-semibold text-ink">{fmtMan(w.sub.salary)}</strong>（同報告書）。
            </span>
          )}
        </div>
      </section>

      {/* 大学・社長 */}
      <section className="mt-10 grid gap-4 lg:grid-cols-5">
        <div className="card p-4 sm:p-5 lg:col-span-3">
          <SectionTitle eyebrow="UNIVERSITY" title="どの大学から入っている？" lead="大学通信の2025年春の就職者数（上位に掲載された大学）。グループ会社を含む場合があります。" accent={ind.color} />
          <UnivHiringBars code={c.code} />
        </div>
        <div className="card p-4 sm:p-5 lg:col-span-2">
          <SectionTitle eyebrow="PRESIDENT" title="社長" accent={ind.color} />
          <p className="text-2xl font-bold">{c.ceo.name}</p>
          <p className="mt-1 text-xs text-ink-3">{c.ceo.title}（有価証券報告書の役員の状況より）</p>
          <div className="mt-4 rounded-xl border border-white/10 p-3">
            <p className="text-xs text-ink-3">出身大学</p>
            {c.ceo.univ ? (
              <>
                <Link href={`/university/?u=${encodeURIComponent(c.ceo.univ)}`} className="mt-1 block text-xl font-bold hover:underline">
                  {c.ceo.univ}
                </Link>
                <p className="mt-1 text-xs text-ink-2">{c.ceo.detail}</p>
                <p className="mt-1 text-[11px] text-ink-3">
                  出典：
                  {c.ceo.url ? (
                    <a href={c.ceo.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-ink">
                      {c.ceo.src} ↗
                    </a>
                  ) : (
                    c.ceo.src
                  )}
                  {c.ceo.weak && <span className="text-[#c98500]">（報道1件のみで確認）</span>}
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-ink-3">{c.ceo.note ?? "未確認"}</p>
            )}
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-ink-3">
            取締役全員の出身大学は、有価証券報告書の経歴欄に学歴の記載がないため、現在確認を進めています。
          </p>
        </div>
      </section>

      {/* 世間ウケ */}
      <section className="mt-10">
        <SectionTitle
          eyebrow="REPUTATION"
          title="世間ウケ"
          lead="結婚相手・親世代・就活生が選んだ人気ランキングでの順位です。公開されている調査の順位をそのまま載せています。"
          accent={ind.color}
        />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {SURVEYS.map((s) => {
            const r = pop[s.id];
            return (
              <div key={s.id} className="card p-4" style={r.rank !== null && r.rank <= 10 ? { borderColor: ind.color + "99" } : undefined}>
                <p className="text-xs text-ink-3">{s.tab}</p>
                <p className={`mt-1 text-2xl font-bold ${r.rank === null ? "text-ink-3" : ""}`}>
                  {r.rank !== null ? `${r.rank}位` : "圏外"}
                </p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-ink-3">
                  {r.rank !== null && r.value !== undefined
                    ? `${s.metric === "rate" ? "回答率" : "得票"} ${fmtPopValue(r.value, s.metric)}`
                    : "上位100位に入っていない"}
                  {r.entity && <span className="block">調査上の名前：{r.entity}</span>}
                  {r.group && <span className="block">{r.group}</span>}
                </p>
              </div>
            );
          })}
        </div>
        {latest && (
          <p className="mt-3 rounded-2xl border border-[#ff7fb5]/40 bg-[#ff7fb5]/10 px-4 py-3 text-sm">
            <span className="mr-2 text-[11px] tracking-[0.18em] text-ink-3">LATEST</span>
            最新の{LATEST_MARRY.name}（{LATEST_MARRY.published}発表）では<strong className="font-bold">{latest.rank}位</strong>
            （回答率{latest.value.toFixed(1)}%）。
          </p>
        )}
        <ul className="mt-3 space-y-1 text-[11px] leading-relaxed text-ink-3">
          {SURVEYS.map((s) => (
            <li key={s.id}>
              {s.tab}：
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-ink">
                {s.name} ↗
              </a>
              （{s.publisher}・{s.published}発表、{s.target}、{s.sample}）
            </li>
          ))}
        </ul>
      </section>

      {/* 会社の規模・業績 */}
      <section className="mt-10">
        <SectionTitle eyebrow="BUSINESS" title="会社の規模と業績" lead="安定して稼げているか、伸びているかを見ておきましょう。" accent={ind.color} />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {bizTiles.map((t) => (
            <div key={t.label} className="card p-4">
              <p className="text-xs text-ink-3">{t.label}</p>
              <p className={`mt-1 text-xl font-bold ${t.neg ? "text-[#e66767]" : ""}`}>{t.value}</p>
              <p className="mt-0.5 text-[11px] text-ink-3">{t.sub}</p>
            </div>
          ))}
        </div>
        {c.notes.length > 0 && (
          <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-ink-2">
            <p className="mb-1 text-xs font-bold text-ink-3">業績のポイント</p>
            <ul className="list-disc space-y-1 pl-5">
              {c.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </div>
        )}
        <div className={`mt-4 grid gap-4 ${hasRevHistory ? "md:grid-cols-2" : ""}`}>
          {hasRevHistory && (
            <div className="card p-4 sm:p-5">
              <h3 className="text-sm font-bold">{c.revenueLabel}の推移</h3>
              <HistoryBars code={c.code} metric="revenue" />
            </div>
          )}
          <div className="card p-4 sm:p-5">
            <h3 className="text-sm font-bold">純利益（親会社株主に帰属）の推移</h3>
            <HistoryBars code={c.code} metric="netIncome" />
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-4 lg:grid-cols-2">
        <div className="card p-4 sm:p-5">
          <SectionTitle
            eyebrow="5-AXIS SCORE"
            title="会社の強み（5軸）"
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
          <SectionTitle eyebrow="PEERS" title="同業他社と比べる" lead="自社のみ色付きで表示しています。" accent={ind.color} />
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
        <p className="mb-3 text-xs text-ink-3">同じ業界の企業（平均年収順）</p>
        <div className="flex flex-wrap gap-2">
          {others.map((o) => (
            <Link key={o.code} href={`/company/${o.code}/`} className="chip hover:text-ink">
              {o.short}
              <span className="text-ink-3">{fmtMan(o.avgSalary)}</span>
            </Link>
          ))}
        </div>
        <p className="mt-6 text-xs leading-relaxed text-ink-3">
          {c.revenueApprox ? "* 億円単位の公表・報道値から換算。" : ""}
          財務は連結（{c.fiscalPeriod}まで）、時価総額は{DATA_META.marketCapAsOf}ベース。
        </p>
      </section>
    </>
  );
}
