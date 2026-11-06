"use client";

import { useEffect, useRef } from "react";
import { echarts, type EChartsOption } from "@/lib/echarts";

interface Props {
  option: EChartsOption;
  height?: number | string;
  ariaLabel: string;
  className?: string;
  onItemClick?: (params: { name?: string; data?: unknown; seriesName?: string }) => void;
  /** trueなら前のオプションを破棄して描き直す（系列数が変わる場合など） */
  notMerge?: boolean;
}

export default function EChart({ option, height = 360, ariaLabel, className, onItemClick, notMerge }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof echarts.init> | null>(null);
  const clickRef = useRef(onItemClick);

  useEffect(() => {
    clickRef.current = onItemClick;
  }, [onItemClick]);

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current, undefined, { renderer: "canvas" });
    chartRef.current = chart;
    chart.on("click", (p) => clickRef.current?.(p as { name?: string; data?: unknown; seriesName?: string }));
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(ref.current);
    return () => {
      ro.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    chartRef.current?.setOption(
      { animation: !reduce, ...option, aria: { enabled: true, label: { enabled: true, description: ariaLabel } } },
      { notMerge: !!notMerge },
    );
  }, [option, notMerge, ariaLabel]);

  return (
    <div
      ref={ref}
      className={className}
      style={{ height, width: "100%" }}
      role="img"
      aria-label={ariaLabel}
    />
  );
}
