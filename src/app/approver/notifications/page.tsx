'use client';

import React from 'react';
import NotificationCenter from '@/components/NotificationCenter';

export default function ApproverNotificationsPage() {
  return (
    <NotificationCenter
      role="APPROVER"
      pageTitle="Notifications"
      subtitle="Graphic submissions awaiting review and team activity."
    />
  );
}
