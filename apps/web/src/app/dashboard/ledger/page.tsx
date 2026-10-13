'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BookOpen,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  Scale,
  Calendar,
  Filter,
  Download,
  Printer,
  Edit,
  Trash2,
  Search,
  CheckCircle2,
  FileSpreadsheet,
  GraduationCap,
  PieChart,
  ListFilter,
  DollarSign
} from 'lucide-react';
import { ledgerService, LedgerRecord, LedgerFilterOptions } from '@/services/ledgerService';
import { SecurityDeleteModal } from '@/components/SecurityDeleteModal';
import { SystemPurgeReport } from '@/services/systemResetService';

export default function LedgerDashboardPage() {
  const [mounted, setMounted] = useState(false);

  // View Mode: 'statement' (পাশাপাশি ল্যান্ডস্কেপ আয়-ব্যয় বিবরণী) vs 'detailed' (বিস্তারিত খতিয়ান মাস্টার)
  const [viewMode, setViewMode] = useState<'statement' | 'detailed'>('statement');

  // Filters State
  const [filterType, setFilterType] = useState<'All' | 'Income' | 'Expense'>('All');
  const [filterGrade, setFilterGrade] = useState<string>('All');
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today' | 'weekly' | 'monthly' | 'custom'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data State
  const [records, setRecords] = useState<LedgerRecord[]>([]);
  const [alertMessage, setAlertMessage] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<LedgerRecord | null>(null);
  const [showSecurityDeleteModal, setShowSecurityDeleteModal] = useState(false);

  // Form State
  const [formType, setFormType] = useState<'Income' | 'Expense'>('Income');
  const [formCategory, setFormCategory] = useState<string>('মাসিক বেতন');
  const [formGrade, setFormGrade] = useState<string>('6th');
  const [formStudentName, setFormStudentName] = useState<string>('');
  const [formStudentRoll, setFormStudentRoll] = useState<string>('');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formVoucherNo, setFormVoucherNo] = useState<string>('');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formPaymentMethod, setFormPaymentMethod] = useState<'Cash' | 'bKash' | 'Nagad' | 'Bank Transfer'>('Cash');
  const [formDescription, setFormDescription] = useState<string>('');

  // Refresh Data
  const refreshData = useCallback(() => {
    if (typeof window === 'undefined') return;
    const filterOptions: LedgerFilterOptions = {
      type: filterType,
      grade: filterGrade,
      period: filterPeriod,
      startDate: startDate,
      endDate: endDate,
      search: searchQuery
    };
    const list = ledgerService.getFilteredRecords(filterOptions);
    setRecords(list);
  }, [filterType, filterGrade, filterPeriod, startDate, endDate, searchQuery]);

  useEffect(() => {
    setMounted(true);
    refreshData();
    const handleStorageChange = () => {
      refreshData();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [refreshData]);

  // Calculate Summary
  const summary = useMemo(() => {
    return ledgerService.getSummary(records);
  }, [records]);

  // Income Rows for Side-by-Side Table
  const incomeRows = useMemo(() => {
    const list = [
      { name: '৬ষ্ঠ শ্রেণি মোট সংগৃহীত আয়', amount: summary.classIncomeMap['6th'] || 0 },
      { name: '৭ম শ্রেণি মোট সংগৃহীত আয়', amount: summary.classIncomeMap['7th'] || 0 },
      { name: '৮ম শ্রেণি মোট সংগৃহীত আয়', amount: summary.classIncomeMap['8th'] || 0 },
      { name: '৯ম শ্রেণি মোট সংগৃহীত আয়', amount: summary.classIncomeMap['9th'] || 0 },
      { name: '১০ম শ্রেণি মোট সংগৃহীত আয়', amount: summary.classIncomeMap['10th'] || 0 },
    ];
    if (summary.otherIncome > 0) {
      list.push({ name: 'অন্যান্য/সাধারণ খাত আয় (বিবিধ)', amount: summary.otherIncome });
    }
    return list;
  }, [summary]);

  // Expense Rows for Side-by-Side Table
  const expenseRows = useMemo(() => {
    const entries = Object.entries(summary.expenseCategoryMap);
    if (entries.length === 0) {
      return [{ name: 'কোনো ব্যয়ের রেকর্ড নেই', amount: 0 }];
    }
    return entries.map(([name, amount]) => ({ name, amount }));
  }, [summary]);

  // Max length to balance table height
  const maxRows = Math.max(incomeRows.length, expenseRows.length);

  // Open Modal for Add
  const handleOpenAddModal = (type: 'Income' | 'Expense') => {
    setEditingRecord(null);
    setFormType(type);
    setFormCategory(type === 'Income' ? 'মাসিক বেতন' : 'প্রিন্টিং ও খাতাপত্র');
    setFormGrade('6th');
    setFormStudentName('');
    setFormStudentRoll('');
    setFormAmount('');
    setFormVoucherNo('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormPaymentMethod('Cash');
    setFormDescription('');
    setIsModalOpen(true);
  };

  // Open Modal for Edit / Update
  const handleOpenEditModal = (record: LedgerRecord) => {
    setEditingRecord(record);
    setFormType(record.type);
    setFormCategory(record.category);
    setFormGrade(record.grade || 'all');
    setFormStudentName(record.studentName || '');
    setFormStudentRoll(record.studentRoll || '');
    setFormAmount(String(record.amount));
    setFormVoucherNo(record.voucherNo);
    setFormDate(record.date);
    setFormPaymentMethod(record.paymentMethod);
    setFormDescription(record.description || '');
    setIsModalOpen(true);
  };

  // Save or Update Record
  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(formAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('অনুগ্রহ করে সঠিক টাকার পরিমাণ লিখুন!');
      return;
    }

    if (editingRecord) {
      ledgerService.updateRecord(editingRecord.id, {
        type: formType,
        category: formCategory,
        grade: formGrade,
        studentName: formStudentName,
        studentRoll: formStudentRoll,
        amount: amountNum,
        voucherNo: formVoucherNo,
        date: formDate,
        paymentMethod: formPaymentMethod,
        description: formDescription
      });
      setAlertMessage('লেজার এন্ট্রি সফলভাবে আপডেট করা হয়েছে!');
    } else {
      ledgerService.addRecord({
        type: formType,
        category: formCategory,
        grade: formGrade,
        studentName: formStudentName,
        studentRoll: formStudentRoll,
        amount: amountNum,
        voucherNo: formVoucherNo,
        date: formDate,
        paymentMethod: formPaymentMethod,
        description: formDescription,
        createdByName: 'অ্যাডমিন/ক্যাশিয়ার'
      });
      setAlertMessage('নতুন লেজার রেকর্ড সফলভাবে সংরক্ষণ করা হয়েছে!');
    }

    setIsModalOpen(false);
    refreshData();
    setTimeout(() => setAlertMessage(''), 5000);
  };

  // Delete Record
  const handleDeleteRecord = (id: string) => {
    if (confirm('আপনি কি নিশ্চিত যে এই লেজার এন্ট্রিটি মুছে ফেলতে চান?')) {
      ledgerService.deleteRecord(id);
      setAlertMessage('লেজার এন্ট্রি সফলভাবে মুছে ফেলা হয়েছে!');
      refreshData();
      setTimeout(() => setAlertMessage(''), 5000);
    }
  };

  // Reset & Clear all ledger records with security comment requirement
  const handleResetLedger = () => {
    setShowSecurityDeleteModal(true);
  };

  const handleSecurityPurgeSuccess = (report: SystemPurgeReport) => {
    refreshData();
    setAlertMessage(`সকল স্তরের ডেমো ডাটা সফলভাবে মুছে ফেলা হয়েছে! (কমেন্ট: "${report.comment}")`);
    setTimeout(() => setAlertMessage(''), 6000);
  };

  // Export CSV
  const handleExportCSV = () => {
    ledgerService.exportToCSV(records, `Ledger_Statement_${new Date().toISOString().split('T')[0]}.csv`);
  };

  // Print Report
  const handlePrint = () => {
    window.print();
  };

  if (!mounted) return null;

  return (
    <div className="w-full space-y-6 pb-20 font-sans text-slate-900" suppressHydrationWarning>
      
      {/* LANDSCAPE PRINT STYLING */}
      <style jsx global>{`
        @media print {
          @page {
            size: landscape;
            margin: 0.5in;
          }
          body {
            background-color: white !important;
            color: black !important;
          }
        }
      `}</style>

      {/* HERO BANNER & HEADER */}
      <div className="relative overflow-hidden bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
              <BookOpen size={24} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
                শ্রেণিভিত্তিক আয় ও সকল ব্যয় পাশাপাশি ল্যান্ডস্কেপ খতিয়ান (Side-by-Side Landscape Ledger)
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                শ্রেণিভিত্তিক আয়ের সংক্ষেপ এবং দফাওয়ারী ব্যয়ের পাশাপাশি ল্যান্ডস্কেপ অফিশিয়াল খতিয়ান রিপোর্ট।
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleResetLedger}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-slate-700 shadow cursor-pointer transition"
              title="সকল ডেমো ডাটা মুছে লেজার সম্পূর্ণ খালি (৳০) করুন"
            >
              <Trash2 size={15} className="text-rose-400" /> ডেমো মুছুন
            </button>
            <button
              type="button"
              onClick={() => handleOpenAddModal('Income')}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow cursor-pointer transition"
            >
              <PlusCircle size={15} /> আয় যোগ করুন
            </button>
            <button
              type="button"
              onClick={() => handleOpenAddModal('Expense')}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow cursor-pointer transition"
            >
              <PlusCircle size={15} /> ব্যয় যোগ করুন
            </button>
          </div>
        </div>
      </div>

      {/* ALERT MESSAGE */}
      {alertMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold rounded-2xl flex items-center gap-2 shadow-sm animate-fade-in print:hidden">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{alertMessage}</span>
        </div>
      )}

      {/* SUMMARY KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:hidden">
        {/* Total Income */}
        <div className="bg-emerald-900 text-white p-5 rounded-3xl shadow-md border border-emerald-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-300 uppercase block tracking-wider mb-1">
              • শ্রেণিভিত্তিক সংগৃহীত মোট আয়
            </span>
            <strong className="text-2xl font-black font-mono">৳{summary.totalIncome.toLocaleString('bn-BD')}</strong>
            <span className="text-[11px] text-emerald-200 block mt-1">৬ষ্ঠ থেকে ১০ম শ্রেণির মোট জমা</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-800/80 text-emerald-300 flex items-center justify-center font-bold">
            <TrendingUp size={24} />
          </div>
        </div>

        {/* Total Expense */}
        <div className="bg-rose-950 text-white p-5 rounded-3xl shadow-md border border-rose-900 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-rose-300 uppercase block tracking-wider mb-1">
              • দফাওয়ারী সর্বমোট ব্যয় (Total Expenses)
            </span>
            <strong className="text-2xl font-black font-mono">৳{summary.totalExpense.toLocaleString('bn-BD')}</strong>
            <span className="text-[11px] text-rose-200 block mt-1">বেতন, ইউটিলিটি ও দফাওয়ারি খরচ</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-900/80 text-rose-300 flex items-center justify-center font-bold">
            <TrendingDown size={24} />
          </div>
        </div>

        {/* Net Balance */}
        <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-md border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-indigo-300 uppercase block tracking-wider mb-1">
              • নিট উদ্বৃত্ত (Net Surplus Balance)
            </span>
            <strong className={`text-2xl font-black font-mono ${summary.netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              ৳{summary.netBalance.toLocaleString('bn-BD')}
            </strong>
            <span className="text-[11px] text-slate-400 block mt-1">মোট আয় - মোট ব্যয়</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-indigo-400 flex items-center justify-center font-bold">
            <Scale size={24} />
          </div>
        </div>
      </div>

      {/* VIEW MODE & FILTER CONTROL BAR */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4 print:hidden">
        
        {/* Top Controls: View Mode Tabs & Export */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('statement')}
              className={`px-4 py-2 rounded-xl font-black text-xs flex items-center gap-2 cursor-pointer transition ${
                viewMode === 'statement' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <PieChart size={15} /> 📊 পাশাপাশি আয়-ব্যয় বিবরণী (Side-by-Side Landscape)
            </button>

            <button
              type="button"
              onClick={() => setViewMode('detailed')}
              className={`px-4 py-2 rounded-xl font-black text-xs flex items-center gap-2 cursor-pointer transition ${
                viewMode === 'detailed' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <ListFilter size={15} /> 📑 বিস্তারিত লেনদেন মাস্টার (Master Records)
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 flex items-center gap-1.5 transition cursor-pointer"
            >
              <FileSpreadsheet size={15} /> CSV ডাউনলোড
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow"
            >
              <Printer size={15} /> 🖨️ ল্যান্ডস্কেপ প্রিন্ট
            </button>
          </div>
        </div>

        {/* Filter Selection Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-bold pt-1">
          {/* Time Period Filter */}
          <div>
            <label className="block text-slate-600 mb-1">সময়সীমা (Time Period) *</label>
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value as any)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none font-bold text-slate-900 cursor-pointer"
            >
              <option value="all">সকল সময় (All Records)</option>
              <option value="today">আজকের বিবরণী (Daily / Today)</option>
              <option value="weekly">চলতি সপ্তাহ (Weekly)</option>
              <option value="monthly">চলতি মাস (Monthly)</option>
              <option value="custom">তারিখ অনুযায়ী (Custom Date Range)</option>
            </select>
          </div>

          {/* Class Filter */}
          <div>
            <label className="block text-slate-600 mb-1">শ্রেণি (Class Filter) *</label>
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none font-bold text-slate-900 cursor-pointer"
            >
              <option value="All">সকল শ্রেণি (All Classes)</option>
              <option value="6th">৬ষ্ঠ শ্রেণি (Class 6)</option>
              <option value="7th">৭ম শ্রেণি (Class 7)</option>
              <option value="8th">৮ম শ্রেণি (Class 8)</option>
              <option value="9th">৯ম শ্রেণি (Class 9)</option>
              <option value="10th">১০ম শ্রেণি (Class 10)</option>
            </select>
          </div>

          {/* Transaction Type */}
          <div>
            <label className="block text-slate-600 mb-1">লেনদেনের ধরন *</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none font-bold text-slate-900 cursor-pointer"
            >
              <option value="All">সকল লেনদেন (Income & Expense)</option>
              <option value="Income">শুধুমাত্র আয় (Income Only)</option>
              <option value="Expense">শুধুমাত্র ব্যয় (Expense Only)</option>
            </select>
          </div>

          {/* Search Input */}
          <div>
            <label className="block text-slate-600 mb-1">খুঁজুন (Search)</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ভাউচার, নাম বা তথ্য..."
                className="w-full p-2.5 pl-8 bg-slate-50 border border-slate-300 rounded-xl outline-none text-slate-900"
              />
              <Search size={14} className="absolute left-2.5 top-3 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Custom Date Range Picker */}
        {filterPeriod === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs font-bold">
            <div>
              <label className="block text-slate-600 mb-1">প্রারম্ভিক তারিখ (From Date)</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none font-mono text-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">শেষ তারিখ (To Date)</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none font-mono text-slate-900"
              />
            </div>
          </div>
        )}
      </div>

      {/* PRINTABLE OFFICIAL HEADER (Shown only when printing) */}
      <div className="hidden print:block text-center border-b-2 border-slate-900 pb-3 mb-4">
        <h1 className="text-2xl font-black text-slate-900">বরইতলী উচ্চ বিদ্যালয়</h1>
        <p className="text-xs text-slate-700 font-bold">বরইতলী, চকরিয়া, কক্সবাজার | শ্রেণিভিত্তিক আয় ও প্রাতিষ্ঠানিক সকল ব্যয়ের ল্যান্ডস্কেপ সমাপনী বিবরণী</p>
        <div className="mt-2 text-xs font-black flex justify-between px-2 text-slate-800">
          <span>রিপোর্ট প্রকাশের তারিখ: {new Date().toLocaleDateString('bn-BD')}</span>
          <span>সময়কাল: {filterPeriod === 'today' ? 'আজকের' : filterPeriod === 'weekly' ? 'চলতি সপ্তাহ' : filterPeriod === 'monthly' ? 'চলতি মাস' : 'সকল সময়'}</span>
        </div>
      </div>

      {/* EMPTY / FRESH STATE BANNER */}
      {records.length === 0 && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 text-xs font-bold rounded-2xl flex items-center justify-between gap-3 shadow-2xs print:hidden animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>বর্তমানে কোনো ডেমো বা বাস্তব লেনদেনের ডাটা নেই (সম্পূর্ণ ফ্রেশ ও খালি খতিয়ান — সর্বমোট আয় ও ব্যয় ৳০)। নতুন আয় বা ব্যয়ের এন্ট্রি দিতে উপরের বাটন ব্যবহার করুন।</span>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* VIEW MODE 1: আয় ও ব্যয় পাশাপাশি ল্যান্ডস্কেপ টেবিল (SIDE-BY-SIDE) */}
      {/* ══════════════════════════════════════════════════════════ */}
      {viewMode === 'statement' ? (
        <div className="bg-white rounded-3xl border-2 border-slate-900 shadow-xl overflow-hidden print:border-2 print:border-slate-900 print:shadow-none">
          
          {/* Executive Header */}
          <div className="bg-slate-900 text-white p-4 font-black text-sm flex items-center justify-between border-b-2 border-slate-950">
            <span className="flex items-center gap-2">
              <PieChart size={18} className="text-amber-400" /> শ্রেণিভিত্তিক সংগৃহীত আয় ও দফাওয়ারী ব্যয়ের পাশাপাশি বিবরণী (Side-by-Side Landscape Statement)
            </span>
            <span className="text-xs text-amber-300 font-mono font-bold">LANDSCAPE FORM</span>
          </div>

          {/* Dual-Column Master Side-by-Side Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-bold">
              <thead>
                <tr className="bg-slate-900 text-white font-black text-xs border-b-2 border-slate-950">
                  {/* Left Column Header: Income */}
                  <th className="p-3.5 border-r-2 border-slate-900 w-1/2 bg-emerald-950 text-emerald-300" colSpan={2}>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs font-black">
                        <GraduationCap size={16} /> ১. শ্রেণিভিত্তিক সংগৃহীত আয় (INCOME SIDE)
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">৬ষ্ঠ - ১০ম সংক্ষেপ</span>
                    </div>
                  </th>

                  {/* Right Column Header: Expense */}
                  <th className="p-3.5 w-1/2 bg-rose-950 text-rose-300" colSpan={2}>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs font-black">
                        <TrendingDown size={16} /> ২. প্রাতিষ্ঠানিক ব্যয়ের দফাওয়ারী হিসাব (EXPENSE SIDE)
                      </span>
                      <span className="text-[10px] text-rose-400 font-mono font-bold">সকল দফা</span>
                    </div>
                  </th>
                </tr>

                <tr className="bg-slate-100 text-slate-900 font-extrabold text-[11px] border-b-2 border-slate-300">
                  {/* Income Subheaders */}
                  <th className="p-2.5 pl-4 border-r border-slate-300">আয়ের শ্রেণি / খাতের বিবরণ</th>
                  <th className="p-2.5 text-right border-r-2 border-slate-900 w-32">পরিমাণ (৳)</th>

                  {/* Expense Subheaders */}
                  <th className="p-2.5 pl-4 border-r border-slate-300">ব্যয়ের দফা / খাতের নাম</th>
                  <th className="p-2.5 text-right w-32">পরিমাণ (৳)</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 text-xs font-semibold">
                {Array.from({ length: maxRows }).map((_, idx) => {
                  const inc = incomeRows[idx];
                  const exp = expenseRows[idx];
                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition">
                      {/* Income Cells (Left Column) */}
                      <td className="p-3 pl-4 border-r border-slate-200 text-slate-900 font-bold">
                        {inc ? (
                          <span className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                            {inc.name}
                          </span>
                        ) : (
                          <span className="text-slate-300 italic">-</span>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono font-black text-slate-900 border-r-2 border-slate-900">
                        {inc ? `৳${inc.amount.toLocaleString('bn-BD')}` : '-'}
                      </td>

                      {/* Expense Cells (Right Column) */}
                      <td className="p-3 pl-4 border-r border-slate-200 text-slate-900 font-bold">
                        {exp ? (
                          <span className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0"></span>
                            {exp.name}
                          </span>
                        ) : (
                          <span className="text-slate-300 italic">-</span>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono font-black text-slate-900">
                        {exp ? `৳${exp.amount.toLocaleString('bn-BD')}` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Total Summary Rows */}
              <tfoot>
                <tr className="bg-slate-900 text-white font-black text-xs border-t-2 border-slate-950">
                  <td className="p-3.5 pl-4 border-r border-slate-700 text-emerald-300">
                    সর্বমোট সংগৃহীত আয় (TOTAL INCOME):
                  </td>
                  <td className="p-3.5 text-right font-mono text-sm text-emerald-400 border-r-2 border-slate-950">
                    ৳{summary.totalIncome.toLocaleString('bn-BD')}
                  </td>

                  <td className="p-3.5 pl-4 border-r border-slate-700 text-rose-300">
                    সর্বমোট প্রাতিষ্ঠানিক ব্যয় (TOTAL EXPENSES):
                  </td>
                  <td className="p-3.5 text-right font-mono text-sm text-rose-400">
                    ৳{summary.totalExpense.toLocaleString('bn-BD')}
                  </td>
                </tr>

                {/* Final Net Operating Surplus Row */}
                <tr className="bg-slate-950 text-white font-black text-sm border-t-2 border-slate-950">
                  <td colSpan={2} className="p-4 pl-4 border-r-2 border-slate-900 text-amber-300">
                    নিট আয়-ব্যয় স্থিতি / জের (NET SURPLUS BALANCE):
                  </td>
                  <td colSpan={2} className={`p-4 text-right font-mono text-lg ${summary.netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ৳{summary.netBalance.toLocaleString('bn-BD')} {summary.netBalance >= 0 ? '(উদ্বৃত্ত)' : '(ঘাটতি)'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : (
        /* ══════════════════════════════════════════════════════════ */
        /* VIEW MODE 2: বিস্তারিত লেনদেন মাস্টার (MASTER LEDGER TABLE) */
        /* ══════════════════════════════════════════════════════════ */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between print:hidden">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
              <BookOpen size={16} className="text-indigo-600" />
              বিস্তারিত খতিয়ান লেনদেন তালিকা ({records.length} টি রেকর্ড)
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-bold text-[11px] border-b border-slate-800">
                  <th className="p-3 text-center w-24">তারিখ</th>
                  <th className="p-3 text-center w-28">ভাউচার/রশিদ</th>
                  <th className="p-3 text-center w-24">ধরন</th>
                  <th className="p-3">ক্যাটাগরি/দফা</th>
                  <th className="p-3 text-center w-24">শ্রেণি</th>
                  <th className="p-3">শিক্ষার্থী / বিবরণ</th>
                  <th className="p-3 text-center w-24">মেথড</th>
                  <th className="p-3 text-right w-28">পরিমাণ (৳)</th>
                  <th className="p-3 text-center w-24 print:hidden">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500 italic">
                      কোনো লেজার খতিয়ান রেকর্ড পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  records.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 text-center font-mono text-[11px] font-bold text-slate-700">{r.date}</td>
                      <td className="p-3 text-center font-mono font-bold text-slate-800">{r.voucherNo}</td>
                      <td className="p-3 text-center">
                        {r.type === 'Income' ? (
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-lg uppercase inline-flex items-center gap-1">
                            ▲ আয়
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-rose-100 text-rose-800 text-[10px] font-black rounded-lg uppercase inline-flex items-center gap-1">
                            ▼ ব্যয়
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-bold text-slate-900">{r.category}</td>
                      <td className="p-3 text-center font-bold text-slate-700">
                        {r.grade && r.grade !== 'all' ? (
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md font-mono">
                            {r.grade}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono">সকল</span>
                        )}
                      </td>
                      <td className="p-3">
                        {r.studentName ? (
                          <div>
                            <strong className="text-slate-900 block">{r.studentName}</strong>
                            <span className="text-[10px] text-slate-500 font-mono">রোল: #{r.studentRoll} • {r.description}</span>
                          </div>
                        ) : (
                          <span className="text-slate-700">{r.description}</span>
                        )}
                      </td>
                      <td className="p-3 text-center font-mono text-[11px] text-slate-600">{r.paymentMethod}</td>
                      <td className={`p-3 text-right font-mono font-black text-sm ${r.type === 'Income' ? 'text-emerald-700' : 'text-rose-700'}`}>
                        ৳{r.amount.toLocaleString('bn-BD')}
                      </td>
                      <td className="p-3 text-center print:hidden">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(r)}
                            title="সম্পাদনা / আপডেট করুন"
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRecord(r.id)}
                            title="মুছে ফেলুন"
                            className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 size={14} />
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
      )}

      {/* PRINT FOOTER SIGNATURES (Shown only on Print) */}
      <div className="hidden print:flex justify-between items-end pt-16 px-12 text-xs font-black">
        <div className="text-center">
          <div className="w-48 border-b-2 border-slate-900 mb-1"></div>
          <span>ক্যাশিয়ার / হিসাবরক্ষণ কর্মকর্তা</span>
        </div>
        <div className="text-center">
          <div className="w-48 border-b-2 border-slate-900 mb-1"></div>
          <span>প্রধান শিক্ষক</span>
        </div>
      </div>

      {/* ADD / EDIT TRANSACTION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in print:hidden">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden space-y-4">
            
            {/* Modal Header */}
            <div className={`p-5 text-white flex items-center justify-between ${formType === 'Income' ? 'bg-emerald-700' : 'bg-rose-700'}`}>
              <h3 className="font-black text-sm flex items-center gap-2">
                {editingRecord ? '✏️ লেজার তথ্য আপডেট করুন' : formType === 'Income' ? '➕ নতুন আয় এন্ট্রি যোগ করুন' : '➕ নতুন ব্যয় এন্ট্রি যোগ করুন'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveRecord} className="p-6 space-y-4 text-xs font-bold">
              
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormType('Income')}
                  className={`py-2 rounded-xl font-black text-xs cursor-pointer transition ${formType === 'Income' ? 'bg-emerald-600 text-white shadow' : 'bg-slate-100 text-slate-700'}`}
                >
                  ▲ আয় (Income)
                </button>
                <button
                  type="button"
                  onClick={() => setFormType('Expense')}
                  className={`py-2 rounded-xl font-black text-xs cursor-pointer transition ${formType === 'Expense' ? 'bg-rose-600 text-white shadow' : 'bg-slate-100 text-slate-700'}`}
                >
                  ▼ ব্যয় (Expense)
                </button>
              </div>

              {/* Category & Grade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">ক্যাটাগরি / ব্যয় দফা *</label>
                  {formType === 'Income' ? (
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none font-bold text-slate-900 cursor-pointer"
                    >
                      <option value="মাসিক বেতন">মাসিক বেতন (Tuition Fee)</option>
                      <option value="ভর্তি ফি">ভর্তি ফি (Admission Fee)</option>
                      <option value="সেশন ফি">সেশন ফি (Session Fee)</option>
                      <option value="পরীক্ষা ফি">পরীক্ষা ফি (Exam Fee)</option>
                      <option value="প্রত্যয়ন ফি">প্রত্যয়ন ফি (Certificate Fee)</option>
                      <option value="অন্যান্য আয়">অন্যান্য আয় (Other Income)</option>
                    </select>
                  ) : (
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none font-bold text-slate-900 cursor-pointer"
                    >
                      <option value="শিক্ষক বেতন">শিক্ষক ও কর্মচারী বেতন</option>
                      <option value="বিদ্যুৎ বিল">বিদ্যুৎ ও ইউটিলিটি বিল</option>
                      <option value="প্রিন্টিং ও খাতাপত্র">প্রিন্টিং ও খাতাপত্র খরচ</option>
                      <option value="ভবন মেরামত ও সংস্কার">ভবন মেরামত ও সংস্কার</option>
                      <option value="খেলাধুলা ও বার্ষিক অনুষ্ঠান">খেলাধুলা ও বার্ষিক অনুষ্ঠান</option>
                      <option value="কম্পিউটার ও আইটি খরচ">কম্পিউটার ও আইটি খরচ</option>
                      <option value="অন্যান্য ব্যয়">অন্যান্য ব্যয় (Other Expense)</option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">শ্রেণি (Class) *</label>
                  <select
                    value={formGrade}
                    onChange={(e) => setFormGrade(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none font-bold text-slate-900 cursor-pointer"
                  >
                    <option value="all">সকল শ্রেণি (General / Common)</option>
                    <option value="6th">৬ষ্ঠ শ্রেণি (Class 6)</option>
                    <option value="7th">৭ম শ্রেণি (Class 7)</option>
                    <option value="8th">৮ম শ্রেণি (Class 8)</option>
                    <option value="9th">৯ম শ্রেণি (Class 9)</option>
                    <option value="10th">১০ম শ্রেণি (Class 10)</option>
                  </select>
                </div>
              </div>

              {/* Amount & Voucher No */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">পরিমাণ (টাকা/৳) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="যেমন: 1500"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none font-mono text-slate-900 text-sm font-black"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">ভাউচার / রশিদ নম্বর</label>
                  <input
                    type="text"
                    value={formVoucherNo}
                    onChange={(e) => setFormVoucherNo(e.target.value)}
                    placeholder="খালি রাখলে অটো জেনারেট হবে"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none font-mono text-slate-900"
                  />
                </div>
              </div>

              {/* Student Name & Roll */}
              {formType === 'Income' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100">
                  <div>
                    <label className="block text-slate-700 mb-1">শিক্ষার্থীর নাম (ঐচ্ছিক)</label>
                    <input
                      type="text"
                      value={formStudentName}
                      onChange={(e) => setFormStudentName(e.target.value)}
                      placeholder="যেমন: আরিফুল ইসলাম"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl outline-none text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1">শ্রেণি রোল (ঐচ্ছিক)</label>
                    <input
                      type="text"
                      value={formStudentRoll}
                      onChange={(e) => setFormStudentRoll(e.target.value)}
                      placeholder="যেমন: 101"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl outline-none font-mono text-slate-900"
                    />
                  </div>
                </div>
              )}

              {/* Date & Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">তারিখ *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">পেমেন্ট মাধ্যম *</label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none font-bold text-slate-900 cursor-pointer"
                  >
                    <option value="Cash">ক্যাশ (Cash)</option>
                    <option value="bKash">বিকাশ (bKash)</option>
                    <option value="Nagad">নগদ (Nagad)</option>
                    <option value="Bank Transfer">ব্যাংক ট্রান্সফার (Bank)</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-700 mb-1">বিবরণ / রিমার্কস *</label>
                <textarea
                  rows={2}
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="লেনদেনের সংক্ষিপ্ত বিবরণ লিখুন..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none text-slate-900"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs cursor-pointer transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className={`px-6 py-2.5 text-white font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow transition ${formType === 'Income' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
                >
                  <CheckCircle2 size={16} /> {editingRecord ? 'তথ্য আপডেট করুন' : 'রেকর্ড সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
      </div>
      )}

      {/* Security Delete Modal */}
      <SecurityDeleteModal
        isOpen={showSecurityDeleteModal}
        onClose={() => setShowSecurityDeleteModal(false)}
        onSuccess={handleSecurityPurgeSuccess}
        performedBy="প্রধান শিক্ষক / ক্যাশিয়ার"
      />
    </div>
  );
}
