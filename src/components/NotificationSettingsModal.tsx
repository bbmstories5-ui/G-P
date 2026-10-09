'use client';

import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Volume1,
  Bell,
  Sparkles,
  X,
  Play,
  Check,
  Moon,
  Smartphone,
  Monitor,
  Shield,
  Radio,
  Sliders,
} from 'lucide-react';
import {
  SoundPreferences,
  SoundPreset,
  SoundVolume,
  getSoundPreferences,
  saveSoundPreferences,
  previewNotificationSound,
  unlockAudioContext,
} from '@/lib/notificationSound';
import { useTabUser } from '@/lib/tabAuth';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_OPTIONS: { id: SoundPreset; label: string; desc: string }[] = [
  { id: 'iphone_best', label: 'iPhone Best Tone (Default)', desc: 'User custom tone: Apple Best Notification Chime' },
  { id: 'ios_chord', label: 'iOS Soft Chime', desc: 'Warm Apple-inspired harmonic chord chime' },
  { id: 'crystal_bell', label: 'Crystal Shimmer Bell', desc: 'High crisp resonance for fast recognition' },
  { id: 'marimba', label: 'Warm Wooden Marimba', desc: 'Organic acoustic mallet triad' },
  { id: 'pop_ping', label: 'Subtle Modern Pip', desc: 'Minimal executive bubble ping' },
];

export default function NotificationSettingsModal({
  isOpen,
  onClose,
}: NotificationSettingsModalProps) {
  const user = useTabUser();
  const [prefs, setPrefs] = useState<SoundPreferences>(getSoundPreferences());
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>('default');
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPrefs(getSoundPreferences());
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setBrowserPermission(Notification.permission);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const updatePref = <K extends keyof SoundPreferences>(key: K, value: SoundPreferences[K]) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    saveSoundPreferences(updated);
  };

  const handleTestSound = () => {
    setIsPlayingPreview(true);
    unlockAudioContext();
    previewNotificationSound(prefs.preset, prefs.volume);
    setTimeout(() => setIsPlayingPreview(false), 700);
  };

  const handleRequestBrowserPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        setBrowserPermission(res);
      } catch (err) {
        console.error('Notification permission error:', err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden text-slate-800 dark:text-slate-100 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Bell className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Notification &amp; Sound Preferences
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Configure real-time chimes, iOS toasts, and quiet hours
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
          
          {/* Section 1: Sound Master Switch */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${prefs.enabled ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400' : 'bg-slate-200 text-slate-500 dark:bg-slate-700'}`}>
                {prefs.enabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-white text-xs block">
                  Notification Sound Chime
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Play soft synthesized chime for incoming updates
                </span>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.enabled}
                onChange={(e) => {
                  updatePref('enabled', e.target.checked);
                  if (e.target.checked) unlockAudioContext();
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Section 2: Sound Tone & Preview */}
          {prefs.enabled && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                  Notification Ringtone
                </label>
              </div>

              <div className="p-3.5 rounded-2xl border border-indigo-500/40 bg-indigo-50/70 dark:bg-indigo-950/40 dark:border-indigo-800/60 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                    <Bell className="w-4 h-4 text-amber-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        iPhone Best Tone (Default)
                      </span>
                      <span className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/60 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Custom Apple Chime from Best Notification Tone
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTestSound}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1.5 transition-colors border border-indigo-200 dark:border-indigo-800/80 text-xs shadow-xs"
                >
                  <Play className={`w-3.5 h-3.5 ${isPlayingPreview ? 'animate-ping' : ''}`} />
                  <span>{isPlayingPreview ? 'Playing...' : 'Play Tone'}</span>
                </button>
              </div>

              {/* Volume Slider */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Volume Level</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">{prefs.volume}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['LOW', 'MEDIUM', 'HIGH'] as SoundVolume[]).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => {
                        updatePref('volume', v);
                        previewNotificationSound(prefs.preset, v);
                      }}
                      className={`py-1.5 px-3 rounded-xl font-bold border transition-all text-center ${
                        prefs.volume === v
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Visual Toasts */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-800 dark:text-slate-200">
              In-App Visual Alerts
            </h3>

            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <Monitor className="w-4 h-4 text-slate-500" />
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">Desktop Notification Banner</span>
                    <span className="text-[10px] text-slate-500">Show floating toast on top-right of the screen</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.desktopToast}
                  onChange={(e) => updatePref('desktopToast', e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-4 h-4 text-slate-500" />
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">Mobile Dynamic Island Pill</span>
                    <span className="text-[10px] text-slate-500">Safe-area aware compact toast on iOS &amp; Android</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.mobileToast}
                  onChange={(e) => updatePref('mobileToast', e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Section 4: Quiet Hours */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 cursor-pointer">
              <div className="flex items-center gap-2.5">
                <Moon className="w-4 h-4 text-slate-500" />
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">Quiet Hours (10:00 PM – 7:00 AM)</span>
                  <span className="text-[10px] text-slate-500">Automatically mute sounds during focus &amp; night hours</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={prefs.quietHours}
                onChange={(e) => updatePref('quietHours', e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
              />
            </label>
          </div>

          {/* Section 5: Browser System Permissions */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between gap-3">
            <div>
              <span className="font-bold text-slate-900 dark:text-white block text-xs">
                Operating System &amp; Browser Push
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Status: <strong className="uppercase text-indigo-600 dark:text-indigo-400 font-mono">{browserPermission}</strong>
              </span>
            </div>

            {browserPermission !== 'granted' && (
              <button
                type="button"
                onClick={handleRequestBrowserPermission}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0"
              >
                Enable OS Alerts
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Tab Isolated Session: <strong>{user?.name || 'Active User'}</strong></span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
