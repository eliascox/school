'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TeacherLoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login?role=teacher');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-4 text-slate-300 font-bold text-xs">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping"></span>
        <span>শিক্ষক লগইন প্যানেলে রিডাইরেক্ট হচ্ছে...</span>
      </div>
    </div>
  );
}
