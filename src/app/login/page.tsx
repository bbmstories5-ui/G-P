'use client';

import React from 'react';
import ModernAuthCard from '@/components/ModernAuthCard';

export default function UnifiedLoginPage() {
  return (
    <div className="min-h-screen bg-[#D6DCE5] bg-gradient-to-br from-[#E4E8EE] via-[#D5DBE5] to-[#C8CFDC] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Background Soft Glows */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glass/Pill Card Component */}
      <div className="w-full max-w-5xl z-10 animate-fadeIn">
        <ModernAuthCard />
      </div>
    </div>
  );
}
