'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRightLeft,
  BadgePercent,
  DollarSign,
  Edit,
  Landmark,
  Percent,
  Plus,
  Printer,
  RotateCcw,
  Smartphone,
  Trash2,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import {
  BankAccount,
  FeeCollectionStats,
  RefundRecord,
  VoucherRecord,
  WaiverRecord,
  financeService,
} from '@/services/financeService';
import { Student } from '@/services/studentService';
import { confirmDialog, promptDialog, showToast } from '@/components/ui/ToastProvider';
import { FinancePrintHeader, SchoolInfoState, isStipendStudent } from './financeShared';

interface CashBankAndWaiversTabsProps {
  activeTab: 'cash_bank' | 'waivers_refunds';
  bankAccounts: BankAccount[];
  vouchers: VoucherRecord[];
  waivers: WaiverRecord[];
  refunds: RefundRecord[];
  students: Student[];
  feeStats: FeeCollectionStats;
  cashInHand: number;
  totalBankBalance: number;
  schoolInfo: SchoolInfoState;
  onRefreshAll: () => void;
}

/** Renders the Cash & Bank Treasury and Waivers & Refunds tabs along with their interactive modals. */
export function CashBankAndWaiversTabs({
  activeTab,
  bankAccounts,
  vouchers,
  waivers,
  refunds,
  students,
  feeStats,
  cashInHand,
  totalBankBalance,
  schoolInfo,
  onRefreshAll,
}: CashBankAndWaiversTabsProps) {
  const [showBankTransferModal, setShowBankTransferModal] = useState(false);
  const [bankTransferForm, setBankTransferForm] = useState({
    from: 'Cash in Hand (হাতে নগদ)',
    to: 'bank-1',
    amount: 0,
    refNo: '',
    note: '',
  });

  const [showBankEditModal, setShowBankEditModal] = useState(false);
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null);
  const [bankModalForm, setBankModalForm] = useState({
    bankName: '',
    accountName: '',
    accountNumber: '',
    branch: '',
    accountCode: '1020',
    balance: 0,
  });

  const [showWaiverModal, setShowWaiverModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [waiverForm, setWaiverForm] = useState<{
    studentId: string;
    studentName: string;
    roll: string;
    grade: string;
    type: 'percent' | 'flat';
    value: number;
    reason: string;
    approvedBy: string;
  }>({
    studentId: '',
    studentName: '',
    roll: '',
    grade: '',
    type: 'percent',
    value: 0,
    reason: '',
    approvedBy: 'প্রধান শিক্ষক',
  });
  const [refundForm, setRefundForm] = useState({
    receiptId: '',
    studentId: '',
    studentName: '',
    amount: 0,
    reason: '',
    processedBy: 'ক্যাশিয়ার',
  });

  const handleOpenBankModal = (b: BankAccount | null) => {
    if (b) {
      setEditingBank(b);
      setBankModalForm({
        bankName: b.bankName,
        accountName: b.accountName,
        accountNumber: b.accountNumber,
        branch: b.branch,
        accountCode: b.accountCode || '1020',
        balance: b.balance,
      });
    } else {
      setEditingBank(null);
      setBankModalForm({
        bankName: '',
        accountName: '',
        accountNumber: '',
        branch: '',
        accountCode: `10${(bankAccounts.length + 2) * 10}`,
        balance: 0,
      });
    }
    setShowBankEditModal(true);
  };

  const handleSaveBankModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankModalForm.bankName.trim()) {
      showToast('অনুগ্রহ করে ব্যাংকের নাম প্রদান করুন', 'warning');
      return;
    }
    financeService.addOrUpdateBankAccount({
      id: editingBank ? editingBank.id : `bank-${Date.now()}`,
      bankName: bankModalForm.bankName.trim(),
      accountName: bankModalForm.accountName.trim() || bankModalForm.bankName.trim(),
      accountNumber: bankModalForm.accountNumber.trim(),
      branch: bankModalForm.branch.trim(),
      accountCode: bankModalForm.accountCode.trim(),
      balance: Number(bankModalForm.balance) || 0,
    });
    onRefreshAll();
    setShowBankEditModal(false);
  };

  const handleDeleteBank = async (id: string, name: string) => {
    const comment = await promptDialog({
      title: 'ব্যাংক হিসাব ডিলিট নিশ্চিতকরণ',
      message: `"${name}" ব্যাংক হিসাবটি ডিলিট করতে নিরাপত্তা কমেন্ট লিখুন (যেমন: DELETE):`,
      placeholder: 'DELETE',
      confirmLabel: 'ডিলিট করুন',
      danger: true,
      required: true,
    });
    if (!comment || !comment.trim()) {
      showToast('কমেন্ট প্রদান না করায় ব্যাংক হিসাব ডিলিট বাতিল করা হয়েছে।', 'info');
      return;
    }
    financeService.deleteBankAccount(id);
    onRefreshAll();
  };

  const handleResetAllBankBalances = async () => {
    const comment = await promptDialog({
      title: 'সকল ব্যাংক ব্যালেন্স রিসেট',
      message: 'সকল ব্যাংকের স্থিতি ও ডেমো টাকা ৳০ করতে নিরাপত্তা কমেন্ট লিখুন (যেমন: RESET অথবা ০):',
      placeholder: 'RESET',
      confirmLabel: 'রিসেট করুন',
      danger: true,
      required: true,
    });
    if (!comment || !comment.trim()) {
      showToast('নিরাপত্তা কমেন্ট প্রদান না করায় ব্যালেন্স রিসেট বাতিল করা হয়েছে।', 'info');
      return;
    }
    financeService.resetAllBankBalancesToZero();
    onRefreshAll();
    showToast(`সকল ব্যাংক হিসাবের ব্যালেন্স সফলভাবে ৳০ করা হয়েছে! (কমেন্ট: "${comment.trim()}")`, 'success');
  };

  const handleSaveBankTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    financeService.postContraJournal({
      from: bankTransferForm.from,
      to: bankTransferForm.to,
      amount: Number(bankTransferForm.amount),
      date: new Date().toISOString().split('T')[0],
      refNo: bankTransferForm.refNo,
      note: bankTransferForm.note,
    });
    onRefreshAll();
    setShowBankTransferModal(false);
  };

  const openWaiverModal = () => {
    if (students.length > 0 && !waiverForm.studentId) {
      const first = students[0];
      setWaiverForm((prev) => ({
        ...prev,
        studentId: first.id,
        studentName: first.name,
        roll: first.roll || '০১',
        grade: first.grade || '৬ষ্ঠ শ্রেণি',
      }));
    }
    setShowWaiverModal(true);
  };

  const openRefundModal = () => {
    if (students.length > 0 && !refundForm.studentId) {
      const first = students[0];
      setRefundForm((prev) => ({
        ...prev,
        studentId: first.id,
        studentName: first.name,
      }));
    }
    setShowRefundModal(true);
  };

  const handleSaveWaiver = (e: React.FormEvent) => {
    e.preventDefault();
    financeService.saveWaiver({
      id: `WVR-${Date.now()}`,
      ...waiverForm,
      value: Number(waiverForm.value),
      date: new Date().toISOString().split('T')[0],
    });
    onRefreshAll();
    setShowWaiverModal(false);
  };

  const handleSaveRefund = (e: React.FormEvent) => {
    e.preventDefault();
    financeService.saveRefund({
      id: `RFD-${Date.now()}`,
      ...refundForm,
      amount: Number(refundForm.amount),
      date: new Date().toISOString().split('T')[0],
    });
    onRefreshAll();
    setShowRefundModal(false);
  };

  const renderCashBankTab = () => {
    const contraVouchers = vouchers.filter((v) => v.voucherType === 'Contra');
    const mfsBalance = feeStats.bkashCollected + feeStats.nagadCollected;
    const totalTreasury = cashInHand + totalBankBalance + mfsBalance;

    return (
      <div className="space-y-6">
        <FinancePrintHeader
          schoolInfo={schoolInfo}
          title="ক্যাশ ও ব্যাংক হিসাব স্থিতি বিবরণী এবং কন্ট্রা ট্রান্সফার খতিয়ান"
        />

        <div className="print:hidden flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-500/30">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                ক্যাশ, ব্যাংক ও ট্রেজারি ব্যবস্থাপনা (Cash, Bank &amp; MFS Treasury)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                হাতে নগদ ড্রয়ার, ব্যাংক হিসাবসমূহ, মোবাইল ওয়ালেট এবং অভ্যন্তরীণ ফান্ড ট্রান্সফার
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleResetAllBankBalances}
              title="সকল ব্যাংকের ডেমো ব্যালেন্স ০ করতে ক্লিক করুন"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-200 dark:border-rose-800/60 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <RotateCcw className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>ব্যালেন্স রিসেট (৳০)</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenBankModal(null)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 text-xs font-bold border border-sky-200 dark:border-sky-800/60 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>নতুন ব্যাংক হিসাব</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>স্থিতি প্রিন্ট</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (bankAccounts.length > 0 && !bankAccounts.some((b) => b.id === bankTransferForm.to)) {
                  setBankTransferForm((prev) => ({ ...prev, to: bankAccounts[0].id }));
                }
                setShowBankTransferModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/30 transition-all cursor-pointer active:scale-95"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>ব্যাংকে অর্থ জমা ও ফান্ড ট্রান্সফার</span>
            </button>
          </div>
        </div>

        <div className="print:hidden grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">হাতে নগদ (Cash in Hand)</p>
              <h4 className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                ৳ {cashInHand.toLocaleString('bn-BD')}
              </h4>
              <p className="text-[10px] text-slate-400">ক্যাশবুক সমাপনী জের (1010)</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20">
              <Wallet className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">ব্যাংক হিসাব স্থিতি</p>
              <h4 className="text-lg font-black font-mono text-sky-600 dark:text-sky-400 mt-1">
                ৳ {totalBankBalance.toLocaleString('bn-BD')}
              </h4>
              <p className="text-[10px] text-slate-400">{bankAccounts.length} টি সক্রিয় ব্যাংক হিসাব</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-100 dark:border-sky-500/20">
              <Landmark className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">মোবাইল ব্যাংকিং (bKash/Nagad)</p>
              <h4 className="text-lg font-black font-mono text-pink-600 dark:text-pink-400 mt-1">
                ৳ {mfsBalance.toLocaleString('bn-BD')}
              </h4>
              <p className="text-[10px] text-slate-400">
                বিকাশ: ৳{feeStats.bkashCollected} • নগদ: ৳{feeStats.nagadCollected}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center border border-pink-100 dark:border-pink-500/20">
              <Smartphone className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">মোট তরল তহবিল (Total Liquid)</p>
              <h4 className="text-lg font-black font-mono text-indigo-600 dark:text-indigo-400 mt-1">
                ৳ {totalTreasury.toLocaleString('bn-BD')}
              </h4>
              <p className="text-[10px] text-slate-400">ক্যাশ + ব্যাংক + এমএফএস</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {bankAccounts.map((b, idx) => (
            <div
              key={b.id || idx}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 space-y-3 print:bg-white print:border-black relative group transition-all hover:border-sky-300 dark:hover:border-sky-700"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-100 dark:border-sky-500/20 font-bold">
                  <Landmark className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono font-bold">
                    কোড: {b.accountCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenBankModal(b)}
                    className="print:hidden p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="ব্যাংক হিসাব ও ব্যালেন্স এডিট করুন"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {bankAccounts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteBank(b.id, b.bankName)}
                      className="print:hidden p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="হিসাব মুছে ফেলুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white print:text-black">{b.bankName}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">{b.accountName}</p>
                {b.branch && <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{b.branch}</p>}
                <p className="text-[11px] font-mono text-slate-600 dark:text-slate-400 mt-1">হিসাব নং: {b.accountNumber}</p>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">বর্তমান স্থিতি:</span>
                  <button
                    type="button"
                    onClick={() => handleOpenBankModal(b)}
                    className="print:hidden text-[11px] text-sky-600 dark:text-sky-400 hover:underline font-semibold cursor-pointer"
                    title="ব্যালেন্স এডিট করতে ক্লিক করুন"
                  >
                    (এডিট)
                  </button>
                </div>
                <span className="text-lg font-black font-mono text-sky-700 dark:text-sky-400 print:text-black">
                  ৳ {b.balance.toLocaleString('bn-BD')}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 space-y-4 print:border-none print:p-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              সাম্প্রতিক কন্ট্রা ভাউচার ও ডিপোজিট খতিয়ান (Contra Transfers)
            </h3>
            <span className="text-xs font-bold text-slate-400">{contraVouchers.length} টি লেনদেন</span>
          </div>
          {contraVouchers.length === 0 ? (
            <div className="py-12 text-center space-y-2 bg-slate-50/60 dark:bg-slate-950/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <ArrowRightLeft className="w-7 h-7 text-amber-400 mx-auto" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                এখনো কোনো কন্ট্রা ট্রান্সফার বা ব্যাংক ডিপোজিট এন্ট্রি হয়নি
              </p>
              <p className="text-[11px] text-slate-400">ক্যাশ থেকে ব্যাংকে টাকা জমা দিলে তা এখানে নথিভুক্ত হবে।</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse print:text-black">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 print:bg-gray-100 print:border-black">
                    <th className="p-3">ভাউচার নং</th>
                    <th className="p-3">তারিখ</th>
                    <th className="p-3">রেফারেন্স ও উদ্দেশ্য</th>
                    <th className="p-3">বিবরণ</th>
                    <th className="p-3 text-right text-emerald-700 dark:text-emerald-400">পরিমাণ (টাকা)</th>
                    <th className="p-3">এন্ট্রি কারক</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200 print:divide-gray-300">
                  {contraVouchers.map((cv, idx) => (
                    <tr key={cv.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3 font-mono font-bold text-amber-700 dark:text-amber-400 print:text-black">
                        {cv.voucherNo}
                      </td>
                      <td className="p-3 text-slate-500 dark:text-slate-400">{cv.date}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white print:text-black">{cv.reference}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{cv.narration}</td>
                      <td className="p-3 text-right font-mono font-black text-emerald-700 dark:text-emerald-400 print:text-black">
                        ৳ {cv.totalAmount.toLocaleString('bn-BD')}
                      </td>
                      <td className="p-3 text-slate-500 dark:text-slate-400">{cv.createdBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderWaiversRefundsTab = () => {
    const totalRefundedAmt = refunds.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const stipendStudentsCount = students.filter((s) => isStipendStudent(s)).length;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">অনুমোদিত বিশেষ ফি মওকুফ</p>
              <h4 className="text-lg font-black font-mono text-purple-600 dark:text-purple-400 mt-1">
                {waivers.length} জন শিক্ষার্থী
              </h4>
              <p className="text-[10px] text-slate-400">শতকরা ও এককালীন ছাড়</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-500/20">
              <BadgePercent className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">সরকারি উপবৃত্তি সুবিধাভোগী</p>
              <h4 className="text-lg font-black font-mono text-indigo-600 dark:text-indigo-400 mt-1">
                {stipendStudentsCount} জন শিক্ষার্থী
              </h4>
              <p className="text-[10px] text-slate-400">১০০% মাসিক বেতন মওকুফ</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">সর্বমোট ফি রিফান্ড</p>
              <h4 className="text-lg font-black font-mono text-rose-600 dark:text-rose-400 mt-1">
                ৳ {totalRefundedAmt.toLocaleString('bn-BD')}
              </h4>
              <p className="text-[10px] text-slate-400">{refunds.length} টি রিফান্ড ভাউচার (COA 5110)</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-100 dark:border-rose-500/20">
              <RotateCcw className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Percent className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  বৃত্তি ও ফি মওকুফ রেজিস্টার (Fee Waivers)
                </h3>
                <p className="text-[11px] text-slate-500">দরিদ্র, মেধাবী ও বিশেষ কোটায় অনুমোদিত টিউশন ফি ছাড়</p>
              </div>
              <button
                type="button"
                onClick={openWaiverModal}
                className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>মওকুফ অনুমোদন</span>
              </button>
            </div>
            <div className="space-y-2.5">
              {waivers.length === 0 ? (
                <div className="p-10 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                  <Percent className="w-6 h-6 text-purple-400 mx-auto" />
                  <p className="font-bold text-slate-700 dark:text-slate-300">কোনো বৃত্তি বা ফি মওকুফ রেকর্ড নথিভুক্ত নেই</p>
                  <p className="text-[11px]">উপরের &quot;+ মওকুফ অনুমোদন&quot; বাটনে ক্লিক করে শিক্ষার্থীর ফি ছাড় যুক্ত করুন।</p>
                </div>
              ) : (
                waivers.map((w, idx) => (
                  <div
                    key={w.id || idx}
                    className="bg-slate-50 dark:bg-slate-950/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 transition-colors hover:border-purple-300 dark:hover:border-purple-800/60 shadow-2xs"
                  >
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {w.studentName}{' '}
                        <span className="text-slate-600 dark:text-slate-400 font-medium">
                          ({w.grade} • রোল: {w.roll || '-'})
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-700 dark:text-slate-300">
                        <span className="font-semibold text-slate-900 dark:text-slate-200">কারণ:</span> {w.reason}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        অনুমোদনে: {w.approvedBy} • {w.date}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2.5 py-1 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 text-xs font-mono font-black border border-purple-200 dark:border-purple-800">
                        {w.type === 'percent' ? `${w.value}% ছাড়` : `৳ ${w.value.toLocaleString('bn-BD')} ছাড়`}
                      </span>
                      <button
                        type="button"
                        onClick={async () => {
                          if (
                            await confirmDialog({
                              title: 'ফি মওকুফ বাতিল',
                              message: `'${w.studentName}'-এর ফি মওকুফ রেকর্ডটি বাতিল করতে চান?`,
                              confirmLabel: 'বাতিল করুন',
                              danger: true,
                            })
                          ) {
                            financeService.deleteWaiver(w.id);
                            onRefreshAll();
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="মওকুফ বাতিল করুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  ফি রিফান্ড ও সমন্বয় রেজিস্টার (Refunds)
                </h3>
                <p className="text-[11px] text-slate-500">অতিরিক্ত আদায়কৃত ফি ফেরত ও ডাবল-এন্ট্রি সমন্বয়</p>
              </div>
              <button
                type="button"
                onClick={openRefundModal}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>রিফান্ড ভাউচার</span>
              </button>
            </div>
            <div className="space-y-2.5">
              {refunds.length === 0 ? (
                <div className="p-10 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                  <RotateCcw className="w-6 h-6 text-rose-400 mx-auto" />
                  <p className="font-bold text-slate-700 dark:text-slate-300">কোনো ফি রিফান্ড বা সমন্বয় রেকর্ড নেই</p>
                  <p className="text-[11px]">ভুলবশত অতিরিক্ত আদায়কৃত অর্থ ফেরত দিলে এখানে ভাউচার সংরক্ষিত হবে।</p>
                </div>
              ) : (
                refunds.map((r, idx) => (
                  <div
                    key={r.id || idx}
                    className="bg-slate-50 dark:bg-slate-950/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 transition-colors hover:border-rose-300 dark:hover:border-rose-800/60 shadow-2xs"
                  >
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{r.studentName}</h4>
                      <p className="text-[11px] text-slate-700 dark:text-slate-300">
                        <span className="font-semibold text-slate-900 dark:text-slate-200">রসিদ নং:</span> {r.receiptId} •{' '}
                        <span className="font-semibold text-slate-900 dark:text-slate-200">কারণ:</span> {r.reason}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        প্রক্রিয়াকরণে: {r.processedBy} • {r.date}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2.5 py-1 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 text-xs font-mono font-black border border-rose-200 dark:border-rose-800">
                        ফেরত ৳ {r.amount.toLocaleString('bn-BD')}
                      </span>
                      <button
                        type="button"
                        onClick={async () => {
                          if (
                            await confirmDialog({
                              title: 'রিফান্ড রেকর্ড মুছুন',
                              message: `'${r.studentName}'-এর রিফান্ড রেকর্ডটি মুছে ফেলতে চান?`,
                              confirmLabel: 'মুছে ফেলুন',
                              danger: true,
                            })
                          ) {
                            financeService.deleteRefund(r.id);
                            onRefreshAll();
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="রিফান্ড মুছুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {activeTab === 'cash_bank' ? renderCashBankTab() : renderWaiversRefundsTab()}

      {showBankTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-amber-400" />
                কন্ট্রা ভাউচার (ক্যাশ-টু-ব্যাংক ট্রান্সফার)
              </h3>
              <button
                type="button"
                onClick={() => setShowBankTransferModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBankTransfer} className="space-y-3">
              <div>
                <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">উৎস হিসাব (From Account)</label>
                <input
                  type="text"
                  value={bankTransferForm.from}
                  disabled
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">গন্তব্য ব্যাংক হিসাব (To Bank)</label>
                <select
                  value={bankTransferForm.to}
                  onChange={(e) => setBankTransferForm({ ...bankTransferForm, to: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bankName} ({b.accountNumber || b.accountCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">টাকার পরিমাণ</label>
                <input
                  type="number"
                  value={bankTransferForm.amount}
                  onChange={(e) => setBankTransferForm({ ...bankTransferForm, amount: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">ডিপোজিট স্লিপ / রেফারেন্স নং</label>
                <input
                  type="text"
                  placeholder="যেমন: SLIP-88210"
                  value={bankTransferForm.refNo}
                  onChange={(e) => setBankTransferForm({ ...bankTransferForm, refNo: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowBankTransferModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold cursor-pointer"
                >
                  ট্রান্সফার সম্পন্ন ও কন্ট্রা এন্ট্রি
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBankEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Landmark className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                {editingBank ? 'ব্যাংক হিসাব এডিট ও ব্যালেন্স পরিবর্তন' : 'নতুন ব্যাংক হিসাব যুক্ত করুন'}
              </h3>
              <button
                type="button"
                onClick={() => setShowBankEditModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBankModal} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  ব্যাংকের নাম <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="যেমন: সোনালী ব্যাংক পিএলসি"
                  value={bankModalForm.bankName}
                  onChange={(e) => setBankModalForm({ ...bankModalForm, bankName: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  হিসাবের নাম (Account Title)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: বিদ্যালয় সাধারণ তহবিল"
                  value={bankModalForm.accountName}
                  onChange={(e) => setBankModalForm({ ...bankModalForm, accountName: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    হিসাব নম্বর (Account Number)
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: 1042003819201"
                    value={bankModalForm.accountNumber}
                    onChange={(e) => setBankModalForm({ ...bankModalForm, accountNumber: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    শাখা (Branch)
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: চকরিয়া শাখা, কক্সবাজার"
                    value={bankModalForm.branch}
                    onChange={(e) => setBankModalForm({ ...bankModalForm, branch: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    হিসাব কোড (COA Account Code)
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: 1020, 1030, 1040"
                    value={bankModalForm.accountCode}
                    onChange={(e) => setBankModalForm({ ...bankModalForm, accountCode: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    বর্তমান স্থিতি / প্রারম্ভিক জের (টাকা)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">৳</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0"
                      value={bankModalForm.balance}
                      onChange={(e) => setBankModalForm({ ...bankModalForm, balance: Number(e.target.value) || 0 })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-7 pr-3 py-2 text-xs text-slate-900 dark:text-white font-mono font-bold outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl p-3 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <span>
                  ডেমো ডাটা মুছে ফেলার পর যদি কোনো ডেমো ব্যালেন্স অবশিষ্ট থাকে, তবে এখানে <strong>০ (শূন্য)</strong> লিখে সেভ করুন অথবা
                  উপরের &quot;ব্যালেন্স রিসেট (৳০)&quot; বাটনে ক্লিক করুন।
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBankEditModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/20 cursor-pointer active:scale-95"
                >
                  {editingBank ? 'পরিবর্তন সংরক্ষণ করুন' : 'হিসাব সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showWaiverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Percent className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                বৃত্তি ও ফি মওকুফ অনুমোদন (Fee Waiver Approval)
              </h3>
              <button
                type="button"
                onClick={() => setShowWaiverModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWaiver} className="space-y-3">
              <div>
                <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                  শিক্ষার্থী নির্বাচন করুন
                </label>
                {students.length > 0 ? (
                  <select
                    value={waiverForm.studentId}
                    onChange={(e) => {
                      const st = students.find((s) => s.id === e.target.value);
                      if (st) {
                        setWaiverForm({
                          ...waiverForm,
                          studentId: st.id,
                          studentName: st.name,
                          roll: st.roll || '০১',
                          grade: st.grade || '৬ষ্ঠ শ্রেণি',
                        });
                      }
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                  >
                    {students.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.grade} - রোল: {st.roll})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={waiverForm.studentName}
                    onChange={(e) => setWaiverForm({ ...waiverForm, studentName: e.target.value })}
                    placeholder="শিক্ষার্থীর নাম"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1">মওকুফের ধরণ</label>
                  <select
                    value={waiverForm.type}
                    onChange={(e) => setWaiverForm({ ...waiverForm, type: e.target.value as 'percent' | 'flat' })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                  >
                    <option value="percent">শতকরা হার (%)</option>
                    <option value="flat">নির্দিষ্ট পরিমাণ (৳)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                    {waiverForm.type === 'percent' ? 'ছাড়ের পরিমাণ (%)' : 'ছাড়ের পরিমাণ (৳)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={waiverForm.type === 'percent' ? 100 : 100000}
                    value={waiverForm.value}
                    onChange={(e) => setWaiverForm({ ...waiverForm, value: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                  মওকুফ / বৃত্তির কারণ
                </label>
                <input
                  type="text"
                  placeholder="যেমন: বীর মুক্তিযোদ্ধা সন্তান কোটা / এতিম দরিদ্র তহবিল"
                  value={waiverForm.reason}
                  onChange={(e) => setWaiverForm({ ...waiverForm, reason: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                  অনুমোদনকারী কর্তৃপক্ষ
                </label>
                <input
                  type="text"
                  placeholder="যেমন: প্রধান শিক্ষক / সভাপতি"
                  value={waiverForm.approvedBy}
                  onChange={(e) => setWaiverForm({ ...waiverForm, approvedBy: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowWaiverModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  মওকুফ সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRefundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                ফি রিফান্ড ও সমন্বয় ভাউচার (Refund Voucher)
              </h3>
              <button
                type="button"
                onClick={() => setShowRefundModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRefund} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                    রসিদ নম্বর (Receipt ID)
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: REC-2026-001"
                    value={refundForm.receiptId}
                    onChange={(e) => setRefundForm({ ...refundForm, receiptId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                    রিফান্ড পরিমাণ (৳)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={refundForm.amount}
                    onChange={(e) => setRefundForm({ ...refundForm, amount: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                  শিক্ষার্থী নির্বাচন করুন
                </label>
                {students.length > 0 ? (
                  <select
                    value={refundForm.studentId}
                    onChange={(e) => {
                      const st = students.find((s) => s.id === e.target.value);
                      if (st) {
                        setRefundForm({
                          ...refundForm,
                          studentId: st.id,
                          studentName: st.name,
                        });
                      }
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                  >
                    {students.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.grade} - রোল: {st.roll})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={refundForm.studentName}
                    onChange={(e) => setRefundForm({ ...refundForm, studentName: e.target.value })}
                    placeholder="শিক্ষার্থীর নাম"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
                    required
                  />
                )}
              </div>

              <div>
                <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1">রিফান্ডের কারণ</label>
                <input
                  type="text"
                  placeholder="যেমন: অতিরিক্ত ফি প্রদান করায় বা ভুল চালানের অর্থ ফেরত"
                  value={refundForm.reason}
                  onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                  প্রক্রিয়াকরণে (ক্যাশিয়ার/হিসাবরক্ষক)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: হিসাবরক্ষক"
                  value={refundForm.processedBy}
                  onChange={(e) => setRefundForm({ ...refundForm, processedBy: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRefundModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  রিফান্ড ভাউচার তৈরি করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
