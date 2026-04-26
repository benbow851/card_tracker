"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Icon } from "@/components/ui/Icon";

interface ChipGroup {
  param: string;
  thai: string;
  label: string;
  options: { value: string; label: string; color?: string }[];
}

const COLOR_CHIPS: ChipGroup = {
  param: "color",
  thai: "ธีมสี",
  label: "Color",
  options: [
    { value: "", label: "All" },
    { value: "Red", label: "Red", color: "bg-red-500" },
    { value: "Blue", label: "Blue", color: "bg-primary" },
    { value: "Green", label: "Green", color: "bg-tertiary" },
    { value: "Purple", label: "Purple", color: "bg-secondary" },
    { value: "Black", label: "Black", color: "bg-on-surface" },
    { value: "Yellow", label: "Yellow", color: "bg-amber-400" },
  ],
};

const TYPE_CHIPS: ChipGroup = {
  param: "type",
  thai: "ประเภทการ์ด",
  label: "Type",
  options: [
    { value: "", label: "All" },
    { value: "Leader", label: "Leader" },
    { value: "Character", label: "Character" },
    { value: "Event", label: "Event" },
    { value: "Stage", label: "Stage" },
  ],
};

const RARITY_CHIPS: ChipGroup = {
  param: "rarity",
  thai: "ความหายาก",
  label: "Rarity",
  options: [
    { value: "", label: "All" },
    { value: "C", label: "C" },
    { value: "UC", label: "UC" },
    { value: "R", label: "R" },
    { value: "SR", label: "SR" },
    { value: "SEC", label: "SEC" },
    { value: "L", label: "L" },
  ],
};

export function FilterBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    startTransition(() => {
      router.push(`/cards?${next.toString()}`);
    });
  }

  function clearAll() {
    const cat = params.get("category");
    startTransition(() => {
      router.push(cat ? `/cards?category=${cat}` : "/cards");
    });
  }

  const hasActive =
    params.get("color") || params.get("type") || params.get("rarity") || params.get("search");

  return (
    <div className="glass-panel rounded-2xl p-6 space-y-6">
      {/* Search */}
      <div className="relative">
        <Icon
          name="search"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm pointer-events-none"
        />
        <form
          action="/cards"
          method="get"
          className="flex gap-2"
        >
          {params.get("category") && (
            <input
              type="hidden"
              name="category"
              value={params.get("category") ?? ""}
            />
          )}
          <input
            type="text"
            name="search"
            defaultValue={params.get("search") ?? ""}
            placeholder="Search by name, set, number..."
            className="flex-1 bg-surface-container-highest border-none rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-1 focus:ring-primary focus:outline-none"
          />
          <button
            type="submit"
            className="bg-primary text-on-primary px-6 rounded-xl font-bold text-sm hover:brightness-110"
          >
            Search
          </button>
        </form>
      </div>

      {/* Chips */}
      {[COLOR_CHIPS, TYPE_CHIPS, RARITY_CHIPS].map((group) => {
        const active = params.get(group.param) ?? "";
        return (
          <div key={group.param} className="space-y-2">
            <h3 className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">
              {group.thai} <span className="opacity-60">· {group.label}</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {group.options.map((opt) => {
                const isActive = active === opt.value;
                return (
                  <button
                    key={opt.value || "all"}
                    onClick={() => update(group.param, opt.value)}
                    disabled={pending}
                    className={
                      "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all " +
                      (isActive
                        ? "bg-primary text-on-primary"
                        : "bg-surface-container-high text-on-surface-variant hover:text-on-surface")
                    }
                  >
                    {opt.color && (
                      <span
                        className={"w-2 h-2 rounded-full " + opt.color}
                      />
                    )}
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {hasActive && (
        <button
          onClick={clearAll}
          className="text-xs font-bold text-on-surface-variant hover:text-error flex items-center gap-1"
        >
          <Icon name="close" className="text-sm" />
          Clear all filters · ล้างตัวกรอง
        </button>
      )}
    </div>
  );
}
