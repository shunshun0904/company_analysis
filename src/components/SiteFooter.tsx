import Link from "next/link";
import { DATA_META } from "@/lib/data";

export default function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-6xl px-4 py-10 text-xs leading-relaxed text-ink-3 sm:px-6">
        <p>
          時価総額は{DATA_META.marketCapAsOf}、財務数値は各社の直近5期（連結）。金額は四捨五入して表示しています。
          掲載情報は企業研究の参考用であり、投資勧誘や将来の業績を保証するものではありません。
        </p>
        <p className="mt-2">
          出典と定義は
          <Link href="/about/" className="mx-1 text-ink-2 underline underline-offset-4 hover:text-ink">
            データについて
          </Link>
          をご覧ください。最終更新：{DATA_META.updatedAt}
        </p>
      </div>
    </footer>
  );
}
