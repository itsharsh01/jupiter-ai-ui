import { useMemo, useState } from 'react';
import {
  executeAuditTestCase,
  fetchAuditSandboxById,
  STRATEGY_LABELS,
  STRATEGY_ORDER,
  type AuditSandbox,
  type AuditTestCase,
  type TestCaseStrategy,
} from '../api/audit';

interface AuditTestCasesPanelProps {
  sandbox: AuditSandbox;
  onSandboxUpdate: (sandbox: AuditSandbox) => void;
}

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 120000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hasPendingEvaluation(cases: AuditTestCase[]): boolean {
  return cases.some((tc) => tc.status === 'running' || tc.status === 'evaluating');
}

async function pollUntilEvaluationsComplete(
  auditId: string,
  onUpdate: (sandbox: AuditSandbox) => void,
): Promise<AuditSandbox> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  let latest = await fetchAuditSandboxById(auditId);
  onUpdate(latest);

  while (hasPendingEvaluation(latest.test_cases) && Date.now() < deadline) {
    await sleep(POLL_INTERVAL_MS);
    latest = await fetchAuditSandboxById(auditId);
    onUpdate(latest);
  }

  return latest;
}

function executionLabel(testCase: AuditTestCase): string | null {
  if (testCase.status === 'running') return 'RUNNING';
  if (testCase.status === 'evaluating') return 'EVALUATING';
  if (testCase.status === 'passed') return 'PASS';
  if (testCase.status === 'failed') return 'FAIL';
  if (testCase.status === 'error') return 'ERROR';
  if (testCase.execution) {
    if (testCase.execution.passed === true) return 'PASS';
    if (testCase.execution.passed === false) return 'FAIL';
    return 'DONE';
  }
  return null;
}

function executionColor(label: string | null): string {
  switch (label) {
    case 'PASS':
      return 'text-primary-fixed border-primary-fixed/40 bg-primary-fixed/10';
    case 'FAIL':
    case 'ERROR':
      return 'text-error border-error/40 bg-error/10';
    case 'RUNNING':
    case 'EVALUATING':
      return 'text-outline border-outline-variant bg-surface-container-low';
    default:
      return 'text-on-surface-variant border-outline-variant bg-surface-container-low';
  }
}

function agentResponseText(testCase: AuditTestCase): string {
  const preview = testCase.execution?.response_preview;
  if (!preview) return testCase.execution?.message ?? '(no response)';

  try {
    const parsed = JSON.parse(preview) as Record<string, unknown>;
    if (typeof parsed.answer === 'string') return parsed.answer;
    if (typeof parsed.message === 'string') return parsed.message;
    if (typeof parsed.response === 'string') return parsed.response;
  } catch {
    // use raw preview
  }
  return preview;
}

