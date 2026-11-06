import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <p className="text-6xl font-black neon-text">404</p>
      <p className="mt-3 text-ink-2">ページが見つかりませんでした。</p>
      <Link href="/" className="mt-6 inline-block rounded-full border border-white/20 px-5 py-2 text-sm hover:bg-white/5">
        ホームへ戻る
      </Link>
    </div>
  );
}
