export type UIInteractionType =
  | 'text'
  | 'boolean'
  | 'single_select'
  | 'multi_select'
  | 'tool_registry'
  | 'document_upload';

export interface UIHint {
  interaction_type: UIInteractionType;
  field_key: string;
  label: string;
  allowed_values?: string[] | null;
  min_selections?: number;
  max_selections?: number | null;
}

export interface TurnResponse {
  session_id: string;
  assistant_message: string;
  current_key: string | null;
  completion_pct: number;
  remaining_keys: number;
  discovery_complete: boolean;
  ui_hint: UIHint | null;
  response_type: 'discovery' | 'clarification' | 'complete';
  notices?: string[];
}

export type StreamEventName =
  | 'status'
  | 'progress'
  | 'greeting'
  | 'notice'
  | 'user_message'
  | 'assistant_message'
  | 'clarification'
  | 'done';

export interface StreamEvent {
  event: StreamEventName;
  data: Record<string, unknown>;
}

export interface ToolRegistryEntry {
  tool_name: string;
  tool_description: string;
  access_required: string;
  access_currently_has: string;
}

/** Mapped for ChatView panels */
export type InteractionType =
  | 'text'
  | 'multi_select'
  | 'multi_input'
  | 'document_upload'
  | 'tool_registry';

export interface InteractionOption {
  id: string;
  label: string;
  description: string;
}

export interface InteractionRequest {
  type: InteractionType;
  field_path: string;
  prompt: string;
  options?: InteractionOption[];
  min_selections?: number;
  max_selections?: number | null;
  input_label?: string;
  input_placeholder?: string;
  key_label?: string;
  accept?: string;
  max_files?: number;
}

export function uiHintToInteraction(hint: UIHint | null | undefined): InteractionRequest | null {
  if (!hint) return null;
  const formatLabel = (v: string) => v.replace(/_/g, ' ').toUpperCase();
  if (hint.interaction_type === 'boolean') {
    return {
      type: 'text',
      field_path: hint.field_key,
      prompt: hint.label,
    };
  }
  if (hint.interaction_type === 'tool_registry') {
    return {
      type: 'tool_registry',
      field_path: hint.field_key,
      prompt: hint.label,
      min_selections: hint.min_selections ?? 1,
    };
  }
  if (hint.interaction_type === 'document_upload') {
    return {
      type: 'document_upload',
      field_path: hint.field_key,
      prompt: hint.label,
      max_selections: hint.max_selections ?? 5,
      max_files: hint.max_selections ?? 5,
      accept: '.pdf,.json,.yaml,.yml',
    };
  }
  if (hint.interaction_type === 'single_select' && hint.allowed_values) {
    return {
      type: 'multi_select',
      field_path: hint.field_key,
      prompt: hint.label,
      options: hint.allowed_values.map((id) => ({
        id,
        label: formatLabel(id),
        description: '',
      })),
      min_selections: 1,
      max_selections: 1,
    };
  }
  if (hint.interaction_type === 'multi_select' && hint.allowed_values) {
    return {
      type: 'multi_select',
      field_path: hint.field_key,
      prompt: hint.label,
      options: hint.allowed_values.map((id) => ({
        id,
        label: formatLabel(id),
        description: '',
      })),
      min_selections: hint.min_selections ?? 1,
    };
  }
  return {
    type: 'text',
    field_path: hint.field_key,
    prompt: hint.label,
  };
}
