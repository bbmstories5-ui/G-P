'use client';

import React from 'react';
import ProfileSettingsView from '@/components/ProfileSettingsView';

export default function RequesterProfilePage() {
  return (
    <ProfileSettingsView
      role="REQUESTER"
      pageTitle="Account Settings"
      subtitle="Manage your personal details, login credentials, and department settings."
    />
  );
}
