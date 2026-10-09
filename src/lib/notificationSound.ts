'use client';

/**
 * Web Audio API Synthesizer for iPhone-Style Notification Sounds
 * Zero external MP3 dependencies, 100% reliable, zero copyright, instant playback.
 */

export type SoundPreset = 'ios_chord' | 'crystal_bell' | 'marimba' | 'pop_ping';
export type SoundVolume = 'LOW' | 'MEDIUM' | 'HIGH';

export interface SoundPreferences {
  enabled: boolean;
  volume: SoundVolume;
  preset: SoundPreset;
  desktopToast: boolean;
  mobileToast: boolean;
  quietHours: boolean;
  quietStartHour: number; // 22 (10 PM)
  quietEndHour: number;   // 7 (7 AM)
}

const DEFAULT_PREFERENCES: SoundPreferences = {
  enabled: true,
  volume: 'HIGH',
  preset: 'ios_chord',
  desktopToast: true,
  mobileToast: true,
  quietHours: false,
  quietStartHour: 22,
  quietEndHour: 7,
};

const STORAGE_KEY = 'portal_notification_sound_prefs';

// In-memory audio context and deduplication tracking
let audioCtx: AudioContext | null = null;
const playedNotificationIds = new Set<string>();
const seenNotificationIds = new Set<string>();

/**
 * Gets or initializes the shared AudioContext safely
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => { });
    }
    return audioCtx;
  } catch (e) {
    console.warn('Web Audio API not supported or blocked:', e);
    return null;
  }
}

/**
 * Unlocks AudioContext upon user gesture
 */
export function unlockAudioContext(): boolean {
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Converts volume string to numeric gain
 */
function getGainValue(volume: SoundVolume): number {
  switch (volume) {
    case 'LOW':
      return 0.15;
    case 'HIGH':
      return 0.75;
    case 'MEDIUM':
    default:
      return 0.4;
  }
}

/**
 * Checks if current time is within quiet hours
 */
function isInQuietHours(prefs: SoundPreferences): boolean {
  if (!prefs.quietHours) return false;
  const currentHour = new Date().getHours();
  if (prefs.quietStartHour > prefs.quietEndHour) {
    // Over midnight e.g. 22 to 7
    return currentHour >= prefs.quietStartHour || currentHour < prefs.quietEndHour;
  }
  return currentHour >= prefs.quietStartHour && currentHour < prefs.quietEndHour;
}

/**
 * Synthesizes a tone based on selected preset
 */
function synthesizeTone(
  preset: SoundPreset,
  volume: SoundVolume,
  isUrgent = false
) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  const targetGain = getGainValue(volume);

  masterGain.connect(ctx.destination);
  masterGain.gain.setValueAtTime(0, now);

  if (preset === 'ios_chord') {
    // Apple-inspired warm tri-tone harmonic chord (C6 - E6 - G6)
    const freqs = [1046.5, 1318.51, 1567.98]; // C6, E6, G6
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0, now + idx * 0.05);
      gain.gain.linearRampToValueAtTime(targetGain * 0.6, now + idx * 0.05 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 0.45);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.5);
    });

    if (isUrgent) {
      // Second high accent note for urgent
      setTimeout(() => {
        if (!audioCtx) return;
        const now2 = audioCtx.currentTime;
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(2093.0, now2); // C7
        gain2.gain.setValueAtTime(0, now2);
        gain2.gain.linearRampToValueAtTime(targetGain * 0.7, now2 + 0.01);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now2 + 0.35);
        osc2.connect(gain2);
        gain2.connect(masterGain);
        osc2.start(now2);
        osc2.stop(now2 + 0.4);
      }, 220);
    }
  } else if (preset === 'crystal_bell') {
    // High shimmer bell (A6 + harmonic)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const bellGain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1760, now); // A6
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(3520, now); // A7 harmonic

    bellGain.gain.setValueAtTime(0, now);
    bellGain.gain.linearRampToValueAtTime(targetGain * 0.8, now + 0.01);
    bellGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

    osc1.connect(bellGain);
    osc2.connect(bellGain);
    bellGain.connect(masterGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.65);
    osc2.stop(now + 0.65);
  } else if (preset === 'marimba') {
    // Warm woody triad (C5 - E5 - G5) with fast attack
    const freqs = [523.25, 659.25, 783.99];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + i * 0.04);
      gain.gain.setValueAtTime(0, now + i * 0.04);
      gain.gain.linearRampToValueAtTime(targetGain * 0.7, now + i * 0.04 + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.04 + 0.38);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now + i * 0.04);
      osc.stop(now + i * 0.04 + 0.42);
    });
  } else {
    // pop_ping: Upward modern micro-slide
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.08);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(targetGain * 0.75, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(now);
    osc.stop(now + 0.32);
  }
}

/**
 * Loads sound preferences from storage
 */
export function getSoundPreferences(): SoundPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) };
    }
  } catch { }
  return DEFAULT_PREFERENCES;
}

/**
 * Saves sound preferences to storage
 */
export function saveSoundPreferences(prefs: SoundPreferences) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch { }
}

/**
 * Registers historical / initial notification IDs so sound is never triggered for existing items
 */
export function markInitialNotificationsSeen(ids: string[]) {
  ids.forEach((id) => {
    if (id) seenNotificationIds.add(id);
  });
}

/**
 * Plays notification chime if permitted by user settings & deduplication rules
 */
export function playNotificationSound(notification?: {
  id?: string;
  type?: string;
  priority?: string;
}) {
  const prefs = getSoundPreferences();

  // 1. Check if sound is enabled
  if (!prefs.enabled) return;

  // 2. Check quiet hours
  if (isInQuietHours(prefs)) return;

  // 3. Deduplication check: Do not replay for known historical notifications
  if (notification?.id) {
    if (seenNotificationIds.has(notification.id) || playedNotificationIds.has(notification.id)) {
      return;
    }
    playedNotificationIds.add(notification.id);
    seenNotificationIds.add(notification.id);
  }

  const isUrgent =
    notification?.priority === 'URGENT' ||
    notification?.type === 'URGENT' ||
    notification?.type === 'REVISION_REQUESTED';

  synthesizeTone(prefs.preset, prefs.volume, isUrgent);
}

/**
 * Previews sound preset in settings dialog
 */
export function previewNotificationSound(preset: SoundPreset, volume: SoundVolume) {
  unlockAudioContext();
  synthesizeTone(preset, volume, false);
}
