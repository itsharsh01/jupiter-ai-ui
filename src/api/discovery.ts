import { apiUrl, authHeaders } from './config';
import type { StreamEvent, TurnResponse } from '../types/discovery';

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail));
  }
  return res.json() as Promise<T>;
}

async function consumeSse(
  res: Response,
  onEvent: (event: StreamEvent) => void,
): Promise<TurnResponse> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail));
  }

  const reader = res.body?.getReader();
  if (!reader) {
    throw new Error('Streaming response has no body');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let finalTurn: TurnResponse | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const chunks = buffer.split('\n\n');
    buffer = chunks.pop() ?? '';

    for (const chunk of chunks) {
      for (const line of chunk.split('\n')) {
        if (!line.startsWith('data: ')) continue;
        const raw = JSON.parse(line.slice(6)) as {
          event: StreamEvent['event'];
          data: Record<string, unknown>;
        };
        onEvent({ event: raw.event, data: raw.data });
        if (raw.event === 'done') {
          finalTurn = raw.data as unknown as TurnResponse;
        }
      }
    }
  }

  if (!finalTurn) {
    throw new Error('Stream ended without a done event');
  }
  return finalTurn;
}

export interface CustomerDiscoveryStatus {
  customer_id: string;
  session_id: string | null;
  discovery_complete: boolean;
  completion_pct: number;
  remaining_keys: number;
  current_key: string | null;
}

export async function fetchCustomerDiscovery(customerId: string): Promise<CustomerDiscoveryStatus> {
  const res = await fetch(apiUrl(`/api/v2/discovery/customers/${customerId}/discovery`), {
    headers: authHeaders(),
  });
  return parseJson<CustomerDiscoveryStatus>(res);
}

export async function startDiscoverySession(
  customerId?: string,
  onEvent?: (event: StreamEvent) => void,
): Promise<TurnResponse> {
  if (onEvent) {
    const res = await fetch(apiUrl('/api/v2/discovery/sessions/stream'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_id: customerId ?? null }),
    });
    return consumeSse(res, onEvent);
  }
  const res = await fetch(apiUrl('/api/v2/discovery/sessions'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customer_id: customerId ?? null }),
  });
  return parseJson(res);
}

export async function sendDiscoveryMessage(
  sessionId: string,
  message: string,
  onEvent?: (event: StreamEvent) => void,
): Promise<TurnResponse> {
  if (onEvent) {
    const res = await fetch(apiUrl(`/api/v2/discovery/sessions/${sessionId}/turns/stream`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    return consumeSse(res, onEvent);
  }
  const res = await fetch(apiUrl(`/api/v2/discovery/sessions/${sessionId}/turns`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  return parseJson(res);
}

export async function sendStructuredAnswers(
  sessionId: string,
  fieldKey: string,
  value: unknown,
  onEvent?: (event: StreamEvent) => void,
): Promise<TurnResponse> {
  const body = {
    answers: { [fieldKey]: value },
  };
  if (onEvent) {
    const res = await fetch(apiUrl(`/api/v2/discovery/sessions/${sessionId}/turns/stream`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return consumeSse(res, onEvent);
  }
  const res = await fetch(apiUrl(`/api/v2/discovery/sessions/${sessionId}/turns`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return parseJson(res);
}
