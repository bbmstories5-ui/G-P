'use client';

import React from 'react';
import ProfileSettingsView from '@/components/ProfileSettingsView';

export default function DesignerProfilePage() {
  return (
    <ProfileSettingsView
      role="DESIGNER"
      pageTitle="Studio Profile & Settings"
      subtitle="Manage your designer credentials, creative specialization, and active sessions."
    />
  );
}
