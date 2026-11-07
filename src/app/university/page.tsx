import type { Metadata } from "next";
import { Suspense } from "react";
import { SectionTitle } from "@/components/ui";
import UniversityFinder from "./UniversityFinder";

export const metadata: Metadata = { title: "大学から探す" };

export default function UniversityPage() {
  return (
    <div className="pt-10">
      <SectionTitle
        eyebrow="FIND BY UNIVERSITY"
        title={<span className="text-3xl sm:text-4xl">大学から探す</span>}
        lead="自分の大学から、掲載企業に何人が就職しているか、どの会社の社長が同じ大学出身かを調べられます。"
        accent="#5ce1ff"
      />
      <Suspense fallback={<div className="card h-64 animate-pulse" />}>
        <UniversityFinder />
      </Suspense>
    </div>
  );
}
