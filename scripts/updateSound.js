const fs = require('fs');
const path = require('path');

const b64 = fs.readFileSync(path.join(__dirname, '../public/sounds/notification_clean_b64.txt'), 'utf8').trim();

const content = `'use client';

/**
 * Universal Audio Engine for Creative Portal Notifications
 * Plays the user's custom Apple iPhone Tone ('Best Notification Tone.m4r')
 * with multi-layered Web Audio API buffer playback, HTML5 Audio, and synthesizer fallback.
 */

export type SoundPreset = 'iphone_best' | 'ios_chord' | 'crystal_bell' | 'marimba' | 'pop_ping';
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
  preset: 'iphone_best',
  desktopToast: true,
  mobileToast: true,
  quietHours: false,
  quietStartHour: 22,
  quietEndHour: 7,
};

const STORAGE_KEY = 'portal_notification_sound_prefs';

// Embedded clean Apple M4R / AAC Base64 Audio data for Best Notification Tone
export const NOTIFICATION_AUDIO_BASE64 = 'data:audio/mp4;base64,` + b64 + `';

// In-memory audio context and deduplication tracking
let audioCtx: AudioContext | null = null;
let decodedBuffer: AudioBuffer | null = null;
let isDecoding = false;
let cachedAudio: HTMLAudioElement | null = null;

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
      audioCtx.resume().catch(() => {});
    }
    if (audioCtx && !decodedBuffer && !isDecoding) {
      loadDecodedBuffer(audioCtx);
    }
    return audioCtx;
  } catch (e) {
    console.warn('Web Audio API not initialized:', e);
    return null;
  }
}

/**
 * Pre-decodes base64 audio into AudioBuffer for instant, zero-latency Web Audio playback
 */
function loadDecodedBuffer(ctx: AudioContext) {
  if (decodedBuffer || isDecoding) return;
  isDecoding = true;

  try {
    const base64Data = NOTIFICATION_AUDIO_BASE64.split(',')[1];
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    ctx.decodeAudioData(
      bytes.buffer.slice(0),
      (buffer) => {
        decodedBuffer = buffer;
        isDecoding = false;
      },
      (err) => {
        console.warn('decodeAudioData fallback:', err);
        isDecoding = false;
      }
    );
  } catch (e) {
    isDecoding = false;
  }
}

/**
 * Unlocks AudioContext upon user gesture
 */
export function unlockAudioContext(): boolean {
  try {
    const ctx = getAudioContext();
    if (ctx) {
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      if (!decodedBuffer && !isDecoding) {
        loadDecodedBuffer(ctx);
      }
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
      return 0.25;
    case 'HIGH':
      return 1.0;
    case 'MEDIUM':
    default:
      return 0.65;
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
 * Plays decoded buffer via Web Audio API
 */
function playCustomBuffer(volume: SoundVolume): boolean {
  const ctx = getAudioContext();
  if (!ctx || !decodedBuffer) return false;

  try {
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const source = ctx.createBufferSource();
    source.buffer = decodedBuffer;

    const gainNode = ctx.createGain();
    const targetGain = getGainValue(volume);
    gainNode.gain.setValueAtTime(targetGain, ctx.currentTime);

    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.start(0);
    return true;
  } catch (e) {
    console.warn('playCustomBuffer error:', e);
    return false;
  }
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

  if (preset === 'crystal_bell') {
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
  } else if (preset === 'pop_ping') {
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
  } else {
    // iphone_best fallback / ios_chord: Apple harmonic triad (C6 - E6 - G6)
    const freqs = [1046.5, 1318.51, 1567.98]; // C6, E6, G6
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0, now + idx * 0.05);
      gain.gain.linearRampToValueAtTime(targetGain * 0.7, now + idx * 0.05 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 0.45);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.5);
    });

    if (isUrgent) {
      setTimeout(() => {
        if (!audioCtx) return;
        const now2 = audioCtx.currentTime;
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(2093.0, now2); // C7
        gain2.gain.setValueAtTime(0, now2);
        gain2.gain.linearRampToValueAtTime(targetGain * 0.8, now2 + 0.01);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now2 + 0.35);
        osc2.connect(gain2);
        gain2.connect(masterGain);
        osc2.start(now2);
        osc2.stop(now2 + 0.4);
      }, 220);
    }
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
 * Plays custom notification chime ('Best Notification Tone.m4r') with Web Audio fallback
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

  // Primary: If user chose iphone_best (Default) or fallback, play the custom tone
  if (prefs.preset === 'iphone_best' || !prefs.preset) {
    // A) Try Web Audio API pre-decoded buffer
    const playedViaBuffer = playCustomBuffer(prefs.volume);
    if (playedViaBuffer) return;

    // B) Try HTML5 Audio with static file / data URI
    try {
      if (!cachedAudio) {
        cachedAudio = new Audio('/sounds/notification.m4a');
        cachedAudio.preload = 'auto';
      }
      cachedAudio.currentTime = 0;
      cachedAudio.volume = getGainValue(prefs.volume);
      const playPromise = cachedAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // C) Fallback to audio synthesizer
          synthesizeTone('ios_chord', prefs.volume, isUrgent);
        });
        return;
      }
    } catch {
      // Fallback
    }

    synthesizeTone('ios_chord', prefs.volume, isUrgent);
    return;
  }

  // If user explicitly picked another preset
  synthesizeTone(prefs.preset, prefs.volume, isUrgent);
}

/**
 * Previews sound preset in settings dialog
 */
export function previewNotificationSound(preset: SoundPreset, volume: SoundVolume) {
  unlockAudioContext();

  if (preset === 'iphone_best') {
    const playedViaBuffer = playCustomBuffer(volume);
    if (playedViaBuffer) return;

    try {
      if (!cachedAudio) {
        cachedAudio = new Audio('/sounds/notification.m4a');
        cachedAudio.preload = 'auto';
      }
      cachedAudio.currentTime = 0;
      cachedAudio.volume = getGainValue(volume);
      cachedAudio.play().catch(() => {
        synthesizeTone('ios_chord', volume, false);
      });
      return;
    } catch { }
  }

  synthesizeTone(preset, volume, false);
}
`;

fs.writeFileSync(path.join(__dirname, '../src/lib/notificationSound.ts'), content, 'utf8');
console.log('Successfully written src/lib/notificationSound.ts');
