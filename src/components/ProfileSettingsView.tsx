'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Shield,
  Lock,
  Key,
  Bell,
  Sliders,
  Laptop,
  Check,
  AlertCircle,
  Camera,
  Trash2,
  Upload,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Smartphone,
  Globe,
  Clock,
  LogOut,
  Copy,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Volume2,
  VolumeX,
  Volume1,
  Play,
  Sparkles,
  Moon,
  Music,
} from 'lucide-react';
import { tabFetch, getTabSessionId } from '@/lib/tabAuth';
import { toast } from '@/components/ui/ToastProvider';
import {
  SoundPreferences,
  SoundPreset,
  SoundVolume,
  getSoundPreferences,
  saveSoundPreferences,
  previewNotificationSound,
  unlockAudioContext,
} from '@/lib/notificationSound';

interface ProfileSettingsViewProps {
  currentRole?: 'REQUESTER' | 'DESIGNER' | 'APPROVER' | 'ADMIN' | string;
  role?: 'REQUESTER' | 'DESIGNER' | 'APPROVER' | 'ADMIN' | string;
  pageTitle?: string;
  subtitle?: string;
}

export default function ProfileSettingsView({
  currentRole: propCurrentRole,
  role: propRole,
  pageTitle,
  subtitle,
}: ProfileSettingsViewProps) {
  const currentRole = (propCurrentRole || propRole || 'REQUESTER').toUpperCase() as
    | 'REQUESTER'
    | 'DESIGNER'
    | 'APPROVER'
    | 'ADMIN';
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'permissions' | 'security' | 'preferences'>('profile');

  // Loading & State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // User Core State
  const [user, setUser] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);

  // Profile Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');

  // Password Form Fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Notification Preferences State
  const [notifications, setNotifications] = useState({
    inAppStatusChanges: true,
    inAppFeedbackNotes: true,
    inAppUrgentSLA: true,
    emailInstantAlerts: true,
    emailDailyDigest: false,
    emailWeeklySummary: true,
    desktopPush: false,
    soundAlerts: true,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
  });

  // Workspace Preferences State
  const [preferences, setPreferences] = useState({
    timezone: 'UTC+05:30 (IST - India Standard Time)',
    dateFormat: 'MMM D, YYYY',
    defaultLanding: 'dashboard',
    autoSaveInterval: '30s',
    density: 'comfortable',
  });

  // Sound Preferences State
  const [soundPrefs, setSoundPrefs] = useState<SoundPreferences>(getSoundPreferences());
  const [isPlayingSoundPreview, setIsPlayingSoundPreview] = useState(false);
  const soundFileInputRef = useRef<HTMLInputElement>(null);

  // 2FA Modal & State
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [twoFactorStep, setTwoFactorStep] = useState<'qr' | 'verify' | 'recovery'>('qr');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [apiKeyCopied, setApiKeyCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [currentTabSessionId, setCurrentTabSessionId] = useState('');

  // Fetch initial profile
  useEffect(() => {
    setMounted(true);
    setCurrentTabSessionId(getTabSessionId());
    fetchProfileData();
    // Load sound preferences
    try {
      setSoundPrefs(getSoundPreferences());
      const savedNotifs = localStorage.getItem(`portal_notifs_${currentRole}`);
      if (savedNotifs) setNotifications(JSON.parse(savedNotifs));
      const savedPrefs = localStorage.getItem(`portal_prefs_${currentRole}`);
      if (savedPrefs) setPreferences(JSON.parse(savedPrefs));
      const saved2FA = localStorage.getItem(`portal_2fa_${currentRole}`);
      if (saved2FA) setTwoFactorEnabled(saved2FA === 'true');
    } catch (e) {}
  }, [currentRole]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const res = await tabFetch('/api/auth/profile');
      if (!res.ok) {
        throw new Error('Failed to load profile details');
      }
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        setName(data.user.name || '');
        setEmail(data.user.email || '');
        setAvatar(data.user.avatar || '');

        if (data.user.requesterProfile) {
          setDepartment(data.user.requesterProfile.department || '');
          setPhone(data.user.requesterProfile.phone || '');
        }
        if (data.user.designerProfile) {
          setSpecialty(data.user.designerProfile.specialty || '');
        }
        if (data.user.approverProfile) {
          setTitle(data.user.approverProfile.title || '');
          setDepartment(data.user.approverProfile.department || '');
        }
      }
      if (data.sessions) {
        setSessions(data.sessions);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error connecting to profile service');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string, isError = false, desc?: string) => {
    if (isError) {
      toast.error(msg, desc);
    } else {
      toast.success(msg, desc);
    }
  };

  // Avatar file upload handler
  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large', 'Image size must be under 5MB.');
      return;
    }

    try {
      setUploadingAvatar(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'avatar');

      // Upload via multipart form
      const token = sessionStorage.getItem('token') || '';
      const tabSessionId = getTabSessionId();

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(tabSessionId ? { 'X-Tab-Session': tabSessionId } : {}),
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Failed to upload photo');
      }

      setAvatar(data.url);

      // Auto save avatar in database
      await tabFetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: data.url }),
      });

      toast.success('Profile photo updated', 'Your new avatar has been saved and applied across tabs.');
    } catch (err: any) {
      toast.error('Upload failed', err.message || 'Failed to process image');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatar('');
    try {
      await tabFetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: null }),
      });
      toast.info('Profile photo removed', 'Avatar has been reset to default initials.');
    } catch (err: any) {
      toast.error('Failed to remove photo', 'Could not update avatar setting.');
    }
  };

  // Save Basic Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload: any = {
        name,
        avatar,
        phone,
        department,
        specialty,
        title,
      };

      const res = await tabFetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      toast.success('Profile updated successfully', 'Your identity and account details are saved.');
      fetchProfileData();
    } catch (err: any) {
      toast.error('Update failed', err.message || 'Could not save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  // Update Sound Preferences
  const updateSoundPref = <K extends keyof SoundPreferences>(key: K, value: SoundPreferences[K]) => {
    const updated = { ...soundPrefs, [key]: value };
    setSoundPrefs(updated);
    saveSoundPreferences(updated);
  };

  // Preview notification tone
  const handlePreviewSound = (presetToPlay?: SoundPreset, volumeToPlay?: SoundVolume) => {
    setIsPlayingSoundPreview(true);
    unlockAudioContext();
    previewNotificationSound(presetToPlay || soundPrefs.preset, volumeToPlay || soundPrefs.volume);
    setTimeout(() => setIsPlayingSoundPreview(false), 750);
  };

  // Save Notifications
  const handleSaveNotifications = () => {
    try {
      localStorage.setItem(`portal_notifs_${currentRole}`, JSON.stringify(notifications));
      saveSoundPreferences(soundPrefs);
      toast.success('Notification & Sound preferences saved', 'Chime tone, volume, and alert channels are now active.');
    } catch (e) {
      toast.error('Save failed', 'Could not persist notification settings.');
    }
  };

  // Request browser desktop push permissions
  const handleRequestPushPermission = async () => {
    if (!('Notification' in window)) {
      toast.warning('Not supported', 'Desktop notifications are not supported in this browser.');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setNotifications(prev => ({ ...prev, desktopPush: true }));
      toast.success('Desktop alerts enabled', 'You will receive native notifications for critical tasks.');
      new Notification('GraphicPortal Alerts Enabled', {
        body: 'You will now receive desktop alerts for priority tasks & approvals.',
        icon: '/favicon.ico',
      });
    } else {
      setNotifications(prev => ({ ...prev, desktopPush: false }));
      toast.error('Permission denied', 'Desktop notification permission was denied in browser settings.');
    }
  };

  // Save Preferences
  const handleSavePreferences = () => {
    try {
      localStorage.setItem(`portal_prefs_${currentRole}`, JSON.stringify(preferences));
      toast.success('Workspace preferences updated', 'Regional timezone and display formats saved.');
    } catch (e) {
      toast.error('Save failed', 'Could not save workspace preferences.');
    }
  };

  // Save Password Change
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Missing current password', 'Please enter your current account password.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password too short', 'New password must contain at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords mismatch', 'New passwords do not match. Please verify.');
      return;
    }

    try {
      setSaving(true);
      const res = await tabFetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      toast.success('Password changed successfully', 'Your new security passphrase is now active.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error('Password update failed', err.message || 'Error updating password.');
    } finally {
      setSaving(false);
    }
  };

  // Revoke Session
  const handleRevokeSession = async (sessionId?: string, revokeAllOthers = false) => {
    try {
      const currentTabSessionId = getTabSessionId();
      const res = await tabFetch('/api/auth/profile', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          revokeAllOthers,
          currentTabSessionId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to revoke session');

      toast.success('Session terminated', data.message || 'Active session has been revoked.');
      fetchProfileData();
    } catch (err: any) {
      toast.error('Revocation failed', err.message || 'Error revoking session.');
    }
  };

  // Password strength calculation
  const getPasswordStrength = () => {
    if (!newPassword) return { score: 0, label: 'None', color: 'bg-slate-200 dark:bg-neutral-700' };
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;

    if (score === 1) return { score: 1, label: 'Weak', color: 'bg-rose-500' };
    if (score === 2) return { score: 2, label: 'Fair', color: 'bg-amber-500' };
    if (score === 3) return { score: 3, label: 'Good', color: 'bg-emerald-500' };
    return { score: 4, label: 'Strong', color: 'bg-emerald-600' };
  };

  const strength = getPasswordStrength();

  // Role permissions catalog
  const getRolePermissions = () => {
    switch (currentRole) {
      case 'REQUESTER':
        return [
          { scope: 'Creative Briefs', action: 'Create & Edit Requests', granted: true, desc: 'Author graphic design requirements with asset dimensions and reference files' },
          { scope: 'Deliverables', action: 'View Version History & Previews', granted: true, desc: 'Inspect graphic submissions, zoom into high-res renders, and download finals' },
          { scope: 'Revisions', action: 'Request Revisions & Clarifications', granted: true, desc: 'Send feedback directly to assigned designer when changes are requested' },
          { scope: 'Approvals', action: 'Final Creative Sign-off', granted: false, desc: 'Governed by executive Approver role for brand consistency assurance' },
          { scope: 'User Governance', action: 'Manage Team & Assign Designers', granted: false, desc: 'Restricted to system administrators and lead coordinators' },
        ];
      case 'DESIGNER':
        return [
          { scope: 'Deliverables', action: 'Upload & Version Graphics', granted: true, desc: 'Upload production-ready renders, attach designer notes, and increment versions' },
          { scope: 'Assigned Pipeline', action: 'Claim & Accept Tasks', granted: true, desc: 'Accept assigned creative requests and transition status to In-Progress' },
          { scope: 'Feedback Loop', action: 'Inspect Revisions & Approver Notes', granted: true, desc: 'Review approver markups, revision requests, and historical feedback' },
          { scope: 'Creative Briefs', action: 'Create New Requisition', granted: false, desc: 'Designers work on assigned requests dispatched by marketing requesters' },
          { scope: 'Production Sign-off', action: 'Direct Approval Authority', granted: false, desc: 'Requires independent verification from Brand Approver' },
        ];
      case 'APPROVER':
        return [
          { scope: 'Governance', action: 'Approve Deliverables to Production', granted: true, desc: 'Execute binding final approval and publish approved graphic to enterprise library' },
          { scope: 'Quality Control', action: 'Reject & Mandate Revisions', granted: true, desc: 'Provide itemized revision directives back to assigned designers' },
          { scope: 'Audit Trail', action: 'View End-to-End Activity Logs', granted: true, desc: 'Inspect timestamped audit logs for all request status transitions' },
          { scope: 'Asset Library', action: 'Download Master High-Res Assets', granted: true, desc: 'Access approved master deliverables and vector package attachments' },
          { scope: 'System Core', action: 'Direct Database & User Administration', granted: false, desc: 'Restricted to root Administrator role' },
        ];
      case 'ADMIN':
        return [
          { scope: 'Full Access', action: 'Manage All Users & Role Assignment', granted: true, desc: 'Create, update, and manage accounts for requesters, designers, and approvers' },
          { scope: 'Creative Pipeline', action: 'Override Request Status & Assignments', granted: true, desc: 'Reassign designers, force status transitions, or archive stalled requests' },
          { scope: 'Compliance', action: 'Full Audit Log & Activity Inspection', granted: true, desc: 'Complete visibility into all system events, logins, and file operations' },
          { scope: 'System Config', action: 'Manage Workspace & Integrations', granted: true, desc: 'Configure webhook endpoints, email dispatchers, and system parameters' },
          { scope: 'Security', action: 'Revoke Tab Sessions & Session Tokens', granted: true, desc: 'Terminate suspicious concurrent sessions and enforce authentication policies' },
        ];
    }
  };

  const permissionsList = getRolePermissions();

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-neutral-950 text-slate-900 dark:text-neutral-100 p-6 md:p-10 transition-colors">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-neutral-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Account & Workspace Settings
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wider bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 border border-slate-300 dark:border-neutral-700">
                {currentRole}
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1">
              Manage your personal identity, avatar image, notification channels, security, and role permissions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchProfileData()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-neutral-400 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg hover:bg-slate-50 dark:hover:bg-neutral-800 transition"
              title="Refresh profile data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Sync
            </button>
            <button
              onClick={() => router.push(`/${currentRole.toLowerCase()}/dashboard`)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-neutral-200 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg hover:bg-slate-50 dark:hover:bg-neutral-800 transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Main Settings Layout with Left Sidebar Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Navigation Tabs (3 cols) */}
          <div className="md:col-span-3 space-y-1 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-2.5 shadow-sm">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'profile'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Profile & Avatar</span>
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'notifications'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Notifications & Alerts</span>
            </button>

            <button
              onClick={() => setActiveTab('permissions')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'permissions'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Permissions & Role</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'security'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Security & Sessions</span>
            </button>

            <button
              onClick={() => setActiveTab('preferences')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'preferences'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Display & Workspace</span>
            </button>

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-neutral-800 px-3 pb-2 text-xs text-slate-400 dark:text-neutral-500">
              <div className="flex items-center justify-between">
                <span>Tab Isolation:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">Active</span>
              </div>
              <div className="truncate mt-1 text-[11px] font-mono text-slate-500 dark:text-neutral-400" suppressHydrationWarning>
                SID: {mounted && currentTabSessionId ? currentTabSessionId.slice(0, 16) + '...' : 'System Local'}
              </div>
            </div>
          </div>

          {/* Content Panel (9 cols) */}
          <div className="md:col-span-9 space-y-6">

            {/* TAB 1: PROFILE & IDENTITY */}
            {activeTab === 'profile' && (
              <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-8">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Profile & Identity</h2>
                  <p className="text-sm text-slate-500 dark:text-neutral-400 mt-0.5">
                    Update your display name, contact information, and upload an official profile image.
                  </p>
                </div>

                {/* Avatar Upload Section */}
                <div className="p-5 bg-slate-50/70 dark:bg-neutral-900/50 border border-slate-200/80 dark:border-neutral-800 rounded-2xl space-y-4">
                  <div className="text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                    Profile Photo & Avatar
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    {/* Avatar Display */}
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-200 dark:bg-neutral-800 border-2 border-white dark:border-neutral-700 shadow-md flex items-center justify-center text-slate-600 dark:text-neutral-300 font-bold text-2xl flex-shrink-0">
                        {avatar ? (
                          <img
                            src={avatar}
                            alt={name || 'User'}
                            className="w-full h-full object-cover"
                            onError={() => setAvatar('')}
                          />
                        ) : (
                          <span>{(name || user?.name || currentRole).charAt(0).toUpperCase()}</span>
                        )}
                      </div>

                      {uploadingAvatar && (
                        <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center text-white text-xs font-medium backdrop-blur-sm">
                          <RefreshCw className="w-5 h-5 animate-spin" />
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="space-y-2.5 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                          onChange={handleAvatarFileUpload}
                          className="hidden"
                          id="avatar-file-input"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingAvatar}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          {uploadingAvatar ? 'Uploading...' : 'Upload New Photo'}
                        </button>

                        {avatar && (
                          <button
                            type="button"
                            onClick={handleRemoveAvatar}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-neutral-800 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs font-medium hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove
                          </button>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 dark:text-neutral-400">
                        Supports PNG, JPG, WebP, SVG or GIF up to 5MB. Photo will be automatically optimized.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Profile Form */}
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-2">
                        Full Display Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="Your full name"
                        className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          value={email}
                          disabled
                          className="w-full pl-10 pr-24 py-2.5 text-sm bg-slate-100 dark:bg-neutral-800/50 border border-slate-200 dark:border-neutral-700 rounded-xl text-slate-500 dark:text-neutral-400 cursor-not-allowed"
                        />
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <span className="absolute right-3 top-2.5 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/40">
                          <Check className="w-3 h-3" /> Verified
                        </span>
                      </div>
                    </div>

                    {/* Role-specific fields */}
                    {currentRole === 'REQUESTER' && (
                      <>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-2">
                            Department / Business Unit
                          </label>
                          <input
                            type="text"
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            placeholder="e.g. Marketing Operations"
                            className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-2">
                            Contact Phone
                          </label>
                          <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+1 (555) 000-0000"
                            className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition"
                          />
                        </div>
                      </>
                    )}

                    {currentRole === 'DESIGNER' && (
                      <>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-2">
                            Design Specialty / Focus
                          </label>
                          <input
                            type="text"
                            value={specialty}
                            onChange={(e) => setSpecialty(e.target.value)}
                            placeholder="e.g. Social Media & Brand Identity"
                            className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-2">
                            Designer Code
                          </label>
                          <input
                            type="text"
                            disabled
                            value={user?.designerProfile?.designerCode || 'DES-001'}
                            className="w-full px-4 py-2.5 text-sm bg-slate-100 dark:bg-neutral-800/50 border border-slate-200 dark:border-neutral-700 rounded-xl text-slate-500 dark:text-neutral-400 cursor-not-allowed font-mono"
                          />
                        </div>
                      </>
                    )}

                    {currentRole === 'APPROVER' && (
                      <>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-2">
                            Executive Governance Title
                          </label>
                          <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Head of Creative Quality & Governance"
                            className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-2">
                            Governing Council / Committee
                          </label>
                          <input
                            type="text"
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            placeholder="e.g. Executive Brand Council"
                            className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition"
                          />
                        </div>
                      </>
                    )}

                    {currentRole === 'ADMIN' && (
                      <>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-2">
                            System Access Level
                          </label>
                          <input
                            type="text"
                            disabled
                            value="Super Admin (Root Organization Level)"
                            className="w-full px-4 py-2.5 text-sm bg-slate-100 dark:bg-neutral-800/50 border border-slate-200 dark:border-neutral-700 rounded-xl text-slate-500 dark:text-neutral-400 cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-2">
                            Account ID
                          </label>
                          <input
                            type="text"
                            disabled
                            value={user?.id || 'Root Admin'}
                            className="w-full px-4 py-2.5 text-xs bg-slate-100 dark:bg-neutral-800/50 border border-slate-200 dark:border-neutral-700 rounded-xl text-slate-500 dark:text-neutral-400 cursor-not-allowed font-mono"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-neutral-800">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 rounded-xl text-sm font-semibold shadow-sm transition disabled:opacity-50"
                    >
                      {saving ? 'Saving changes...' : 'Save Profile Changes'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 2: NOTIFICATIONS & ALERTS */}
            {activeTab === 'notifications' && (
              <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-8">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Notification & Sound Preferences</h2>
                  <p className="text-sm text-slate-500 dark:text-neutral-400 mt-0.5">
                    Customize your notification chime sound, volume level, quiet hours, and delivery channels.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* SECTION 1: NOTIFICATION SOUND TONE & VOLUME */}
                  <div className="p-5 bg-slate-50/80 dark:bg-neutral-900/60 border border-slate-200/80 dark:border-neutral-800 rounded-2xl space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          soundPrefs.enabled
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                            : 'bg-slate-200 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400'
                        }`}>
                          {soundPrefs.enabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            Notification Sound Chime
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-neutral-400">
                            Play an audible alert tone when new tasks, assignments, or revisions arrive.
                          </p>
                        </div>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={soundPrefs.enabled}
                          onChange={(e) => {
                            updateSoundPref('enabled', e.target.checked);
                            setNotifications({ ...notifications, soundAlerts: e.target.checked });
                            if (e.target.checked) unlockAudioContext();
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    {soundPrefs.enabled && (
                      <div className="space-y-4 pt-4 border-t border-slate-200/60 dark:border-neutral-800 animate-in fade-in duration-200">
                        {/* Notification Sound Tone Card */}
                        <div>
                          <div className="flex items-center justify-between mb-2.5">
                            <label className="text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider">
                              Notification Ringtone
                            </label>
                          </div>

                          <div className="p-3.5 rounded-xl border border-indigo-500/40 bg-indigo-50/70 dark:bg-indigo-950/40 dark:border-indigo-800/60 flex items-center justify-between shadow-xs">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                                <Volume2 className="w-4 h-4 text-amber-300" />
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
                                <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                                  Custom Apple Chime from Best Notification Tone
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handlePreviewSound('iphone_best')}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/80 rounded-lg text-xs font-bold transition shadow-xs"
                            >
                              <Play className={`w-3.5 h-3.5 ${isPlayingSoundPreview ? 'animate-ping' : ''}`} />
                              <span>{isPlayingSoundPreview ? 'Playing...' : 'Play Tone'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Volume Level */}
                        <div className="pt-2">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider">
                              Volume Level
                            </span>
                            <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono text-xs">
                              {soundPrefs.volume}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            {(['LOW', 'MEDIUM', 'HIGH'] as SoundVolume[]).map((vol) => (
                              <button
                                key={vol}
                                type="button"
                                onClick={() => {
                                  updateSoundPref('volume', vol);
                                  handlePreviewSound(soundPrefs.preset, vol);
                                }}
                                className={`py-1.5 px-3 rounded-xl font-bold text-xs border transition-all text-center ${
                                  soundPrefs.volume === vol
                                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                                    : 'bg-white dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 border-slate-200 dark:border-neutral-700 hover:bg-slate-50'
                                }`}
                              >
                                {vol}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Quiet Hours (Do Not Disturb) */}
                        <div className="pt-2 border-t border-slate-200/60 dark:border-neutral-800 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <Moon className="w-4 h-4 text-slate-500 dark:text-neutral-400" />
                            <div>
                              <span className="text-xs font-semibold text-slate-800 dark:text-neutral-200 block">
                                Quiet Hours (10:00 PM – 7:00 AM)
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-neutral-400">
                                Automatically silence sound alerts during night/focus hours
                              </span>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={soundPrefs.quietHours}
                            onChange={(e) => updateSoundPref('quietHours', e.target.checked)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SECTION 2: IN-APP DIRECT WORKFLOW NOTIFICATIONS */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                      In-App Direct Notifications
                    </h3>
                    
                    <div className="divide-y divide-slate-100 dark:divide-neutral-800 border border-slate-200 dark:border-neutral-800 rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between p-4 bg-white dark:bg-neutral-900 hover:bg-slate-50/50 dark:hover:bg-neutral-800/40 transition">
                        <div className="space-y-0.5 pr-4">
                          <p className="text-sm font-medium text-slate-900 dark:text-white">Request Status Transitions</p>
                          <p className="text-xs text-slate-500 dark:text-neutral-400">
                            Notify immediately when a creative request is assigned, in-progress, approved, or revised.
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifications.inAppStatusChanges}
                            onChange={(e) => setNotifications({ ...notifications, inAppStatusChanges: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900 dark:peer-checked:bg-white dark:peer-checked:after:bg-slate-900"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white dark:bg-neutral-900 hover:bg-slate-50/50 dark:hover:bg-neutral-800/40 transition">
                        <div className="space-y-0.5 pr-4">
                          <p className="text-sm font-medium text-slate-900 dark:text-white">Revision Notes & Annotations</p>
                          <p className="text-xs text-slate-500 dark:text-neutral-400">
                            Receive notifications when approvers or requesters post specific feedback notes on deliverables.
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifications.inAppFeedbackNotes}
                            onChange={(e) => setNotifications({ ...notifications, inAppFeedbackNotes: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900 dark:peer-checked:bg-white dark:peer-checked:after:bg-slate-900"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white dark:bg-neutral-900 hover:bg-slate-50/50 dark:hover:bg-neutral-800/40 transition">
                        <div className="space-y-0.5 pr-4">
                          <p className="text-sm font-medium text-slate-900 dark:text-white">Urgent SLA & Priority Alerts</p>
                          <p className="text-xs text-slate-500 dark:text-neutral-400">
                            High-priority banner alerts for requests approaching deadline within 24 hours.
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifications.inAppUrgentSLA}
                            onChange={(e) => setNotifications({ ...notifications, inAppUrgentSLA: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900 dark:peer-checked:bg-white dark:peer-checked:after:bg-slate-900"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: EMAIL & DESKTOP BROADCASTS */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                      Email & Desktop Broadcasts
                    </h3>
                    
                    <div className="divide-y divide-slate-100 dark:divide-neutral-800 border border-slate-200 dark:border-neutral-800 rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between p-4 bg-white dark:bg-neutral-900 hover:bg-slate-50/50 dark:hover:bg-neutral-800/40 transition">
                        <div className="space-y-0.5 pr-4">
                          <p className="text-sm font-medium text-slate-900 dark:text-white">Email Digest & Critical Dispatches</p>
                          <p className="text-xs text-slate-500 dark:text-neutral-400">
                            Send direct email for required actions (approvals pending, revision requested).
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifications.emailInstantAlerts}
                            onChange={(e) => setNotifications({ ...notifications, emailInstantAlerts: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900 dark:peer-checked:bg-white dark:peer-checked:after:bg-slate-900"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white dark:bg-neutral-900 hover:bg-slate-50/50 dark:hover:bg-neutral-800/40 transition">
                        <div className="space-y-0.5 pr-4">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-slate-900 dark:text-white">Browser Desktop Push</p>
                            {notifications.desktopPush && (
                              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded font-medium">Enabled</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-neutral-400">
                            Receive native OS notifications even when the browser tab is in background.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleRequestPushPermission}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-200 hover:bg-slate-200 dark:hover:bg-neutral-700 transition"
                        >
                          {notifications.desktopPush ? 'Test Push' : 'Enable Push'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-neutral-800">
                  <button
                    type="button"
                    onClick={handleSaveNotifications}
                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 rounded-xl text-sm font-semibold shadow-sm transition"
                  >
                    Save Notification & Sound Preferences
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: PERMISSIONS & ROLE PRIVILEGES */}
            {activeTab === 'permissions' && (
              <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Role Privileges & Access Matrix</h2>
                    <p className="text-sm text-slate-500 dark:text-neutral-400 mt-0.5">
                      Fine-grained capability scopes assigned to your enterprise account tier.
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-neutral-800 text-slate-800 dark:text-neutral-200 text-xs font-semibold">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Tier: {currentRole} Certified
                  </div>
                </div>

                {/* Permission Cards Grid */}
                <div className="grid grid-cols-1 gap-3">
                  {permissionsList.map((perm, idx) => (
                    <div
                      key={idx}
                      className="flex items-start justify-between p-4 bg-slate-50/60 dark:bg-neutral-900/50 border border-slate-200/80 dark:border-neutral-800 rounded-xl"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 font-mono">
                            {perm.scope}
                          </span>
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">
                            {perm.action}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-neutral-400">
                          {perm.desc}
                        </p>
                      </div>

                      <div className="flex-shrink-0 ml-4">
                        {perm.granted ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800/40">
                            <Check className="w-3.5 h-3.5" /> Allowed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 dark:text-neutral-500 bg-slate-100 dark:bg-neutral-800 px-2.5 py-1 rounded-md">
                            Restricted
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Developer API Key Section */}
                <div className="p-5 border border-slate-200 dark:border-neutral-800 rounded-xl bg-slate-50/50 dark:bg-neutral-900/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                        Personal Workspace Access Token
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                        Used for authenticated tab authorization and external webhook integrations.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`gpk_live_${user?.id || 'demo_key_9938'}_${Date.now()}`);
                        setApiKeyCopied(true);
                        setTimeout(() => setApiKeyCopied(false), 3000);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg text-xs font-medium text-slate-700 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-700 transition"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {apiKeyCopied ? 'Copied Token!' : 'Copy API Token'}
                    </button>
                  </div>
                  <div className="bg-slate-900 text-slate-200 dark:bg-neutral-950 dark:text-neutral-300 font-mono text-xs px-3.5 py-2.5 rounded-lg border border-slate-800 dark:border-neutral-800 truncate">
                    gpk_live_{user?.id ? user.id.replace(/-/g, '').slice(0, 24) : '••••••••••••••••••••••••'}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: SECURITY & SESSIONS */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                
                {/* Change Password Card */}
                <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Security & Password</h2>
                    <p className="text-sm text-slate-500 dark:text-neutral-400 mt-0.5">
                      Ensure your account is protected with a strong, complex passphrase.
                    </p>
                  </div>

                  <form onSubmit={handleUpdatePassword} className="space-y-5 max-w-xl">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter your current password"
                          className="w-full pl-4 pr-10 py-2.5 text-sm bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-300"
                        >
                          {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Minimum 6 characters"
                          className="w-full pl-4 pr-10 py-2.5 text-sm bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-300"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Password strength meter */}
                      {newPassword && (
                        <div className="mt-2.5 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 dark:text-neutral-400">Password Strength:</span>
                            <span className="font-semibold text-slate-800 dark:text-neutral-200">{strength.label}</span>
                          </div>
                          <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
                            <div className={`rounded-full ${strength.score >= 1 ? strength.color : 'bg-slate-200 dark:bg-neutral-700'}`} />
                            <div className={`rounded-full ${strength.score >= 2 ? strength.color : 'bg-slate-200 dark:bg-neutral-700'}`} />
                            <div className={`rounded-full ${strength.score >= 3 ? strength.color : 'bg-slate-200 dark:bg-neutral-700'}`} />
                            <div className={`rounded-full ${strength.score >= 4 ? strength.color : 'bg-slate-200 dark:bg-neutral-700'}`} />
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={saving || !currentPassword || !newPassword}
                        className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 rounded-xl text-sm font-semibold shadow-sm transition disabled:opacity-50"
                      >
                        {saving ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Active Sessions Card */}
                <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Active Device Sessions</h2>
                      <p className="text-sm text-slate-500 dark:text-neutral-400 mt-0.5">
                        Manage your active browser sessions and terminate other signed-in tabs.
                      </p>
                    </div>
                    {sessions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRevokeSession(undefined, true)}
                        className="px-3.5 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/40 transition"
                      >
                        Revoke All Other Sessions
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {sessions.map((sess) => {
                      const isCurrent = mounted && Boolean(currentTabSessionId) && sess.tabSessionId === currentTabSessionId;
                      return (
                        <div
                          key={sess.id}
                          className={`flex items-center justify-between p-4 rounded-xl border ${
                            isCurrent
                              ? 'bg-slate-50 dark:bg-neutral-800/40 border-slate-300 dark:border-neutral-700'
                              : 'bg-white dark:bg-neutral-900 border-slate-200 dark:border-neutral-800'
                          }`}
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300">
                              <Laptop className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                  {sess.userAgent ? sess.userAgent.split(' ')[0] : 'Web Browser Session'}
                                </span>
                                {isCurrent && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                                    Current Tab
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 dark:text-neutral-400 font-mono mt-0.5">
                                IP: {sess.ipAddress || '127.0.0.1'} • Last active: {new Date(sess.lastActivityAt || sess.createdAt).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>

                          {!isCurrent && (
                            <button
                              type="button"
                              onClick={() => handleRevokeSession(sess.id)}
                              className="text-xs font-medium text-rose-600 dark:text-rose-400 hover:underline"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: WORKSPACE & DISPLAY PREFERENCES */}
            {activeTab === 'preferences' && (
              <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-8">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Display & Workspace Preferences</h2>
                  <p className="text-sm text-slate-500 dark:text-neutral-400 mt-0.5">
                    Customize your regional timezone, date formatting, and default landing views.
                  </p>
                </div>

                <div className="space-y-6 max-w-xl">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-2">
                      Regional Timezone
                    </label>
                    <select
                      value={preferences.timezone}
                      onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition"
                    >
                      <option value="UTC+05:30 (IST - India Standard Time)">UTC+05:30 (IST - India Standard Time)</option>
                      <option value="UTC+00:00 (GMT - Greenwich Mean Time)">UTC+00:00 (GMT - Greenwich Mean Time)</option>
                      <option value="UTC-05:00 (EST - Eastern Standard Time)">UTC-05:00 (EST - Eastern Standard Time)</option>
                      <option value="UTC-08:00 (PST - Pacific Standard Time)">UTC-08:00 (PST - Pacific Standard Time)</option>
                      <option value="UTC+08:00 (SGT - Singapore Standard Time)">UTC+08:00 (SGT - Singapore Standard Time)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-2">
                      Date Display Format
                    </label>
                    <select
                      value={preferences.dateFormat}
                      onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition"
                    >
                      <option value="MMM D, YYYY">Oct 8, 2026 (MMM D, YYYY)</option>
                      <option value="YYYY-MM-DD">2026-10-08 (YYYY-MM-DD - ISO)</option>
                      <option value="DD/MM/YYYY">08/10/2026 (DD/MM/YYYY)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-2">
                      Default Startup View
                    </label>
                    <select
                      value={preferences.defaultLanding}
                      onChange={(e) => setPreferences({ ...preferences, defaultLanding: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition"
                    >
                      <option value="dashboard">Operations Dashboard</option>
                      {currentRole === 'REQUESTER' && <option value="new">Create New Requirement</option>}
                      {currentRole === 'DESIGNER' && <option value="assigned">My Assigned Tasks</option>}
                      {currentRole === 'APPROVER' && <option value="pending">Pending Approvals Queue</option>}
                    </select>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-neutral-800">
                    <button
                      type="button"
                      onClick={handleSavePreferences}
                      className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 rounded-xl text-sm font-semibold shadow-sm transition"
                    >
                      Save Workspace Preferences
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
