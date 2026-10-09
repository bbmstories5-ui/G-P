'use client';

import React from 'react';
import ModernAuthCard from '@/components/ModernAuthCard';

export default function DesignerLoginPage() {
  return (
    <div className="min-h-screen bg-[#D6DCE5] bg-gradient-to-br from-[#E4E8EE] via-[#D5DBE5] to-[#C8CFDC] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      <div className="w-full max-w-5xl z-10 animate-fadeIn">
        <ModernAuthCard initialRole="DESIGNER" />
      </div>
    </div>
  );
}
