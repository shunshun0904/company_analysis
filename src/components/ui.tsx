import type { ReactNode } from "react";

export function SectionTitle({
  eyebrow,
  title,
  lead,
  accent,
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  accent?: string;
}) {
  return (
    <div className="mb-5">
      {eyebrow && (
        <p className="mb-1 text-[11px] font-medium tracking-[0.22em] text-ink-3">
          <span
            className="mr-2 inline-block h-1.5 w-1.5 -translate-y-px rounded-full align-middle"
            style={{ background: accent ?? "#5ce1ff", boxShadow: `0 0 8px ${accent ?? "#5ce1ff"}` }}
            aria-hidden
          />
          {eyebrow}
        </p>
      )}
      <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
      {lead && <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-ink-2">{lead}</p>}
    </div>
  );
}

export function StatTile({
  label,
  value,
  unit,
  sub,
  accent,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  sub?: ReactNode;
  accent?: string;
}) {
  return (
    <div className="card p-4 sm:p-5">
      <p className="text-xs text-ink-3">{label}</p>
      <p className="mt-1.5 flex items-baseline gap-1">
        <span className="text-2xl font-bold tracking-tight sm:text-[28px]">{value}</span>
        {unit && <span className="text-sm text-ink-2">{unit}</span>}
      </p>
      {sub && <div className="mt-1 text-xs text-ink-3">{sub}</div>}
      {accent && <div className="glow-line mt-3" style={{ ["--glow" as string]: accent }} aria-hidden />}
    </div>
  );
}

export function RankBadge({ rank, label, color }: { rank: number | null; label: string; color: string }) {
  if (rank === null) return null;
  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
  return (
    <span className="chip" style={{ borderColor: rank <= 3 ? color : undefined }}>
      {medal ? <span aria-hidden>{medal}</span> : <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} aria-hidden />}
      {label} 業界{rank}位
    </span>
  );
}

/** インラインSVGの小さな推移線（装飾ではなくトレンドの目安）。最新点だけ強調する */
export function Sparkline({ values, color, height = 40 }: { values: number[]; color: string; height?: number }) {
  const w = 120;
  const h = height;
  // 推移の形が読めるよう、値の範囲に合わせて縦方向を広げる（マイナスを含む時だけゼロ線を描く）
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const pad = (hi - lo) * 0.15 || Math.abs(hi) * 0.1 || 1;
  const min = lo - pad;
  const max = hi + pad;
  const span = max - min;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * (w - 8) + 4, h - 4 - ((v - min) / span) * (h - 8)]);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const zeroY = h - 4 - ((0 - min) / span) * (h - 8);
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-10 w-full" preserveAspectRatio="none" aria-hidden>
      {lo < 0 && <line x1="0" x2={w} y1={zeroY} y2={zeroY} stroke="#34364a" strokeWidth="1" />}
      <path d={`${d} L${last[0]},${h} L${pts[0][0]},${h} Z`} fill={color} opacity="0.1" />
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <circle cx={last[0]} cy={last[1]} r="3.5" fill={color} stroke="#151726" strokeWidth="2" />
    </svg>
  );
}

export function IndustryDot({ color, glow }: { color: string; glow?: string }) {
  return (
    <span
      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
      style={{ background: color, boxShadow: glow ? `0 0 10px ${glow}` : undefined }}
      aria-hidden
    />
  );
}

export function Delta({ value, suffix = "%" }: { value: number | null; suffix?: string }) {
  if (value === null || !Number.isFinite(value)) return <span className="text-ink-3">—</span>;
  const up = value >= 0;
  return (
    <span className={up ? "text-[#0ca30c]" : "text-[#e66767]"}>
      <span aria-hidden>{up ? "▲" : "▼"}</span>
      <span className="sr-only">{up ? "増加" : "減少"}</span>
      {Math.abs(value).toFixed(1)}
      {suffix}
    </span>
  );
}
