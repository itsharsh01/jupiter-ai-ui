import { useState, type FormEvent } from 'react';

type AuthMode = 'login' | 'register';

interface LoginViewProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (email: string, password: string, name?: string, company?: string) => Promise<void>;
  error?: string | null;
  loading?: boolean;
}

function CliField({
  label,
  type,
  value,
  onChange,
  placeholder,
  disabled,
  required = true,
  minLength,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  required?: boolean;
  minLength?: number;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="flex flex-col">
      <label className="font-code-snippet text-code-snippet text-outline mb-1 flex items-center">
        <span className="text-primary-fixed-dim mr-2">&gt;</span>
        {label}
      </label>
      <div className="flex items-center">
        <input
          className="cli-input font-code-snippet text-code-snippet py-2"
          type={type}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          minLength={minLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => onChange(e.target.value)}
        />
        {focused && <span className="terminal-cursor-inline" aria-hidden />}
      </div>
    </div>
  );
}

export default function LoginView({ onLogin, onRegister, error, loading }: LoginViewProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('root@gov.os');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [company, setCompany] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (mode === 'register') {
      await onRegister(trimmedEmail, password, displayName.trim() || undefined, company.trim() || undefined);
    } else {
      await onLogin(trimmedEmail, password);
    }
  }

  function switchMode(next: AuthMode) {
    setMode(next);
    if (next === 'login') {
      setDisplayName('');
      setCompany('');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-10">
      <main className="w-full max-w-[440px] flex flex-col items-center justify-center">
        <div className="glass-panel w-full p-4 md:p-8 flex flex-col gap-8">
          <header className="flex flex-col gap-1">
            <h1 className="font-headline-md text-headline-md text-secondary-container tracking-wider">
              JUPITER AI
            </h1>
            <div className="h-px w-full bg-outline-variant/30" />
            <p className="font-label-caps text-label-caps text-outline mt-2">
              PROTOCOL: {mode === 'login' ? 'AUTHENTICATION' : 'OPERATOR_PROVISIONING'}
            </p>
          </header>

          <form className="flex flex-col gap-4" onSubmit={(e) => void handleSubmit(e)}>
            {mode === 'register' && (
              <>
                <CliField
                  label="OPERATOR_NAME:"
                  type="text"
                  value={displayName}
                  onChange={setDisplayName}
                  placeholder="Portfolio Ops"
                  disabled={loading}
                  required={false}
                />
                <CliField
                  label="ORGANIZATION:"
                  type="text"
                  value={company}
                  onChange={setCompany}
                  placeholder="Acme Financial"
                  disabled={loading}
                  required={false}
                />
              </>
            )}

            <CliField
              label="EMAIL_ADDRESS:"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder={mode === 'login' ? 'root@gov.os' : 'ops@yourcompany.com'}
              disabled={loading}
            />

            <div className={mode === 'login' ? 'mt-2' : ''}>
              <CliField
                label="ACCESS_KEY:"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
                disabled={loading}
                minLength={mode === 'register' ? 8 : undefined}
              />
            </div>

            {mode === 'register' && (
              <p className="text-[10px] text-outline font-code-snippet">
                Access key must be at least 8 characters.
              </p>
            )}

            {error && (
              <p className="text-error font-code-snippet text-[12px] border border-error-container/40 bg-error-container/10 px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !email.trim() || !password}
              className="mt-4 border border-primary-fixed-dim text-primary-fixed-dim font-headline-md text-headline-md font-bold py-3 px-6 hover:bg-primary-fixed-dim/10 transition-all duration-150 ease-in-out disabled:opacity-40"
            >
              {loading
                ? mode === 'login'
                  ? 'INITIALIZING…'
                  : 'PROVISIONING…'
                : mode === 'login'
                  ? 'INITIALIZE_SESSION'
                  : 'PROVISION_ACCESS'}
            </button>
          </form>

          <div className="text-center">
            <button
              type="button"
              disabled={loading}
              onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
              className="font-code-snippet text-[11px] text-primary-fixed uppercase hover:underline disabled:opacity-40"
            >
              {mode === 'login'
                ? 'Need an account? Register operator'
                : 'Already provisioned? Initialize session'}
            </button>
          </div>

          <footer className="flex justify-between items-center pt-2 border-t border-outline-variant/20 gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-fixed-dim" />
              <span className="font-label-caps text-label-caps text-on-surface-variant">
                SECURE_LINK: STABLE
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="material-symbols-outlined text-[12px] text-tertiary-fixed-dim"
                style={{ fontVariationSettings: '"FILL" 1' }}
              >
                lock
              </span>
              <span className="font-label-caps text-label-caps text-on-surface-variant">
                ENCRYPTION: ACTIVE
              </span>
            </div>
          </footer>
        </div>

        <p className="mt-8 font-label-caps text-label-caps text-outline text-center opacity-50">
          SYSTEM_ID: GOV_OS / AI_GENESIS_v2.0.4
          <br />
          UNAUTHORIZED_ACCESS_IS_LOGGED
        </p>
      </main>
    </div>
  );
}
