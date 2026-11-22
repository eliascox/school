'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { teacherAuthService } from '@/services/teacherAuthService';

export default function AnalyticsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const session = teacherAuthService.getSession();
    if (session && session.role === 'teacher') {
      router.replace('/dashboard/teacher-portal');
    } else {
      router.replace('/dashboard?tab=analytics');
    }
  }, [router]);

  return (
    <div className="p-8 text-center font-bold text-slate-400">
      সমন্বিত ড্যাশবোর্ড ও অ্যানালিটিক্সে রিডাইরেক্ট হচ্ছে...
    </div>
  );
}
