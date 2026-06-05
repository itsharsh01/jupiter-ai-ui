import type { AuthUser } from '../api/auth';

const iconLinks = ['terminal', 'settings', 'help_outline'];

interface TopNavProps {
  user: AuthUser | null;
  onLogout: () => void;
}

export default function TopNav({ user, onLogout }: TopNavProps) {
  return (
    <header className="fixed top-0 w-full z-50 flex justify-between items-center px-10 py-1 bg-surface/30 backdrop-blur-xl border-b border-outline-variant">
      <div className="font-headline-md text-headline-md text-primary-fixed-dim tracking-tighter">
        COMPLIANCE_SYS_v4.0.2
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <div className="hidden sm:flex items-center gap-2 mr-2 border-r border-outline-variant pr-3">
            <span className="material-symbols-outlined text-primary-fixed-dim text-[18px]">
              account_circle
            </span>
            <span className="font-code-snippet text-[11px] text-on-surface-variant uppercase">
              {user.email}
            </span>
          </div>
        )}
        {iconLinks.map((icon) => (
          <span
            key={icon}
            className="material-symbols-outlined text-primary-fixed-dim p-2 hover:bg-primary-container/10 cursor-pointer text-[22px]"
          >
            {icon}
          </span>
        ))}
        <button
          type="button"
          onClick={onLogout}
          className="font-code-snippet text-[11px] text-primary-fixed border border-primary-fixed-dim px-3 py-1 uppercase hover:bg-primary-container/10"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
