import { apiUrl, authHeaders } from './config';

export interface KnowledgeGraphMapResult {
  mapping_run_id: string;
  customer_id: string;
  mapped_count: number;
  skipped_count: number;
  message?: string;
}

async function parseJson<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = (body as { detail?: string }).detail ?? res.statusText;
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
  }
  return body as T;
}

export async function mapCustomerKnowledgeGraph(
  customerId: string,
  sessionId: string,
): Promise<KnowledgeGraphMapResult> {
  const res = await fetch(apiUrl(`/api/v1/customers/${customerId}/knowledge-graph/map`), {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      source: 'discovery',
      session_id: sessionId,
      replace_existing: false,
    }),
  });
  return parseJson(res);
}

export interface KnowledgeGraphSummary {
  customer_id: string;
  graph: Record<string, unknown>;
  instances: Record<string, unknown>[];
  last_mapping_run?: Record<string, unknown> | null;
}

export async function fetchKnowledgeGraphSummary(
  customerId: string,
): Promise<KnowledgeGraphSummary> {
  const res = await fetch(apiUrl(`/api/v1/customers/${customerId}/knowledge-graph`), {
    headers: authHeaders(),
  });
  return parseJson(res);
}
