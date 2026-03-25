import { useState } from "react";
import { ChevronDown, Settings2 } from "lucide-react";
import { getCurrentRole, ROLE_INFO, setCurrentRole, USER_ROLES } from "../services/roleService";
import { prepareRuntimeForRoleChange } from "../services/runtimeStateService";

export function RoleSwitcher({ onRoleChange }) {
  const [role, setRole] = useState(getCurrentRole);
  const [open, setOpen] = useState(false);
  const info = ROLE_INFO[role] || ROLE_INFO.standard;

  function pickRole(next) {
    const previousRole = role;
    if (next === previousRole) {
      setOpen(false);
      return;
    }
    prepareRuntimeForRoleChange(next, previousRole);
    setCurrentRole(next);
    setRole(next);
    setOpen(false);
    onRoleChange?.(next);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        className={`flex items-center gap-1.5 rounded-xl border border-white/20 bg-slate-900/80 px-2 py-1.5 text-xs font-bold transition hover:bg-white/10 ${info.color}`}
        title="Mode dev : changer le rôle"
      >
        <Settings2 className="h-3 w-3" />
        {info.label}
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[180px] overflow-hidden rounded-xl border border-white/20 bg-slate-900 shadow-xl">
          <p className="border-b border-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white/50">
            Mode dev – Rôle actif
          </p>
          {USER_ROLES.map((item) => {
            const itemInfo = ROLE_INFO[item];
            return (
              <button
                key={item}
                onClick={() => pickRole(item)}
                className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs font-semibold transition hover:bg-white/10 ${item === role ? "bg-white/10" : ""}`}
              >
                <span className={itemInfo.color}>{itemInfo.label}</span>
                <span className="text-white/50">{itemInfo.description}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function DevRoleBanner({ onRoleChange }) {
  const [role, setRole] = useState(getCurrentRole);
  const info = ROLE_INFO[role] || ROLE_INFO.free;

  function handleChange(next) {
    if (next === role) return;
    setRole(next);
    onRoleChange?.(next);
  }

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-amber-300/30 bg-amber-300/10 px-4 py-2">
      <p className="text-xs font-semibold text-amber-100">
        <span className="font-black text-amber-300">Mode dev actif.</span> Rôle courant :
        <span className={`ml-1 font-black ${info.color}`}>{info.label}</span>
      </p>
      <RoleSwitcher onRoleChange={handleChange} />
    </div>
  );
}
