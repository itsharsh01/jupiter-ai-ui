import { apiUrl, authHeaders } from './config';

export type TestCaseStrategy =
  | 'governance'
  | 'ai_risk'
  | 'tool_abuse'
  | 'data_leakage'
  | 'control_bypass';

export type TestCaseStatus =
  | 'pending'
  | 'ready'
  | 'running'
  | 'evaluating'
  | 'passed'
  | 'failed'
  | 'error';

export type EvaluationStatus =
  | 'pending_trace'
  | 'tracing'
  | 'evaluating'
  | 'complete'
  | 'error';

export interface StepFinding {
  step_type: string;
  tool?: string | null;
  issue: string;
}

export interface TestCaseReport {
  verdict: 'pass' | 'fail';
  reasoning: string;
  failure_summary?: string | null;
  problematic_tools?: string[];
  step_findings?: StepFinding[];
  recommendations?: string | null;
}

export interface TestCaseExecution {
  status_code: number;
  response_preview?: string | null;
  executed_at: string;
  passed?: boolean | null;
  message?: string | null;
  execution_id?: string | null;
  phoenix_trace_id?: string | null;
  phoenix_span_id?: string | null;
  phoenix_span_global_id?: string | null;
  evaluation_status?: EvaluationStatus | null;
  report?: TestCaseReport | null;
  trace_linked_at?: string | null;
  evaluated_at?: string | null;
}

export interface AuditTestCase {
  test_case_id: string;
  strategy: TestCaseStrategy;
  title: string;
  description: string;
  user_prompt: string;
  category: string;
  pass_condition: string;
  fail_condition: string;
  severity: string;
  tool_name?: string | null;
  source_node_type?: string | null;
  source_node_name?: string | null;
  status: TestCaseStatus;
  execution?: TestCaseExecution | null;
}

export interface AuditSandbox {
  audit_id: string;
  session_id: string;
  customer_id?: string | null;
  system_url: string;
  auth_token_set: boolean;
  sample_request_body?: Record<string, unknown> | string | null;
  sample_response_body?: Record<string, unknown> | string | null;
  sandbox_test_passed: boolean;
  sandbox_test_status_code?: number | null;
  status: 'draft' | 'generating' | 'ready' | 'failed';
  test_cases: AuditTestCase[];
  created_at: string;
  updated_at: string;
}

export interface AuditSandboxUpsert {
  session_id: string;
  system_url: string;
  auth_token?: string;
  sample_request_body?: Record<string, unknown> | string;
  sample_response_body?: Record<string, unknown> | string;
  test_sandbox?: boolean;
}

export interface SandboxTestResult {
  audit_id: string;
  passed: boolean;
  status_code: number;
  response_preview?: string | null;
  message: string;
}

export interface StartAuditResult {
  audit_id: string;
  status: AuditSandbox['status'];
  test_cases_generated: number;
  message: string;
  strategies_generated?: string[];
}

export interface ExecuteTestCaseResult {
  audit_id: string;
  test_case_id: string;
  status: TestCaseStatus;
  execution: TestCaseExecution;
}

async function parseJson<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = (body as { detail?: string }).detail ?? res.statusText;
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
  }
  return body as T;
}

export async function saveAuditSandbox(payload: AuditSandboxUpsert): Promise<AuditSandbox> {
  const res = await fetch(apiUrl('/api/v1/audit/sandbox'), {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  return parseJson(res);
}

export async function fetchAuditSandboxForSession(sessionId: string): Promise<AuditSandbox | null> {
  const res = await fetch(apiUrl(`/api/v1/audit/sandbox/session/${sessionId}`), {
    headers: authHeaders(),
  });
  if (res.status === 404) return null;
  return parseJson(res);
}

export async function fetchAuditSandboxById(auditId: string): Promise<AuditSandbox> {
  const res = await fetch(apiUrl(`/api/v1/audit/sandbox/${auditId}`), {
    headers: authHeaders(),
  });
  return parseJson(res);
}

export interface GovernanceAuditReport {
  audit_id: string;
  generated_at: string;
  executive_summary: Record<string, unknown>;
  system_understanding: Record<string, unknown>;
  asset_inventory: Record<string, unknown>;
  policy_coverage: Record<string, unknown>;
  risk_assessment: Record<string, unknown>;
  test_execution: Record<string, unknown>;
  policy_violations: Record<string, unknown>[];
  control_effectiveness: Record<string, unknown>;
  tool_governance: Record<string, unknown>[];
  trace_evidence: Record<string, unknown>[];
  remediation_plan: Record<string, unknown>;
  maturity_assessment: Record<string, unknown>;
  final_verdict: Record<string, unknown>;
}

export async function fetchGovernanceAuditReport(auditId: string): Promise<GovernanceAuditReport> {
  const res = await fetch(apiUrl(`/api/v1/audit/sandbox/${auditId}/report`), {
    headers: authHeaders(),
  });
  return parseJson(res);
}

export async function startGeneratingTestCases(auditId: string): Promise<StartAuditResult> {
  const res = await fetch(apiUrl(`/api/v1/audit/sandbox/${auditId}/start-generating-test-cases`), {
    method: 'POST',
    headers: authHeaders(),
  });
  return parseJson(res);
}

export async function testAuditSandbox(auditId: string): Promise<SandboxTestResult> {
  const res = await fetch(apiUrl(`/api/v1/audit/sandbox/${auditId}/test`), {
    method: 'POST',
    headers: authHeaders(),
  });
  return parseJson(res);
}

export async function executeAuditTestCase(
  auditId: string,
  testCaseId: string,
): Promise<ExecuteTestCaseResult> {
  const res = await fetch(
    apiUrl(`/api/v1/audit/sandbox/${auditId}/test-cases/${testCaseId}/execute`),
    {
      method: 'POST',
      headers: authHeaders(),
    },
  );
  return parseJson(res);
}

export const STRATEGY_LABELS: Record<TestCaseStrategy, string> = {
  governance: 'Governance',
  ai_risk: 'AI Risk',
  tool_abuse: 'Tool Abuse',
  data_leakage: 'Data Leakage',
  control_bypass: 'Control Verification',
};

export const STRATEGY_ORDER: TestCaseStrategy[] = [
  'governance',
  'ai_risk',
  'tool_abuse',
  'data_leakage',
  'control_bypass',
];
