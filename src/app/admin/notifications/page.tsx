'use client';

import React from 'react';
import NotificationCenter from '@/components/NotificationCenter';

export default function AdminNotificationsPage() {
  return (
    <NotificationCenter
      role="ADMIN"
      pageTitle="Notifications"
      subtitle="System alerts, user events, and workflow logs."
    />
  );
}
