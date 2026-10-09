'use client';

import React from 'react';
import { ArrowRight, CheckCircle2, AlertCircle, Clock, Palette, Layers, Send } from 'lucide-react';

interface StageItem {
  stage: string;
  count: number;
  color: string;
}

interface PipelineFlowChartProps {
  stages: StageItem[];
  title?: string;
}

export default function PipelineFlowChart({
  stages,
  title = 'Graphic Production & Approval Pipeline',
}: PipelineFlowChartProps) {
  const getStageIcon = (stageName: string) => {
    switch (stageName.toLowerCase()) {
      case 'assigned':
        return Layers;
      case 'in design':
        return Palette;
      case 'submitted':
        return Send;
      case 'under review':
      case 'approval':
        return Clock;
      case 'approved / completed':
      case 'approved':
        return CheckCircle2;
      default:
        return CheckCircle2;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-xs font-bold text-slate-900 tracking-tight">{title}</h3>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            Real-time active workflow stages and throughput
          </p>
        </div>
        <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
          Live Flow
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
        {stages.map((stage, idx) => {
          const Icon = getStageIcon(stage.stage);
          const isLast = idx === stages.length - 1;

          return (
            <div key={idx} className="relative flex-1">
              <div className="bg-[#F8FAFC] border border-slate-200/70 hover:border-slate-300 rounded-xl p-3.5 flex flex-col justify-between h-full transition-all group hover:shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-xs"
                    style={{ backgroundColor: stage.color }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">
                    0{idx + 1}
                  </span>
                </div>

                <div className="mt-2">
                  <div className="text-2xl font-black text-slate-900 tracking-tight">
                    {stage.count}
                  </div>
                  <div className="text-xs font-semibold text-slate-600 mt-0.5 truncate">
                    {stage.stage}
                  </div>
                </div>

                {/* Progress bar inside card */}
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(stage.count * 15 + 10, 100)}%`,
                      backgroundColor: stage.color,
                    }}
                  />
                </div>
              </div>

              {/* Connecting arrow between cards on desktop */}
              {!isLast && (
                <div className="hidden md:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-4 h-4 rounded-full bg-white border border-slate-200 items-center justify-center text-slate-400 shadow-xs">
                  <ArrowRight className="w-2.5 h-2.5" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
