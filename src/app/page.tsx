'use client';

import React from 'react';
import ModernAuthCard from '@/components/ModernAuthCard';

export default function RootHomePage() {
  return (
    <main className="min-h-screen bg-[#D6DCE5] bg-gradient-to-br from-[#E4E8EE] via-[#D5DBE5] to-[#C8CFDC] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden selection:bg-amber-400 selection:text-slate-900">
      {/* Soft Ambient Background Highlights */}
      <div className="absolute top-12 left-12 w-96 h-96 bg-amber-300/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-12 right-12 w-96 h-96 bg-indigo-400/15 rounded-full blur-3xl pointer-events-none" />

      {/* Directly Display Modern Login Card */}
      <div className="w-full max-w-5xl z-10 animate-fadeIn">
        <ModernAuthCard />
      </div>
    </main>
  );
}
