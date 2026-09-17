import React, { useState } from 'react';
import {
  X,
  Calendar,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  Gift,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';

export default function NewPayrollPeriodModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    period_name: '',
    cut_off_start: '',
    cut_off_end: '',
    payout_date: '',
    cut_off_type: '1st',
    is_semi_monthly: true,
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const applyTemplate = (type) => {
    setError('');
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    if (type === '1st') {
      // Next 1st Cut-off: October 1–15, 2026
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const targetMonthIdx = (currentMonth + 1) % 12;
      const targetYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const mName = monthNames[targetMonthIdx];
      const mNum = String(targetMonthIdx + 1).padStart(2, '0');

      setFormData({
        period_name: `${mName} 1–15, ${targetYear}`,
        cut_off_start: `${targetYear}-${mNum}-01`,
        cut_off_end: `${targetYear}-${mNum}-15`,
        payout_date: `${targetYear}-${mNum}-15`,
        cut_off_type: '1st',
        is_semi_monthly: true,
        description: `Regular 1st half pay cycle — Withholding tax only (Statutory deferred to 2nd half)`
      });
    } else if (type === '2nd') {
      // 2nd Cut-off: September 16–30, 2026
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const mName = monthNames[currentMonth];
      const mNum = String(currentMonth + 1).padStart(2, '0');
      const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();

      setFormData({
        period_name: `${mName} 16–${lastDay}, ${currentYear}`,
        cut_off_start: `${currentYear}-${mNum}-16`,
        cut_off_end: `${currentYear}-${mNum}-${lastDay}`,
        payout_date: `${currentYear}-${mNum}-${lastDay}`,
        cut_off_type: '2nd',
        is_semi_monthly: true,
        description: `Regular 2nd half pay cycle — Full statutory SSS, PhilHealth, Pag-IBIG & withholding tax`
      });
    } else if (type === '13th_month') {
      // 13th Month Pay Annual Run
      setFormData({
        period_name: `13th Month Pay ${currentYear}`,
        cut_off_start: `${currentYear}-01-01`,
        cut_off_end: `${currentYear}-12-31`,
        payout_date: `${currentYear}-12-15`,
        cut_off_type: 'Special / 13th Month',
        is_semi_monthly: false,
        description: `Mandatory Annual 13th Month Pay (P.D. 851) — Tax-exempt threshold up to ₱90,000`
      });
    } else if (type === 'monthly') {
      // Full Monthly Cycle
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const mName = monthNames[currentMonth];
      const mNum = String(currentMonth + 1).padStart(2, '0');
      const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();

      setFormData({
        period_name: `${mName} ${currentYear} (Full Month)`,
        cut_off_start: `${currentYear}-${mNum}-01`,
        cut_off_end: `${currentYear}-${mNum}-${lastDay}`,
        payout_date: `${currentYear}-${mNum}-25`,
        cut_off_type: 'Full Month',
        is_semi_monthly: false,
        description: `Monthly standard payroll run with unified statutory deductions`
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.period_name.trim()) {
      setError('Please enter a period title/name.');
      return;
    }
    if (!formData.cut_off_start || !formData.cut_off_end || !formData.payout_date) {
      setError('Please specify cut-off start, end, and payout dates.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.createPayrollPeriod(formData);
      if (res.error) {
        setError(res.error);
      } else {
        onSuccess(res.period || { ...formData, status: 'Draft' });
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to create payroll period');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 mb-1.5">
            <Calendar className="w-5 h-5 text-blue-200" />
            <span className="text-xs font-bold uppercase tracking-wider text-blue-200">New Pay Cycle</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">Create New Payroll Period</h2>
          <p className="text-xs text-blue-100/80 mt-1">
            Initialize an upcoming regular cut-off, annual 13th month run, or custom ad-hoc pay batch.
          </p>
        </div>

        {/* Quick Template Presets */}
        <div className="p-5 pb-0 bg-slate-50 border-b border-slate-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
            ⚡ Quick Template Presets (One-Click Setup)
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => applyTemplate('1st')}
              className="px-2.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-[11px] font-semibold text-slate-700 transition-all text-left flex flex-col gap-0.5 shadow-2xs cursor-pointer"
            >
              <span className="font-bold text-blue-700">📅 1st Cut-off</span>
              <span className="text-[10px] text-slate-500">1st–15th (BIR only)</span>
            </button>
            <button
              type="button"
              onClick={() => applyTemplate('2nd')}
              className="px-2.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-purple-400 hover:bg-purple-50/50 text-[11px] font-semibold text-slate-700 transition-all text-left flex flex-col gap-0.5 shadow-2xs cursor-pointer"
            >
              <span className="font-bold text-purple-700">📅 2nd Cut-off</span>
              <span className="text-[10px] text-slate-500">16th–End (Full Stat)</span>
            </button>
            <button
              type="button"
              onClick={() => applyTemplate('13th_month')}
              className="px-2.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 text-[11px] font-semibold text-slate-700 transition-all text-left flex flex-col gap-0.5 shadow-2xs cursor-pointer"
            >
              <span className="font-bold text-emerald-700">🎁 13th Month</span>
              <span className="text-[10px] text-slate-500">Annual P.D. 851</span>
            </button>
            <button
              type="button"
              onClick={() => applyTemplate('monthly')}
              className="px-2.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 text-[11px] font-semibold text-slate-700 transition-all text-left flex flex-col gap-0.5 shadow-2xs cursor-pointer"
            >
              <span className="font-bold text-amber-700">📊 Full Month</span>
              <span className="text-[10px] text-slate-500">Monthly unified</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Period Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Period Title / Cycle Identifier <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.period_name}
              onChange={(e) => setFormData({ ...formData, period_name: e.target.value })}
              placeholder="e.g., October 1–15, 2026 or 13th Month Pay 2026"
              className="w-full px-3.5 py-2 text-xs font-semibold text-slate-900 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-2xs"
            />
          </div>

          {/* Cycle Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Statutory / Cycle Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.cut_off_type}
                onChange={(e) => setFormData({
                  ...formData,
                  cut_off_type: e.target.value,
                  is_semi_monthly: e.target.value === '1st' || e.target.value === '2nd'
                })}
                className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-600 shadow-2xs"
              >
                <option value="1st">1st Cut-off (1st–15th: Tax Withholding Only)</option>
                <option value="2nd">2nd Cut-off (16th–End: Full Statutory SSS/PhilHealth/HDMF)</option>
                <option value="Full Month">Full Month (Standard Monthly Payroll)</option>
                <option value="Special / 13th Month">Special / 13th Month Pay (P.D. 851)</option>
                <option value="Off-Cycle">Off-Cycle Emergency Disbursal</option>
              </select>
            </div>

            {/* Payout Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Scheduled Payout Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.payout_date}
                onChange={(e) => setFormData({ ...formData, payout_date: e.target.value })}
                className="w-full px-3.5 py-2 text-xs font-semibold text-slate-900 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-600 shadow-2xs"
              />
            </div>
          </div>

          {/* Cut-Off Date Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cut-off Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.cut_off_start}
                onChange={(e) => setFormData({ ...formData, cut_off_start: e.target.value })}
                className="w-full px-3.5 py-2 text-xs font-semibold text-slate-900 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-600 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cut-off End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.cut_off_end}
                onChange={(e) => setFormData({ ...formData, cut_off_end: e.target.value })}
                className="w-full px-3.5 py-2 text-xs font-semibold text-slate-900 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-600 shadow-2xs"
              />
            </div>
          </div>

          {/* Semi-Monthly Rule Checkbox */}
          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-start gap-2.5">
            <input
              type="checkbox"
              id="is_semi_monthly"
              checked={formData.is_semi_monthly}
              onChange={(e) => setFormData({ ...formData, is_semi_monthly: e.target.checked })}
              className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="is_semi_monthly" className="text-xs text-slate-700 leading-snug cursor-pointer">
              <strong>Apply Philippine Semi-Monthly Labor Rules:</strong> Split basic wages into two equal halves. SSS, PhilHealth, and HDMF statutory contributions will only be deducted on the 2nd cut-off.
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-lg bg-[#2E6BE6] hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{loading ? 'Initializing Cycle...' : 'Create & Initialize Period ➔'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
