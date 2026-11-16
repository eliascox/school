'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, FileText, Plus, Printer, Share2, Smartphone, X } from 'lucide-react';
import QRCode from 'qrcode';
import { paymentGatewayService } from '@/services/paymentGatewayService';
import {
  AccountHead,
  ExpenseRecord,
  JournalLine,
  PayrollRecord,
  VoucherRecord,
  VoucherType,
  financeService,
} from '@/services/financeService';
import { AppLanguage } from '@/services/languageService';
import { showToast } from '@/components/ui/ToastProvider';
import { PaymentRecord, SchoolInfoState } from './financeShared';

interface FinanceModalsAndPrintsProps {
  showVoucherModal: boolean;
  voucherDefaultType: VoucherType;
  onCloseVoucherModal: () => void;
  printReceiptData: PaymentRecord | null;
  onCloseReceipt: () => void;
  printExpenseSlip: ExpenseRecord | null;
  onCloseExpenseSlip: () => void;
  printSalarySlip: PayrollRecord | null;
  onCloseSalarySlip: () => void;
  printVoucherData: VoucherRecord | null;
  onCloseVoucherPrint: () => void;
  onSelectVoucherPrint: (v: VoucherRecord) => void;
  schoolInfo: SchoolInfoState;
  currentLang: AppLanguage;
  chartOfAccounts: AccountHead[];
  onRefreshAll: () => void;
}

const DEFAULT_VOUCHER_ROWS: JournalLine[] = [
  { accountCode: '5030', accountName: 'বিদ্যুৎ বিল ও ইউটিলিটি চার্জ', debit: 0, credit: 0, narration: '' },
  { accountCode: '1010', accountName: 'হাতে নগদ (ক্যাশ ইন হ্যান্ড)', debit: 0, credit: 0, narration: '' },
];

