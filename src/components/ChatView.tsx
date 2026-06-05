import { useState, useRef, useEffect, type KeyboardEvent, type ChangeEvent, type DragEvent } from 'react';
import { useDiscoveryChat } from '../hooks/useDiscoveryChat';
import type { InteractionRequest, ToolRegistryEntry } from '../types/discovery';

const EMPTY_TOOL: ToolRegistryEntry = {
  tool_name: '',
  tool_description: '',
  access_required: '',
  access_currently_has: '',
};

function now(): string {
  return new Date().toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function QuestionLoading() {
  return (
    <div className="flex items-center gap-3 pl-3 py-1" aria-label="Generating question">
      <div className="flex gap-1.5">
        <span className="w-2 h-2 rounded-full bg-primary-fixed/90 animate-pulse" />
        <span className="w-2 h-2 rounded-full bg-primary-fixed/70 animate-pulse [animation-delay:150ms]" />
        <span className="w-2 h-2 rounded-full bg-primary-fixed/50 animate-pulse [animation-delay:300ms]" />
      </div>
      <span className="text-[11px] text-outline font-code-snippet uppercase tracking-wider">
        Generating question…
      </span>
    </div>
  );
}

function AIMsgBubble({
  content,
  streaming,
  variant = 'default',
}: {
  content: string;
  streaming?: boolean;
  variant?: 'default' | 'notice';
}) {
  const isNotice = variant === 'notice';
  const showLoading = streaming && !content.trim();
  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center gap-2 mb-1">
        <span
          className={`material-symbols-outlined text-[18px] ${
            isNotice ? 'text-outline' : 'text-primary-fixed'
          }`}
        >
          {isNotice ? 'info' : 'bolt'}
        </span>
        <span
          className={`font-label-caps text-label-caps ${
            isNotice ? 'text-outline' : 'text-primary-fixed'
          }`}
        >
          {isNotice ? 'SYSTEM_NOTICE' : 'JUPITER_AI'}
        </span>
        <span className="text-[10px] text-outline font-code-snippet">DISCOVERY // {now()}</span>
        {streaming && content.trim() && (
          <span className="text-[10px] text-primary-fixed font-code-snippet animate-pulse">
            STREAMING
          </span>
        )}
      </div>
      <div
        className={`glass-panel p-4 relative overflow-hidden ${
          isNotice ? 'border border-outline-variant bg-surface-container-low/40' : ''
        }`}
      >
        <div
          className={`absolute top-0 left-0 w-[3px] h-full ${
            isNotice ? 'bg-outline' : 'bg-primary-fixed'
          }`}
        />
        {showLoading ? (
          <QuestionLoading />
        ) : (
          <p
            className={`font-body-sm leading-relaxed pl-3 whitespace-pre-wrap ${
              isNotice ? 'text-outline' : 'text-body-sm text-on-surface'
            }`}
          >
            {content}
            {streaming && content.trim() ? (
              <span className="inline-block w-2 h-4 ml-1 bg-primary-fixed/80 animate-pulse align-middle" />
            ) : null}
          </p>
        )}
      </div>
    </div>
  );
}

function UserTextBubble({ text }: { text: string }) {
  return (
    <div className="flex flex-col gap-2 w-full items-end">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] text-outline font-code-snippet">{now()}</span>
        <span className="font-label-caps text-label-caps text-outline uppercase">OPERATOR_INPUT</span>
        <span className="material-symbols-outlined text-outline text-[18px]">account_circle</span>
      </div>
      <div className="glass-panel p-4 w-full max-w-xl">
        <p className="font-code-snippet text-on-surface text-[13px] leading-relaxed whitespace-pre-wrap">
          {text}
        </p>
      </div>
    </div>
  );
}

