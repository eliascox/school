'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Library,
  Plus,
  Search,
  BookMarked,
  RotateCcw,
  Trash2,
  Printer,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  UserPlus,
} from 'lucide-react';
import { libraryService, LibraryBook, LibraryLoan } from '@/services/libraryService';
import { studentService, Student } from '@/services/studentService';
import { teacherRBACService, TeacherRecord } from '@/services/teacherRBACService';
import { settingsService, SchoolSettings } from '@/services/settingsService';
import { localDateKey } from '@/lib/dateUtils';
import { confirmDialog, showToast } from '@/components/ui/ToastProvider';

type LibraryTab = 'catalog' | 'issue' | 'loans';

const BOOK_CATEGORIES = ['পাঠ্যবই', 'বিজ্ঞান ও গণিত', 'সাহিত্য ও উপন্যাস', 'ধর্ম ও নৈতিকতা', 'রেফারেন্স ও অভিধান', 'কম্পিউটার ও তথ্যপ্রযুক্তি'];

function addDaysKey(base: string, days: number): string {
  const dt = new Date(base);
  if (Number.isNaN(dt.getTime())) return base;
  dt.setDate(dt.getDate() + days);
  return localDateKey(dt);
}

function previewOverdueDays(dueDate: string, returnDate: string): number {
  const dueMs = new Date(dueDate).getTime();
  const retMs = new Date(returnDate).getTime();
  if (Number.isNaN(dueMs) || Number.isNaN(retMs) || retMs <= dueMs) return 0;
  return Math.floor((retMs - dueMs) / (24 * 60 * 60 * 1000));
}

