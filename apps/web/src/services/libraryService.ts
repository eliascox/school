'use client';

import { financeService } from './financeService';
import { ledgerService } from './ledgerService';
import { auditTrailService } from './auditTrailService';

export interface LibraryBook {
  id: string;
  accessionNo: string;
  title: string;
  author: string;
  category: string;
  shelfNo: string;
  totalCopies: number;
  availableCopies: number;
  addedAt: string;
}

export interface LibraryLoan {
  id: string;
  bookId: string;
  accessionNo: string;
  bookTitle: string;
  borrowerType: 'student' | 'teacher';
  borrowerId: string;
  borrowerName: string;
  borrowerMeta: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  finePerDay: number;
  calculatedFine: number;
  finePaid: boolean;
  status: 'issued' | 'returned';
}

const BOOKS_KEY = 'sms_library_books';
const LOANS_KEY = 'sms_library_loans';

function calcOverdueDays(dueDate: string, compareDate: string): number {
  const dueMs = new Date(dueDate).getTime();
  const retMs = new Date(compareDate).getTime();
  if (Number.isNaN(dueMs) || Number.isNaN(retMs) || retMs <= dueMs) return 0;
  return Math.floor((retMs - dueMs) / (24 * 60 * 60 * 1000));
}

export const libraryService = {
  getBooks(): LibraryBook[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(BOOKS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  addBook(data: Omit<LibraryBook, 'id' | 'availableCopies' | 'addedAt'>): {
    success: boolean;
    message: string;
    book?: LibraryBook;
  } {
    if (typeof window === 'undefined') return { success: false, message: 'ব্রাউজার অনুপস্থিত' };
    if (!data.title.trim() || !data.accessionNo.trim()) {
      return { success: false, message: 'বইয়ের নাম ও অ্যাকসেশন নম্বর আবশ্যক।' };
    }
    const books = this.getBooks();
    if (books.some((b) => b.accessionNo.toLowerCase() === data.accessionNo.trim().toLowerCase())) {
      return { success: false, message: 'এই অ্যাকসেশন নম্বরের বই ইতিমধ্যেই তালিকাভুক্ত আছে।' };
    }
    const copies = Math.max(1, Number(data.totalCopies) || 1);
    const book: LibraryBook = {
      ...data,
      totalCopies: copies,
      availableCopies: copies,
      id: `BOOK-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      addedAt: new Date().toISOString(),
    };
    localStorage.setItem(BOOKS_KEY, JSON.stringify([book, ...books]));
    window.dispatchEvent(new Event('storage'));
    return { success: true, message: 'বইটি লাইব্রেরি ক্যাটালগে যুক্ত হয়েছে!', book };
  },

  deleteBook(bookId: string): { success: boolean; message: string } {
    if (typeof window === 'undefined') return { success: false, message: 'ব্রাউজার অনুপস্থিত' };
    const activeLoan = this.getLoans().some((l) => l.bookId === bookId && l.status === 'issued');
    if (activeLoan) {
      return { success: false, message: 'এই বইটির কপি এখনো ফেরত আসেনি, তাই মুছে ফেলা যাবে না।' };
    }
    localStorage.setItem(BOOKS_KEY, JSON.stringify(this.getBooks().filter((b) => b.id !== bookId)));
    window.dispatchEvent(new Event('storage'));
    return { success: true, message: 'বইটি তালিকা থেকে অপসারণ করা হয়েছে।' };
  },

  getLoans(): LibraryLoan[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(LOANS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  issueBook(params: {
    bookId: string;
    borrowerType: 'student' | 'teacher';
    borrowerId: string;
    borrowerName: string;
    borrowerMeta: string;
    issueDate: string;
    dueDate: string;
    finePerDay?: number;
  }): { success: boolean; message: string; loan?: LibraryLoan } {
    if (typeof window === 'undefined') return { success: false, message: 'ব্রাউজার অনুপস্থিত' };
    const books = this.getBooks();
    const bookIdx = books.findIndex((b) => b.id === params.bookId);
    if (bookIdx === -1) return { success: false, message: 'বইটি খুঁজে পাওয়া যায়নি।' };
    const book = books[bookIdx];
    if (book.availableCopies <= 0) {
      return { success: false, message: 'এই বইটির কোনো কপি বর্তমানে লাইব্রেরিতে অবশিষ্ট নেই।' };
    }

    const loan: LibraryLoan = {
      id: `LOAN-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      bookId: book.id,
      accessionNo: book.accessionNo,
      bookTitle: book.title,
      borrowerType: params.borrowerType,
      borrowerId: params.borrowerId,
      borrowerName: params.borrowerName,
      borrowerMeta: params.borrowerMeta,
      issueDate: params.issueDate,
      dueDate: params.dueDate,
      finePerDay: Math.max(0, Number(params.finePerDay ?? 5)),
      calculatedFine: 0,
      finePaid: false,
      status: 'issued',
    };

    books[bookIdx] = { ...book, availableCopies: book.availableCopies - 1 };
    localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
    localStorage.setItem(LOANS_KEY, JSON.stringify([loan, ...this.getLoans()]));
    auditTrailService.addLog({
      action: 'LIBRARY_BOOK_ISSUED',
      category: 'Library',
      details: `বই "${book.title}" (${book.accessionNo}) — ${params.borrowerName}-কে ইস্যু করা হয়েছে (ফেরত: ${params.dueDate})।`,
      performedBy: 'লাইব্রেরিয়ান',
      status: 'Success',
    });
    window.dispatchEvent(new Event('storage'));
    return { success: true, message: 'বই সফলভাবে ইস্যু করা হয়েছে!', loan };
  },

  returnBook(loanId: string, returnDate: string, collectFineToFinance = true): {
    success: boolean;
    message: string;
    fineAmount: number;
  } {
    if (typeof window === 'undefined') return { success: false, message: 'ব্রাউজার অনুপস্থিত', fineAmount: 0 };
    const loans = this.getLoans();
    const loanIdx = loans.findIndex((l) => l.id === loanId);
    if (loanIdx === -1) return { success: false, message: 'ইস্যু রেকর্ড পাওয়া যায়নি।', fineAmount: 0 };
    const loan = loans[loanIdx];
    if (loan.status === 'returned') {
      return { success: false, message: 'বইটি ইতিমধ্যেই ফেরত নেওয়া হয়েছে।', fineAmount: loan.calculatedFine };
    }

    const lateDays = calcOverdueDays(loan.dueDate, returnDate);
    const fineAmount = lateDays * (loan.finePerDay || 0);

    loans[loanIdx] = {
      ...loan,
      returnDate,
      calculatedFine: fineAmount,
      finePaid: fineAmount > 0 ? collectFineToFinance : true,
      status: 'returned',
    };

    const books = this.getBooks().map((b) =>
      b.id === loan.bookId ? { ...b, availableCopies: Math.min(b.totalCopies, b.availableCopies + 1) } : b
    );
    localStorage.setItem(LOANS_KEY, JSON.stringify(loans));
    localStorage.setItem(BOOKS_KEY, JSON.stringify(books));

    if (fineAmount > 0 && collectFineToFinance) {
      const vNo = `LIB-${Date.now().toString().slice(-6)}`;
      financeService.addVoucher({
        id: `VOUCH-LIB-${Date.now()}`,
        voucherNo: vNo,
        voucherType: 'Receipt',
        date: returnDate,
        reference: `লাইব্রেরি জরিমানা — ${loan.borrowerName} (${loan.bookTitle})`,
        narration: `বই ফেরতে ${lateDays} দিন বিলম্ব জরিমানা আদায়`,
        sourceModule: 'library',
        sourceId: loan.id,
        totalAmount: fineAmount,
        createdBy: 'লাইব্রেরিয়ান',
        entries: [
          { accountCode: '1010', accountName: 'হাতে নগদ (ক্যাশ ইন হ্যান্ড)', debit: fineAmount, credit: 0, narration: vNo },
          { accountCode: '4060', accountName: 'অন্যান্য ও লাইব্রেরি জরিমানা আয়', debit: 0, credit: fineAmount, narration: loan.bookTitle },
        ],
      });
      try {
        ledgerService.addRecord({
          type: 'Income',
          category: 'লাইব্রেরি জরিমানা',
          grade: 'General',
          studentName: loan.borrowerName,
          amount: fineAmount,
          voucherNo: vNo,
          date: returnDate,
          paymentMethod: 'Cash',
          description: `লাইব্রেরি বিলম্ব জরিমানা: ${loan.bookTitle} (${lateDays} দিন)`,
          createdByName: 'লাইব্রেরিয়ান',
        });
      } catch {}
    }

    window.dispatchEvent(new Event('storage'));
    return {
      success: true,
      message:
        fineAmount > 0
          ? `বই ফেরত গ্রহণ সম্পন্ন! ${lateDays} দিন বিলম্বে ৳${fineAmount} জরিমানা সমন্বিত হয়েছে।`
          : 'বই সফলভাবে ফেরত নেওয়া হয়েছে!',
      fineAmount,
    };
  },
};
