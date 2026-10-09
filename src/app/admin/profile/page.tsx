'use client';

import React from 'react';
import ProfileSettingsView from '@/components/ProfileSettingsView';

export default function AdminProfilePage() {
  return (
    <ProfileSettingsView
      role="ADMIN"
      pageTitle="Super Admin Profile"
      subtitle="Root administrator credentials, security access, and session governance."
    />
  );
}
