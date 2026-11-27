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
    <div className="min-h-screen bg-[#050714] flex items-center justify-center p-4 text-slate-200 font-bold text-xs">
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#0D112E] border border-[#7C6FFF]/35 shadow-lg">
        <Loader2 className="w-4 h-4 text-[#C084FC] animate-spin" />
        <span>শিক্ষক লগইন প্যানেলে রিডাইরেক্ট হচ্ছে...</span>
      </div>
    </div>
  );
}
