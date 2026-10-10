'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Client-side instant navigation for static export
    if (typeof window !== 'undefined') {
      window.location.replace('/dashboard/');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-300 font-medium">SchoolPro সিস্টেমে প্রবেশ করা হচ্ছে...</p>
        <noscript>
          <meta httpEquiv="refresh" content="0; url=/dashboard/" />
          <p><a href="/dashboard/" className="text-indigo-400 underline">এখানে ক্লিক করুন যদি স্বয়ংক্রিয়ভাবে প্রবেশ না হয়</a></p>
        </noscript>
      </div>
    </div>
  );
}
