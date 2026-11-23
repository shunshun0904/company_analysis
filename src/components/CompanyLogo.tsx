import Image from "next/image";
import logosJson from "@/data/logos.json";
import { getIndustry, type Company } from "@/lib/data";
import { hexA } from "@/lib/chartTheme";

/** scripts/fetch-logos.mjs が書き出すロゴ情報（ウィキメディア・コモンズのファイルとライセンス） */
export interface LogoInfo {
  src: string;
  width: number;
  height: number;
  file: string;
  page: string;
  license: string | null;
  artist: string | null;
  restrictions: string | null;
}

const LOGOS = logosJson as unknown as Record<string, LogoInfo | { missing: true }>;

/** basePath（GitHub Pages のサブパス）は next/image では自動で付かないため、自分で前に付ける */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function logoOf(code: string): LogoInfo | null {
  const l = LOGOS[code];
  return l && !("missing" in l) ? l : null;
}

/** ロゴを取得できた会社（「データについて」の出典一覧用） */
export function allLogos(): [string, LogoInfo][] {
  return Object.entries(LOGOS).filter((e): e is [string, LogoInfo] => !("missing" in e[1]));
}

const SIZE = {
  sm: { w: 56, h: 26, pad: 3, text: "text-[11px]" },
  md: { w: 88, h: 38, pad: 5, text: "text-sm" },
  lg: { w: 152, h: 68, pad: 8, text: "text-2xl" },
} as const;

/**
 * 会社のロゴ。ダーク背景でも黒いロゴが見えるよう白い台座に載せる。
 * ロゴが無い会社は業界色の頭文字マーク（実際のロゴではない）を出す。社名は必ず隣に文字で出すので装飾扱い（alt=""）。
 */
export default function CompanyLogo({
  company,
  size = "md",
  className = "",
}: {
  company: Pick<Company, "code" | "short" | "industry">;
  size?: keyof typeof SIZE;
  className?: string;
}) {
  const s = SIZE[size];
  const logo = logoOf(company.code);
  if (!logo) {
    const ind = getIndustry(company.industry)!;
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-lg font-bold text-ink ${s.text} ${className}`}
        style={{ width: s.h, height: s.h, background: hexA(ind.color, 0.22), border: `1px solid ${hexA(ind.color, 0.6)}` }}
        aria-hidden
      >
        {Array.from(company.short)[0]}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-lg bg-white shadow-[0_0_0_1px_rgba(255,255,255,0.08)] ${className}`}
      style={{ width: s.w, height: s.h, padding: s.pad }}
    >
      <Image src={`${BASE}${logo.src}`} alt="" width={logo.width} height={logo.height} className="h-full w-full object-contain" unoptimized />
    </span>
  );
}
