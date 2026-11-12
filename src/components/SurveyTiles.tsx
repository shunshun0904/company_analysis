import type { ReactNode } from "react";
import { fmtPopValue, popOf, type Survey } from "@/lib/popularity";

/** 企業ページ用：調査ごとの順位カードと出典の一覧 */
export default function SurveyTiles({
  code,
  surveys,
  color,
  children,
}: {
  code: string;
  surveys: Survey[];
  color: string;
  /** 最新回の補足など、カードと出典の間に入れる内容 */
  children?: ReactNode;
}) {
  const pop = popOf(code);
  return (
    <>
      <div className={`grid grid-cols-2 gap-3 ${surveys.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}>
        {surveys.map((s) => {
          const r = pop[s.id];
          return (
            <div key={s.id} className="card p-4" style={r.rank !== null && r.rank <= 10 ? { borderColor: color + "99" } : undefined}>
              <p className="text-xs text-ink-3">{s.tab}</p>
              <p className={`mt-1 text-2xl font-bold ${r.rank === null ? "text-ink-3" : ""}`}>{r.rank !== null ? `${r.rank}位` : "圏外"}</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-ink-3">
                {r.rank !== null && r.value !== undefined
                  ? `${s.metric === "rate" ? "回答率" : "得票"} ${fmtPopValue(r.value, s.metric)}`
                  : `公表された${s.depth}に入っていない`}
                {r.entity && <span className="block">調査上の名前：{r.entity}</span>}
                {r.group && <span className="block">{r.group}</span>}
              </p>
            </div>
          );
        })}
      </div>
      {children}
      <ul className="mt-3 space-y-1 text-[11px] leading-relaxed text-ink-3">
        {surveys.map((s) => (
          <li key={s.id}>
            {s.tab}：
            <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-ink">
              {s.name} ↗
            </a>
            （{s.publisher}・{s.published}発表、調査{s.period}、{s.target}、{s.sample}）
          </li>
        ))}
      </ul>
    </>
  );
}
