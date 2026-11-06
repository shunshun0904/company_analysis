import type { Metadata } from "next";
import { DATA_META } from "@/lib/data";
import { SectionTitle } from "@/components/ui";

export const metadata: Metadata = { title: "データについて" };

const DEFS = [
  { term: "時価総額", desc: "株価×発行済株式数。株式市場がつけた「会社の値段」。" },
  { term: "売上", desc: "各社の連結売上高（売上収益・営業収益・収益）。金融は経常収益、野村HDは収益合計（金融費用控除後）を売上相当として掲載。会計基準や定義が異なるため、業界をまたいだ単純比較には注意が必要です。" },
  { term: "純利益", desc: "親会社株主（所有者）に帰属する当期純利益。" },
  { term: "純利益率", desc: "純利益÷売上。" },
  { term: "ROE", desc: "純利益÷期末の自己資本（株主資本）で簡易計算。期中平均を使う会社公表値とは異なる場合があります。" },
  { term: "PER", desc: "時価総額÷純利益（実績）。赤字の場合は算出しません。" },
  { term: "PBR", desc: "時価総額÷期末の自己資本。" },
  { term: "業界規模", desc: "掲載企業の売上合計。業界全体の市場規模ではありません。" },
  { term: "5軸スコア", desc: "規模（売上）・市場評価（時価総額）・収益性（純利益率）・資本効率（ROE）・成長性（4年の年平均成長率。非金融は売上、金融は純利益）について、掲載29社の中での順位を0〜100に換算した値。" },
];

export default function AboutPage() {
  return (
    <div className="max-w-3xl pt-10">
      <SectionTitle eyebrow="ABOUT DATA" title={<span className="text-3xl">データについて</span>} lead={`最終更新：${DATA_META.updatedAt}。時価総額は${DATA_META.marketCapAsOf}。`} />

      <section className="card p-5">
        <h2 className="text-lg font-bold">出典</h2>
        <ul className="mt-3 space-y-3 text-sm">
          {DATA_META.sources.map((s) => (
            <li key={s.label}>
              <p className="font-semibold">{s.label}</p>
              <p className="text-ink-2">{s.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="card mt-4 p-5">
        <h2 className="text-lg font-bold">照合した主な数値</h2>
        <p className="mt-1 text-sm text-ink-2">取得データの信頼性を確かめるため、以下の値を決算短信・決算報道と照合し、一致を確認しています（直近期）。</p>
        <div className="-mx-1 mt-3 overflow-x-auto px-1">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs text-ink-3">
                <th scope="col" className="py-2 pr-3 font-medium">企業</th>
                <th scope="col" className="py-2 pr-3 font-medium">照合した値</th>
                <th scope="col" className="py-2 font-medium">照合先</th>
              </tr>
            </thead>
            <tbody>
              {DATA_META.verified.map((v) => (
                <tr key={v.company} className="border-b border-white/5 align-top">
                  <th scope="row" className="py-2 pr-3 text-left font-medium">{v.company}</th>
                  <td className="py-2 pr-3 text-ink-2">{v.items}</td>
                  <td className="py-2 text-ink-3">{v.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card mt-4 p-5">
        <h2 className="text-lg font-bold">用語と計算方法</h2>
        <dl className="mt-3 space-y-3 text-sm">
          {DEFS.map((d) => (
            <div key={d.term}>
              <dt className="font-semibold">{d.term}</dt>
              <dd className="text-ink-2">{d.desc}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="card mt-4 p-5 text-sm text-ink-2">
        <h2 className="text-lg font-bold text-ink">ご注意</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5">
          <li>本サイトは企業研究の参考情報です。投資の勧誘や、将来の業績・株価を示すものではありません。</li>
          <li>決算期は原則3月期。楽天グループのみ12月期のため、推移グラフでは各社の直近5期を同じ並び順で表示しています。</li>
          <li>平均年収・従業員数は、出典ごとに定義（提出会社単体か連結か等）がそろわないため現在は掲載していません。有価証券報告書をもとに今後追加予定です。</li>
          <li>最新の正確な数値は、各社の決算短信・有価証券報告書（EDINET）をご確認ください。</li>
        </ul>
      </section>
    </div>
  );
}
