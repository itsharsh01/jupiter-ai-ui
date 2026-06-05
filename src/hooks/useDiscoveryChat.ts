import { useCallback, useEffect, useRef, useState } from 'react';
import {
  sendDiscoveryMessage,
  sendStructuredAnswers,
  startDiscoverySession,
} from '../api/discovery';
import { getStoredCustomerId } from '../api/auth';
import type {
  InteractionRequest,
  StreamEvent,
  ToolRegistryEntry,
  TurnResponse,
} from '../types/discovery';
import { uiHintToInteraction } from '../types/discovery';

const SESSION_KEY = 'jupiter_discovery_session_v2_id';

export type ChatStatus = 'idle' | 'loading' | 'error';

export interface ChatProgress {
  completeness: number;
  remaining: number;
  complete: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  id: string;
  streaming?: boolean;
  /** System notice (e.g. LLM unavailable) — distinct from discovery questions */
  variant?: 'default' | 'notice';
}

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

export function useDiscoveryChat(options?: {
  onDiscoveryComplete?: () => void;
}) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pendingInteraction, setPendingInteraction] = useState<InteractionRequest | null>(null);
  const [progress, setProgress] = useState<ChatProgress | null>(null);
  const [status, setStatus] = useState<ChatStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [waitingMessage, setWaitingMessage] = useState<string | null>(null);
  const streamingIdRef = useRef<string | null>(null);
  const initRef = useRef(false);

  const updateStreamingMessage = useCallback((content: string, streaming: boolean) => {
    const sid = streamingIdRef.current;
    if (!sid) return;
    setMessages((prev) =>
      prev.map((m) => (m.id === sid ? { ...m, content, streaming } : m)),
    );
  }, []);

  const ensureStreamingBubble = useCallback(() => {
    if (streamingIdRef.current) return streamingIdRef.current;
    const id = crypto.randomUUID();
    streamingIdRef.current = id;
    setMessages((prev) => [
      ...prev,
      { id, role: 'assistant', content: '', streaming: true },
    ]);
    return id;
  }, []);

  const handleStreamEvent = useCallback(
    (event: StreamEvent) => {
      if (event.event === 'status') {
        const msg = String(event.data.message ?? 'Processing...');
        setWaitingMessage(msg);
        const phase = String(event.data.phase ?? '');
        if (phase === 'generating' || msg.toLowerCase().includes('question')) {
          ensureStreamingBubble();
        }
        return;
      }

      if (event.event === 'greeting') {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: String(event.data.content ?? ''),
          },
        ]);
        return;
      }

      if (event.event === 'notice') {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: String(event.data.content ?? ''),
            variant: 'notice',
          },
        ]);
        return;
      }

      if (event.event === 'progress') {
        setProgress((prev) => ({
          completeness: Number(event.data.completion_pct ?? prev?.completeness ?? 0),
          remaining: Number(event.data.remaining_keys ?? prev?.remaining ?? 0),
          complete: Boolean(event.data.discovery_complete ?? prev?.complete ?? false),
        }));
        return;
      }

      if (event.event === 'user_message') {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'user',
            content: String(event.data.content ?? ''),
          },
        ]);
        return;
      }

      if (event.event === 'clarification') {
        ensureStreamingBubble();
        updateStreamingMessage(String(event.data.content ?? ''), true);
        return;
      }

      if (event.event === 'assistant_message') {
        ensureStreamingBubble();
        const content = String(event.data.content ?? '');
        const phase = String(event.data.phase ?? 'final');

        if (phase === 'preview') {
          return;
        }
        if (phase === 'delta') {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === streamingIdRef.current
                ? { ...m, content: m.content + content, streaming: true }
                : m,
            ),
          );
        } else if (phase === 'final') {
          updateStreamingMessage(content, false);
          streamingIdRef.current = null;
        }
      }
    },
    [ensureStreamingBubble, updateStreamingMessage],
  );

  const applyTurn = useCallback(
    (turn: TurnResponse, opts?: { skipAssistantFinalize?: boolean; onComplete?: () => void }) => {
      setSessionId(turn.session_id);
      sessionStorage.setItem(SESSION_KEY, turn.session_id);
      setWaitingMessage(null);

      if (!opts?.skipAssistantFinalize && streamingIdRef.current) {
        updateStreamingMessage(turn.assistant_message, false);
        streamingIdRef.current = null;
      } else if (!opts?.skipAssistantFinalize) {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: 'assistant', content: turn.assistant_message },
        ]);
      } else if (streamingIdRef.current) {
        updateStreamingMessage(turn.assistant_message, false);
        streamingIdRef.current = null;
      }

      setProgress({
        completeness: turn.completion_pct,
        remaining: turn.remaining_keys,
        complete: turn.discovery_complete,
      });

      if (turn.discovery_complete) {
        opts?.onComplete?.();
      }

      if (turn.response_type === 'clarification') {
        if (turn.ui_hint) {
          setPendingInteraction(uiHintToInteraction(turn.ui_hint));
        }
        return;
      }

      if (!turn.discovery_complete && turn.ui_hint) {
        setPendingInteraction(uiHintToInteraction(turn.ui_hint));
      } else {
        setPendingInteraction(null);
      }

      for (const notice of turn.notices ?? []) {
        setMessages((prev) => {
          if (prev.some((m) => m.variant === 'notice' && m.content === notice)) {
            return prev;
          }
          return [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: notice,
              variant: 'notice' as const,
            },
          ];
        });
      }
    },
    [updateStreamingMessage],
  );

  const beginSession = useCallback(async () => {
    setStatus('loading');
    setError(null);
    setWaitingMessage('Loading discovery session...');
    streamingIdRef.current = null;
    try {
      setMessages([]);
      streamingIdRef.current = null;
      const turn = await startDiscoverySession(getStoredCustomerId() ?? undefined, handleStreamEvent);
      applyTurn(turn, { skipAssistantFinalize: true, onComplete: options?.onDiscoveryComplete });
      setStatus('idle');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start discovery session');
      setStatus('error');
      setWaitingMessage(null);
    }
  }, [applyTurn, handleStreamEvent, options]);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    void beginSession();
  }, [beginSession]);

  const runTurn = useCallback(
    async (fn: (onEvent: (e: StreamEvent) => void) => Promise<TurnResponse>, userLabel: string) => {
      if (!sessionId) return;
      const previousPending = pendingInteraction;
      setStatus('loading');
      setError(null);
      setPendingInteraction(null);
      setWaitingMessage('Processing your response...');
      streamingIdRef.current = null;
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'user', content: userLabel },
      ]);
      try {
        const turn = await fn(handleStreamEvent);
        if (turn.response_type === 'clarification') {
          setPendingInteraction(previousPending);
        }
        applyTurn(turn, {
          skipAssistantFinalize: true,
          onComplete: options?.onDiscoveryComplete,
        });
        setStatus('idle');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Request failed');
        setStatus('error');
        setPendingInteraction(previousPending);
        setWaitingMessage(null);
        if (streamingIdRef.current) {
          setMessages((prev) => prev.filter((m) => m.id !== streamingIdRef.current));
          streamingIdRef.current = null;
        }
      }
    },
    [sessionId, applyTurn, pendingInteraction, handleStreamEvent, options],
  );

  const sendText = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !sessionId) return;
      void runTurn((onEvent) => sendDiscoveryMessage(sessionId, trimmed, onEvent), trimmed);
    },
    [sessionId, runTurn],
  );

  const confirmMultiSelect = useCallback(
    (selectedIds: string[]) => {
      if (!sessionId || !pendingInteraction) return;
      const label = selectedIds.join(', ');
      void runTurn(
        (onEvent) =>
          sendStructuredAnswers(sessionId, pendingInteraction.field_path, selectedIds, onEvent),
        `Selected: ${label}`,
      );
    },
    [sessionId, pendingInteraction, runTurn],
  );

  const confirmToolRegistry = useCallback(
    (tools: ToolRegistryEntry[]) => {
      if (!sessionId || !pendingInteraction) return;
      const names = tools.map((t) => t.tool_name).join(', ');
      void runTurn(
        (onEvent) =>
          sendStructuredAnswers(sessionId, pendingInteraction.field_path, tools, onEvent),
        `Registered tools: ${names}`,
      );
    },
    [sessionId, pendingInteraction, runTurn],
  );

  const confirmMultiInput = useCallback(
    (values: string[]) => {
      if (!sessionId || !pendingInteraction) return;
      void runTurn(
        (onEvent) =>
          sendStructuredAnswers(sessionId, pendingInteraction.field_path, values, onEvent),
        values.join('; '),
      );
    },
    [sessionId, pendingInteraction, runTurn],
  );

  const uploadDocuments = useCallback(
    (files: File[]) => {
      if (!sessionId || !pendingInteraction) return;
      const names = files.map((f) => f.name).join(', ');
      void runTurn(
        (onEvent) =>
          sendStructuredAnswers(
            sessionId,
            pendingInteraction.field_path,
            names.split(', '),
            onEvent,
          ),
        `Uploaded: ${names}`,
      );
    },
    [sessionId, pendingInteraction, runTurn],
  );

  const progressLabel = progress
    ? `COMPLETE: ${pct(progress.completeness)} // REMAINING: ${progress.remaining}`
    : 'INITIALIZING...';

  const isStreaming = messages.some((m) => m.streaming);

  /** Only structured widgets (multi-select, upload, etc.) replace the terminal. */
  const structuredInteractionActive =
    pendingInteraction != null && pendingInteraction.type !== 'text';

  const discoveryComplete = progress?.complete ?? false;

  return {
    sessionId,
    messages,
    pendingInteraction,
    progress,
    progressLabel,
    status,
    error,
    waitingMessage,
    isStreaming,
    sendText,
    confirmMultiSelect,
    confirmMultiInput,
    confirmToolRegistry,
    uploadDocuments,
    restart: beginSession,
    isLoading: status === 'loading',
    inputDisabled: status === 'loading' || structuredInteractionActive || discoveryComplete,
    canTypeInTerminal:
      !structuredInteractionActive && status !== 'loading' && !discoveryComplete,
    discoveryComplete,
  };
}
