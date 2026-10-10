'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MobileAppPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/teacher-portal');
  }, [router]);

  return (
    <div className="p-8 text-center font-bold text-slate-400">
      শিক্ষক পোর্টালে রিডাইরেক্ট হচ্ছে...
    </div>
  );
}
