'use client';

import React from 'react';
import NotificationCenter from '@/components/NotificationCenter';

export default function DesignerNotificationsPage() {
  return (
    <NotificationCenter
      role="DESIGNER"
      pageTitle="Notifications"
      subtitle="Newly available requests, revision notes, and approval updates."
    />
  );
}
