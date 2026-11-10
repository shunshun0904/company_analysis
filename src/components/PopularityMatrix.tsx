import Link from "next/link";
import type { CompanyWithMetrics } from "@/lib/data";
import { SURVEYS, popOf } from "@/lib/popularity";
import { hexA } from "@/lib/chartTheme";

/** 順位が高いほど濃く（1位＝最も濃い、100位＝最も薄い）。単色の明暗だけで表す */
function cellBg(rank: number, color: string): string {
  const t = 1 - (Math.min(rank, 100) - 1) / 99;
  return hexA(color, 0.14 + 0.7 * t);
}

/**
 * 世間ウケの一覧：会社 × 4つの調査の順位。空欄は公表された上位100位に入っていない（圏外）。
 */
export default function PopularityMatrix({ companies, color }: { companies: CompanyWithMetrics[]; color: string }) {
  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <table className="w-full min-w-[520px] border-separate border-spacing-1 text-sm">
        <caption className="sr-only">各社の世間ウケ（調査ごとの順位）</caption>
        <thead>
          <tr className="text-left text-[11px] text-ink-3">
            <th scope="col" className="px-1 py-1 font-medium">
              会社
            </th>
            {SURVEYS.map((s) => (
              <th key={s.id} scope="col" className="px-1 py-1 text-center font-medium">
                {s.tab}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {companies.map((c) => {
            const p = popOf(c.code);
            return (
              <tr key={c.code}>
                <th scope="row" className="whitespace-nowrap px-1 py-1 text-left font-medium">
                  <Link href={`/company/${c.code}/`} className="hover:underline">
                    {c.short}
                  </Link>
                </th>
                {SURVEYS.map((s) => {
                  const r = p[s.id];
                  const title = r.rank !== null ? `${s.tab}：${r.rank}位${r.entity ? `（${r.entity}）` : ""}` : `${s.tab}：上位100位圏外${r.group ? `（${r.group}）` : ""}`;
                  return (
                    <td key={s.id} className="p-0 text-center" title={title}>
                      {r.rank !== null ? (
                        <span
                          className="tabular block rounded-lg px-2 py-1.5 text-[13px] font-bold text-white"
                          style={{ background: cellBg(r.rank, color), textShadow: "0 0 3px rgba(0,0,0,.65)" }}
                        >
                          {r.rank}位{r.sub ? <sup className="ml-0.5 font-normal text-white/70">*</sup> : null}
                        </span>
                      ) : (
                        <span className="block rounded-lg border border-white/[0.06] px-2 py-1.5 text-[12px] text-ink-3">圏外</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-2 text-[11px] leading-relaxed text-ink-3">
        色が濃いほど上位。「圏外」は公表された上位100位に入っていないことを表します。* は調査上の名前が子会社（三菱UFJ銀行・野村證券など）。
      </p>
    </div>
  );
}
