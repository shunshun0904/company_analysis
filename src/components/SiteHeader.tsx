"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { INDUSTRIES } from "@/lib/data";

const NAV = [
  { href: "/", label: "ホーム" },
  ...INDUSTRIES.map((i) => ({ href: `/industry/${i.id}/`, label: i.name, color: i.color, glow: i.glow })),
  { href: "/compare/", label: "企業を比較" },
  { href: "/about/", label: "データについて" },
] as { href: string; label: string; color?: string; glow?: string }[];

export default function SiteHeader() {
  const pathname = usePathname() || "/";
  const norm = (p: string) => (p.endsWith("/") ? p : p + "/");
  const isActive = (href: string) => (href === "/" ? norm(pathname) === "/" : norm(pathname).startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-[#0d0e19]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="業界レーダー ホーム">
          <span className="relative grid h-8 w-8 place-items-center rounded-lg border border-white/15 bg-white/5">
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
              <circle cx="12" cy="12" r="9" fill="none" stroke="#5ce1ff" strokeOpacity=".5" />
              <circle cx="12" cy="12" r="5" fill="none" stroke="#ff7fb5" strokeOpacity=".7" />
              <path d="M12 12 L19 6" stroke="#5ce1ff" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="12" r="1.6" fill="#f0efec" />
            </svg>
          </span>
          <span className="leading-tight">
            <span className="block text-[15px] font-bold tracking-wide">業界レーダー</span>
            <span className="block text-[10px] tracking-[0.2em] text-ink-3">SHUKATSU DATA</span>
          </span>
        </Link>
        <nav className="scrollbar-none -mr-4 flex flex-1 items-center gap-1 overflow-x-auto pr-4 sm:mr-0 sm:justify-end sm:pr-0" aria-label="メインメニュー">
          {NAV.map((n) => {
            const active = isActive(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] transition ${
                  active ? "bg-white/10 text-ink" : "text-ink-2 hover:bg-white/5 hover:text-ink"
                }`}
              >
                {n.color && (
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: n.color, boxShadow: active ? `0 0 10px ${n.glow}` : undefined }}
                    aria-hidden
                  />
                )}
                {n.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
