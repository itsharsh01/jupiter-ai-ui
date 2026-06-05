import { useCallback, useEffect, useState } from 'react';
import {
  fetchAuditSandboxForSession,
  saveAuditSandbox,
  startGeneratingTestCases,
  testAuditSandbox,
  type AuditSandbox,
} from '../api/audit';
import { mapCustomerKnowledgeGraph } from '../api/knowledgeGraph';
import AuditTestCasesPanel from './AuditTestCasesPanel';

function parseJsonField(raw: string): Record<string, unknown> | string | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    return trimmed;
  }
}

function formatJsonField(value: Record<string, unknown> | string | null | undefined): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
}

interface AuditSandboxViewProps {
  sessionId?: string | null;
  onBackToChat?: () => void;
}

export default function AuditSandboxView({ sessionId, onBackToChat }: AuditSandboxViewProps) {
  const [sandbox, setSandbox] = useState<AuditSandbox | null>(null);
  const [systemUrl, setSystemUrl] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [requestBody, setRequestBody] = useState('{\n  "query": "portfolio recommendation"\n}');
  const [responseBody, setResponseBody] = useState('');
  const [testSandboxOnSave, setTestSandboxOnSave] = useState(true);
  const [showSandbox, setShowSandbox] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [starting, setStarting] = useState(false);
  const [mapping, setMapping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const hasTestCases = (sandbox?.test_cases.length ?? 0) > 0;

  const loadExisting = useCallback(async () => {
    if (!sessionId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const existing = await fetchAuditSandboxForSession(sessionId);
      if (existing) {
        setSandbox(existing);
        setSystemUrl(existing.system_url);
        setRequestBody(formatJsonField(existing.sample_request_body));
        setResponseBody(formatJsonField(existing.sample_response_body));
        if (existing.test_cases.length > 0) {
          setShowSandbox(false);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load audit sandbox');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    void loadExisting();
  }, [loadExisting]);

  async function handleSave() {
    if (!sessionId) {
      setError('Complete discovery questioning first to link an audit session.');
      return;
    }
    if (!systemUrl.trim()) {
      setError('System URL is required.');
      return;
    }
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const saved = await saveAuditSandbox({
        session_id: sessionId,
        system_url: systemUrl.trim(),
        auth_token: authToken.trim() || undefined,
        sample_request_body: parseJsonField(requestBody),
        sample_response_body: parseJsonField(responseBody),
        test_sandbox: testSandboxOnSave,
      });
      setSandbox(saved);
      if (saved.sample_response_body) {
        setResponseBody(formatJsonField(saved.sample_response_body));
      }
      if (testSandboxOnSave) {
        setNotice(
          saved.sandbox_test_passed
            ? `Sandbox test passed (HTTP ${saved.sandbox_test_status_code ?? 200}). You can generate test cases.`
            : `Sandbox saved but test failed (HTTP ${saved.sandbox_test_status_code ?? 'error'}). Fix the URL or payload and test again.`,
        );
      } else {
        setNotice('Sandbox configuration saved. Run a sandbox test before generating test cases.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleTestSandbox() {
    if (!sandbox?.audit_id) {
      setError('Save your system details before testing the sandbox.');
      return;
    }
    setTesting(true);
    setError(null);
    setNotice(null);
    try {
      const result = await testAuditSandbox(sandbox.audit_id);
      const refreshed = await fetchAuditSandboxForSession(sessionId!);
      if (refreshed) {
        setSandbox(refreshed);
        if (refreshed.sample_response_body) {
          setResponseBody(formatJsonField(refreshed.sample_response_body));
        }
      }
      if (result.passed) {
        setNotice(`${result.message} You can generate test cases.`);
      } else {
        setError(`${result.message}${result.status_code ? ` (HTTP ${result.status_code})` : ''}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sandbox test failed');
    } finally {
      setTesting(false);
    }
  }

  async function handleMapKnowledgeGraph() {
    if (!sandbox?.customer_id || !sessionId) {
      setError('Customer id and session are required to map the knowledge graph.');
      return;
    }
    setMapping(true);
    setError(null);
    setNotice(null);
    try {
      const result = await mapCustomerKnowledgeGraph(sandbox.customer_id, sessionId);
      setNotice(
        `Knowledge graph mapped: ${result.mapped_count} entities linked (${result.skipped_count} skipped).`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Knowledge graph mapping failed');
    } finally {
      setMapping(false);
    }
  }

  async function handleStartAudit() {
    if (!sandbox?.audit_id) {
      setError('Save your system details before starting the audit.');
      return;
    }
    setStarting(true);
    setShowSandbox(false);
    setError(null);
    setNotice(null);
    try {
      const result = await startGeneratingTestCases(sandbox.audit_id);
      const refreshed = await fetchAuditSandboxForSession(sessionId!);
      if (refreshed) setSandbox(refreshed);
      setNotice(result.message);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to start audit';
      setError(message);
      if (message.toLowerCase().includes('knowledge graph')) {
        setShowSandbox(true);
      }
    } finally {
      setStarting(false);
    }
  }

  const isKgMapError = error?.toLowerCase().includes('knowledge graph') ?? false;

  if (!sessionId) {
    return (
      <div className="flex-1 flex items-center justify-center p-10">
        <div className="glass-panel p-10 max-w-lg w-full text-center">
          <span className="material-symbols-outlined text-outline text-[40px] mb-4">lock</span>
          <h2 className="font-headline-md text-headline-md text-primary-fixed-dim mb-3">AUDIT LOCKED</h2>
          <p className="font-body-sm text-on-surface-variant leading-relaxed mb-6">
            Finish discovery questioning in the chat first. Your session id is required to submit system
            details for audit.
          </p>
          {onBackToChat && (
            <button
              type="button"
              onClick={onBackToChat}
              className="border border-primary-fixed text-primary-fixed font-code-snippet text-[11px] px-4 py-2 uppercase"
            >
              Go to discovery chat
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="border-b border-outline-variant pb-4 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary-fixed">science</span>
              <span className="font-label-caps text-label-caps text-primary-fixed">AUDIT SANDBOX</span>
            </div>
            <p className="font-body-sm text-on-surface-variant max-w-2xl">
              Configure your client system endpoint, then generate adversarial test cases from your
              knowledge graph across five strategies.
            </p>
            <p className="text-[10px] text-outline font-code-snippet mt-2">
              SESSION // {sessionId}
            </p>
          </div>
          {onBackToChat && (
            <button
              type="button"
              onClick={onBackToChat}
              className="text-primary-fixed font-code-snippet text-[11px] border border-primary-fixed px-3 py-1 uppercase shrink-0"
            >
              View discovery chat
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-outline font-code-snippet text-[12px]">Loading sandbox…</p>
        ) : starting ? (
          <div className="glass-panel p-12 flex flex-col items-center justify-center gap-4 text-center">
            <span className="material-symbols-outlined text-primary-fixed text-[48px] animate-pulse">
              progress_activity
            </span>
            <p className="font-label-caps text-label-caps text-primary-fixed">Generating test cases</p>
            <p className="text-[12px] text-on-surface-variant font-code-snippet max-w-md">
              Running 5 strategies (governance, AI risk, tool abuse, data leakage, control verification)…
            </p>
          </div>
        ) : (
          <>
            {error && (
              <div className="border border-error-container bg-error-container/10 p-4 space-y-3">
                <p className="text-error font-code-snippet text-[12px]">{error}</p>
                {isKgMapError && sandbox?.customer_id && (
                  <button
                    type="button"
                    onClick={() => void handleMapKnowledgeGraph()}
                    disabled={mapping || starting}
                    className="bg-primary-fixed text-on-primary font-code-snippet text-[11px] px-4 py-2 uppercase disabled:opacity-40"
                  >
                    {mapping ? 'Mapping…' : 'Map knowledge graph'}
                  </button>
                )}
              </div>
            )}
            {notice && (
              <div className="border border-primary-container/40 bg-primary-container/10 p-4 text-primary-fixed font-code-snippet text-[12px]">
                {notice}
              </div>
            )}

            {(hasTestCases || !showSandbox) && (
              <button
                type="button"
                onClick={() => setShowSandbox((v) => !v)}
                className="flex items-center gap-2 text-primary-fixed font-code-snippet text-[11px] uppercase border border-primary-fixed px-3 py-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {showSandbox ? 'visibility_off' : 'settings'}
                </span>
                {showSandbox ? 'Hide sandbox configuration' : 'Show sandbox configuration'}
              </button>
            )}

            {showSandbox && (
              <>
                <div className="glass-panel p-6 space-y-5">
                  <h3 className="font-label-caps text-label-caps text-primary-fixed-dim">System connection</h3>
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] text-outline font-code-snippet uppercase">Client system URL *</span>
                    <input
                      value={systemUrl}
                      onChange={(e) => {
                        setSystemUrl(e.target.value);
                        setSandbox((prev) => (prev ? { ...prev, sandbox_test_passed: false } : prev));
                      }}
                      placeholder="http://127.0.0.1:8820/chat"
                      className="h-11 px-3 bg-surface-container-low/60 border border-outline-variant font-code-snippet text-sm text-primary outline-none focus:border-primary-fixed"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] text-outline font-code-snippet uppercase">
                      Sample auth token (Bearer / API key)
                    </span>
                    <input
                      type="password"
                      value={authToken}
                      onChange={(e) => setAuthToken(e.target.value)}
                      placeholder="sk-… or eyJ…"
                      className="h-11 px-3 bg-surface-container-low/60 border border-outline-variant font-code-snippet text-sm text-primary outline-none focus:border-primary-fixed"
                    />
                    {sandbox?.auth_token_set && !authToken && (
                      <span className="text-[10px] text-outline font-code-snippet">
                        Token on file — enter again only to replace
                      </span>
                    )}
                  </label>
                </div>

                <div className="glass-panel p-6 space-y-5">
                  <h3 className="font-label-caps text-label-caps text-primary-fixed-dim">Sample payloads</h3>
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] text-outline font-code-snippet uppercase">
                      Sample request body (JSON)
                    </span>
                    <textarea
                      value={requestBody}
                      onChange={(e) => {
                        setRequestBody(e.target.value);
                        setSandbox((prev) => (prev ? { ...prev, sandbox_test_passed: false } : prev));
                      }}
                      rows={8}
                      spellCheck={false}
                      className="px-3 py-2 bg-surface-container-low/60 border border-outline-variant font-code-snippet text-[12px] text-primary outline-none focus:border-primary-fixed resize-y"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] text-outline font-code-snippet uppercase">
                      Sample response body (optional JSON)
                    </span>
                    <textarea
                      value={responseBody}
                      onChange={(e) => setResponseBody(e.target.value)}
                      rows={6}
                      spellCheck={false}
                      placeholder='{"status": "ok"}'
                      className="px-3 py-2 bg-surface-container-low/60 border border-outline-variant font-code-snippet text-[12px] text-primary outline-none focus:border-primary-fixed resize-y"
                    />
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={testSandboxOnSave}
                      onChange={(e) => setTestSandboxOnSave(e.target.checked)}
                      className="accent-primary-fixed"
                    />
                    <span className="text-[11px] text-on-surface-variant font-code-snippet">
                      Test sandbox on save (POST to URL; require HTTP 200)
                    </span>
                  </label>
                  {sandbox?.sandbox_test_passed && (
                    <p className="text-[11px] text-primary-fixed font-code-snippet">
                      Sandbox verified // HTTP {sandbox.sandbox_test_status_code ?? 200}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void handleSave()}
                    disabled={saving || starting || testing || mapping}
                    className="bg-primary-fixed/10 border border-primary-fixed text-primary-fixed font-bold font-code-snippet px-6 py-3 uppercase hover:bg-primary-fixed/20 disabled:opacity-40"
                  >
                    {saving ? 'Saving…' : 'Save system details'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleTestSandbox()}
                    disabled={saving || starting || testing || mapping || !sandbox?.audit_id}
                    className="bg-surface-container-high border border-outline-variant text-primary-fixed font-bold font-code-snippet px-6 py-3 uppercase hover:border-primary-fixed disabled:opacity-40"
                  >
                    {testing ? 'Testing…' : 'Test sandbox'}
                  </button>
                  {sandbox?.customer_id && (
                    <button
                      type="button"
                      onClick={() => void handleMapKnowledgeGraph()}
                      disabled={saving || starting || testing || mapping}
                      className="bg-surface-container-high border border-outline-variant text-primary-fixed font-bold font-code-snippet px-6 py-3 uppercase hover:border-primary-fixed disabled:opacity-40"
                    >
                      {mapping ? 'Mapping…' : 'Map knowledge graph'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void handleStartAudit()}
                    disabled={
                      saving || starting || testing || mapping || !sandbox?.audit_id || !sandbox?.sandbox_test_passed
                    }
                    title={
                      !sandbox?.sandbox_test_passed
                        ? 'Run sandbox test and receive HTTP 200 first'
                        : undefined
                    }
                    className="bg-primary-fixed text-on-primary font-bold font-code-snippet px-6 py-3 uppercase hover:bg-primary-container disabled:opacity-40 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                    Start generating test cases
                  </button>
                </div>
              </>
            )}

            {sandbox && hasTestCases && (
              <AuditTestCasesPanel sandbox={sandbox} onSandboxUpdate={setSandbox} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
