import type { AppView } from '../types/views';

const COPY: Record<Exclude<AppView, 'dashboard' | 'auditing'>, { title: string; desc: string }> = {
  audit_report: {
    title: 'AUDIT_REPORT',
    desc: 'Completed discovery runs, compliance findings, and exportable audit ledgers will appear here.',
  },
  sys_config: {
    title: 'SYS_CONFIG',
    desc: 'Application profile, tools, data assets, policies, and audit endpoint configuration.',
  },
};

interface PlaceholderViewProps {
  view: keyof typeof COPY;
}

export default function PlaceholderView({ view }: PlaceholderViewProps) {
  const { title, desc } = COPY[view];
  return (
    <div className="flex-1 flex items-center justify-center p-10">
      <div className="glass-panel p-10 max-w-lg w-full text-center">
        <span className="material-symbols-outlined text-primary-fixed text-[40px] mb-4">construction</span>
        <h2 className="font-headline-md text-headline-md text-primary-fixed-dim mb-3">{title}</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
