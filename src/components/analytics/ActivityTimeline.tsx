'use client';

import React from 'react';
import { Clock, CheckCircle2, AlertCircle, Sparkles, Send, FileCheck } from 'lucide-react';

interface ActivityItem {
  id: string;
  date: string;
  time: string;
  userName: string;
  userRole: string;
  action: string;
  details: string;
}

interface ActivityTimelineProps {
  activities: ActivityItem[];
  title?: string;
}

export default function ActivityTimeline({
  activities,
  title = 'Live System Activity Feed',
}: ActivityTimelineProps) {
  const getActionIcon = (action: string) => {
    if (action.includes('Approved')) return { icon: CheckCircle2, color: 'bg-emerald-500 text-white' };
    if (action.includes('Revision')) return { icon: AlertCircle, color: 'bg-amber-500 text-white' };
    if (action.includes('Submitted') || action.includes('Uploaded')) return { icon: Send, color: 'bg-blue-500 text-white' };
    return { icon: Sparkles, color: 'bg-indigo-500 text-white' };
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xs font-bold text-slate-900 tracking-tight">{title}</h3>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            Audit-logged chronological actions
          </p>
        </div>
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
      </div>

      <div className="space-y-3 overflow-y-auto max-h-[320px] pr-1 scrollbar-thin">
        {activities.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No recent activity recorded
          </div>
        ) : (
          activities.map((item) => {
            const { icon: Icon, color } = getActionIcon(item.action);

            return (
              <div key={item.id} className="flex items-start gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                <div className={`w-6 h-6 rounded-lg ${color} flex items-center justify-center shrink-0 mt-0.5 shadow-xs`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800 truncate">{item.action}</span>
                    <span className="text-[10px] font-medium text-slate-400 shrink-0">
                      {item.date}, {item.time}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                    {item.details || `${item.userName} (${item.userRole}) performed this action`}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
