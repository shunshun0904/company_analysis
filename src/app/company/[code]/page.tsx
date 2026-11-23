import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ALL,
  DATA_META,
  codeLabel,
  companiesOf,
  getCompany,
  getIndustry,
  hasRadar,
  isListed,
  radarScores,
  rankIn,
  RADAR_AXES,
  type CompanyWithMetrics,
  type MetricKey,
} from "@/lib/data";
import { fmtYen, fmtPct, fmtMan, fmtAge, fmtYears, fmtPeople } from "@/lib/format";
import { RankBadge, SectionTitle } from "@/components/ui";
import HistoryBars from "@/components/charts/HistoryBars";
import RadarScore from "@/components/charts/RadarScore";
import PeerBars from "@/components/charts/PeerBars";
import UnivHiringBars from "@/components/charts/UnivHiringBars";
import { LATEST_BY_GENDER, LATEST_MARRY, MOTE_SURVEYS, SURVEYS } from "@/lib/popularity";
import SurveyTiles from "@/components/SurveyTiles";
import CompanyLogo from "@/components/CompanyLogo";

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
const ymd = (iso: string) => iso.replace(/-/g, "/");

/** 掲載企業全体の中での順位（値がある会社の中で） */
function overallRank(c: CompanyWithMetrics, key: MetricKey): { rank: number; of: number } | null {
  const pool = ALL.filter((x) => x[key] !== null);
  if (c[key] === null) return null;
  const sorted = [...pool].sort((a, b) => (b[key] as number) - (a[key] as number));
  return { rank: sorted.findIndex((x) => x.code === c.code) + 1, of: pool.length };
}

