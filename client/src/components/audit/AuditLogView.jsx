import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { ACCENT } from '../../theme';
import { 
  Shield, 
  Search, 
  RefreshCw, 
  X, 
  CheckCircle2, 
  Lock, 
  Info, 
  Download,
  Eye,
  FileText
} from 'lucide-react';

const ACTION_BADGES = {
  SYSTEM_BOOTSTRAP: { bg: '#EFF6FF', text: '#2E6BE6', border: '#BFDBFE' },
  PAYROLL_CALCULATION_RUN: { bg: '#EFF6FF', text: '#2E6BE6', border: '#BFDBFE' },
  PAYROLL_APPROVED: { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' },
  OVERTIME_APPROVED: { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' },
  CLAIM_SUBMITTED: { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' },
  USER_PROFILE_UPDATED: { bg: '#F3E8FF', text: '#7C3AED', border: '#DDD6FE' },
  USER_PASSWORD_CHANGED: { bg: '#FEE2E2', text: '#DC2626', border: '#FECACA' },
  OAUTH2_TOKEN_ISSUED: { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' },
  DEFAULT: { bg: '#F8FAFC', text: '#64748B', border: '#E2E8F0' }
};

export default function AuditLogView() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const isScoped = user?.role === 'employee' || user?.role === 'officer';

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getAuditLogs({
        action: actionFilter !== 'ALL' ? actionFilter : undefined,
        entity: entityFilter !== 'ALL' ? entityFilter : undefined,
        search: search || undefined
      });
      if (res && res.audit_logs) {
        setLogs(res.audit_logs);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [actionFilter, entityFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadLogs();
  };

  const handleClearSearch = () => {
    setSearch('');
    setTimeout(loadLogs, 10);
  };

  const copyChecksum = (checksum, id) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(checksum);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const exportCSV = () => {
    if (!logs.length) return;
    const headers = ['ID', 'Timestamp', 'Action', 'Entity', 'Entity ID', 'User', 'Role', 'IP Address', 'Checksum'];
    const rows = logs.map(l => [
      l.id,
      new Date(l.created_at).toLocaleString('en-US'),
      l.action,
      l.entity,
      l.entity_id || '',
      l.user_name || '',
      l.user_role || '',
      l.ip_address || '',
      l.cryptographic_checksum || ''
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Audit_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const uniqueActions = useMemo(() => {
    const set = new Set(logs.map(l => l.action).filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [logs]);

  const uniqueEntities = useMemo(() => {
    const set = new Set(logs.map(l => l.entity).filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [logs]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-[#EFF6FF] text-[#2E6BE6]">
              <Shield className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold font-display text-slate-900">
              System Audit &amp; Activity Logs
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isScoped 
              ? 'Showing your account activity trail and personal transactional operations'
              : 'Tamper-evident, immutable system ledger with SHA-256 cryptographic verification'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadLogs}
            className="px-3 py-1.5 rounded-lg border border-[#E4E8F0] bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#2E6BE6]' : 'text-slate-500'}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={exportCSV}
            disabled={logs.length === 0}
            className="px-3.5 py-1.5 rounded-lg bg-[#2E6BE6] hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Security Scope Banner */}
      <div className={`p-4 rounded-[14px] border flex items-start gap-3 text-xs ${
        isScoped 
          ? 'bg-amber-50/70 border-amber-200 text-amber-900'
          : 'bg-[#EFF6FF]/60 border-blue-200 text-blue-900'
      }`}>
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <div className="font-bold">
            {isScoped ? 'Employee Activity Scoping Active' : 'Cryptographic Integrity Notice'}
          </div>
          <div className="text-[11px] opacity-90 leading-relaxed">
            {isScoped
              ? `You are signed in as ${user?.full_name} (${user?.role_label}). Under privacy policies, only actions performed by or addressed to your account are displayed.`
              : 'All audit events are recorded in real-time with actor attribution, client IP address, and an immutable SHA-256 cryptographic checksum matching BIR and DOLE compliance audit standards.'}
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-[14px] border border-[#E4E8F0] p-4 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search action, user, entity ID, IP, or details..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 border border-[#E4E8F0] rounded-lg text-xs outline-none focus:border-[#2E6BE6] bg-slate-50/50 focus:bg-white transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2.5 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
              className="px-3 py-2 border border-[#E4E8F0] rounded-lg text-xs bg-slate-50/50 outline-none focus:border-[#2E6BE6] cursor-pointer"
            >
              <option value="ALL">All Actions</option>
              {uniqueActions.filter(a => a !== 'ALL').map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>

            <select
              value={entityFilter}
              onChange={e => setEntityFilter(e.target.value)}
              className="px-3 py-2 border border-[#E4E8F0] rounded-lg text-xs bg-slate-50/50 outline-none focus:border-[#2E6BE6] cursor-pointer"
            >
              <option value="ALL">All Entities</option>
              {uniqueEntities.filter(e => e !== 'ALL').map(ent => (
                <option key={ent} value={ent}>{ent}</option>
              ))}
            </select>

            <button
              type="submit"
              className="px-4 py-2 bg-[#2E6BE6] hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-all shadow-xs cursor-pointer"
            >
              Search
            </button>
          </div>
        </form>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <span>Found <strong>{logs.length}</strong> recorded audit event{logs.length === 1 ? '' : 's'}</span>
          {(actionFilter !== 'ALL' || entityFilter !== 'ALL' || search) && (
            <button
              type="button"
              onClick={() => {
                setActionFilter('ALL');
                setEntityFilter('ALL');
                setSearch('');
                setTimeout(loadLogs, 10);
              }}
              className="text-[#2E6BE6] hover:underline cursor-pointer"
            >
              Reset all filters
            </button>
          )}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-[14px] border border-[#E4E8F0] shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#2E6BE6]" />
            <p className="text-xs">Loading cryptographically verified log stream...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <FileText className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No audit logs found</p>
            <p className="text-xs text-slate-400">Try adjusting your filters or search term.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#E4E8F0]">
                <tr>
                  <th className="py-3 px-4 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Timestamp</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Action</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Target Entity</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Actor / Role</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">IP Address</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Checksum</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-[#64748B] uppercase tracking-wider text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {logs.map((log) => {
                  const badgeStyle = ACTION_BADGES[log.action] || ACTION_BADGES.DEFAULT;
                  const formattedDate = new Date(log.created_at).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  });

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                        {formattedDate}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span 
                          style={{ 
                            background: badgeStyle.bg, 
                            color: badgeStyle.text, 
                            borderColor: badgeStyle.border 
                          }}
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{log.entity}</div>
                        {log.entity_id && (
                          <div className="text-[10px] text-slate-400 font-mono">ID: {log.entity_id}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-800">{log.user_name || 'System'}</div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-tight">{log.user_role || 'system'}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-500">
                        {log.ip_address}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[10px] text-slate-400">
                        <button
                          type="button"
                          onClick={() => copyChecksum(log.cryptographic_checksum, log.id)}
                          className="flex items-center gap-1 hover:text-[#2E6BE6] cursor-pointer"
                          title="Click to copy full SHA-256 hash"
                        >
                          <span>{log.cryptographic_checksum ? `${log.cryptographic_checksum.slice(0, 10)}...` : 'N/A'}</span>
                          {copiedId === log.id && (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-[#2E6BE6] transition-colors cursor-pointer"
                          title="View event payload"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payload Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[14px] border border-[#E4E8F0] shadow-xl max-w-lg w-full p-6 space-y-4 animate-modal-enter">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-[#EFF6FF] text-[#2E6BE6]">
                  <Lock className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Audit Event Details</h3>
                  <p className="text-[11px] text-slate-400 font-mono">Event #{selectedLog.id} • {selectedLog.action}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Actor</span>
                  <span className="font-semibold text-slate-800">{selectedLog.user_name} ({selectedLog.user_role})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">IP Address</span>
                  <span className="font-mono text-slate-800">{selectedLog.ip_address}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Entity</span>
                  <span className="font-semibold text-slate-800">{selectedLog.entity} {selectedLog.entity_id ? `(${selectedLog.entity_id})` : ''}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Timestamp</span>
                  <span className="text-slate-800">{new Date(selectedLog.created_at).toLocaleString('en-US')}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-bold block mb-1">Payload JSON</span>
                <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg text-[11px] font-mono overflow-x-auto max-h-48">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>

              <div>
                <span className="text-slate-500 font-bold block mb-1">SHA-256 Cryptographic Checksum</span>
                <div className="p-2 bg-slate-100 rounded-lg font-mono text-[10px] text-slate-600 break-all select-all">
                  {selectedLog.cryptographic_checksum}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-[#2E6BE6] hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
