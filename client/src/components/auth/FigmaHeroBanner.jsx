import React from 'react';
import { 
  CreditCard, 
  Users, 
  Layers, 
  ShieldCheck, 
  FileCheck2, 
  Sparkles,
  Lock
} from 'lucide-react';

export default function FigmaHeroBanner() {
  const features = [
    {
      title: 'Automated Payroll & Tax Settlement',
      desc: 'Real-time DOLE statutory computations, TRAIN Law withholding & digital payslips',
      color: 'bg-purple-500',
      icon: CreditCard,
      borderGlow: 'hover:border-purple-500/40'
    },
    {
      title: 'Workforce Directory & Management',
      desc: 'Centralized employee profiles, compensation history & department structures',
      color: 'bg-emerald-500',
      icon: Users,
      borderGlow: 'hover:border-emerald-500/40'
    },
    {
      title: 'Statutory Compliance & Benefits',
      desc: 'SSS, PhilHealth, Pag-IBIG Circular No. 460 & HMO contribution management',
      color: 'bg-amber-500',
      icon: Layers,
      borderGlow: 'hover:border-amber-500/40'
    },
    {
      title: 'Bank-Grade Cryptographic Security',
      desc: 'OAuth 2.0 authentication, AES-256 encrypted storage & tamper-proof audit trails',
      color: 'bg-blue-500',
      icon: Lock,
      borderGlow: 'hover:border-blue-500/40'
    },
    {
      title: 'Executive Financial Auditing',
      desc: 'Comprehensive disbursement controls, ledger verification & compliance reporting',
      color: 'bg-teal-500',
      icon: ShieldCheck,
      borderGlow: 'hover:border-teal-500/40'
    }
  ];

  return (
    <div className="relative flex flex-col justify-between w-full h-full p-6 sm:p-8 lg:p-10 xl:p-12 text-white overflow-hidden">
      {/* Ambient background glow effects */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Brand */}
      <div className="relative z-10 space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center font-black tracking-wider text-white shadow-lg shadow-indigo-500/25 text-sm">
              MMS
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-2">
                Microfinancial
              </h1>
              <p className="text-[11px] text-slate-400 font-medium tracking-wide">Management System</p>
            </div>
          </div>

          {/* Status Indicator Dots */}
          <div className="flex items-center space-x-1.5 bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
        </div>

        {/* Hero Title & Pill */}
        <div className="space-y-1.5 pt-1 sm:pt-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] font-semibold uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            Enterprise Workforce Platform
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Intelligent Enterprise <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-indigo-200">
              HR & Payroll Infrastructure
            </span>
          </h2>

          <p className="text-xs sm:text-sm text-slate-400 font-normal leading-relaxed max-w-md">
            Mission-critical microfinancial infrastructure providing automated Philippine payroll computation, 
            statutory compliance, and enterprise workforce administration.
          </p>
        </div>

        {/* 5 Feature Highlight Pills */}
        <div className="space-y-1.5 sm:space-y-2 pt-1">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx}
                className={`group flex items-center justify-between p-2 sm:p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] ${item.borderGlow} transition-all duration-200`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${item.color} shadow-sm`} />
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-normal hidden xl:block">
                      {item.desc}
                    </p>
                  </div>
                </div>
                <div className="p-1 rounded-lg bg-white/[0.04] text-slate-400 group-hover:text-slate-200 transition-colors">
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="relative z-10 pt-3 sm:pt-4 mt-2 border-t border-slate-800/80">
        <div className="grid grid-cols-3 gap-3 text-center sm:text-left">
          <div>
            <div className="text-lg lg:text-xl font-bold text-white tracking-tight">99.9%</div>
            <div className="text-[10px] text-slate-400 font-medium">Uptime SLA</div>
          </div>
          <div>
            <div className="text-lg lg:text-xl font-bold text-white tracking-tight">10,000+</div>
            <div className="text-[10px] text-slate-400 font-medium">Transactions</div>
          </div>
          <div>
            <div className="text-lg lg:text-xl font-bold text-emerald-400 tracking-tight">0</div>
            <div className="text-[10px] text-slate-400 font-medium">Security Breaches</div>
          </div>
        </div>
      </div>
    </div>
  );
}