export default async function CompanyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const c = getCompany(code);
  if (!c) notFound();
  const ind = getIndustry(c.industry)!;
  const peers = companiesOf(c.industry);
  const style = { ["--accent" as string]: ind.color, ["--glow" as string]: ind.glow };
  const listed = isListed(c);
  const w = c.workforce;
  const sp = c.startPay;
  const ceo = c.ceo;

  // 業績・時価総額
  const hasBiz = c.revenue !== null || c.netIncome !== null || c.marketCap !== null;
  const prevNi = c.history[c.history.length - 2]?.netIncome;
  const hasRevHistory = c.history.filter((h) => h.revenue !== null).length >= 3;
  const hasNiHistory = c.history.length >= 2;

  // 5軸スコア（業績・時価総額・成長率がそろう会社のみ）。業界平均もそろう会社だけで出す
  const radarOk = hasRadar(c);
  const radarPeers = peers.filter(hasRadar);
  const scores = radarOk ? radarScores(c) : [];
  const avg = RADAR_AXES.map((_, i) => Math.round(radarPeers.reduce((s, p) => s + radarScores(p)[i], 0) / Math.max(1, radarPeers.length)));
  const peerOk = w !== null || c.revenue !== null;

  const others = [...peers].filter((p) => p.code !== c.code).sort((a, b) => (b.avgSalary ?? -1) - (a.avgSalary ?? -1));
  const yuhoUrl = w ? `https://disclosure2dl.edinet-fsa.go.jp/searchdocument/pdf/${w.edinetDoc}.pdf` : null;
  const latest = LATEST_MARRY.top.find((t) => t.code === c.code);
  const latestGender = (
    [
      ["女性が選んだ", LATEST_BY_GENDER.female],
      ["男性が選んだ", LATEST_BY_GENDER.male],
    ] as const
  ).flatMap(([label, rows]) => rows.filter((t) => t.code === c.code).map((t) => ({ label, rank: t.rank, value: t.value })));

  const salRank = overallRank(c, "avgSalary");
  const mcRank = overallRank(c, "marketCap");

  const workTiles = w
    ? [
        { label: "平均年齢", value: w.ageText ?? fmtAge(w.avgAge), sub: `業界${rankIn(peers, c, "avgAge")}位（若い順）` },
        { label: "平均勤続年数", value: w.tenureText ?? fmtYears(w.avgTenure), sub: `業界${rankIn(peers, c, "avgTenure")}位` },
        { label: "従業員数（単体）", value: fmtPeople(w.employees), sub: `${ymd(w.asOf)}現在` },
      ]
    : [
        { label: "平均年齢", value: "非公開", sub: "有価証券報告書なし" },
        { label: "平均勤続年数", value: "非公開", sub: "有価証券報告書なし" },
        c.jpEmployees
          ? {
              label: "従業員数（日本）",
              value: `${c.jpEmployees.approx ? "約" : ""}${c.jpEmployees.count.toLocaleString("ja-JP")}人`,
              sub: `${c.jpEmployees.asOf}時点・公式発表`,
            }
          : { label: "従業員数", value: "非公開", sub: "有価証券報告書なし" },
      ];

  const bizTiles = [
    {
      label: "時価総額",
      value: c.marketCap !== null ? fmtYen(c.marketCap) : c.listing === "delisted" ? "上場廃止" : "非上場",
      sub: mcRank ? `上場${mcRank.of}社中 ${mcRank.rank}位` : "株価がないため算出できません",
      muted: c.marketCap === null,
    },
    {
      label: c.revenueLabel === "収益合計（金融費用控除後）" ? "収益合計（純額）" : (c.revenueLabel ?? "売上"),
      value: fmtYen(c.revenue) + (c.revenueApprox ? "*" : ""),
      sub: c.fiscalPeriod ?? "—",
    },
    {
      label: "純利益",
      value: fmtYen(c.netIncome),
      sub: prevNi !== undefined && c.netIncome !== null ? niChange(prevNi, c.netIncome) : (c.fiscalPeriod ?? "—"),
      neg: (c.netIncome ?? 0) < 0,
    },
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
          <span className="chip">{codeLabel(c)}</span>
        </div>
        <div className="relative mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
          <CompanyLogo company={c} size="lg" />
          <h1 className="text-3xl font-black tracking-tight sm:text-5xl">{c.name}</h1>
        </div>
        <p className="relative mt-2 text-sm text-ink-2">{c.description}</p>
        {c.listingNote && (
          <p className="relative mt-3 max-w-3xl rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs leading-relaxed text-ink-2">
            <span className="mr-1.5 font-bold text-ink">{listed ? "補足" : c.listing === "delisted" ? "上場廃止" : "非上場"}</span>
            {c.listingNote}
          </p>
        )}
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
            <p className="text-xs text-ink-3">平均年収{w?.holding ? "（持株会社）" : ""}</p>
            {w ? (
              <>
                <p className="mt-1 text-5xl font-bold tracking-tight">{fmtMan(w.avgSalary)}</p>
                <p className="mt-2 text-xs text-ink-3">
                  {salRank && `掲載企業（年収がわかる${salRank.of}社）中 ${salRank.rank}位 ／ `}有価証券報告書（{ymd(w.asOf)}現在）
                </p>
              </>
            ) : (
              <>
                <p className="mt-1 text-5xl font-bold tracking-tight text-ink-2">非公開</p>
                <p className="mt-2 text-xs leading-relaxed text-ink-3">
                  日本で上場していないため有価証券報告書がなく、平均年収は公開されていません。口コミサイトなどの推定値は、このサイトでは載せていません。
                </p>
              </>
            )}
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
              <p className="mt-2 text-sm leading-relaxed text-ink-3">{c.startPayNote ?? "確認できませんでした"}</p>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
            {workTiles.map((t) => (
              <div key={t.label} className="card p-3 lg:p-4">
                <p className="text-[11px] text-ink-3">{t.label}</p>
                <p className={`mt-0.5 text-lg font-bold ${t.value === "非公開" ? "text-ink-3" : ""}`}>{t.value}</p>
                <p className="text-[10px] text-ink-3">{t.sub}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs leading-relaxed text-ink-2">
          {w && yuhoUrl ? (
            <>
              平均年収・平均年齢・勤続年数・従業員数は
              {w.basis ? `、${w.basis}（` : ""}
              <a href={yuhoUrl} target="_blank" rel="noopener noreferrer" className="mx-1 underline underline-offset-4 hover:text-ink">
                有価証券報告書（EDINET）↗
              </a>
              {w.basis ? "）です。" : "の「従業員の状況」（提出会社）より。"}
              {w.note && <span className="text-[#c98500]"> {w.note}。</span>}
              {w.sub && (
                <span>
                  {" "}
                  主要子会社の{w.sub.name}は、従業員{fmtPeople(w.sub.employees)}・平均年齢{fmtAge(w.sub.age)}・平均勤続{fmtYears(w.sub.tenure)}・平均年収
                  <strong className="font-semibold text-ink">{fmtMan(w.sub.salary)}</strong>（同報告書）。
                </span>
              )}
            </>
          ) : (
            <>
              平均年収・平均年齢・勤続年数は、上場企業が提出する有価証券報告書の値だけを載せています。{c.short}は日本で上場していないため「非公開」としています。
              {c.jpEmployees && (
                <>
                  {" "}
                  日本の従業員数は
                  {c.jpEmployees.url ? (
                    <a href={c.jpEmployees.url} target="_blank" rel="noopener noreferrer" className="mx-1 underline underline-offset-4 hover:text-ink">
                      {c.jpEmployees.src} ↗
                    </a>
                  ) : (
                    c.jpEmployees.src
                  )}
                  の値です。
                </>
              )}
            </>
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
          <SectionTitle eyebrow="PRESIDENT" title={listed ? "社長" : "代表者"} accent={ind.color} />
          {ceo ? (
            <>
              <p className="text-2xl font-bold">{ceo.name}</p>
              <p className="mt-1 text-sm text-ink-2">{ceo.title}</p>
              <p className="mt-1 text-[11px] text-ink-3">
                確認元：
                {ceo.basisUrl ? (
                  <a href={ceo.basisUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-ink">
                    {ceo.basis ?? "出典"} ↗
                  </a>
                ) : (
                  (ceo.basis ?? "有価証券報告書の役員の状況")
                )}
              </p>
              {ceo.change && <p className="mt-2 text-xs text-[#c98500]">{ceo.change}</p>}
              <div className="mt-4 rounded-xl border border-white/10 p-3">
                <p className="text-xs text-ink-3">出身大学</p>
                {ceo.univ ? (
                  <>
                    <Link href={`/university/?u=${encodeURIComponent(ceo.univ)}`} className="mt-1 block text-xl font-bold hover:underline">
                      {ceo.univ}
                    </Link>
                    <p className="mt-1 text-xs text-ink-2">{ceo.detail}</p>
                    <p className="mt-1 text-[11px] text-ink-3">
                      出典：
                      {ceo.url ? (
                        <a href={ceo.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-ink">
                          {ceo.src} ↗
                        </a>
                      ) : (
                        ceo.src
                      )}
                      {ceo.weak && <span className="text-[#c98500]">（報道1件のみで確認）</span>}
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-ink-3">{ceo.note ?? "未確認"}</p>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm leading-relaxed text-ink-3">日本の代表者は、公式サイト・報道で確認できませんでした。</p>
          )}
          <p className="mt-3 text-[11px] leading-relaxed text-ink-3">
            {listed
              ? "取締役全員の出身大学は、有価証券報告書の経歴欄に学歴の記載がないため、現在確認を進めています。"
              : c.listing === "delisted"
                ? "上場廃止の会社は、確認できた最新の資料の代表者を載せています。"
                : "日本で上場していない会社は有価証券報告書がないため、公式サイト・報道で確認できた日本の代表者を載せています。"}
          </p>
        </div>
      </section>

      {/* 世間ウケ */}
      <section className="mt-10">
        <SectionTitle
          eyebrow="REPUTATION"
          title="世間ウケ"
          lead="結婚相手・親世代・就活生（全国の大学生と、東大・京大生）が選んだ人気ランキングでの順位です。公開されている調査の順位をそのまま載せています。"
          accent={ind.color}
        />
        <SurveyTiles code={c.code} surveys={SURVEYS} color={ind.color}>
          {latest && (
            <p className="mt-3 rounded-2xl border border-[#ff7fb5]/40 bg-[#ff7fb5]/10 px-4 py-3 text-sm">
              <span className="mr-2 text-[11px] tracking-[0.18em] text-ink-3">LATEST</span>
              最新の{LATEST_MARRY.name}（{LATEST_MARRY.published}発表）では<strong className="font-bold">{latest.rank}位</strong>
              （回答率{latest.value.toFixed(1)}%）。
            </p>
          )}
        </SurveyTiles>
      </section>

      {/* モテる会社 */}
      <section className="mt-10">
        <SectionTitle
          eyebrow="MOTE"
          title="モテる会社？"
          lead="女性・男性それぞれが「結婚相手の勤務先」に選んだ順位（2025年調査）と、「合コンしたい会社」の順位（2019年調査）です。"
          accent={ind.color}
        />
        <SurveyTiles code={c.code} surveys={MOTE_SURVEYS} color={ind.color}>
          {latestGender.length > 0 && (
            <p className="mt-3 rounded-2xl border border-[#c084fc]/40 bg-[#c084fc]/10 px-4 py-3 text-sm">
              <span className="mr-2 text-[11px] tracking-[0.18em] text-ink-3">LATEST</span>
              最新の{LATEST_BY_GENDER.name}（{LATEST_BY_GENDER.published}発表）では、
              {latestGender.map((g, i) => (
                <span key={g.label}>
                  {i > 0 && "、"}
                  {g.label}で<strong className="font-bold">{g.rank}位</strong>（回答率{g.value.toFixed(1)}%）
                </span>
              ))}
              。
            </p>
          )}
        </SurveyTiles>
      </section>

      {/* 会社の規模・業績 */}
      <section className="mt-10">
        <SectionTitle eyebrow="BUSINESS" title="会社の規模と業績" lead="安定して稼げているか、伸びているかを見ておきましょう。" accent={ind.color} />
        {hasBiz ? (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {bizTiles.map((t) => (
                <div key={t.label} className="card p-4">
                  <p className="text-xs text-ink-3">{t.label}</p>
                  <p className={`mt-1 text-xl font-bold ${t.neg ? "text-[#e66767]" : t.muted ? "text-ink-3" : ""}`}>{t.value}</p>
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
            {(hasRevHistory || hasNiHistory) && (
              <div className={`mt-4 grid gap-4 ${hasRevHistory && hasNiHistory ? "md:grid-cols-2" : ""}`}>
                {hasRevHistory && (
                  <div className="card p-4 sm:p-5">
                    <h3 className="text-sm font-bold">{c.revenueLabel}の推移</h3>
                    <HistoryBars code={c.code} metric="revenue" />
                  </div>
                )}
                {hasNiHistory && (
                  <div className="card p-4 sm:p-5">
                    <h3 className="text-sm font-bold">純利益（親会社株主に帰属）の推移</h3>
                    <HistoryBars code={c.code} metric="netIncome" />
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="card p-5 text-sm leading-relaxed text-ink-2">
            <p className="text-xs text-ink-3">売上・純利益・時価総額</p>
            <p className="mt-1 text-2xl font-bold text-ink-3">非公開</p>
            <p className="mt-2">
              {c.listing === "delisted"
                ? "上場廃止にともない、このサイトでは業績を載せていません。"
                : "日本で上場していないため、日本法人の業績は有価証券報告書で公開されていません。"}
              {c.notes.length > 0 && ` ${c.notes.join("。")}。`}
            </p>
          </div>
        )}
      </section>

      {(radarOk || peerOk) && (
        <section className={`mt-10 grid gap-4 ${radarOk && peerOk ? "lg:grid-cols-2" : ""}`}>
          {radarOk && (
            <div className="card p-4 sm:p-5">
              <SectionTitle
                eyebrow="5-AXIS SCORE"
                title="会社の強み（5軸）"
                lead={`業績・時価総額・成長率がそろう掲載${ALL.filter(hasRadar).length}社の中での位置（0〜100、100が最上位）。グレーは${ind.name}の平均。`}
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
          )}
          {peerOk && (
            <div className="card p-4 sm:p-5">
              <SectionTitle eyebrow="PEERS" title="同業他社と比べる" lead="自社のみ色付きで表示しています。値がない会社は表示していません。" accent={ind.color} />
              <PeerBars code={c.code} />
            </div>
          )}
        </section>
      )}

      <section className="mt-10 flex flex-wrap items-center gap-3">
        <Link
          href={`/compare/?c=${c.code}${others[0] ? "," + others[0].code : ""}`}
          className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#0d0e19] shadow-[0_0_30px_-8px_rgba(255,255,255,.7)]"
        >
          {c.short}を他社と比較する →
        </Link>
        <Link href={`/industry/${ind.id}/`} className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-bold hover:bg-white/5">
          {ind.name}の{peers.some((p) => p.avgSalary !== null) ? "ランキング" : "ページ"}へ
        </Link>
      </section>

      <section className="mt-10">
        <p className="mb-3 text-xs text-ink-3">同じ業界の企業{others.some((o) => o.avgSalary !== null) ? "（平均年収順）" : ""}</p>
        <div className="flex flex-wrap gap-2">
          {others.map((o) => (
            <Link key={o.code} href={`/company/${o.code}/`} className="chip hover:text-ink">
              {o.short}
              <span className="text-ink-3">{o.avgSalary === null ? "非公開" : fmtMan(o.avgSalary)}</span>
            </Link>
          ))}
        </div>
        <p className="mt-6 text-xs leading-relaxed text-ink-3">
          {c.revenueApprox ? "* 億円単位の公表・報道値から換算。" : ""}
          {c.fiscalPeriod ? `財務は連結（${c.fiscalPeriod}まで）。` : ""}
          {c.marketCap !== null ? `時価総額は${DATA_META.marketCapAsOf}ベース。` : ""}
        </p>
      </section>
    </>
  );
}
