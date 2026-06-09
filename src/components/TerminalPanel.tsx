
interface TerminalPanelProps {
  onOpenAuditing?: () => void;
}

export default function TerminalPanel({ onOpenAuditing }: TerminalPanelProps) {
  return (
    <section className="max-w-3xl w-full terminal-panel backdrop-blur-md rounded shadow-2xl overflow-hidden">
      <div className="bg-surface-variant/40 px-4 py-2 flex justify-between items-center border-b border-outline-variant">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-error/40" />
          <div className="w-2.5 h-2.5 rounded-full bg-on-tertiary-container/40" />
          <div className="w-2.5 h-2.5 rounded-full bg-primary-fixed-dim/40" />
        </div>
        <div className="font-label-caps text-label-caps text-on-surface-variant tracking-widest">
          — compliance.ai —
        </div>
        <div className="w-12" />
      </div>

      <div className="p-8 space-y-6">
        <div className="flex justify-between items-start">
          <div className="text-[11px] text-on-surface-variant/60 font-code-snippet">
            VERSION: v4.0.2-build.09
            <br />
            LAST_AUTH: 2024-10-24_T22:04:11
          </div>
          <div className="text-on-tertiary-fixed-dim text-[11px] font-bold font-code-snippet">
            ORG: NEURAL_LINK
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="font-headline-lg text-headline-lg text-secondary-fixed-dim tracking-tight">
            Jupiter AI
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
            Verify AI alignment and regulatory compliance across distributed systems. High-precision
            automated governance for enterprise scale.
          </p>
        </div>
        {/* Verification Pipeline: Your System ──▶ Jupiter AI ──▶ Production Ready? */}
        <div className="border border-outline-variant/30 bg-surface-container-lowest/20 p-5 rounded font-code-snippet">
          <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4">
            {/* Step 1: Your System */}
            <div className="w-full md:w-auto md:flex-1 min-w-[140px] border border-outline-variant/50 bg-surface-container-low/30 px-4 py-2.5 rounded text-center">
              <div className="text-[9px] text-outline uppercase tracking-wider mb-0.5">Target</div>
              <div className="text-[13px] font-bold text-on-surface uppercase tracking-wide whitespace-nowrap">YOUR SYSTEM</div>
            </div>

            {/* Connection Arrow */}
            <div className="text-outline/40 text-sm select-none">
              <span className="hidden md:inline">──▶</span>
              <span className="md:hidden">▼</span>
            </div>

            {/* Step 2: Jupiter AI (Us) */}
            <div className="w-full md:w-auto md:flex-1 min-w-[140px] border border-primary-fixed/40 bg-primary-fixed/5 px-4 py-2.5 rounded text-center shadow-[0_0_15px_rgba(var(--color-primary),0.02)]">
              <div className="text-[9px] text-primary-fixed-dim uppercase tracking-wider mb-0.5">Auditor</div>
              <div className="text-[13px] font-bold text-primary-fixed uppercase tracking-wider whitespace-nowrap">JUPITER AI</div>
            </div>

            {/* Connection Arrow */}
            <div className="text-outline/40 text-sm select-none">
              <span className="hidden md:inline">──▶</span>
              <span className="md:hidden">▼</span>
            </div>

            {/* Step 3: Production Status */}
            <div className="w-full md:w-auto md:flex-1 min-w-[160px] border border-outline-variant/50 bg-surface-container-low/30 px-4 py-2.5 rounded text-center">
              <div className="text-[9px] text-outline uppercase tracking-wider mb-0.5">Decision</div>
              <div className="text-[12px] font-bold text-secondary-fixed-dim uppercase tracking-wide whitespace-nowrap">PRODUCTION READY?</div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenAuditing}
          className="pt-2 w-full flex items-center font-code-snippet text-primary-fixed-dim text-lg hover:opacity-90 transition-opacity text-left group"
          aria-label="Start auditing"
        >
          <span className="mr-3">$</span>
          <span className="text-on-surface opacity-90 group-hover:text-primary-fixed transition-colors">
            start_auditing
          </span>
          <span className="block-cursor" />
        </button>
      </div>    </section>
  );
}
