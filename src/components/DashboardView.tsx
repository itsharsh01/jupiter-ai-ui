import TerminalPanel from './TerminalPanel';

interface DashboardViewProps {
  onOpenAuditing: () => void;
}

export default function DashboardView({ onOpenAuditing }: DashboardViewProps) {
  return (
    <div className="flex-1 flex items-center justify-center px-6 py-10 overflow-y-auto">
      <TerminalPanel onOpenAuditing={onOpenAuditing} />
    </div>
  );
}
