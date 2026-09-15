import { useMemo, useState } from "react";
import type { Locale } from "../../i18n/LocaleContext";
import { optionLabel, ROLE_GROUPS } from "../../lib/talentTaxonomy";
interface RoleMultiSelectProps {
    locale: Locale;
    selected: string[];
    onChange: (roles: string[]) => void;
    legend: string;
    hint: string;
}
const interfaceCopy = {
    ko: { all: "전체", selected: "개 선택", empty: "관심 분야를 여러 개 선택할 수 있습니다." },
    en: { all: "All", selected: "selected", empty: "Choose as many fields as you are interested in." }
} as const;
export default function RoleMultiSelect({ locale, selected, onChange, legend, hint }: RoleMultiSelectProps) {
    const [activeGroup, setActiveGroup] = useState("all");
    const t = interfaceCopy[locale];
    const roles = useMemo(() => (activeGroup === "all" ? ROLE_GROUPS.flatMap((group) => group.roles) : ROLE_GROUPS.find((group) => group.id === activeGroup)?.roles || []), [activeGroup]);
    const toggleRole = (role: string) => {
        onChange(selected.includes(role) ? selected.filter((item) => item !== role) : [...selected, role]);
    };
    return (<fieldset>
      <legend className="text-base font-black text-[#17342d]">{legend}</legend>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
        <p className="max-w-xl text-xs leading-5 text-[#738781]">{hint}</p>
        <span aria-live="polite" className="rounded-full bg-[#eaf0ff] px-3 py-1 text-[11px] font-black text-[#324fc0]">
          {selected.length} {t.selected}
        </span>
      </div>

      <div role="group" className="mt-4 flex gap-2 overflow-x-auto pb-2" aria-label={legend}>
        <button type="button" aria-pressed={activeGroup === "all"} onClick={() => setActiveGroup("all")} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition ${activeGroup === "all" ? "border-[#4361ee] bg-[#4361ee] text-white" : "border-[#17342d]/15 bg-white text-[#49655e]"}`}>
          {t.all}
        </button>
        {ROLE_GROUPS.map((group) => (<button key={group.id} type="button" aria-pressed={activeGroup === group.id} onClick={() => setActiveGroup(group.id)} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition ${activeGroup === group.id ? "border-[#4361ee] bg-[#4361ee] text-white" : "border-[#17342d]/15 bg-white text-[#49655e]"}`}>
            {group.label[locale]}
          </button>))}
      </div>

      <p className="mt-1 text-[11px] leading-5 text-[#738781]">{t.empty}</p>
      <div className="mt-3 max-h-64 overflow-y-auto rounded-2xl border border-[#17342d]/10 bg-[#fbfcf9] p-3">
        <div className="flex flex-wrap gap-2">
          {roles.map((role) => {
            const isSelected = selected.includes(role.value);
            return (<button key={role.value} type="button" aria-pressed={isSelected} onClick={() => toggleRole(role.value)} className={`rounded-full border px-3 py-2 text-left text-xs font-bold leading-5 transition ${isSelected
                    ? "border-[#17342d] bg-[#17342d] text-white"
                    : "border-[#17342d]/12 bg-white text-[#315149] hover:border-[#17342d]/40"}`}>
                {optionLabel(role, locale)}
              </button>);
        })}
        </div>
      </div>
    </fieldset>);
}
