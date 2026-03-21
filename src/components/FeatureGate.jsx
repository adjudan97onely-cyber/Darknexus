import { Lock } from "lucide-react";
import { getCurrentRole, getRequiredRoleLabel, getUpgradeMessage, hasAccess } from "../services/roleService";

export function UpgradeBadge({ feature, compact = false }) {
  const label = getRequiredRoleLabel(feature);
  if (!label) return null;
  if (compact) {
    return (
      <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-amber-300/20 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-200">
        <Lock className="h-2.5 w-2.5" /> {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-300/20 px-2 py-1 text-xs font-bold text-amber-200">
      <Lock className="h-3 w-3" /> Disponible en {label}
    </span>
  );
}

export function LockedOverlay({ feature, children }) {
  const role = getCurrentRole();
  if (hasAccess(feature, role)) return children;
  const msg = getUpgradeMessage(feature);
  const label = getRequiredRoleLabel(feature);
  return (
    <div className="relative select-none overflow-hidden rounded-2xl">
      <div className="pointer-events-none opacity-30 blur-sm">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-slate-950/80 p-4 text-center">
        <Lock className="h-8 w-8 text-amber-300" />
        <p className="max-w-xs text-sm font-semibold text-white">{msg}</p>
        {label && (
          <span className="rounded-full bg-amber-300 px-3 py-1 text-xs font-black text-slate-900">
            Disponible en {label}
          </span>
        )}
      </div>
    </div>
  );
}

export function FeatureGate({ feature, fallback, children }) {
  const role = getCurrentRole();
  if (hasAccess(feature, role)) return children;
  if (fallback !== undefined) return fallback ?? null;

  const msg = getUpgradeMessage(feature);
  const label = getRequiredRoleLabel(feature);
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-amber-300/25 bg-slate-950/60 p-5 text-center">
      <Lock className="h-6 w-6 text-amber-300" />
      <p className="text-sm font-semibold text-white/90">{msg}</p>
      {label && (
        <span className="rounded-full bg-amber-300/20 px-3 py-1 text-xs font-bold text-amber-200">
          Disponible en {label}
        </span>
      )}
    </div>
  );
}
