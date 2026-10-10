'use client';

import dynamic from 'next/dynamic';

const ClassesClient = dynamic(() => import('./ClassesClient'), {
  ssr: false,
  loading: () => (
    <div className="max-w-6xl mx-auto p-12 text-center font-extrabold text-slate-400 animate-pulse">
      শ্রেণি ও শাখা পরিচালনা পেজ লোড হচ্ছে...
    </div>
  ),
});

export default function ClassAndBranchPage() {
  return <ClassesClient />;
}