function TestCaseCard({ testCase }: { testCase: AuditTestCase }) {
  const [expanded, setExpanded] = useState(false);
  const label = executionLabel(testCase);
  const report = testCase.execution?.report;
  const hasResponse = Boolean(
    testCase.execution?.response_preview ||
      testCase.execution?.message ||
      report?.reasoning,
  );

  return (
    <div className="border border-outline-variant bg-surface-container-low/30">
      <button
        type="button"
        onClick={() => hasResponse && setExpanded((v) => !v)}
        disabled={!hasResponse}
        className={`w-full flex items-start justify-between gap-3 p-4 text-left ${
          hasResponse ? 'hover:bg-surface-container-low/50 cursor-pointer' : 'cursor-default'
        }`}
      >
        <p className="text-[12px] text-on-surface-variant leading-relaxed font-code-snippet flex-1 min-w-0">
          {testCase.user_prompt}
        </p>
        <div className="flex items-center gap-2 shrink-0">
          {label && (
            <span
              className={`text-[10px] font-code-snippet uppercase px-2 py-0.5 border ${executionColor(label)}`}
            >
              {label}
            </span>
          )}
          {hasResponse && (
            <span className="material-symbols-outlined text-outline text-[18px]">
              {expanded ? 'expand_less' : 'expand_more'}
            </span>
          )}
        </div>
      </button>

      {expanded && hasResponse && (
        <div className="px-4 pb-4 border-t border-outline-variant/50 space-y-4">
          <div>
            <p className="text-[10px] text-outline font-code-snippet uppercase pt-3 mb-2">
              Agent response
            </p>
            <pre className="text-[11px] font-code-snippet text-on-surface-variant whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
              {agentResponseText(testCase)}
            </pre>
          </div>

          {report?.reasoning && (
            <div>
              <p className="text-[10px] text-outline font-code-snippet uppercase mb-2">
                Evaluation
              </p>
              <p className="text-[11px] font-code-snippet text-on-surface-variant leading-relaxed">
                {report.reasoning}
              </p>
            </div>
          )}

          {report?.verdict === 'fail' && (
            <div className="space-y-3">
              {report.failure_summary && (
                <div>
                  <p className="text-[10px] text-error font-code-snippet uppercase mb-2">
                    Failure summary
                  </p>
                  <p className="text-[11px] font-code-snippet text-on-surface-variant leading-relaxed">
                    {report.failure_summary}
                  </p>
                </div>
              )}

              {(report.problematic_tools?.length ?? 0) > 0 && (
                <div>
                  <p className="text-[10px] text-error font-code-snippet uppercase mb-2">
                    Problematic tools
                  </p>
                  <p className="text-[11px] font-code-snippet text-on-surface-variant">
                    {report.problematic_tools?.join(', ')}
                  </p>
                </div>
              )}

              {(report.step_findings?.length ?? 0) > 0 && (
                <div>
                  <p className="text-[10px] text-error font-code-snippet uppercase mb-2">
                    Step findings
                  </p>
                  <ul className="space-y-2">
                    {report.step_findings?.map((finding, index) => (
                      <li
                        key={`${finding.step_type}-${finding.tool ?? 'none'}-${index}`}
                        className="text-[11px] font-code-snippet text-on-surface-variant"
                      >
                        <span className="text-outline uppercase">{finding.step_type}</span>
                        {finding.tool ? ` · ${finding.tool}` : ''}: {finding.issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {report.recommendations && (
                <div>
                  <p className="text-[10px] text-outline font-code-snippet uppercase mb-2">
                    Recommendations
                  </p>
                  <p className="text-[11px] font-code-snippet text-on-surface-variant leading-relaxed">
                    {report.recommendations}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AuditTestCasesPanel({ sandbox, onSandboxUpdate }: AuditTestCasesPanelProps) {
  const casesByStrategy = useMemo(() => {
    const map = new Map<TestCaseStrategy, AuditTestCase[]>();
    for (const strategy of STRATEGY_ORDER) {
      map.set(strategy, []);
    }
    for (const tc of sandbox.test_cases) {
      const list = map.get(tc.strategy);
      if (list) list.push(tc);
    }
    return map;
  }, [sandbox.test_cases]);

  const firstWithCases = STRATEGY_ORDER.find((s) => (casesByStrategy.get(s)?.length ?? 0) > 0);
  const [activeTab, setActiveTab] = useState<TestCaseStrategy>(firstWithCases ?? 'governance');
  const [runningAll, setRunningAll] = useState(false);
  const [runProgress, setRunProgress] = useState<{ current: number; total: number } | null>(null);
  const [runError, setRunError] = useState<string | null>(null);

  async function handleRunAll() {
    const cases = sandbox.test_cases;
    if (cases.length === 0) return;

    setRunningAll(true);
    setRunError(null);
    setRunProgress({ current: 0, total: cases.length });

    let latestCases = [...sandbox.test_cases];
    let executionFailed = false;

    for (let i = 0; i < cases.length; i++) {
      const tc = cases[i];
      setRunProgress({ current: i + 1, total: cases.length });

      latestCases = latestCases.map((c) =>
        c.test_case_id === tc.test_case_id ? { ...c, status: 'running' as const } : c,
      );
      onSandboxUpdate({ ...sandbox, test_cases: latestCases });

      try {
        const result = await executeAuditTestCase(sandbox.audit_id, tc.test_case_id);
        latestCases = latestCases.map((c) =>
          c.test_case_id === tc.test_case_id
            ? { ...c, status: result.status, execution: result.execution }
            : c,
        );
        onSandboxUpdate({ ...sandbox, test_cases: latestCases });
      } catch (e) {
        executionFailed = true;
        const message = e instanceof Error ? e.message : 'Execution failed';
        setRunError(message);
        latestCases = latestCases.map((c) =>
          c.test_case_id === tc.test_case_id ? { ...c, status: 'error' as const } : c,
        );
        onSandboxUpdate({ ...sandbox, test_cases: latestCases });
        break;
      }
    }

    if (!executionFailed) {
      try {
        setRunProgress({ current: cases.length, total: cases.length });
        const finalSandbox = await pollUntilEvaluationsComplete(
          sandbox.audit_id,
          onSandboxUpdate,
        );
        onSandboxUpdate(finalSandbox);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Evaluation polling failed';
        setRunError(message);
      }
    }

    setRunningAll(false);
    setRunProgress(null);
  }

  const activeCases = casesByStrategy.get(activeTab) ?? [];
  const isPollingEvaluations =
    runningAll && runProgress !== null && runProgress.current === runProgress.total;

  return (
    <div className="glass-panel p-6 space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h3 className="font-label-caps text-label-caps text-primary-fixed-dim">Test cases</h3>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[10px] font-code-snippet text-outline uppercase">
            {sandbox.test_cases.length} cases
          </span>
          <button
            type="button"
            onClick={() => void handleRunAll()}
            disabled={runningAll || sandbox.test_cases.length === 0}
            className="bg-primary-fixed text-on-primary font-bold font-code-snippet px-4 py-2 uppercase text-[11px] hover:bg-primary-container disabled:opacity-40"
          >
            {runningAll && runProgress
              ? isPollingEvaluations
                ? 'Evaluating traces…'
                : `Running ${runProgress.current}/${runProgress.total}…`
              : 'Run all'}
          </button>
        </div>
      </div>

      {runError && (
        <p className="text-[11px] text-error font-code-snippet">{runError}</p>
      )}

      <div className="flex flex-wrap gap-1 border-b border-outline-variant pb-2">
        {STRATEGY_ORDER.map((strategy) => {
          const count = casesByStrategy.get(strategy)?.length ?? 0;
          return (
            <button
              key={strategy}
              type="button"
              onClick={() => setActiveTab(strategy)}
              className={`font-code-snippet text-[11px] px-3 py-1.5 uppercase border ${
                activeTab === strategy
                  ? 'border-primary-fixed text-primary-fixed bg-primary-fixed/10'
                  : 'border-transparent text-outline hover:text-primary-fixed'
              }`}
            >
              {STRATEGY_LABELS[strategy]}
              {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
            </button>
          );
        })}
      </div>

      {activeCases.length === 0 ? (
        <p className="text-[12px] text-outline font-code-snippet">
          No test cases for this strategy.
        </p>
      ) : (
        <div className="space-y-2">
          {activeCases.map((tc) => (
            <TestCaseCard key={tc.test_case_id} testCase={tc} />
          ))}
        </div>
      )}
    </div>
  );
}
