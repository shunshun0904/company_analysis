"use client";

interface Tab<K extends string> {
  key: K;
  label: string;
}

export default function MetricTabs<K extends string>({
  tabs,
  value,
  onChange,
  accent = "#5ce1ff",
  label,
}: {
  tabs: Tab<K>[];
  value: K;
  onChange: (k: K) => void;
  accent?: string;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="scrollbar-none -mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
      {tabs.map((t) => {
        const active = t.key === value;
        return (
          <button
            key={t.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.key)}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] transition ${
              active ? "text-ink" : "border-white/10 text-ink-2 hover:border-white/25 hover:text-ink"
            }`}
            style={
              active
                ? {
                    borderColor: accent,
                    background: `color-mix(in srgb, ${accent} 18%, transparent)`,
                    boxShadow: `0 0 16px -4px ${accent}`,
                  }
                : undefined
            }
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
