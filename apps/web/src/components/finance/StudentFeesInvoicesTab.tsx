'use client';

import React, { useState } from 'react';
import { Banknote, FileCheck, Plus, Search, X } from 'lucide-react';
import { BANGLA_MONTHS, FeeInvoice, GRADES_LIST, financeService } from '@/services/financeService';
import { smsService } from '@/services/smsService';
import { showToast } from '@/components/ui/ToastProvider';

interface StudentFeesInvoicesTabProps {
  invoices: FeeInvoice[];
  goLiveStartYear: number;
  schoolNameBn: string;
  onRefreshAll: () => void;
}

export function StudentFeesInvoicesTab({
  invoices,
  goLiveStartYear,
  schoolNameBn,
  onRefreshAll,
}: StudentFeesInvoicesTabProps) {
  const [invoiceGradeFilter, setInvoiceGradeFilter] = useState<string>('all');
  const [invoiceMonthFilter, setInvoiceMonthFilter] = useState<string>('all');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>('all');
  const [invoiceSearch, setInvoiceSearch] = useState<string>('');
  const [generateInvoiceMonth, setGenerateInvoiceMonth] = useState<string>(
    () => BANGLA_MONTHS[new Date().getMonth()] || 'জানুয়ারি'
  );
  const [generateInvoiceGrade, setGenerateInvoiceGrade] = useState<string>('all');
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<FeeInvoice | null>(null);
  const [invoicePayAmount, setInvoicePayAmount] = useState<number | string>('');
  const [invoicePayMethod, setInvoicePayMethod] = useState<string>('Cash');
  const [invoiceTrxId, setInvoiceTrxId] = useState<string>('');

  const handleGenerateInvoices = () => {
    const res = financeService.generateMonthlyInvoices(
      generateInvoiceMonth,
      Number(goLiveStartYear) || 2026,
      generateInvoiceGrade
    );
    onRefreshAll();
    showToast(
      `${generateInvoiceMonth} মাসের জন্য মোট ${res.generated} টি নতুন ফি ইনভয়েস সফলভাবে প্রস্তুত হয়েছে!`,
      'success'
    );
  };

  const handlePayInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForPayment) return;
    const payAmt = Number(invoicePayAmount);
    if (!payAmt || payAmt <= 0) {
      showToast('অনুগ্রহ করে পরিশোধের সঠিক টাকার পরিমাণ লিখুন!', 'warning');
      return;
    }
    if (payAmt > selectedInvoiceForPayment.dueAmount) {
      showToast(`পরিশোধের পরিমাণ বকেয়া (৳${selectedInvoiceForPayment.dueAmount}) থেকে বেশি হতে পারবে না!`, 'warning');
      return;
    }

    try {
      const res = financeService.payInvoice(selectedInvoiceForPayment.id, {
        amount: payAmt,
        paymentMethod: invoicePayMethod,
        trxId:
          invoiceTrxId ||
          (invoicePayMethod === 'Cash'
            ? `CASH-${Date.now().toString().slice(-6)}`
            : `TRX-${Date.now().toString().slice(-6)}`),
        collectedBy: 'ক্যাশিয়ার',
        date: new Date().toISOString().split('T')[0],
      });

      if (res.invoice.mobile && res.invoice.mobile !== 'N/A' && res.invoice.mobile.length >= 11) {
        try {
          smsService.sendSMS({
            recipient: res.invoice.mobile,
            message: `${schoolNameBn}: শিক্ষার্থী ${res.invoice.studentName}-এর ইনভয়েস #${res.invoice.invoiceNo || res.invoice.invoiceId} বাবদ ৳${payAmt} গ্রহণ করা হয়েছে। বর্তমান ইনভয়েস বকেয়া: ৳${res.invoice.dueAmount}। ধন্যবাদ।`,
            type: 'fee_reminder',
            targetAudience: 'individual',
            recipientName: res.invoice.studentName,
            studentId: res.invoice.studentId,
            class: res.invoice.grade,
            roll: res.invoice.roll,
          });
        } catch {}
      }

      onRefreshAll();
      setSelectedInvoiceForPayment(null);
      setInvoicePayAmount('');
      setInvoiceTrxId('');
      showToast(
        `ইনভয়েস #${res.invoice.invoiceNo || res.invoice.invoiceId}-এ ৳${payAmt} সফলভাবে জমা হয়েছে! রসিদ নং: ${res.receiptId}`,
        'success'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      showToast('ইনভয়েস পেমেন্ট সংরক্ষণে ত্রুটি: ' + msg, 'error');
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchGrade = invoiceGradeFilter === 'all' || inv.grade === invoiceGradeFilter;
    const matchMonth = invoiceMonthFilter === 'all' || inv.month === invoiceMonthFilter;
    const matchStatus = invoiceStatusFilter === 'all' || inv.status === invoiceStatusFilter;
    const invCode = (inv.invoiceNo || inv.invoiceId || inv.id || '').toLowerCase();
    const matchSearch =
      !invoiceSearch ||
      invCode.includes(invoiceSearch.toLowerCase()) ||
      inv.studentName.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      inv.roll.includes(invoiceSearch);
    return matchGrade && matchMonth && matchStatus && matchSearch;
  });

  return (
    <div className="space-y-4">
      {/* Top Generator Card */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-indigo-700/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-white/10 backdrop-blur border border-white/20">
              <FileCheck className="w-5 h-5 text-indigo-300" />
            </span>
            <div>
              <h3 className="text-base font-black">মাসিক ফি ইনভয়েস জেনারেটর</h3>
              <p className="text-xs text-indigo-200 mt-0.5">
                এক ক্লিকে সকল শিক্ষার্থীর জন্য স্বয়ংক্রিয় মাসিক ফি ইনভয়েস প্রস্তুত করুন
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 bg-black/20 p-2.5 rounded-xl border border-white/10">
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <span className="text-indigo-200">মাস:</span>
              <select
                value={generateInvoiceMonth}
                onChange={(e) => setGenerateInvoiceMonth(e.target.value)}
                className="bg-slate-900 text-white text-xs font-bold rounded-lg px-2.5 py-1.5 border border-indigo-500/40 outline-none cursor-pointer"
              >
                {BANGLA_MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold">
              <span className="text-indigo-200">শ্রেণি:</span>
              <select
                value={generateInvoiceGrade}
                onChange={(e) => setGenerateInvoiceGrade(e.target.value)}
                className="bg-slate-900 text-white text-xs font-bold rounded-lg px-2.5 py-1.5 border border-indigo-500/40 outline-none cursor-pointer"
              >
                <option value="all">সকল শ্রেণি</option>
                {GRADES_LIST.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleGenerateInvoices}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-black shadow-md transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ইনভয়েস জেনারেট করুন</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={invoiceGradeFilter}
            onChange={(e) => setInvoiceGradeFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none cursor-pointer font-medium"
          >
            <option value="all">🎓 সকল শ্রেণি</option>
            {GRADES_LIST.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>

          <select
            value={invoiceMonthFilter}
            onChange={(e) => setInvoiceMonthFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none cursor-pointer font-medium"
          >
            <option value="all">📅 সকল মাস</option>
            {BANGLA_MONTHS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <select
            value={invoiceStatusFilter}
            onChange={(e) => setInvoiceStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none cursor-pointer font-medium"
          >
            <option value="all">🏷️ সকল স্ট্যাটাস</option>
            <option value="unpaid">বকেয়া (Unpaid)</option>
            <option value="partial">আংশিক পরিশোধ (Partial)</option>
            <option value="paid">পরিশোধিত (Paid)</option>
            <option value="cancelled">বাতিল (Cancelled)</option>
          </select>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="ইনভয়েস নং / নাম / রোল..."
            value={invoiceSearch}
            onChange={(e) => setInvoiceSearch(e.target.value)}
            className="w-full sm:w-64 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <th className="p-3">ইনভয়েস নং</th>
                <th className="p-3">শিক্ষার্থী</th>
                <th className="p-3">শ্রেণি</th>
                <th className="p-3">মাস</th>
                <th className="p-3 text-right">মোট ফি</th>
                <th className="p-3 text-right">পরিশোধিত</th>
                <th className="p-3 text-right text-rose-600 dark:text-rose-400">বকেয়া</th>
                <th className="p-3 text-center">স্ট্যাটাস</th>
                <th className="p-3 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500 text-xs">
                    কোনো ইনভয়েস পাওয়া যায়নি। উপরের &apos;ইনভয়েস জেনারেট করুন&apos; বোতামে ক্লিক করে নতুন ইনভয়েস প্রস্তুত করুন।
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {inv.invoiceNo || inv.invoiceId || inv.id}
                    </td>
                    <td className="p-3">
                      <p className="font-bold text-slate-900 dark:text-white">{inv.studentName}</p>
                      <p className="text-[10px] text-slate-400">
                        রোল: #{inv.roll} {inv.mobile ? `• ${inv.mobile}` : ''}
                      </p>
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">
                      {inv.grade} ({inv.section || 'ক'})
                    </td>
                    <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">
                      {inv.month} {inv.year}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                      ৳ {(inv.totalPayable ?? inv.netPayable ?? 0).toLocaleString('bn-BD')}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      ৳ {(inv.totalPaid ?? inv.paidAmount ?? 0).toLocaleString('bn-BD')}
                    </td>
                    <td className="p-3 text-right font-mono font-black text-rose-600 dark:text-rose-400">
                      ৳ {(inv.dueAmount ?? 0).toLocaleString('bn-BD')}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.status === 'paid'
                            ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                            : inv.status === 'partial'
                            ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                            : inv.status === 'cancelled'
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            : 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-700'
                        }`}
                      >
                        {inv.status === 'paid'
                          ? 'পরিশোধিত'
                          : inv.status === 'partial'
                          ? 'আংশিক জমা'
                          : inv.status === 'cancelled'
                          ? 'বাতিল'
                          : 'বকেয়া'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {inv.dueAmount > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedInvoiceForPayment(inv);
                              setInvoicePayAmount(inv.dueAmount);
                              setInvoiceTrxId('');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                          >
                            <Banknote className="w-3 h-3" />
                            <span>ফি জমা</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            showToast(
                              `ইনভয়েস #${inv.invoiceNo || inv.invoiceId || inv.id}: ${inv.studentName} (${inv.grade}) • ${inv.month} • প্রদেয়: ৳${inv.totalPayable ?? inv.netPayable ?? 0} • পরিশোধ: ৳${inv.totalPaid ?? inv.paidAmount ?? 0} • বকেয়া: ৳${inv.dueAmount ?? 0}`,
                              { type: 'info', durationMs: 7000 }
                            );
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-[11px] cursor-pointer"
                        >
                          বিবরণ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Invoice Payment */}
      {selectedInvoiceForPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">ইনভয়েস ফি পরিশোধ</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoiceForPayment(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl space-y-1.5 text-xs border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-500">ইনভয়েস আইডি:</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {selectedInvoiceForPayment.invoiceId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">শিক্ষার্থীর নাম:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedInvoiceForPayment.studentName} (#{selectedInvoiceForPayment.roll})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">শ্রেণি ও মাস:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {selectedInvoiceForPayment.grade} • {selectedInvoiceForPayment.month}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-1.5">
                <span className="text-slate-500">বর্তমান বকেয়া:</span>
                <span className="font-mono font-black text-rose-600 dark:text-rose-400">
                  ৳ {selectedInvoiceForPayment.dueAmount}
                </span>
              </div>
            </div>

            <form onSubmit={handlePayInvoiceSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  পরিশোধের পরিমাণ (টাকা) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedInvoiceForPayment.dueAmount}
                  value={invoicePayAmount}
                  onChange={(e) => setInvoicePayAmount(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-black text-indigo-700 dark:text-emerald-400 outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-0.5">আংশিক বা সম্পূর্ণ টাকা জমা দেওয়া যাবে</p>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">পেমেন্ট মাধ্যম</label>
                <select
                  value={invoicePayMethod}
                  onChange={(e) => setInvoicePayMethod(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white outline-none cursor-pointer"
                >
                  <option value="Cash">💵 নগদ ক্যাশ</option>
                  <option value="bKash">📱 বিকাশ (bKash)</option>
                  <option value="Nagad">📲 নগদ (Nagad)</option>
                  <option value="Bank Transfer">🏛️ ব্যাংক ডিপোজিট</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  TrxID / ট্রানজেকশন নম্বর (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: TRX-83719"
                  value={invoiceTrxId}
                  onChange={(e) => setInvoiceTrxId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-white outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedInvoiceForPayment(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md"
                >
                  ফি জমা নিশ্চিত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
