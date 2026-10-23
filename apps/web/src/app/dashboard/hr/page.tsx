'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { teacherAuthService } from '@/services/teacherAuthService';

export default function HRRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const session = teacherAuthService.getSession();
    if (session && session.role === 'teacher') {
      router.replace('/dashboard/teacher-portal');
    } else {
      router.replace('/dashboard/teacher');
    }
  }, [router]);

  return (
    <div className="p-8 text-center font-bold text-slate-400">
      শিক্ষক ব্যবস্থাপনা (HR) পোর্টালে রিডাইরেক্ট হচ্ছে...
    </div>
  );
}
