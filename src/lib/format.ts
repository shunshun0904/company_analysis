/** 百万円単位の金額を「兆円 / 億円」で表示する */
export function fmtYen(millions: number, opts: { compact?: boolean } = {}): string {
  const abs = Math.abs(millions);
  const sign = millions < 0 ? "−" : "";
  if (abs >= 1_000_000) {
    const cho = abs / 1_000_000;
    const digits = opts.compact ? (cho >= 10 ? 1 : 2) : cho >= 10 ? 1 : 2;
    return `${sign}${cho.toFixed(digits)}兆円`;
  }
  return `${sign}${Math.round(abs / 100).toLocaleString("ja-JP")}億円`;
}

/** 数値部分と単位を分けて返す（大きな数字の表示用） */
export function splitYen(millions: number): { value: string; unit: string } {
  const s = fmtYen(millions);
  const m = s.match(/^(−?[\d.,]+)(.*)$/);
  return m ? { value: m[1], unit: m[2] } : { value: s, unit: "" };
}

/** 軸目盛り用（兆円単位の数値） */
export function toCho(millions: number): number {
  return millions / 1_000_000;
}

export function fmtPct(v: number | null, digits = 1): string {
  if (v === null || !Number.isFinite(v)) return "—";
  return `${v.toFixed(digits)}%`;
}

export function fmtTimes(v: number | null, digits = 1): string {
  if (v === null || !Number.isFinite(v)) return "—";
  return `${v.toFixed(digits)}倍`;
}

export function fmtYenShort(millions: number): string {
  return fmtYen(millions, { compact: true });
}
