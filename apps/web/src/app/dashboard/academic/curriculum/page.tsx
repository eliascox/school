'use client';

import dynamic from 'next/dynamic';

const CurriculumClient = dynamic(() => import('./CurriculumClient'), {
  ssr: false,
  loading: () => (
    <div className="max-w-6xl mx-auto p-12 text-center font-extrabold text-slate-400 animate-pulse">
      পাঠ্যক্রম, বিষয় তালিকা ও NCTB ক্যাটালগ লোড হচ্ছে...
    </div>
  ),
});

export default function CurriculumManagementPage() {
  return <CurriculumClient />;
}
