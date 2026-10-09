'use client';

import React from 'react';
import NotificationCenter from '@/components/NotificationCenter';

export default function RequesterNotificationsPage() {
  return (
    <NotificationCenter
      role="REQUESTER"
      pageTitle="Notifications"
      subtitle="Activity, designer assignments, and approvals on your requests."
    />
  );
}
