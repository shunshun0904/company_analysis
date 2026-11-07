"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import RankingBars from "./RankingBars";
import { univTotals } from "@/lib/data";

/** 掲載企業への就職者が多い大学（大学通信の上位掲載分の合計）。1系列なので1色 */
export default function UnivTotalsChart({ top = 12 }: { top?: number }) {
  const router = useRouter();
  const items = useMemo(
    () =>
      univTotals()
        .slice(0, top)
        .map((u) => ({ code: u.univ, label: u.univ.replace(/大学$/, "大"), value: u.total, color: "#199e70", sub: `${u.companies}社に登場` })),
    [top],
  );
  return (
    <div>
      <RankingBars items={items} format="people" ariaLabel="掲載企業への就職者数が多い大学" linkToCompany={false} rowHeight={32} />
      <div className="mt-3 flex flex-wrap gap-2">
        {items.slice(0, 8).map((u) => (
          <button key={u.code} onClick={() => router.push(`/university/?u=${encodeURIComponent(u.code)}`)} className="chip hover:text-ink">
            {u.label}の就職先を見る →
          </button>
        ))}
      </div>
    </div>
  );
}
