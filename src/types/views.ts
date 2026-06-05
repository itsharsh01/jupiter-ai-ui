export type AppView = 'dashboard' | 'auditing' | 'audit_report' | 'sys_config';

export const NAV_ITEMS: {
  id: AppView;
  icon: string;
  label: string;
  requiresDiscovery?: boolean;
}[] = [
  { id: 'dashboard', icon: 'space_dashboard', label: 'DASHBOARD' },
  { id: 'auditing', icon: 'chat_bubble', label: 'DISCOVERY' },
  {
    id: 'audit_report',
    icon: 'science',
    label: 'AUDIT',
    requiresDiscovery: true,
  },
  { id: 'sys_config', icon: 'developer_board', label: 'SYS_CONFIG' },
];
