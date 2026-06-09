import { useEffect, useState } from 'react';
import { fetchAuditSandboxForSession } from '../api/audit';
import AuditGovernanceReportView from './AuditGovernanceReportView';
import JupiterLoader from './JupiterLoader';

interface GovernanceReportPageProps {
  sessionId: string | null;
}

export default function GovernanceReportPage({ sessionId }: GovernanceReportPageProps) {
  const [auditId, setAuditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!sessionId) {
        setLoading(false);
        setError('Complete discovery and configure the audit sandbox first.');
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const sandbox = await fetchAuditSandboxForSession(sessionId);
        if (cancelled) return;

        if (!sandbox?.audit_id) {
          setError('Save your audit sandbox configuration before viewing the report.');
          setAuditId(null);
          return;
        }
        if (!sandbox.test_cases.length) {
          setError('Generate test cases in the audit sandbox before viewing the report.');
          setAuditId(null);
          return;
        }

        setAuditId(sandbox.audit_id);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load audit session');
          setAuditId(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (loading) {
    return (
      <JupiterLoader fullscreen text="Loading governance report…" />
    );
  }

  if (error || !auditId) {
    return (
      <div className="flex-1 flex items-center justify-center p-10">
        <div className="glass-panel p-10 max-w-lg w-full text-center">
          <span className="material-symbols-outlined text-outline text-[40px] mb-4">description</span>
          <h2 className="font-headline-md text-headline-md text-primary-fixed-dim mb-3">REPORT UNAVAILABLE</h2>
          <p className="font-body-sm text-on-surface-variant leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  return <AuditGovernanceReportView auditId={auditId} />;
}