/** Renders the manual double-entry voucher creator modal and all 4 printable slip/receipt preview overlays. */
export function FinanceModalsAndPrints({
  showVoucherModal,
  voucherDefaultType,
  onCloseVoucherModal,
  printReceiptData,
  onCloseReceipt,
  printExpenseSlip,
  onCloseExpenseSlip,
  printSalarySlip,
  onCloseSalarySlip,
  printVoucherData,
  onCloseVoucherPrint,
  onSelectVoucherPrint,
  schoolInfo,
  currentLang,
  chartOfAccounts,
  onRefreshAll,
}: FinanceModalsAndPrintsProps) {
  const [voucherFormType, setVoucherFormType] = useState<VoucherType>(voucherDefaultType);
  const [voucherFormRef, setVoucherFormRef] = useState('');
  const [voucherFormNarration, setVoucherFormNarration] = useState('');
  const [voucherFormRows, setVoucherFormRows] = useState<JournalLine[]>(DEFAULT_VOUCHER_ROWS);
  const [receiptMode, setReceiptMode] = useState<'a4' | 'pos80'>('a4');
  const [receiptQrUrl, setReceiptQrUrl] = useState<string>('');

  useEffect(() => {
    if (!printReceiptData) {
      setReceiptQrUrl('');
      return;
    }
    let active = true;
    const verifyUrl = paymentGatewayService.getReceiptVerifyUrl(printReceiptData.receiptId);
    QRCode.toDataURL(verifyUrl, {
      margin: 0,
      width: 110,
      color: { dark: '#0f172a', light: '#ffffff' },
    })
      .then((url) => {
        if (active) setReceiptQrUrl(url);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [printReceiptData]);

  useEffect(() => {
    if (showVoucherModal) {
      setVoucherFormType(voucherDefaultType);
    }
  }, [showVoucherModal, voucherDefaultType]);

  const addVoucherRow = () => {
    setVoucherFormRows([
      ...voucherFormRows,
      { accountCode: '1010', accountName: 'Cash in Hand (হাতে নগদ)', debit: 0, credit: 0, narration: '' },
    ]);
  };

  const removeVoucherRow = (idx: number) => {
    if (voucherFormRows.length > 2) {
      setVoucherFormRows(voucherFormRows.filter((_, i) => i !== idx));
    }
  };

  const updateVoucherRow = (idx: number, field: keyof JournalLine, value: string | number) => {
    const copy = [...voucherFormRows];
    const row = { ...copy[idx] };
    if (field === 'accountCode') {
      const code = String(value);
      const matched = chartOfAccounts.find((a) => a.code === code);
      row.accountCode = code;
      row.accountName = matched ? matched.nameBn || matched.name : code;
    } else if (field === 'debit') {
      row.debit = Number(value) || 0;
    } else if (field === 'credit') {
      row.credit = Number(value) || 0;
    } else if (field === 'narration') {
      row.narration = String(value);
    } else if (field === 'accountName') {
      row.accountName = String(value);
    }
    copy[idx] = row;
    setVoucherFormRows(copy);
  };

  const totalVoucherDebit = voucherFormRows.reduce((sum, r) => sum + (Number(r.debit) || 0), 0);
  const totalVoucherCredit = voucherFormRows.reduce((sum, r) => sum + (Number(r.credit) || 0), 0);
  const isVoucherBalanced = Math.abs(totalVoucherDebit - totalVoucherCredit) < 0.01 && totalVoucherDebit > 0;

  const handleSaveManualVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVoucherBalanced) {
      showToast('ভাউচারের মোট ডেবিট ও মোট ক্রেডিট সমান হতে হবে!', 'warning');
      return;
    }
    const prefix =
      voucherFormType === 'Receipt'
        ? 'RV'
        : voucherFormType === 'Payment'
          ? 'PV'
          : voucherFormType === 'Contra'
            ? 'CV'
            : 'JV';
    const now = new Date();
    const vNo = `${prefix}-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      Math.floor(100 + Math.random() * 900)
    )}`;

    const newVoucher: VoucherRecord = {
      id: `VOUCH-${Date.now()}`,
      voucherNo: vNo,
      voucherType: voucherFormType,
      date: now.toISOString().split('T')[0],
      reference: voucherFormRef || 'ম্যানুয়াল সাধারণ ভাউচার',
      narration: voucherFormNarration || 'অ্যাকাউন্টিং সমন্বয় ও এন্ট্রি',
      sourceModule: 'manual_voucher',
      totalAmount: totalVoucherDebit,
      createdBy: 'হিসাবরক্ষক',
      entries: voucherFormRows.map((r) => ({
        accountCode: r.accountCode,
        accountName: r.accountName,
        debit: Number(r.debit) || 0,
        credit: Number(r.credit) || 0,
        narration: r.narration,
      })),
    };

    financeService.addVoucher(newVoucher);
    onRefreshAll();
    onCloseVoucherModal();
    onSelectVoucherPrint(newVoucher);
  };

  return (
    <>
      {showVoucherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                {currentLang === 'en'
                  ? 'Standard Double-Entry Voucher Creator'
                  : 'স্ট্যান্ডার্ড ডাবল-এন্ট্রি ভাউচার ক্রিয়েটর'}
              </h3>
              <button
                type="button"
                onClick={onCloseVoucherModal}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManualVoucher} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">ভাউচার টাইপ</label>
                  <select
                    value={voucherFormType}
                    onChange={(e) => setVoucherFormType(e.target.value as VoucherType)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  >
                    <option value="Payment">
                      {currentLang === 'en' ? 'Payment Voucher (PV)' : 'পেমেন্ট ভাউচার (PV)'}
                    </option>
                    <option value="Receipt">
                      {currentLang === 'en' ? 'Receipt Voucher (RV)' : 'রিসিপ্ট ভাউচার (RV)'}
                    </option>
                    <option value="Contra">
                      {currentLang === 'en' ? 'Contra Voucher (CV)' : 'কন্ট্রা ভাউচার (CV)'}
                    </option>
                    <option value="Journal">
                      {currentLang === 'en' ? 'Journal Voucher (JV)' : 'জার্নাল সমন্বয় ভাউচার (JV)'}
                    </option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">রেফারেন্স / প্রাপক / উৎস</label>
                  <input
                    type="text"
                    placeholder="যেমন: বিজ্ঞান ল্যাব রাসায়নিক ক্রয়"
                    value={voucherFormRef}
                    onChange={(e) => setVoucherFormRef(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">
                  {currentLang === 'en' ? 'General Narration' : 'সার্বিক বিবরণ'}
                </label>
                <input
                  type="text"
                  placeholder="ভাউচারের বিস্তারিত কারণ ও বিবরণ..."
                  value={voucherFormNarration}
                  onChange={(e) => setVoucherFormNarration(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    ডেবিট ও ক্রেডিট খতিয়ান সারি:
                  </label>
                  <button
                    type="button"
                    onClick={addVoucherRow}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> সারি যোগ করুন
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {voucherFormRows.map((row, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800"
                    >
                      <div className="col-span-4">
                        <select
                          value={row.accountCode}
                          onChange={(e) => updateVoucherRow(idx, 'accountCode', e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-white font-medium"
                        >
                          {chartOfAccounts.map((a) => (
                            <option key={a.code} value={a.code}>
                              {a.code} - {a.nameBn}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          placeholder="ডেবিট ৳"
                          value={row.debit || ''}
                          onChange={(e) => updateVoucherRow(idx, 'debit', Number(e.target.value) || 0)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-lg px-2 py-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold text-right"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          placeholder="ক্রেডিট ৳"
                          value={row.credit || ''}
                          onChange={(e) => updateVoucherRow(idx, 'credit', Number(e.target.value) || 0)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-lg px-2 py-1.5 text-xs text-rose-600 dark:text-rose-400 font-bold text-right"
                        />
                      </div>
                      <div className="col-span-2 text-right">
                        {voucherFormRows.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeVoucherRow(idx)}
                            className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs font-mono text-slate-700 dark:text-slate-300">
                    <span>
                      {currentLang === 'en' ? 'Total Debit:' : 'মোট ডেবিট:'}{' '}
                      <strong className="text-emerald-600 dark:text-emerald-400">৳ {totalVoucherDebit}</strong>
                    </span>
                    <span>
                      {currentLang === 'en' ? 'Total Credit:' : 'মোট ক্রেডিট:'}{' '}
                      <strong className="text-rose-600 dark:text-rose-400">৳ {totalVoucherCredit}</strong>
                    </span>
                  </div>
                  <span
                    className={`text-xs font-bold ${
                      isVoucherBalanced ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {isVoucherBalanced
                      ? currentLang === 'en'
                        ? '✓ Balanced'
                        : '✓ ব্যালেন্স সমান'
                      : currentLang === 'en'
                        ? '✕ Unbalanced'
                        : '✕ ডেবিট ও ক্রেডিট সমান নয়'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={onCloseVoucherModal}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={!isVoucherBalanced}
                  className={`px-5 py-2 rounded-xl text-white text-xs font-bold transition-all ${
                    isVoucherBalanced
                      ? 'bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 cursor-pointer'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  ভাউচার পোস্ট করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {printReceiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto print:static print:p-0 print:bg-white">
          <style jsx global>{`
            @media print {
              ${
                receiptMode === 'pos80'
                  ? '@page { size: 80mm auto; margin: 2mm; }'
                  : '@page { size: A4 landscape; margin: 8mm; }'
              }
            }
          `}</style>
          <div
            id="print-area"
            className={`bg-white text-black rounded-2xl shadow-2xl border border-slate-300 p-5 w-full space-y-4 print:shadow-none print:border-none print:p-0 print:rounded-none ${
              receiptMode === 'pos80' ? 'max-w-sm print:max-w-[76mm]' : 'max-w-6xl'
            }`}
          >
            <div className="print:hidden flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <h2 className="text-sm font-black text-slate-900">
                    {schoolInfo.nameBn} —{' '}
                    {receiptMode === 'pos80'
                      ? '80mm থার্মাল POS রসিদ'
                      : '৩-কপি মানি রিসিট প্রিভিউ (A4 Landscape)'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    রসিদ নং: {printReceiptData.receiptId} • শিক্ষার্থী: {printReceiptData.studentName}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setReceiptMode('a4')}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-black cursor-pointer ${
                      receiptMode === 'a4' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    A4 ৩-কপি
                  </button>
                  <button
                    type="button"
                    onClick={() => setReceiptMode('pos80')}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-black flex items-center gap-1 cursor-pointer ${
                      receiptMode === 'pos80' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    <Smartphone className="w-3 h-3" /> 80mm POS
                  </button>
                </div>
                <a
                  href={paymentGatewayService.buildWhatsAppShareUrl(printReceiptData, schoolInfo.nameBn)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
                >
                  <Share2 className="w-3.5 h-3.5" /> WhatsApp
                </a>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>প্রিন্ট করুন</span>
                </button>
                <button
                  type="button"
                  onClick={onCloseReceipt}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  বন্ধ করুন
                </button>
              </div>
            </div>

            {receiptMode === 'pos80' ? (
              <div className="w-[76mm] mx-auto border border-dashed border-slate-400 p-3 font-mono text-[10px] space-y-2 text-black bg-white">
                <div className="text-center border-b border-dashed border-black pb-2">
                  <h3 className="font-bold text-xs">{schoolInfo.nameBn}</h3>
                  <p className="text-[9px]">{schoolInfo.address}</p>
                  <p className="text-[8.5px]">
                    EIIN: {schoolInfo.eiin}
                    {schoolInfo.phone ? ` • ${schoolInfo.phone}` : schoolInfo.session ? ` • ${schoolInfo.session}` : ''}
                  </p>
                  <p className="mt-1 font-bold uppercase tracking-wider border border-black inline-block px-2 py-0.5 text-[9px]">
                    MONEY RECEIPT (POS)
                  </p>
                </div>
                <div className="space-y-0.5 text-[9.5px] border-b border-dashed border-black pb-2">
                  <p><strong>রসিদ নং:</strong> {printReceiptData.receiptId}</p>
                  <p><strong>তারিখ:</strong> {printReceiptData.date}</p>
                  <p><strong>শিক্ষার্থী:</strong> {printReceiptData.studentName}</p>
                  <p><strong>শ্রেণি/রোল:</strong> {printReceiptData.grade} ({printReceiptData.section}) • #{printReceiptData.roll}</p>
                  <p><strong>মাধ্যম:</strong> {printReceiptData.paymentMethod} {printReceiptData.trxId ? `(${printReceiptData.trxId})` : ''}</p>
                </div>
                <table className="w-full text-[9.5px] border-b border-dashed border-black">
                  <thead>
                    <tr className="border-b border-black">
                      <th className="py-1 text-left">বিবরণ</th>
                      <th className="py-1 text-right">টাকা</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printReceiptData.feeItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-0.5">{item.name}</td>
                        <td className="py-0.5 text-right">৳{item.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="space-y-0.5 text-[10px] border-b border-dashed border-black pb-2">
                  {printReceiptData.discount > 0 && (
                    <div className="flex justify-between">
                      <span>ছাড় / মওকুফ:</span>
                      <span>-৳{printReceiptData.discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-xs">
                    <span>মোট পরিশোধিত:</span>
                    <span>৳{printReceiptData.paidAmount}</span>
                  </div>
                  {printReceiptData.dueRemaining !== undefined && printReceiptData.dueRemaining > 0 && (
                    <div className="flex justify-between">
                      <span>অবশিষ্ট বকেয়া:</span>
                      <span>৳{printReceiptData.dueRemaining}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-center pt-1 text-center space-y-1">
                  {receiptQrUrl && (
                    <img src={receiptQrUrl} alt="Receipt QR" className="w-16 h-16 border border-slate-200 p-0.5" />
                  )}
                  <p className="text-[8px]">QR স্ক্যান করে রসিদ যাচাই করুন</p>
                  <p className="text-[8.5px]">আদায়কারী: {printReceiptData.collectedBy || 'ক্যাশিয়ার'}</p>
                </div>
              </div>
            ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 print:grid-cols-3 gap-3 border-t-2 border-black pt-2 text-[10px]">
              {[
                'শিক্ষার্থী কপি (Student Copy)',
                'অফিস কপি (Office Copy)',
                'হিসাব শাখা কপি (Accounts Copy)',
              ].map((copyName, i) => (
                <div
                  key={i}
                  className="border border-dashed border-gray-400 p-3 relative flex flex-col justify-between min-h-[340px]"
                >
                  <div>
                    <div className="text-center border-b border-gray-300 pb-1.5">
                      <h3 className="font-bold text-[13px] tracking-tight">{schoolInfo.nameBn}</h3>
                      <p className="text-[8.5px] text-gray-700">
                        {schoolInfo.address} • EIIN: {schoolInfo.eiin} • স্থাপিত: {schoolInfo.established}
                      </p>
                      <span className="inline-block bg-gray-200 px-2 py-0.5 rounded text-[8px] font-bold mt-1 uppercase tracking-wider">
                        {copyName}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1 my-1.5 text-[9px] bg-gray-50 p-1.5 rounded border border-gray-200">
                      <div>
                        <strong>রসিদ নং:</strong>{' '}
                        <span className="font-mono font-bold">{printReceiptData.receiptId}</span>
                      </div>
                      <div>
                        <strong>তারিখ:</strong> {printReceiptData.date}
                      </div>
                      <div>
                        <strong>শিক্ষার্থী:</strong> {printReceiptData.studentName}
                      </div>
                      <div>
                        <strong>রোল:</strong> #{printReceiptData.roll}
                      </div>
                      <div>
                        <strong>শ্রেণি:</strong> {printReceiptData.grade} ({printReceiptData.section})
                      </div>
                      <div>
                        <strong>পদ্ধতি:</strong> {printReceiptData.paymentMethod}{' '}
                        {printReceiptData.trxId ? `(${printReceiptData.trxId})` : ''}
                      </div>
                    </div>

                    <table className="w-full text-left text-[8.5px] border-collapse border border-gray-300 mt-1">
                      <thead>
                        <tr className="bg-gray-100 border-b border-gray-300">
                          <th className="p-1">ফি খাত ও বিবরণ</th>
                          <th className="p-1 text-right">আদায়</th>
                        </tr>
                      </thead>
                      <tbody>
                        {printReceiptData.feeItems.map((item, idx) => (
                          <tr key={idx} className="border-b border-gray-200">
                            <td className="p-1">{item.name}</td>
                            <td className="p-1 text-right font-mono">৳{item.amount}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        {printReceiptData.discount > 0 && (
                          <tr>
                            <td className="p-1 text-right text-gray-600">বিশেষ মওকুফ/ছাড়:</td>
                            <td className="p-1 text-right font-mono text-red-600">-৳{printReceiptData.discount}</td>
                          </tr>
                        )}
                        <tr className="font-bold border-t border-gray-400 bg-gray-50">
                          <td className="p-1 text-right">মোট পরিশোধিত অর্থ:</td>
                          <td className="p-1 text-right font-mono text-emerald-800">৳{printReceiptData.paidAmount}</td>
                        </tr>
                        {printReceiptData.dueRemaining !== undefined && printReceiptData.dueRemaining > 0 && (
                          <tr className="font-bold text-red-600 border-t border-gray-300">
                            <td className="p-1 text-right">অবশিষ্ট মোট বকেয়া:</td>
                            <td className="p-1 text-right font-mono">৳{printReceiptData.dueRemaining}</td>
                          </tr>
                        )}
                      </tfoot>
                    </table>
                  </div>

                  <div className="flex justify-between items-end pt-3 text-[8px] border-t border-gray-300 mt-2">
                    <div className="text-center">
                      <p className="text-[7.5px] text-gray-500">{printReceiptData.collectedBy || 'আদায়কারী'}</p>
                      <p className="border-t border-black px-2 mt-0.5 font-semibold">আদায়কারীর স্বাক্ষর</p>
                    </div>
                    {receiptQrUrl && (
                      <div className="flex flex-col items-center">
                        <img src={receiptQrUrl} alt="Verify QR" className="w-10 h-10 border border-gray-200" />
                        <span className="text-[6px] text-gray-500">Verify QR</span>
                      </div>
                    )}
                    <div className="text-center">
                      <p className="border-t border-black px-2 font-semibold">প্রধান শিক্ষক</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        </div>
      )}

      {printExpenseSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs print:static print:p-0 print:bg-white">
          <div
            id="print-area"
            className="text-black bg-white p-6 rounded-2xl shadow-2xl max-w-md w-full mx-auto border border-black print:rounded-none print:shadow-none"
          >
            <div className="print:hidden flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <span className="text-xs font-black text-rose-600">ব্যয় ভাউচার প্রিভিউ</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> প্রিন্ট
                </button>
                <button
                  type="button"
                  onClick={onCloseExpenseSlip}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  বন্ধ
                </button>
              </div>
            </div>

            <div className="text-center border-b pb-2">
              <h2 className="text-base font-bold">{schoolInfo.nameBn}</h2>
              <p className="text-xs">{schoolInfo.address} • বিদ্যালয় ব্যয় ভাউচার স্লিপ</p>
            </div>
            <div className="my-3 text-xs space-y-1">
              <p>
                <strong>ভাউচার নং:</strong> {printExpenseSlip.voucherNo}
              </p>
              <p>
                <strong>ব্যয় খাত:</strong> {printExpenseSlip.category}
              </p>
              <p>
                <strong>প্রাপক / সুবিধাভোগী:</strong> {printExpenseSlip.paidTo}
              </p>
              <p>
                <strong>তারিখ:</strong> {printExpenseSlip.date}
              </p>
              <p>
                <strong>পরিশোধ মাধ্যম:</strong> {printExpenseSlip.paymentMethod}
              </p>
              <p>
                <strong>বিবরণ / নোট:</strong> {printExpenseSlip.note || 'নিয়মিত বিদ্যালয় ব্যয়'}
              </p>
            </div>
            <table className="w-full text-xs border border-collapse mb-4">
              <tbody>
                <tr className="border-b">
                  <td className="p-1.5 font-semibold">খরচের খাত:</td>
                  <td className="p-1.5">{printExpenseSlip.category}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-1.5 font-semibold">বিবরণ:</td>
                  <td className="p-1.5">{printExpenseSlip.note || 'অনুমোদিত ব্যয়'}</td>
                </tr>
                <tr className="bg-gray-100 font-bold">
                  <td className="p-1.5">মোট ব্যয়কৃত অর্থ:</td>
                  <td className="p-1.5 text-right font-mono">৳ {printExpenseSlip.amount}</td>
                </tr>
              </tbody>
            </table>
            <div className="flex justify-between pt-8 text-xs">
              <p className="border-t border-black px-4">গ্রহীতার স্বাক্ষর</p>
              <p className="border-t border-black px-4">হিসাবরক্ষক</p>
              <p className="border-t border-black px-4">প্রধান শিক্ষক</p>
            </div>
          </div>
        </div>
      )}

      {printSalarySlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs print:static print:p-0 print:bg-white">
          <div
            id="print-area"
            className="text-black bg-white p-6 rounded-2xl shadow-2xl max-w-md w-full mx-auto border border-black print:rounded-none print:shadow-none"
          >
            <div className="print:hidden flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <span className="text-xs font-black text-emerald-600">স্যালারি ভাউচার স্লিপ প্রিভিউ</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> প্রিন্ট
                </button>
                <button
                  type="button"
                  onClick={onCloseSalarySlip}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  বন্ধ
                </button>
              </div>
            </div>

            <div className="text-center border-b pb-2">
              <h2 className="text-base font-bold">{schoolInfo.nameBn}</h2>
              <p className="text-xs">{schoolInfo.address} • অফিশিয়াল স্যালারি ভাউচার স্লিপ</p>
            </div>
            <div className="my-3 text-xs space-y-1">
              <p>
                <strong>ভাউচার নং:</strong> {printSalarySlip.voucherNo}
              </p>
              <p>
                <strong>শিক্ষক/স্টাফ নাম:</strong> {printSalarySlip.teacherName} ({printSalarySlip.designation || 'শিক্ষক/স্টাফ'})
              </p>
              <p>
                <strong>মাস ও বছর:</strong> {printSalarySlip.month} {printSalarySlip.year}
              </p>
              <p>
                <strong>পরিশোধ মাধ্যম:</strong> {printSalarySlip.paymentMethod} (Trx: {printSalarySlip.trxId || 'N/A'})
              </p>
            </div>
            <table className="w-full text-xs border border-collapse mb-4">
              <tbody>
                <tr className="border-b">
                  <td className="p-1.5 font-semibold">মূল বেতন:</td>
                  <td className="p-1.5 text-right font-mono">৳ {printSalarySlip.baseSalary}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-1.5 font-semibold">ভাতা ও বোনাস:</td>
                  <td className="p-1.5 text-right font-mono">+ ৳ {printSalarySlip.allowances + printSalarySlip.bonus}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-1.5 font-semibold">প্রভিডেন্ট ফান্ড কর্তন:</td>
                  <td className="p-1.5 text-right font-mono text-red-600">- ৳ {printSalarySlip.deductions}</td>
                </tr>
                <tr className="bg-gray-100 font-bold">
                  <td className="p-1.5">নিট পরিশোধিত বেতন:</td>
                  <td className="p-1.5 text-right font-mono">৳ {printSalarySlip.netPayable}</td>
                </tr>
              </tbody>
            </table>
            <div className="flex justify-between pt-8 text-xs">
              <p className="border-t border-black px-4">গ্রহণকারীর স্বাক্ষর</p>
              <p className="border-t border-black px-4">প্রধান শিক্ষক</p>
            </div>
          </div>
        </div>
      )}

      {printVoucherData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs print:static print:p-0 print:bg-white">
          <div
            id="print-area"
            className="text-black bg-white p-6 rounded-2xl shadow-2xl max-w-lg w-full mx-auto border border-black print:rounded-none print:shadow-none"
          >
            <div className="print:hidden flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <span className="text-xs font-black text-indigo-600">ডাবল-এন্ট্রি ভাউচার প্রিভিউ</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> প্রিন্ট
                </button>
                <button
                  type="button"
                  onClick={onCloseVoucherPrint}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  বন্ধ
                </button>
              </div>
            </div>

            <div className="text-center border-b pb-2">
              <h2 className="text-base font-bold">{schoolInfo.nameBn}</h2>
              <p className="text-xs">
                {schoolInfo.address} • হিসাব ভাউচার ({printVoucherData.voucherType} Voucher)
              </p>
            </div>
            <div className="my-3 text-xs space-y-1">
              <p>
                <strong>ভাউচার নং:</strong> {printVoucherData.voucherNo}
              </p>
              <p>
                <strong>তারিখ:</strong> {printVoucherData.date}
              </p>
              <p>
                <strong>রেফারেন্স:</strong> {printVoucherData.reference}
              </p>
              <p>
                <strong>বিবরণ:</strong> {printVoucherData.narration}
              </p>
            </div>
            <table className="w-full text-xs border border-collapse mb-4">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="p-1.5 text-left">কোড ও হিসাবের নাম</th>
                  <th className="p-1.5 text-right">ডেবিট (৳)</th>
                  <th className="p-1.5 text-right">ক্রেডিট (৳)</th>
                </tr>
              </thead>
              <tbody>
                {printVoucherData.entries.map((e, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-1.5">
                      {e.accountCode} - {e.accountName}
                    </td>
                    <td className="p-1.5 text-right font-mono">{e.debit > 0 ? `৳${e.debit}` : '-'}</td>
                    <td className="p-1.5 text-right font-mono">{e.credit > 0 ? `৳${e.credit}` : '-'}</td>
                  </tr>
                ))}
                <tr className="font-bold bg-gray-100">
                  <td className="p-1.5 text-right">মোট:</td>
                  <td className="p-1.5 text-right font-mono">৳{printVoucherData.totalAmount}</td>
                  <td className="p-1.5 text-right font-mono">৳{printVoucherData.totalAmount}</td>
                </tr>
              </tbody>
            </table>
            <div className="flex justify-between pt-8 text-xs">
              <p className="border-t border-black px-4">ক্যাশিয়ার</p>
              <p className="border-t border-black px-4">হিসাবরক্ষক</p>
              <p className="border-t border-black px-4">প্রধান শিক্ষক</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
