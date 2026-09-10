import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  Database, 
  Cpu, 
  CheckCircle2, 
  Copy, 
  RefreshCw, 
  ArrowRight,
  Fingerprint
} from 'lucide-react';

export default function SecurityCenter() {
  const { user, token } = useAuth();
  
  // AES-256 Demo State
  const [plainInput, setPlainInput] = useState('Account: 8841-2940-1193-4859');
  const [encryptedResult, setEncryptedResult] = useState(null);
  const [decryptedResult, setDecryptedResult] = useState('');
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Decoded JWT state
  const [decodedToken, setDecodedToken] = useState(null);

  useEffect(() => {
    async function loadSecurityData() {
      try {
        setLoading(true);
        const logsData = await api.getAuditLogs();
        if (logsData.audit_logs) setAuditLogs(logsData.audit_logs);
      } catch (err) {
        console.error('Error fetching security logs:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSecurityData();

    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const header = JSON.parse(atob(parts[0]));
          const payload = JSON.parse(atob(parts[1]));
          setDecodedToken({ header, payload });
        }
      } catch (e) {
        // ignore
      }
    }
  }, [token]);

  const handleRunEncryption = async () => {
    setIsEncrypting(true);
    try {
      const res = await api.encryptText(plainInput);
      setEncryptedResult(res);
      setDecryptedResult('');
    } catch (err) {
      alert('Encryption error: ' + err.message);
    } finally {
      setIsEncrypting(false);
    }
  };

  const handleRunDecryption = async () => {
    if (!encryptedResult?.encrypted_payload) return;
    setIsDecrypting(true);
    try {
      const res = await api.decryptPayload(encryptedResult.encrypted_payload);
      setDecryptedResult(res.decrypted_plaintext);
    } catch (err) {
      alert('Decryption error: ' + err.message);
    } finally {
      setIsDecrypting(false);
    }
  };

  const rbacMatrix = [
    { module: 'Employee Directory', admin: true, manager: true, officer: true, director: true, employee: 'Self' },
    { module: 'Decrypted Bank Accounts', admin: true, manager: true, officer: true, director: false, employee: 'Self' },
    { module: 'Run Payroll Calculations', admin: true, manager: false, officer: true, director: false, employee: false },
    { module: 'Approve Disbursements', admin: true, manager: false, officer: false, director: true, employee: false },
    { module: 'Apply for Microloans', admin: true, manager: true, officer: true, director: true, employee: true },
    { module: 'Approve Microloan Advances', admin: true, manager: false, officer: false, director: true, employee: false },
    { module: 'Cryptographic Audit Trail', admin: true, manager: true, officer: true, director: true, employee: false },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-emerald-600" />
          Security, Cryptography & Compliance Center
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Hardware-accelerated AES-256-GCM encryption, OAuth 2.0 / JWT session verification, and tamper-proof SHA-256 audit logs.
        </p>
      </div>

      {/* Protocol Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-700">
            <Lock className="w-4 h-4" />
            <span>AES-256-GCM Hardware Encrypted</span>
          </div>
          <p className="text-[11px] text-slate-500">Sensitive fields (salary, banking, TIN) encrypted with Galois/Counter Mode auth tags.</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-700">
            <KeyRound className="w-4 h-4" />
            <span>OAuth 2.0 / JWT Authentication</span>
          </div>
          <p className="text-[11px] text-slate-500">Cryptographically signed bearer tokens with stateless role claims & expiry.</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center space-x-2 text-xs font-bold text-indigo-700">
            <Database className="w-4 h-4" />
            <span>PostgreSQL Data Store</span>
          </div>
          <p className="text-[11px] text-slate-500">Target database: <strong className="text-slate-800">micropayroll</strong> with relational referential integrity.</p>
        </div>
      </div>

      {/* Interactive AES-256 Sandbox */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-600" />
            Live AES-256 Encryption & Decryption Sandbox
          </h2>
          <p className="text-xs text-slate-500">
            Test how our Node.js cryptography engine secures employee payload data with randomized 16-byte IVs and authenticated tags.
          </p>
        </div>

        <div className="space-y-3">
          <label className="block text-[11px] font-bold text-slate-500 uppercase">Input Plaintext</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={plainInput}
              onChange={(e) => setPlainInput(e.target.value)}
              placeholder="Type sensitive value..."
              className="flex-1 p-2.5 rounded-xl border border-slate-200 text-xs font-mono outline-none focus:border-blue-500"
            />
            <button
              onClick={handleRunEncryption}
              disabled={isEncrypting}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center justify-center space-x-1.5 shrink-0"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isEncrypting ? 'Encrypting...' : 'Encrypt with AES-256'}</span>
            </button>
          </div>
        </div>

        {encryptedResult && (
          <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between text-slate-400 text-[11px] border-b border-slate-800 pb-2">
              <span>ALGORITHM: {encryptedResult.algorithm.toUpperCase()} (256-BIT KEY)</span>
              <span className="text-emerald-400 font-bold">STATUS: AUTHENTICATED</span>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Initialization Vector (IV Hex):</span>
                <span className="text-amber-400">{encryptedResult.breakdown.initialization_vector_hex}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Authentication Tag (Tag Hex):</span>
                <span className="text-purple-400">{encryptedResult.breakdown.auth_tag_hex}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Encrypted Ciphertext:</span>
                <div className="break-all text-emerald-300 bg-slate-950 p-2 rounded-lg mt-0.5">
                  {encryptedResult.breakdown.ciphertext_hex}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <button
                onClick={handleRunDecryption}
                disabled={isDecrypting}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-semibold text-xs flex items-center space-x-1.5 transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Verify Roundtrip Decryption</span>
              </button>

              {decryptedResult && (
                <div className="text-xs font-sans text-slate-200">
                  Decrypted Output: <strong className="font-mono text-emerald-400 ml-1">{decryptedResult}</strong>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* OAuth 2.0 / JWT Token Inspector */}
      {decodedToken && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-emerald-600" />
              Active OAuth 2.0 / JWT Token Claims
            </h2>
            <p className="text-xs text-slate-500">Live inspection of the signed bearer token issued by MMS authentication.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-800 text-[11px] uppercase border-b pb-1">Token Header</div>
              <pre className="text-slate-700">{JSON.stringify(decodedToken.header, null, 2)}</pre>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-800 text-[11px] uppercase border-b pb-1">Token Claims Payload</div>
              <pre className="text-slate-700">{JSON.stringify(decodedToken.payload, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}

      {/* RBAC Matrix */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900">Role-Based Access Control (RBAC) Matrix</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
              <tr>
                <th className="py-2.5 px-3">System Capability</th>
                <th className="py-2.5 px-3">Admin</th>
                <th className="py-2.5 px-3">HR Manager</th>
                <th className="py-2.5 px-3">Payroll Officer</th>
                <th className="py-2.5 px-3">Finance Director</th>
                <th className="py-2.5 px-3">Employee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rbacMatrix.map((r, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-3 font-semibold text-slate-800">{r.module}</td>
                  <td className="py-2.5 px-3">{r.admin ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <span className="text-slate-300">-</span>}</td>
                  <td className="py-2.5 px-3">{r.manager ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <span className="text-slate-300">-</span>}</td>
                  <td className="py-2.5 px-3">{r.officer ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <span className="text-slate-300">-</span>}</td>
                  <td className="py-2.5 px-3">{r.director ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <span className="text-slate-300">-</span>}</td>
                  <td className="py-2.5 px-3">
                    {typeof r.employee === 'string' ? (
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">{r.employee}</span>
                    ) : r.employee ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
