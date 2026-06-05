const DETAILS = [  { key: 'APPLICATION', value: 'NEURAL LINK COMPLIANCE NODE' },
  { key: 'ENVIRONMENT', value: 'PRODUCTION' },
  { key: 'FRAMEWORK', value: 'FED_GOVERNANCE_v4.2' },
  { key: 'ONTOLOGY', value: 'LOADED // NEO4J + QDRANT' },
] as const;

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
        {/* Inline system details — same terminal window, no second title bar */}
        <div className="border border-outline-variant/40 bg-surface-container-lowest/30 p-4">
          <div className="text-[10px] text-outline font-code-snippet uppercase tracking-widest mb-3">
            &gt; system_details
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
            {DETAILS.map(({ key, value }) => (
              <div key={key} className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
                <span className="text-[10px] text-outline font-code-snippet uppercase shrink-0">
                  {key}:
                </span>
                <span className="text-[11px] text-primary-fixed font-code-snippet uppercase">
                  {value}
                </span>
              </div>
            ))}
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