function MultiSelectPanel({
  interaction,
  disabled,
  onConfirm,
}: {
  interaction: InteractionRequest;
  disabled: boolean;
  onConfirm: (ids: string[]) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const single = interaction.max_selections === 1;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (single) {
        return new Set([id]);
      }
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-2 w-full items-end">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] text-outline font-code-snippet">
          FIELD: {interaction.field_path}
        </span>
        <span className="font-label-caps text-label-caps text-outline uppercase">OPERATOR_INPUT</span>
        <span className="material-symbols-outlined text-outline text-[18px]">account_circle</span>
      </div>
      <div className="glass-panel p-4 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4 border-b border-outline-variant pb-3">
          <span className="font-label-caps text-label-caps text-on-surface tracking-widest">
            {single ? 'PROTOCOL_SELECTION' : 'MULTI_SELECT'}
          </span>
          <span className="text-[10px] text-primary-fixed font-code-snippet">SELECT_MULTIPLE</span>
        </div>
        <p className="font-code-snippet text-on-surface text-[12px] mb-4 text-outline">
          {interaction.prompt}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-64 overflow-y-auto">
          {(interaction.options ?? []).map((opt) => (
            <label
              key={opt.id}
              className="flex items-center gap-4 cursor-pointer border border-outline-variant p-3 hover:bg-white/5 transition-colors"
            >
              <input
                type={single ? 'radio' : 'checkbox'}
                name="discovery-select"
                checked={selected.has(opt.id)}
                onChange={() => toggle(opt.id)}
                disabled={disabled}
                className="w-4 h-4 bg-transparent border-primary-fixed cursor-pointer"
              />
              <div className="flex flex-col">
                <span className="font-code-snippet text-on-surface text-[13px]">{opt.label}</span>
                {opt.description ? (
                  <span className="text-[10px] text-outline uppercase">{opt.description}</span>
                ) : null}
              </div>
            </label>
          ))}
        </div>
        <button
          type="button"
          disabled={disabled || selected.size < (interaction.min_selections ?? 1)}
          onClick={() => onConfirm([...selected])}
          className="w-full mt-6 bg-primary-fixed/10 border border-primary-fixed text-primary-fixed font-bold font-code-snippet py-2 uppercase hover:bg-primary-fixed/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          CONFIRM_SELECTION
        </button>
      </div>
    </div>
  );
}

