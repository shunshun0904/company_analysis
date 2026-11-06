import type { Metadata } from "next";
import { Suspense } from "react";
import { SectionTitle } from "@/components/ui";
import CompareClient from "./CompareClient";

export const metadata: Metadata = { title: "企業を比較" };

export default function ComparePage() {
  return (
    <div className="pt-10">
      <SectionTitle
        eyebrow="COMPARE"
        title={<span className="text-3xl sm:text-4xl">気になる3社を比べる</span>}
        lead="業界をまたいで最大3社まで選べます。URLをコピーすれば、同じ比較を友だちと共有できます。"
        accent="#ff7fb5"
      />
      <Suspense fallback={<div className="card h-64 animate-pulse" />}>
        <CompareClient />
      </Suspense>
    </div>
  );
}
