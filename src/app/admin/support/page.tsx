'use client';

import React from 'react';
import { useTabUser } from '@/lib/tabAuth';
import HelpSupportCenter from '@/components/support/HelpSupportCenter';

export default function AdminSupportPage() {
  const user = useTabUser();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <HelpSupportCenter currentUser={user} />;
}
