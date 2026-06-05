import type { AppView } from '../types/views';
import { NAV_ITEMS } from '../types/views';

interface SideNavProps {
  active: AppView;
  onNavigate: (view: AppView) => void;
  discoveryComplete?: boolean;
}

export default function SideNav({ active, onNavigate, discoveryComplete = false }: SideNavProps) {
  function handleNav(id: AppView, locked?: boolean) {
    if (locked) return;
    onNavigate(id);
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 hidden md:flex flex-col pt-20 pb-8 z-40 bg-surface-container-lowest/20 backdrop-blur-md border-r border-outline-variant">
      <div className="px-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary-container/20 border border-primary-fixed-dim flex items-center justify-center">
            <span className="material-symbols-outlined text-primary-fixed-dim text-sm">
              admin_panel_settings
            </span>
          </div>
          <div>
            <div className="font-label-caps text-label-caps text-primary-fixed-dim">ROOT_USER</div>
            <div className="text-[10px] text-on-surface-variant opacity-60">LEVEL_7_ACCESS</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map(({ id, icon, label, requiresDiscovery }) => {
          const locked = Boolean(requiresDiscovery && !discoveryComplete);
          return (
          <button
            key={id}
            type="button"
            onClick={() => handleNav(id, locked)}
            disabled={locked}
            title={locked ? 'Complete discovery questioning to unlock audit' : undefined}
            className={
              active === id
                ? 'w-full flex items-center gap-3 bg-primary-container/10 text-primary-fixed-dim border-l-2 border-primary-fixed-dim px-4 py-3 transition-colors duration-200'
                : locked
                  ? 'w-full flex items-center gap-3 text-outline/50 px-4 py-3 cursor-not-allowed'
                  : 'w-full flex items-center gap-3 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/20 px-4 py-3 transition-colors duration-200'
            }
          >
            <span className="material-symbols-outlined">{icon}</span>
            <span className="font-code-snippet text-code-snippet flex-1 text-left">{label}</span>
            {requiresDiscovery && discoveryComplete && (
              <span className="w-2 h-2 rounded-full bg-primary-fixed animate-pulse" aria-hidden />
            )}
          </button>
          );
        })}
      </nav>

      <div className="px-4 mt-auto">
        <button
          type="button"
          onClick={() => onNavigate('auditing')}
          className="w-full py-2 border border-primary-fixed-dim text-primary-fixed-dim font-bold font-code-snippet text-code-snippet hover:bg-primary-container/10 transition-all flex items-center justify-center gap-2"
        >
          <span className="text-xs">&gt;</span> EXECUTE_SCAN
        </button>
      </div>
    </aside>
  );
}
