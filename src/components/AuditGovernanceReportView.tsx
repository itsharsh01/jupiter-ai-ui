import { useEffect, useMemo, useState } from 'react';
import {
  fetchGovernanceAuditReport,
  type GovernanceAuditReport,
} from '../api/audit';
import JupiterLoader from './JupiterLoader';

const REPORT_TABS = [
  { id: 'tab-1', label: '1. EXECUTIVE SUMMARY' },
  { id: 'tab-2', label: '2. SYSTEM UNDERSTANDING' },
  { id: 'tab-3', label: '3. ASSET INVENTORY' },
  { id: 'tab-4', label: '4. POLICY COVERAGE' },
  { id: 'tab-5', label: '5. RISK ASSESSMENT' },
  { id: 'tab-6', label: '6. TEST EXECUTION' },
  { id: 'tab-7', label: '7. POLICY VIOLATIONS' },
  { id: 'tab-8', label: '8. CONTROL EFFECTIVENESS' },
  { id: 'tab-9', label: '9. REMEDIATION PLAN' },
] as const;

type ReportTabId = (typeof REPORT_TABS)[number]['id'];

interface AuditGovernanceReportViewProps {
  auditId: string;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asList(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' ? value : fallback;
}

function findingBadgeClass(level: string): string {
  switch (level) {
    case 'CRITICAL':
      return 'flex items-center gap-2 px-3 py-1 border border-error text-error bg-error/10';
    case 'HIGH':
      return 'flex items-center gap-2 px-3 py-1 border border-tertiary-fixed-dim text-tertiary-fixed-dim bg-tertiary-fixed-dim/10';
    case 'MEDIUM':
      return 'flex items-center gap-2 px-3 py-1 border border-[#f1fa8c] text-[#f1fa8c] bg-[#f1fa8c]/10';
    default:
      return 'flex items-center gap-2 px-3 py-1 border border-secondary text-secondary bg-secondary/10';
  }
}

function controlStatusClass(status: string): string {
  const s = status.toLowerCase();
  if (s === 'passed' || s === 'effective') return 'text-primary-container';
  if (s === 'failed' || s === 'weak') return 'text-error';
  return 'text-tertiary-fixed-dim';
}

function controlStatusLabel(status: string): string {
  const s = status.toLowerCase();
  if (s === 'passed') return 'EFFECTIVE';
  if (s === 'failed') return 'WEAK';
  if (s === 'partial') return 'PARTIAL';
  return status.toUpperCase();
}

function sensitivityClass(level: string): string {
  const s = level.toUpperCase();
  if (s === 'CRITICAL' || s === 'HIGH') return 'text-error';
  if (s === 'MEDIUM') return 'text-tertiary-fixed-dim';
  return 'text-on-surface';
}

function ScoreRing({ score }: { score: number }) {
  const circumference = 251.2;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#3E4451" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="#50fa7b"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-headline-lg text-headline-lg text-primary-container">{score}</span>
        <span className="font-label-caps text-label-caps text-on-surface-variant">/100</span>
      </div>
    </div>
  );
}

