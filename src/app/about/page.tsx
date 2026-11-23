import type { Metadata } from "next";
import { DATA_META, getCompany } from "@/lib/data";
import { allLogos } from "@/components/CompanyLogo";
import { SectionTitle } from "@/components/ui";

export const metadata: Metadata = { title: "データについて" };

const DEFS = [
  { term: "平均年収", desc: "有価証券報告書の「平均年間給与」（提出会社、賞与・基準外賃金を含む）。総合職だけでなく一般職などを含む社員全体の平均で、新卒がすぐにもらえる金額ではありません。" },
  { term: "初任給", desc: "就職サイトに掲載された大卒の月給。固定残業代や一律の手当を含む会社があるため、比較するときは企業ページの条件欄を確認してください。" },
  { term: "平均年齢・平均勤続年数", desc: "有価証券報告書の値（提出会社）。勤続年数が長いほど社員が定着している目安になります。" },
  { term: "持株会社の数値", desc: "NTT・リクルート・ビジョナルや金融グループなどの提出会社は持株会社で、本社の少人数の社員の値です。銀行など主要子会社の値が有報に載っている場合は企業ページに併記しています。" },
  { term: "非公開", desc: "外資系の日本法人（日本IBM・グーグルなど）や外資コンサルは日本で上場しておらず、有価証券報告書がないため、平均年収・平均年齢・業績が公開されていません。このサイトでは口コミサイトなどの推定値は載せず「非公開」と表示しています。" },
  { term: "上場廃止の会社", desc: "NTTデータ（2025年9月）とSCSK（2026年3月）は親会社の完全子会社になり上場廃止しました。時価総額はありません。NTTデータの年収などはNTTの有価証券報告書に載っている株式会社NTTデータの値、SCSKは上場廃止前の最後の有価証券報告書（2026年3月期）の値です。" },
  { term: "大学別の就職者数", desc: "大学通信の調査で各社の上位に掲載された大学のみ。表に出ない大学からも就職者がいる可能性があります。" },
  { term: "世間ウケ", desc: "結婚相手・親世代・就活生を対象にした公開調査での順位。順位は各調査が公表した範囲（トップ100、東大・京大生のランキングは上位50社）のままで、「圏外」はその範囲に入っていないことを表します。東大・京大生のランキングは就活サイトの「お気に入り登録数」の順位で、数そのものは公表されていません。調査の対象者や時期が違うため、調査どうしで順位を比べたり足し合わせたりはしていません。銀行・証券・保険は調査上の名前（三菱UFJ銀行・野村證券・東京海上日動など）の順位を、グループの欄に掲載しています。" },
  { term: "モテる会社", desc: "女性・男性それぞれが「結婚相手（パートナー）の勤務先」として選んだ順位（リスクモンスター第15回「この企業に勤める人と結婚したいランキング」の男女別、2025年調査、各400人）と、20〜49歳の未婚男女900人が「合コンしたい」と選んだ順位（同 第3回「合コンしたいと思う企業ランキング」、2019年調査）。男女別は上位19〜20社のみ公表されているため、それより下は「圏外」と表示します。合コンの調査は最新版が2019年のため、年を明記しています。" },
  { term: "時価総額", desc: "株価×発行済株式数。株式市場がつけた「会社の値段」で、会社の規模・注目度の目安です。" },
  { term: "売上・純利益", desc: "連結の売上高（売上収益・営業収益・収益）と、親会社株主に帰属する当期純利益。金融は経常収益等を売上相当として掲載。" },
  { term: "ROE", desc: "純利益÷期末の自己資本（簡易計算）。お金を効率よく利益に変えている度合い。" },
  { term: "業界規模", desc: "掲載企業の売上合計。業界全体の市場規模ではありません。" },
  { term: "会社の強み（5軸）", desc: "規模（売上）・市場評価（時価総額）・収益性（純利益率）・資本効率（ROE）・成長性（4年の年平均成長率。非金融は売上、金融は純利益）について、5つの値がそろう掲載企業の中での順位を0〜100に換算した値。非上場・上場廃止の会社は表示しません。" },
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
        <h2 className="text-lg font-bold">照合した主な数値（業績）</h2>
        <p className="mt-1 text-sm text-ink-2">財務データの信頼性を確かめるため、以下の値を決算短信・決算報道と照合し、一致を確認しています（直近期）。</p>
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

      <section className="card mt-4 p-5">
        <h2 className="text-lg font-bold">ロゴについて</h2>
        <p className="mt-1 text-sm text-ink-2">
          会社のロゴは各社の商標です。会社を見分けるための表示として、ウィキメディア・コモンズで公開されているロゴ画像（各社の Wikipedia の記事にひも付くもの）を掲載しています。
          画像の権利情報は下の各ファイルのページをご覧ください。ロゴが見つからない会社は、業界色の頭文字マーク（実際のロゴではありません）を表示しています。
        </p>
        <div className="-mx-1 mt-3 overflow-x-auto px-1">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs text-ink-3">
                <th scope="col" className="py-2 pr-3 font-medium">会社</th>
                <th scope="col" className="py-2 pr-3 font-medium">ファイル（ウィキメディア・コモンズ）</th>
                <th scope="col" className="py-2 font-medium">ライセンス</th>
              </tr>
            </thead>
            <tbody>
              {allLogos().map(([code, l]) => (
                <tr key={code} className="border-b border-white/5 align-top">
                  <th scope="row" className="py-2 pr-3 text-left font-medium">{getCompany(code)?.short ?? code}</th>
                  <td className="py-2 pr-3 text-ink-2">
                    <a href={l.page} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-ink">
                      {l.file} ↗
                    </a>
                  </td>
                  <td className="py-2 text-ink-3">{l.license ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card mt-4 p-5 text-sm text-ink-2">
        <h2 className="text-lg font-bold text-ink">ご注意</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5">
          <li>本サイトは企業研究の参考情報です。投資の勧誘や、将来の業績・株価を示すものではありません。</li>
          <li>決算期は原則3月期。決算月が違う会社（楽天グループ＝12月、サイバーエージェント＝9月、ビジョナル＝7月、メルカリ・freee＝6月、Sansan＝5月、マネーフォワード＝11月）は、推移グラフで各社の直近5期を同じ並び順で表示しています。</li>
          <li>TISは2026年7月にインテックと合併してTISI株式会社に社名を変更しました。掲載の数値は合併前（2026年3月期）のTISの値です。</li>
          <li>取締役全員の出身大学は、有価証券報告書の経歴欄に学歴の記載がないため確認中です。現在は社長（外資は日本の代表者）のみ掲載しています。</li>
          <li>大学通信のデータは同社の調査結果を出典明記のうえ上位校のみ掲載しています。全順位は出典ページをご覧ください。</li>
          <li>世間ウケの調査は回答者数が800人規模（リスクモンスター）で、1〜2人の差で順位が入れ替わることがあります。就職人気ランキングは調査会社によって結果が大きく異なります。</li>
          <li>最新の正確な数値は、各社の決算短信・有価証券報告書（EDINET）をご確認ください。</li>
        </ul>
      </section>
    </div>
  );
}
