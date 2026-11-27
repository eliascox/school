'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function TeacherLoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login?role=teacher');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F6F8FF] flex items-center justify-center p-4 text-slate-700 font-bold text-xs">
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-white border border-indigo-200/80 shadow-md">
        <Loader2 className="w-4 h-4 text-[#6366F1] animate-spin" />
        <span>শিক্ষক লগইন প্যানেলে রিডাইরেক্ট হচ্ছে...</span>
      </div>
    </div>
  );
}