export default function LibraryPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<LibraryTab>('catalog');
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [loans, setLoans] = useState<LibraryLoan[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);

  // Catalog Filters & Add Form
  const [bookSearch, setBookSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [accessionNo, setAccessionNo] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState(BOOK_CATEGORIES[0]);
  const [shelfNo, setShelfNo] = useState('A-1');
  const [totalCopies, setTotalCopies] = useState<number>(3);

  // Issue Book Form
  const [selectedBookId, setSelectedBookId] = useState('');
  const [borrowerType, setBorrowerType] = useState<'student' | 'teacher'>('student');
  const [borrowerGrade, setBorrowerGrade] = useState('all');
  const [borrowerQuery, setBorrowerQuery] = useState('');
  const [selectedBorrowerId, setSelectedBorrowerId] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [finePerDay, setFinePerDay] = useState<number>(5);

  // Loans & Return Options
  const [loanFilter, setLoanFilter] = useState<'all' | 'issued' | 'overdue' | 'returned'>('all');
  const [returnDate, setReturnDate] = useState('');
  const [collectFineToFinance, setCollectFineToFinance] = useState(true);

  const loadData = useCallback(() => {
    const today = localDateKey();
    setBooks(libraryService.getBooks());
    setLoans(libraryService.getLoans());
    setStudents(studentService.getAllStudents());
    setTeachers(teacherRBACService.getTeachers());
    setSettings(settingsService.getSettings());
    setIssueDate((p) => p || today);
    setDueDate((p) => p || addDaysKey(today, 7));
    setReturnDate((p) => p || today);
  }, []);

  useEffect(() => {
    setMounted(true);
    loadData();
    const onStorage = () => loadData();
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [loadData]);

  const stats = useMemo(() => {
    const today = returnDate || localDateKey();
    const totalStock = books.reduce((s, b) => s + b.totalCopies, 0);
    const availableStock = books.reduce((s, b) => s + b.availableCopies, 0);
    const activeLoans = loans.filter((l) => l.status === 'issued');
    const overdueCount = activeLoans.filter((l) => previewOverdueDays(l.dueDate, today) > 0).length;
    const totalCollectedFines = loans.reduce((s, l) => s + (l.calculatedFine || 0), 0);
    return { totalTitles: books.length, totalStock, availableStock, activeCount: activeLoans.length, overdueCount, totalCollectedFines };
  }, [books, loans, returnDate]);

  const filteredBooks = useMemo(() => {
    const q = bookSearch.trim().toLowerCase();
    return books.filter((b) => {
      if (categoryFilter !== 'all' && b.category !== categoryFilter) return false;
      if (q && !`${b.title} ${b.author} ${b.accessionNo} ${b.shelfNo}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [books, bookSearch, categoryFilter]);

  const borrowerCandidates = useMemo(() => {
    const q = borrowerQuery.trim().toLowerCase();
    if (borrowerType === 'teacher') {
      return teachers
        .filter((t) => !q || `${t.name} ${t.phone} ${t.designation}`.toLowerCase().includes(q))
        .map((t) => ({ id: t.id, name: t.name, meta: `${t.designation} (${t.phone})` }));
    }
    return students
      .filter((s) => {
        if (borrowerGrade !== 'all' && s.grade !== borrowerGrade) return false;
        if (q && !`${s.name} ${s.roll} ${s.grade}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .map((s) => ({ id: s.id, name: s.name, meta: `${s.grade} • রোল ${s.roll} (${s.section})` }));
  }, [borrowerType, borrowerGrade, borrowerQuery, students, teachers]);

  const filteredLoans = useMemo(() => {
    const today = returnDate || localDateKey();
    return loans.filter((l) => {
      if (loanFilter === 'issued') return l.status === 'issued';
      if (loanFilter === 'returned') return l.status === 'returned';
      if (loanFilter === 'overdue') return l.status === 'issued' && previewOverdueDays(l.dueDate, today) > 0;
      return true;
    });
  }, [loans, loanFilter, returnDate]);

  const handleAddBook = (e: React.FormEvent) => {
    e.preventDefault();
    const res = libraryService.addBook({
      accessionNo: accessionNo.trim(),
      title: title.trim(),
      author: author.trim() || 'অজ্ঞাত লেখক',
      category,
      shelfNo: shelfNo.trim() || 'A-1',
      totalCopies: Math.max(1, Number(totalCopies) || 1),
    });
    if (!res.success) {
      showToast(res.message, 'error');
      return;
    }
    showToast(res.message, 'success');
    setAccessionNo('');
    setTitle('');
    setAuthor('');
    loadData();
  };

  const handleDeleteBook = async (book: LibraryBook) => {
    const ok = await confirmDialog({
      title: 'বই ক্যাটালগ থেকে মুছুন',
      message: `আপনি কি "${book.title}" (${book.accessionNo}) বইটি ক্যাটালগ থেকে মুছে ফেলতে চান?`,
      confirmLabel: 'মুছুন',
      cancelLabel: 'বাতিল',
      danger: true,
    });
    if (!ok) return;
    const res = libraryService.deleteBook(book.id);
    showToast(res.message, res.success ? 'success' : 'error');
    if (res.success) loadData();
  };

  const handleIssueBook = (e: React.FormEvent) => {
    e.preventDefault();
    const candidate = borrowerCandidates.find((c) => c.id === selectedBorrowerId);
    if (!selectedBookId || !candidate) {
      showToast('অনুগ্রহ করে একটি বই এবং গ্রহীতা নির্বাচন করুন।', 'error');
      return;
    }
    const res = libraryService.issueBook({
      bookId: selectedBookId,
      borrowerType,
      borrowerId: candidate.id,
      borrowerName: candidate.name,
      borrowerMeta: candidate.meta,
      issueDate,
      dueDate,
      finePerDay,
    });
    showToast(res.message, res.success ? 'success' : 'error');
    if (res.success) {
      setSelectedBorrowerId('');
      setActiveTab('loans');
      loadData();
    }
  };

  const handleReturnBook = async (loan: LibraryLoan) => {
    const lateDays = previewOverdueDays(loan.dueDate, returnDate || localDateKey());
    const expectedFine = lateDays * (loan.finePerDay || 0);
    if (expectedFine > 0) {
      const ok = await confirmDialog({
        title: 'বিলম্ব জরিমানাসহ বই ফেরত',
        message: `"${loan.bookTitle}" ${lateDays} দিন বিলম্বে ফেরত আসছে। মোট জরিমানা ৳${expectedFine}। ফেরত সম্পন্ন করবেন?`,
        confirmLabel: 'ফেরত নিন',
        cancelLabel: 'বাতিল',
      });
      if (!ok) return;
    }
    const res = libraryService.returnBook(loan.id, returnDate || localDateKey(), collectFineToFinance);
    showToast(res.message, res.success ? 'success' : 'error');
    loadData();
  };

  if (!mounted) {
    return (
      <div className="p-8 text-center text-sm font-bold text-slate-500 dark:text-slate-400">
        ডিজিটাল লাইব্রেরি লোড হচ্ছে...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 space-y-6">
      <style jsx global>{`
        @media print {
          @page { size: A4 portrait; margin: 12mm; }
          .no-print { display: none !important; }
          body { background: #ffffff !important; color: #0f172a !important; }
        }
      `}</style>

      {/* Print Banner */}
      <div className="hidden print:block text-center border-b-2 border-slate-900 pb-3 mb-4">
        <h1 className="text-xl font-black">{settings?.schoolName || 'স্মার্ট স্কুল অ্যান্ড কলেজ'}</h1>
        <p className="text-xs font-bold text-slate-600">{settings?.address || ''} • কেন্দ্রীয় লাইব্রেরি ও পুস্তক খতিয়ান</p>
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs no-print">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shrink-0">
            <Library className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              ডিজিটাল লাইব্রেরি, বই ইস্যু ও জরিমানা খতিয়ান
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              অ্যাকসেশন নম্বর ক্যাটালগ, শিক্ষার্থী/শিক্ষক বই বিতরণ এবং স্বয়ংক্রিয় ফাইন্যান্স ও লেজার জরিমানা সমন্বয়
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/dashboard"
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> ড্যাশবোর্ড
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" /> প্রিন্ট
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'ক্যাটালগ শিরোনাম', val: `${stats.totalTitles}টি`, tone: 'indigo' },
          { label: 'মোট পুস্তক কপি', val: `${stats.totalStock} কপি`, tone: 'emerald' },
          { label: 'সেল্ফে মজুদ', val: `${stats.availableStock} কপি`, tone: 'teal' },
          { label: 'চলমান ইস্যু / বকেয়া', val: `${stats.activeCount} (${stats.overdueCount} বিলম্ব)`, tone: 'amber' },
          { label: 'আদায়কৃত জরিমানা', val: `৳${stats.totalCollectedFines}`, tone: 'rose' },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4"
          >
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{card.label}</p>
            <p className="text-lg font-black text-slate-900 dark:text-white mt-1">{card.val}</p>
          </div>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto no-print">
        {[
          { id: 'catalog' as const, label: 'বইয়ের ক্যাটালগ ও নতুন সংযোজন', icon: Library },
          { id: 'issue' as const, label: 'নতুন বই ইস্যু করুন', icon: BookMarked },
          { id: 'loans' as const, label: `বই ফেরত ও খতিয়ান (${loans.length})`, icon: RotateCcw },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shrink-0 cursor-pointer transition ${
                active
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: CATALOG */}
      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleAddBook}
            className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 no-print"
          >
            <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600" /> ক্যাটালগে নতুন বই যোগ করুন
            </h2>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">অ্যাকসেশন নম্বর *</label>
              <input
                type="text"
                value={accessionNo}
                onChange={(e) => setAccessionNo(e.target.value)}
                placeholder="যেমন: ACC-1024"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">বইয়ের নাম *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="যেমন: উচ্চতর গণিত সহায়িকা"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">লেখক / প্রকাশক</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="লেখকের নাম"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">বিভাগ</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                >
                  {BOOK_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">সেল্ফ নং</label>
                <input
                  type="text"
                  value={shelfNo}
                  onChange={(e) => setShelfNo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">মোট কপি</label>
              <input
                type="number"
                min={1}
                value={totalCopies}
                onChange={(e) => setTotalCopies(Math.max(1, Number(e.target.value) || 1))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black cursor-pointer"
            >
              ক্যাটালগে যুক্ত করুন
            </button>
          </form>

          <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center gap-3 no-print">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={bookSearch}
                  onChange={(e) => setBookSearch(e.target.value)}
                  placeholder="বইয়ের নাম, অ্যাকসেশন বা লেখক খুঁজুন..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              >
                <option value="all">সকল বিভাগ</option>
                {BOOK_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black">
                  <tr>
                    <th className="p-3 rounded-l-xl">অ্যাকসেশন</th>
                    <th className="p-3">বই ও লেখক</th>
                    <th className="p-3">বিভাগ / সেল্ফ</th>
                    <th className="p-3 text-center">মজুদ</th>
                    <th className="p-3 rounded-r-xl text-right no-print">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredBooks.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400 font-bold">
                        ক্যাটালগে কোনো বই পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    filteredBooks.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-black text-indigo-600 dark:text-indigo-400">{b.accessionNo}</td>
                        <td className="p-3">
                          <p className="font-black text-slate-900 dark:text-white">{b.title}</p>
                          <p className="text-[11px] text-slate-400 font-bold">{b.author}</p>
                        </td>
                        <td className="p-3">
                          <span className="font-bold">{b.category}</span>
                          <span className="block text-[10px] text-slate-400">সেল্ফ: {b.shelfNo}</span>
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                              b.availableCopies > 0
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                            }`}
                          >
                            {b.availableCopies} / {b.totalCopies}
                          </span>
                        </td>
                        <td className="p-3 text-right no-print">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedBookId(b.id);
                                setActiveTab('issue');
                              }}
                              disabled={b.availableCopies <= 0}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-black text-[11px] disabled:opacity-40 cursor-pointer"
                            >
                              ইস্যু
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBook(b)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
        </div>
      )}

      {/* TAB 2: ISSUE BOOK */}
      {activeTab === 'issue' && (
        <form
          onSubmit={handleIssueBook}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-3xl mx-auto space-y-5"
        >
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-600" /> শিক্ষার্থী বা শিক্ষককে বই ইস্যু করুন
          </h2>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">বই নির্বাচন করুন *</label>
            <select
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
            >
              <option value="">-- ক্যাটালগ থেকে বই বাছুন --</option>
              {books.map((b) => (
                <option key={b.id} value={b.id} disabled={b.availableCopies <= 0}>
                  [{b.accessionNo}] {b.title} — {b.author} (অবশিষ্ট: {b.availableCopies}/{b.totalCopies})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">গ্রহীতার ধরন</label>
              <select
                value={borrowerType}
                onChange={(e) => {
                  setBorrowerType(e.target.value as 'student' | 'teacher');
                  setSelectedBorrowerId('');
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              >
                <option value="student">শিক্ষার্থী</option>
                <option value="teacher">শিক্ষক / স্টাফ</option>
              </select>
            </div>
            {borrowerType === 'student' && (
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">শ্রেণি ফিল্টার</label>
                <select
                  value={borrowerGrade}
                  onChange={(e) => setBorrowerGrade(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                >
                  <option value="all">সকল শ্রেণি</option>
                  {['6th', '7th', '8th', '9th', '10th'].map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            )}
            <div className={borrowerType === 'teacher' ? 'sm:col-span-2' : ''}>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">নাম বা রোল খুঁজুন</label>
              <input
                type="text"
                value={borrowerQuery}
                onChange={(e) => setBorrowerQuery(e.target.value)}
                placeholder="সার্চ করুন..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">গ্রহীতা নির্বাচন করুন *</label>
            <select
              value={selectedBorrowerId}
              onChange={(e) => setSelectedBorrowerId(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
            >
              <option value="">-- তালিকা থেকে বাছাই করুন ({borrowerCandidates.length} জন) --</option>
              {borrowerCandidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.meta}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">ইস্যু তারিখ</label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">ফেরতের শেষ তারিখ</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">দৈনিক বিলম্ব জরিমানা (৳)</label>
              <input
                type="number"
                min={0}
                value={finePerDay}
                onChange={(e) => setFinePerDay(Math.max(0, Number(e.target.value) || 0))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black cursor-pointer"
          >
            বই ইস্যু নিশ্চিত করুন
          </button>
        </form>
      )}

      {/* TAB 3: LOANS & RETURN */}
      {activeTab === 'loans' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 no-print">
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'all' as const, label: 'সকল' },
                { id: 'issued' as const, label: 'চলমান ইস্যু' },
                { id: 'overdue' as const, label: 'বিলম্বিত' },
                { id: 'returned' as const, label: 'ফেরতকৃত' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setLoanFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer ${
                    loanFilter === f.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <span className="text-slate-500">ফেরত তারিখ:</span>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
              </div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={collectFineToFinance}
                  onChange={(e) => setCollectFineToFinance(e.target.checked)}
                />
                জরিমানা স্বয়ংক্রিয়ভাবে ক্যাশ/লেজারে সমন্বয় করুন
              </label>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black">
                <tr>
                  <th className="p-3 rounded-l-xl">বই ও অ্যাকসেশন</th>
                  <th className="p-3">গ্রহীতা</th>
                  <th className="p-3">ইস্যু ও শেষ তারিখ</th>
                  <th className="p-3">বিলম্ব / জরিমানা</th>
                  <th className="p-3">অবস্থা</th>
                  <th className="p-3 rounded-r-xl text-right no-print">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLoans.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 font-bold">
                      কোনো লেনদেন পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  filteredLoans.map((l) => {
                    const lateDays = l.status === 'issued' ? previewOverdueDays(l.dueDate, returnDate || localDateKey()) : 0;
                    const estFine = l.status === 'returned' ? l.calculatedFine : lateDays * (l.finePerDay || 0);
                    return (
                      <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3">
                          <p className="font-black text-slate-900 dark:text-white">{l.bookTitle}</p>
                          <p className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400">{l.accessionNo}</p>
                        </td>
                        <td className="p-3">
                          <p className="font-black">{l.borrowerName}</p>
                          <p className="text-[11px] text-slate-400 font-bold">{l.borrowerMeta}</p>
                        </td>
                        <td className="p-3 font-bold">
                          <span className="block">ইস্যু: {l.issueDate}</span>
                          <span className="text-[11px] text-slate-400">মেয়াদ: {l.dueDate}</span>
                        </td>
                        <td className="p-3">
                          {estFine > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-black text-[11px]">
                              <AlertTriangle className="w-3 h-3" /> ৳{estFine} {l.status === 'issued' ? `(${lateDays} দিন)` : ''}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-bold">৳০</span>
                          )}
                        </td>
                        <td className="p-3">
                          {l.status === 'returned' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-black text-[11px]">
                              <CheckCircle2 className="w-3 h-3" /> ফেরত ({l.returnDate})
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-black text-[11px]">
                              ইস্যুকৃত
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right no-print">
                          {l.status === 'issued' && (
                            <button
                              type="button"
                              onClick={() => handleReturnBook(l)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black cursor-pointer"
                            >
                              ফেরত নিন
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
