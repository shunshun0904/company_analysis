// チャート共通のトークン（ダーク面で検証した値）。
// 文字色はテキストトークンのみを使い、系列色は図形（棒・線・点）にだけ使う。
export const T = {
  surface: "#151726",
  page: "#0d0e19",
  textPrimary: "#f0efec",
  textSecondary: "#c3c2b7",
  textMuted: "#8b8a99",
  grid: "#24263a",
  axis: "#34364a",
  muted: "#4a4c63",
  font: '"Space Grotesk", "Noto Sans JP", system-ui, sans-serif',
};

/** 比較ページ用の3スロット（全ペアで色覚シミュレーション検証済み） */
export const COMPARE_COLORS = ["#3987e5", "#d95926", "#199e70"];

export const tooltipBase = {
  backgroundColor: "rgba(16,17,30,0.96)",
  borderColor: "rgba(255,255,255,0.12)",
  borderWidth: 1,
  padding: [10, 12],
  textStyle: { color: T.textPrimary, fontFamily: T.font, fontSize: 12 },
  extraCssText: "border-radius:10px; box-shadow:0 8px 24px rgba(0,0,0,.45);",
};

export const axisLabel = {
  color: T.textMuted,
  fontFamily: T.font,
  fontSize: 11,
};

export const splitLine = { lineStyle: { color: T.grid, width: 1, type: "solid" as const } };

export function hexA(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

/** ツールチップ内の色付きマーカー（識別は図形で、文字はテキスト色で） */
export function dot(color: string): string {
  return `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};margin-right:6px;vertical-align:middle"></span>`;
}
