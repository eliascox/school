'use client';

import dynamic from 'next/dynamic';

const AcademicClient = dynamic(() => import('./AcademicClient'), {
  ssr: false,
  loading: () => (
    <div className="max-w-6xl mx-auto p-12 text-center font-extrabold text-slate-400 animate-pulse">
      একাডেমিক তথ্য ও শ্রেণি কন্ট্রোল সেন্টার লোড হচ্ছে...
    </div>
  ),
});

export default function AcademicPage() {
  return <AcademicClient />;
}
