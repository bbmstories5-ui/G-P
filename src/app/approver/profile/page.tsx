'use client';

import React from 'react';
import ProfileSettingsView from '@/components/ProfileSettingsView';

export default function ApproverProfilePage() {
  return (
    <ProfileSettingsView
      role="APPROVER"
      pageTitle="Governance Profile & Settings"
      subtitle="Manage your brand approver identity, executive title, and security credentials."
    />
  );
}
