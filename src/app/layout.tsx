import type { Metadata, Viewport } from "next";
import "@fontsource/noto-sans-jp/400.css";
import "@fontsource/noto-sans-jp/700.css";
import "@fontsource/noto-sans-jp/900.css";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/700.css";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: {
    default: "業界レーダー｜就活生のための企業比較",
    template: "%s｜業界レーダー",
  },
  description:
    "IT・通信、総合商社、自動車、メガバンク・金融の主要企業を、時価総額・売上・純利益・ROEなどのランキングとグラフで比較できる就活生向けサイト。",
};

export const viewport: Viewport = {
  themeColor: "#0d0e19",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>
        <div className="bg-stage" aria-hidden />
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