function MultiInputPanel({
  interaction,
  disabled,
  onConfirm,
}: {
  interaction: InteractionRequest;
  disabled: boolean;
  onConfirm: (values: string[]) => void;
}) {
  const [inputVal, setInputVal] = useState('');
  const [items, setItems] = useState<string[]>([]);

  function addItem() {
    const v = inputVal.trim();
    if (!v) return;
    setItems((prev) => [...prev, v]);
    setInputVal('');
  }

  return (
    <div className="flex flex-col gap-2 w-full items-end">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] text-outline font-code-snippet">{interaction.input_label}</span>
        <span className="font-label-caps text-label-caps text-outline uppercase">OPERATOR_INPUT</span>
        <span className="material-symbols-outlined text-outline text-[18px]">account_circle</span>
      </div>
      <div className="glass-panel p-4 w-full max-w-2xl">
        <p className="font-code-snippet text-on-surface mb-4 leading-relaxed text-[12px]">
          {interaction.prompt}
        </p>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-14 bg-surface-container-low/60 border border-outline-variant flex items-center px-4 focus-within:border-primary-fixed transition-colors">
            <span className="text-primary-fixed font-code-snippet mr-2">&gt;</span>
            <input
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addItem();
                }
              }}
              disabled={disabled}
              className="bg-transparent border-none focus:ring-0 w-full font-code-snippet text-primary text-body-sm placeholder:text-outline/40 uppercase outline-none"
              placeholder={interaction.input_placeholder ?? 'ADD_ITEM'}
              type="text"
            />
          </div>
          <button
            type="button"
            onClick={addItem}
            disabled={disabled}
            className="w-14 h-14 border border-primary-fixed flex items-center justify-center text-primary-fixed hover:bg-primary-fixed/10 transition-all disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[24px]">add</span>
          </button>
        </div>
        {items.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {items.map((item, idx) => (
              <div
                key={`${item}-${idx}`}
                className="px-3 py-1 bg-surface-container border border-outline-variant flex items-center gap-2"
              >
                <span className="text-[10px] text-outline font-bold uppercase tracking-wider">
                  {interaction.key_label ?? 'ITEM'}:
                </span>
                <span className="text-[12px] text-primary-fixed font-code-snippet uppercase">{item}</span>
                <button
                  type="button"
                  onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                  className="material-symbols-outlined text-[14px] text-error cursor-pointer leading-none"
                >
                  close
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          disabled={disabled || items.length === 0}
          onClick={() => onConfirm(items)}
          className="w-full mt-6 bg-primary-fixed/10 border border-primary-fixed text-primary-fixed font-bold font-code-snippet py-2 uppercase hover:bg-primary-fixed/20 transition-all disabled:opacity-40"
        >
          CONFIRM_ENTRIES
        </button>
      </div>
    </div>
  );
}

function DocumentUploadPanel({
  interaction,
  disabled,
  onUpload,
}: {
  interaction: InteractionRequest;
  disabled: boolean;
  onUpload: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const accept = interaction.accept ?? '.pdf,.json,.yaml,.yml';

  function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const max = interaction.max_files ?? 5;
    onUpload(Array.from(fileList).slice(0, max));
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center gap-2 mb-1">
        <span className="material-symbols-outlined text-primary-fixed text-[18px]">auto_awesome</span>
        <span className="font-label-caps text-label-caps text-primary-fixed uppercase">JUPITER_AI</span>
        <span className="text-[10px] text-outline font-code-snippet">DOCUMENT_UPLOAD</span>
      </div>
      <div className="glass-panel p-4 w-full max-w-2xl">
        <p className="font-code-snippet text-on-surface mb-4">{interaction.prompt}</p>
        <div
          role="button"
          tabIndex={0}
          onDragOver={(e: DragEvent) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e: DragEvent) => {
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          className={`border-2 border-dashed p-10 flex flex-col items-center justify-center bg-surface-container-lowest/30 transition-all cursor-pointer group ${
            dragOver ? 'border-primary-fixed' : 'border-outline-variant hover:border-primary-fixed/50'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={accept}
            className="hidden"
            disabled={disabled}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleFiles(e.target.files)}
          />
          <span className="material-symbols-outlined text-[48px] text-outline group-hover:text-primary-fixed transition-colors mb-4">
            upload_file
          </span>
          <p className="font-code-snippet text-on-surface-variant uppercase tracking-widest mb-1 text-center">
            DRAG_&amp;_DROP_POLICIES
          </p>
          <p className="text-[10px] text-outline text-center">SUPPORTED: {accept.replace(/\./g, ' ').toUpperCase()}</p>
          <button
            type="button"
            disabled={disabled}
            className="mt-6 px-8 py-2 border border-primary-fixed text-primary-fixed font-code-snippet font-bold uppercase hover:bg-primary-fixed/10 transition-all disabled:opacity-40"
          >
            UPLOAD
          </button>
        </div>
      </div>
    </div>
  );
}

function ToolRegistryPanel({
  interaction,
  disabled,
  onConfirm,
}: {
  interaction: InteractionRequest;
  disabled: boolean;
  onConfirm: (tools: ToolRegistryEntry[]) => void;
}) {
  const [draft, setDraft] = useState<ToolRegistryEntry>({ ...EMPTY_TOOL });
  const [tools, setTools] = useState<ToolRegistryEntry[]>([]);

  function updateDraft(field: keyof ToolRegistryEntry, value: string) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  function addTool() {
    const name = draft.tool_name.trim();
    if (!name) return;
    setTools((prev) => [
      ...prev,
      {
        tool_name: name,
        tool_description: draft.tool_description.trim(),
        access_required: draft.access_required.trim(),
        access_currently_has: draft.access_currently_has.trim(),
      },
    ]);
    setDraft({ ...EMPTY_TOOL });
  }

  const minTools = interaction.min_selections ?? 1;

  return (
    <div className="flex flex-col gap-2 w-full items-end">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] text-outline font-code-snippet">TOOL_REGISTRY</span>
        <span className="font-label-caps text-label-caps text-outline uppercase">OPERATOR_INPUT</span>
        <span className="material-symbols-outlined text-outline text-[18px]">account_circle</span>
      </div>
      <div className="glass-panel p-4 w-full max-w-3xl">
        <p className="font-code-snippet text-on-surface mb-4 leading-relaxed text-[12px]">
          {interaction.prompt}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] text-outline font-code-snippet uppercase">Tool name *</span>
            <input
              value={draft.tool_name}
              onChange={(e) => updateDraft('tool_name', e.target.value)}
              disabled={disabled}
              className="h-10 px-3 bg-surface-container-low/60 border border-outline-variant font-code-snippet text-sm text-primary outline-none focus:border-primary-fixed"
              placeholder="e.g. stripe_create_payment"
            />
          </label>
          <label className="flex flex-col gap-1 md:col-span-2">
            <span className="text-[10px] text-outline font-code-snippet uppercase">What it does</span>
            <input
              value={draft.tool_description}
              onChange={(e) => updateDraft('tool_description', e.target.value)}
              disabled={disabled}
              className="h-10 px-3 bg-surface-container-low/60 border border-outline-variant font-code-snippet text-sm text-primary outline-none focus:border-primary-fixed"
              placeholder="Creates outbound payment intents"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] text-outline font-code-snippet uppercase">Access required</span>
            <input
              value={draft.access_required}
              onChange={(e) => updateDraft('access_required', e.target.value)}
              disabled={disabled}
              className="h-10 px-3 bg-surface-container-low/60 border border-outline-variant font-code-snippet text-sm text-primary outline-none focus:border-primary-fixed"
              placeholder="write payments"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] text-outline font-code-snippet uppercase">Access currently has</span>
            <input
              value={draft.access_currently_has}
              onChange={(e) => updateDraft('access_currently_has', e.target.value)}
              disabled={disabled}
              className="h-10 px-3 bg-surface-container-low/60 border border-outline-variant font-code-snippet text-sm text-primary outline-none focus:border-primary-fixed"
              placeholder="sandbox only"
            />
          </label>
        </div>
        <button
          type="button"
          onClick={addTool}
          disabled={disabled || !draft.tool_name.trim()}
          className="mb-4 px-4 py-2 border border-primary-fixed text-primary-fixed font-code-snippet text-[11px] uppercase hover:bg-primary-fixed/10 disabled:opacity-40"
        >
          Add tool
        </button>
        {tools.length > 0 && (
          <div className="space-y-2 mb-4 border-t border-outline-variant pt-3">
            {tools.map((tool, idx) => (
              <div
                key={`${tool.tool_name}-${idx}`}
                className="flex justify-between gap-2 p-2 border border-outline-variant bg-surface-container-low/30"
              >
                <div className="text-[11px] font-code-snippet text-on-surface">
                  <span className="text-primary-fixed">{tool.tool_name}</span>
                  {tool.tool_description ? ` — ${tool.tool_description}` : ''}
                  <br />
                  <span className="text-outline">
                    Required: {tool.access_required || '—'} | Has: {tool.access_currently_has || '—'}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => setTools((prev) => prev.filter((_, i) => i !== idx))}
                  className="material-symbols-outlined text-error text-[18px] shrink-0"
                >
                  close
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          disabled={disabled || tools.length < minTools}
          onClick={() => onConfirm(tools)}
          className="w-full bg-primary-fixed/10 border border-primary-fixed text-primary-fixed font-bold font-code-snippet py-2 uppercase hover:bg-primary-fixed/20 transition-all disabled:opacity-40"
        >
          Confirm {tools.length} tool{tools.length === 1 ? '' : 's'}
        </button>
      </div>
    </div>
  );
}

function PendingInteraction({
  interaction,
  disabled,
  onMultiSelect,
  onMultiInput,
  onUpload,
  onToolRegistry,
}: {
  interaction: InteractionRequest;
  disabled: boolean;
  onMultiSelect: (ids: string[]) => void;
  onMultiInput: (values: string[]) => void;
  onUpload: (files: File[]) => void;
  onToolRegistry: (tools: ToolRegistryEntry[]) => void;
}) {
  switch (interaction.type) {
    case 'multi_select':
      return (
        <MultiSelectPanel interaction={interaction} disabled={disabled} onConfirm={onMultiSelect} />
      );
    case 'multi_input':
      return <MultiInputPanel interaction={interaction} disabled={disabled} onConfirm={onMultiInput} />;
    case 'document_upload':
      return (
        <DocumentUploadPanel interaction={interaction} disabled={disabled} onUpload={onUpload} />
      );
    case 'tool_registry':
      return (
        <ToolRegistryPanel interaction={interaction} disabled={disabled} onConfirm={onToolRegistry} />
      );
    default:
      return null;
  }
}

function AuditReadyPanel({ onOpenAudit }: { onOpenAudit: () => void }) {
  return (
    <div className="glass-panel p-6 border border-primary-fixed/40 bg-primary-fixed/5 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[3px] h-full bg-primary-fixed" />
      <div className="pl-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary-fixed text-[22px]">verified</span>
            <span className="font-label-caps text-label-caps text-primary-fixed">DISCOVERY COMPLETE</span>
          </div>
          <p className="font-body-sm text-on-surface leading-relaxed max-w-2xl">
            Your questioning profile is complete. You are now ready to audit — submit your system URL,
            sample token, and request body in the audit sandbox.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenAudit}
          className="bg-primary-fixed text-on-primary font-bold font-code-snippet px-6 py-3 uppercase hover:bg-primary-container transition-all flex items-center gap-2 shrink-0"
        >
          Open audit sandbox
          <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}

export default function ChatView({
  onOpenAudit,
  onDiscoveryComplete,
}: {
  onOpenAudit?: () => void;
  onDiscoveryComplete?: () => void;
}) {
  const {
    messages,
    pendingInteraction,
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
    restart,
    isLoading,
    canTypeInTerminal,
    discoveryComplete,
  } = useDiscoveryChat({ onDiscoveryComplete });

  const [input, setInput] = useState('');
  const streamRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    streamRef.current?.scrollTo({ top: streamRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, pendingInteraction, isLoading, waitingMessage]);

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendText(input);
      setInput('');
    }
  }

  const showTextInput = canTypeInTerminal || !pendingInteraction;

  return (
    <>
      <div className="scanline" />

      <div
        ref={streamRef}
        className="flex-1 overflow-y-auto px-6 py-6 space-y-8"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="mb-4 pb-4 border-b border-outline-variant flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="material-symbols-outlined text-primary-fixed text-[18px]">chat_bubble</span>
            <span className="font-label-caps text-label-caps text-primary-fixed">DISCOVERY</span>
            <span className="text-[10px] text-outline font-code-snippet">JUPITER_DISCOVERY_AGENT</span>
            {progressLabel && (
              <span className="px-2 py-0.5 border border-primary-container/30 text-[10px] text-primary-fixed font-code-snippet uppercase">
                {progressLabel}
              </span>
            )}
          </div>
          {(isLoading || isStreaming) && (
            <span className="text-[10px] text-primary-fixed font-code-snippet animate-pulse max-w-md truncate">
              {waitingMessage ?? 'PROCESSING...'}
            </span>
          )}
        </div>

        {error && (
          <div className="border border-error-container bg-error-container/10 p-4 flex items-center justify-between gap-4">
            <p className="text-error font-code-snippet text-[12px]">{error}</p>
            <button
              type="button"
              onClick={() => void restart()}
              className="text-primary-fixed font-code-snippet text-[11px] border border-primary-fixed px-3 py-1 uppercase"
            >
              RETRY
            </button>
          </div>
        )}

        {messages.map((msg) =>
          msg.role === 'assistant' ? (
            <AIMsgBubble
              key={msg.id}
              content={msg.content}
              streaming={msg.streaming}
              variant={msg.variant}
            />
          ) : (
            <UserTextBubble key={msg.id} text={msg.content} />
          ),
        )}

        {pendingInteraction && !discoveryComplete && (
          <PendingInteraction
            interaction={pendingInteraction}
            disabled={isLoading}
            onMultiSelect={confirmMultiSelect}
            onMultiInput={confirmMultiInput}
            onUpload={uploadDocuments}
            onToolRegistry={confirmToolRegistry}
          />
        )}

        {discoveryComplete && onOpenAudit && (
          <AuditReadyPanel onOpenAudit={onOpenAudit} />
        )}
      </div>

      <div className="flex-shrink-0 px-6 py-4 surface-glass border-t border-outline-variant">
        {discoveryComplete ? (
          <p className="text-[11px] text-primary-fixed font-code-snippet uppercase text-center py-2">
            Discovery complete — continue in the audit sandbox
          </p>
        ) : showTextInput ? (
          <div className="flex items-center gap-4 w-full">
            <div className="flex-1 relative flex items-center bg-surface-container-low/60 border border-outline-variant h-14 px-4 focus-within:border-primary-fixed transition-colors">
              <span className="text-primary-fixed font-bold font-code-snippet mr-3 select-none">$</span>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!canTypeInTerminal || status === 'error'}
                placeholder={
                  isLoading || isStreaming
                    ? waitingMessage ?? 'Processing...'
                    : 'Describe your AI system...'
                }
                className="flex-1 bg-transparent border-none focus:ring-0 font-code-snippet text-body-sm text-primary placeholder:text-outline/40 outline-none disabled:opacity-50"
                spellCheck={false}
                autoComplete="off"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                sendText(input);
                setInput('');
              }}
              disabled={!canTypeInTerminal || !input.trim() || status === 'error'}
              className="bg-primary-fixed text-on-primary px-8 h-14 font-headline-md text-[16px] font-bold uppercase hover:bg-primary-container transition-all flex items-center gap-2 group whitespace-nowrap disabled:opacity-40"
            >
              SEND
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform text-[20px]">
                terminal
              </span>
            </button>
          </div>
        ) : (
          <p className="text-[11px] text-outline font-code-snippet uppercase text-center py-2">
            Complete the structured input above to continue discovery
          </p>
        )}
      </div>
    </>
  );
}