function TabExecutive({ report }: { report: GovernanceAuditReport }) {
  const ex = asRecord(report.executive_summary);
  const scores = asRecord(ex.scores);
  const findings = asRecord(ex.findings_by_severity);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
      <div className="col-span-1 md:col-span-4 glass-panel p-4 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-container to-transparent opacity-50" />
        <span className="font-label-caps text-label-caps text-on-surface-variant self-start mb-4">
          GOVERNANCE SCORE
        </span>
        <ScoreRing score={asNumber(scores.governance, 0)} />
      </div>
      <div className="col-span-1 md:col-span-8 glass-panel p-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 h-full">
          {(
            [
              ['SECURITY', scores.security, 'text-tertiary-fixed-dim'],
              ['PRIVACY', scores.privacy, 'text-primary-container'],
              ['COMPLIANCE', scores.compliance, 'text-primary-container'],
              ['OBSERVABILITY', scores.observability, 'text-primary-container'],
            ] as const
          ).map(([label, value, color]) => (
            <div key={label} className="flex flex-col justify-between border-l border-[#3E4451] pl-4">
              <span className="font-label-caps text-label-caps text-on-surface-variant">{label}</span>
              <span className={`font-headline-md text-headline-md ${color}`}>{asNumber(value, 0)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="col-span-1 md:col-span-12 glass-panel p-4">
        <span className="font-label-caps text-label-caps text-on-surface-variant mb-4 block border-b border-[#3E4451] pb-2">
          FINDINGS SUMMARY
        </span>
        <div className="flex flex-wrap gap-4 font-code-snippet text-code-snippet">
          {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((level) => (
            <div key={level} className={findingBadgeClass(level)}>
              {level}: {asNumber(findings[level], 0)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TabSystem({ report }: { report: GovernanceAuditReport }) {
  const ex = asRecord(report.executive_summary);
  const sys = asRecord(report.system_understanding);

  return (
    <div className="glass-panel p-4 mb-6">
      <span className="font-label-caps text-label-caps text-on-surface-variant mb-4 block border-b border-[#3E4451] pb-2">
        ARCHITECTURE OVERVIEW
      </span>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-code-snippet text-code-snippet text-on-surface">
        <div>
          <p className="mb-2">
            <span className="text-primary-container">SYS_NAME:</span> {String(ex.system_name || '')}
          </p>
          <p className="mb-2">
            <span className="text-primary-container">TYPE:</span> {String(ex.architecture || 'Agentic RAG System')}
          </p>
          <p className="mb-2">
            <span className="text-primary-container">CORE_LLM:</span> {String(ex.models || '')}
          </p>
        </div>
        <div>
          <p className="mb-2">
            <span className="text-primary-container">FRAMEWORK:</span> {String(ex.framework || '')}
          </p>
          <p className="mb-2">
            <span className="text-primary-container">FLOW:</span> {String(sys.architecture_flow || '')}
          </p>
          <p className="mb-2">
            <span className="text-primary-container">KG_NODES:</span> {String(sys.nodes_discovered ?? '—')}
          </p>
        </div>
      </div>
    </div>
  );
}

function TabAssets({ report }: { report: GovernanceAuditReport }) {
  const inv = asRecord(report.asset_inventory);
  const assets = asList(inv.sensitive_assets);

  return (
    <div className="glass-panel p-4 mb-6">
      <span className="font-label-caps text-label-caps text-on-surface-variant mb-4 block border-b border-[#3E4451] pb-2">
        SENSITIVE ASSETS IDENTIFIED
      </span>
      <table className="w-full text-left font-code-snippet text-code-snippet">
        <thead>
          <tr className="text-on-surface-variant border-b border-[#3E4451]">
            <th className="py-2">ASSET_TYPE</th>
            <th className="py-2">LOCATION</th>
            <th className="py-2">SENSITIVITY</th>
          </tr>
        </thead>
        <tbody className="text-on-surface">
          {assets.length === 0 ? (
            <tr>
              <td colSpan={3} className="py-3 text-outline">
                No sensitive assets mapped in knowledge graph.
              </td>
            </tr>
          ) : (
            assets.map((asset, i) => (
              <tr key={i} className="border-b border-[#3E4451]/50">
                <td className="py-3">{String(asset.name)}</td>
                <td className="py-3">{String(asset.classification || asset.description || '—')}</td>
                <td className={`py-3 ${sensitivityClass(String(asset.risk_level || 'MEDIUM'))}`}>
                  {String(asset.risk_level || 'MEDIUM')}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function TabPolicy({ report }: { report: GovernanceAuditReport }) {
  const pol = asRecord(report.policy_coverage);
  const policies = asList(pol.policies_identified);

  return (
    <div className="glass-panel p-4 mb-6">
      <span className="font-label-caps text-label-caps text-on-surface-variant mb-4 block border-b border-[#3E4451] pb-2">
        APPLICABLE POLICIES
      </span>
      <ul className="space-y-3 font-code-snippet text-code-snippet text-on-surface">
        {policies.length === 0 ? (
          <li className="text-outline">No policies evaluated yet.</li>
        ) : (
          policies.map((p, i) => {
            const effectiveness = String(p.controls || '').toLowerCase();
            const passed = effectiveness === 'passed';
            const failed = effectiveness === 'failed';
            return (
              <li key={i} className="flex items-center gap-3">
                <span
                  className={`material-symbols-outlined text-sm ${
                    passed ? 'text-primary-container' : failed ? 'text-error' : 'text-tertiary-fixed-dim'
                  }`}
                >
                  {passed ? 'check_circle' : failed ? 'cancel' : 'error'}
                </span>
                {String(p.policy)} ({String(p.controls)})
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}

function TabRisks({ report }: { report: GovernanceAuditReport }) {
  const risk = asRecord(report.risk_assessment);
  const matrix = asList(risk.risk_matrix);

  return (
    <div className="glass-panel p-4 mb-6">
      <span className="font-label-caps text-label-caps text-on-surface-variant mb-4 block border-b border-[#3E4451] pb-2">
        INHERENT VS RESIDUAL RISK
      </span>
      {matrix.length === 0 ? (
        <div className="p-4 border border-[#3E4451] bg-surface/50 font-code-snippet text-code-snippet text-on-surface text-center">
          No risk assessments recorded yet.
        </div>
      ) : (
        <table className="w-full text-left font-code-snippet text-code-snippet">
          <thead>
            <tr className="text-on-surface-variant border-b border-[#3E4451]">
              <th className="py-2">RISK</th>
              <th className="py-2">SEVERITY</th>
              <th className="py-2">STATUS</th>
            </tr>
          </thead>
          <tbody className="text-on-surface">
            {matrix.map((row, i) => (
              <tr key={i} className="border-b border-[#3E4451]/50">
                <td className="py-3">{String(row.risk)}</td>
                <td className={`py-3 ${sensitivityClass(String(row.severity || 'MEDIUM'))}`}>
                  {String(row.severity)}
                </td>
                <td className={row.status === 'Passed' ? 'text-primary-container' : 'text-error'}>
                  {String(row.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function TabTests({ report }: { report: GovernanceAuditReport }) {
  const tests = asRecord(report.test_execution);
  const total = asNumber(tests.total_generated);
  const executed = asNumber(tests.executed);
  const failed = asNumber(tests.failed);
  const passRate = executed > 0 ? ((executed - failed) / executed) * 100 : 0;

  return (
    <div className="glass-panel p-4 mb-6">
      <span className="font-label-caps text-label-caps text-on-surface-variant mb-4 block border-b border-[#3E4451] pb-2">
        AUTOMATED TEST RESULTS
      </span>
      <div className="flex flex-wrap gap-8 font-code-snippet text-code-snippet">
        <div>
          <p className="text-on-surface-variant mb-1">TOTAL SCENARIOS RUN</p>
          <p className="text-2xl text-on-surface">{executed || total}</p>
        </div>
        <div>
          <p className="text-on-surface-variant mb-1">PASS RATE</p>
          <p className="text-2xl text-primary-container">{passRate.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-on-surface-variant mb-1">FAILED SCENARIOS</p>
          <p className="text-2xl text-error">{failed}</p>
        </div>
      </div>
    </div>
  );
}

function TabViolations({ report }: { report: GovernanceAuditReport }) {
  const violations = report.policy_violations;

  return (
    <div className="glass-panel p-4 mb-6">
      <span className="font-label-caps text-label-caps text-on-surface-variant mb-4 block border-b border-[#3E4451] pb-2">
        CRITICAL FINDINGS
      </span>
      {violations.length === 0 ? (
        <p className="font-code-snippet text-primary-container">No policy violations recorded.</p>
      ) : (
        <div className="space-y-4">
          {violations.map((v) => (
            <div key={String(v.finding_id)} className="border-l-2 border-error pl-4 py-2 font-code-snippet text-code-snippet">
              <p className="text-error font-bold mb-2">
                VIO-{String(v.finding_id).padStart(3, '0')}: {String(v.title)}
              </p>
              <p className="text-on-surface mb-2">
                {String(v.root_cause || v.risk || 'Policy violation detected during automated test execution.')}
              </p>
              <p className="text-on-surface-variant">
                Evidence: {String(v.test_prompt)} · Trace: {String(v.trace_id || 'pending')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TabControls({ report }: { report: GovernanceAuditReport }) {
  const ctrl = asRecord(report.control_effectiveness);
  const controls = asList(ctrl.controls);

  return (
    <div className="glass-panel p-4 mb-6">
      <span className="font-label-caps text-label-caps text-on-surface-variant mb-4 block border-b border-[#3E4451] pb-2">
        CONTROL EVALUATION
      </span>
      <table className="w-full text-left font-code-snippet text-code-snippet">
        <thead>
          <tr className="text-on-surface-variant border-b border-[#3E4451]">
            <th className="py-2">CONTROL_ID</th>
            <th className="py-2">DESCRIPTION</th>
            <th className="py-2">STATUS</th>
          </tr>
        </thead>
        <tbody className="text-on-surface">
          {controls.length === 0 ? (
            <tr>
              <td colSpan={3} className="py-3 text-outline">
                No controls evaluated yet.
              </td>
            </tr>
          ) : (
            controls.map((c, i) => (
              <tr key={i} className="border-b border-[#3E4451]/50">
                <td className="py-3">CTL-{String(i + 1).padStart(3, '0')}</td>
                <td className="py-3">{String(c.control)}</td>
                <td className={`py-3 ${controlStatusClass(String(c.effectiveness || ''))}`}>
                  {controlStatusLabel(String(c.effectiveness || ''))}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function TabRemediation({ report }: { report: GovernanceAuditReport }) {
  const plan = asRecord(report.remediation_plan);
  const immediate = asList(plan.immediate);
  const shortTerm = asList(plan.short_term);
  const longTerm = asList(plan.long_term);

  return (
    <div className="glass-panel p-4 mb-6">
      <span className="font-label-caps text-label-caps text-on-surface-variant mb-4 block border-b border-[#3E4451] pb-2">
        REQUIRED ACTIONS
      </span>
      <ul className="space-y-4 font-code-snippet text-code-snippet text-on-surface">
        {immediate.map((item, i) => (
          <li key={`imm-${i}`} className="p-3 bg-error/10 border border-error">
            <span className="font-bold text-error block mb-1">IMMEDIATE (0-7 Days)</span>
            {String(item)}
          </li>
        ))}
        {shortTerm.map((item, i) => (
          <li key={`st-${i}`} className="p-3 bg-tertiary-fixed-dim/10 border border-tertiary-fixed-dim">
            <span className="font-bold text-tertiary-fixed-dim block mb-1">SHORT TERM (14-30 Days)</span>
            {String(item)}
          </li>
        ))}
        {longTerm.map((item, i) => (
          <li key={`lt-${i}`} className="p-3 bg-surface-variant border border-[#3E4451]">
            <span className="font-bold text-on-surface-variant block mb-1">LONG TERM (60+ Days)</span>
            {String(item)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TabContent({ tab, report }: { tab: ReportTabId; report: GovernanceAuditReport }) {
  switch (tab) {
    case 'tab-1':
      return <TabExecutive report={report} />;
    case 'tab-2':
      return <TabSystem report={report} />;
    case 'tab-3':
      return <TabAssets report={report} />;
    case 'tab-4':
      return <TabPolicy report={report} />;
    case 'tab-5':
      return <TabRisks report={report} />;
    case 'tab-6':
      return <TabTests report={report} />;
    case 'tab-7':
      return <TabViolations report={report} />;
    case 'tab-8':
      return <TabControls report={report} />;
    case 'tab-9':
      return <TabRemediation report={report} />;
    default:
      return null;
  }
}

export default function AuditGovernanceReportView({ auditId }: AuditGovernanceReportViewProps) {
  const [report, setReport] = useState<GovernanceAuditReport | null>(null);
  const [activeTab, setActiveTab] = useState<ReportTabId>('tab-1');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchGovernanceAuditReport(auditId)
      .then((data) => {
        if (!cancelled) setReport(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load report');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [auditId]);

  const header = useMemo(() => {
    if (!report) return null;
    const ex = asRecord(report.executive_summary);
    return {
      systemName: String(ex.system_name || 'AI System'),
      date: String(ex.audit_date || ''),
      industry: String(ex.industry || ''),
      arch: String(ex.architecture || ex.framework || ''),
    };
  }, [report]);

  const verdict = asRecord(report?.final_verdict);

  if (loading) {
    return (
      <JupiterLoader fullscreen text="Generating governance report…" />
    );
  }

  if (error || !report) {
    return (
      <div className="flex-1 flex items-center justify-center p-10">
        <p className="font-code-snippet text-error">{error ?? 'Report unavailable'}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto min-h-0 pb-24">
      <div className="max-w-[1600px] mx-auto px-6 py-10">
        <div className="mb-8 border-b border-outline-variant pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary-container">shield</span>
              AUDIT_REPORT <span className="text-on-surface-variant">//</span> {header?.systemName}
            </h1>
            <div className="flex flex-wrap gap-4 font-code-snippet text-code-snippet text-on-surface-variant">
              <span className="flex items-center gap-1">
                <span className="text-primary-container">&gt;</span> DATE: {header?.date}
              </span>
              <span className="text-outline-variant">|</span>
              <span className="flex items-center gap-1">
                <span className="text-primary-container">&gt;</span> IND: {header?.industry}
              </span>
              <span className="text-outline-variant">|</span>
              <span className="flex items-center gap-1">
                <span className="text-primary-container">&gt;</span> ARCH: {header?.arch}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-1 border border-outline-variant text-on-surface-variant font-code-snippet text-code-snippet hover:border-primary-container hover:text-primary-container transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            EXPORT
          </button>
        </div>

        <div className="mb-6 border-b border-[#3E4451] overflow-x-auto hide-scrollbar">
          <nav className="flex gap-2 font-code-snippet text-code-snippet min-w-max pb-px">
            {REPORT_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary-container text-primary-container hover:bg-primary-container/5'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <TabContent tab={activeTab} report={report} />
      </div>

      <div className="fixed bottom-0 left-0 md:left-64 right-0 border-t border-error p-4 bg-background/90 backdrop-blur-md z-30 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-error text-3xl">warning</span>
          <div>
            <div className="font-headline-md text-headline-md text-error flex items-center gap-2 flex-wrap">
              {String(verdict.overall_result || 'Pending').toUpperCase()}
              <span className="text-error/50">//</span>
              {verdict.production_readiness ? 'PRODUCTION READY' : 'NOT PRODUCTION READY'}
            </div>
            <div className="font-code-snippet text-code-snippet text-on-surface-variant mt-1">
              <span className="text-error">&gt;</span> ACTION REQUIRED: {String(verdict.required_actions || '')}
            </div>
          </div>
        </div>
        <button
          type="button"
          className="px-6 py-2 bg-error text-on-error font-code-snippet text-code-snippet font-bold hover:bg-error/90 transition-colors"
        >
          ACKNOWLEDGE
        </button>
      </div>
    </div>
  );
}
