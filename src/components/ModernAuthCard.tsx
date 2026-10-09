'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Eye,
  EyeOff,
  X,
  Mail,
  Lock,
  AlertCircle,
  Check,
} from 'lucide-react';
import { getTabSessionId, saveTabAuth } from '@/lib/tabAuth';

interface ModernAuthCardProps {
  onClose?: () => void;
  initialRole?: string;
}

export default function ModernAuthCard({
  onClose,
  initialRole,
}: ModernAuthCardProps) {
  const router = useRouter();

  const [mode, setMode] = useState<'signin' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);

    try {
      const tabSessionId = getTabSessionId();
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password, tabSessionId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid email or password');
      }

      // Save tab-isolated authentication state
      if (data.token) {
        saveTabAuth(data.token, data.user, data.tabSessionId);
      }

      // Automatically redirect based on user role with user-scoped URL
      if (data.redirectUrl) {
        router.push(data.redirectUrl);
      } else {
        const userKey = data.user?.email ? data.user.email.split('@')[0].toLowerCase() : '';
        const role = data.user?.role;
        if (role === 'ADMIN') router.push('/admin/dashboard?u=admin');
        else if (role === 'APPROVER') router.push('/approver/dashboard?u=approver');
        else if (role === 'DESIGNER') router.push(`/designer/dashboard?u=${userKey}`);
        else router.push(`/requester/dashboard?u=${userKey}`);
      }

      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your account email');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setForgotSuccess(true);
    }, 1000);
  };

  // Video source: switches when in forgot password mode
  const currentVideoSrc =
    mode === 'forgot'
      ? '/videos/forgot-password.mp4'
      : '/videos/login-animation.mp4';

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Outer Pill Card */}
      <div className="bg-[#FAF9F5] text-slate-800 rounded-[36px] shadow-[0_25px_70px_rgba(0,0,0,0.18)] border border-white/80 overflow-hidden relative backdrop-blur-xl">
        {/* Top-Right Close Button (if close handler provided) */}
        {onClose && (
          <div className="absolute top-6 right-8 z-30">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-sm hover:bg-white text-slate-600 hover:text-slate-900 transition-all flex items-center justify-center cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main Grid: Form Left, Clean Video Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
          {/* Left Column (5.5 / 12): Form */}
          <div className="lg:col-span-6 p-8 md:p-12 lg:p-14 flex flex-col justify-between">
            <div className="my-auto py-4">
              {/* Form Title & Subtitle */}
              <div className="mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                  {mode === 'forgot' ? 'Forgot Password' : 'Sign in to account'}
                </h2>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  {mode === 'forgot'
                    ? 'Enter your account email to receive a recovery link'
                    : 'Enter your corporate credentials to access portal'}
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* FORGOT PASSWORD FORM */}
              {mode === 'forgot' ? (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  {forgotSuccess ? (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 space-y-2">
                      <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                        <Check className="w-4 h-4" /> Reset link dispatched!
                      </div>
                      <p>
                        A recovery link has been dispatched to <strong>{email}</strong>. (Default credentials for testing: <code>password123</code>).
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setMode('signin');
                          setForgotSuccess(false);
                        }}
                        className="mt-2 text-xs font-bold text-emerald-700 underline cursor-pointer"
                      >
                        Return to Sign in &rarr;
                      </button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1.5 ml-3">
                          Email
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@company.com"
                            className="w-full pl-4 pr-10 py-3.5 bg-[#F0EDE6] border border-transparent focus:border-amber-400 focus:bg-white rounded-full text-xs font-semibold text-slate-900 focus:outline-none transition-all shadow-inner"
                          />
                          <Mail className="w-4 h-4 text-slate-400 absolute right-4 top-3.5" />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 px-6 bg-[#F6C744] hover:bg-[#ebbb38] text-slate-950 font-bold text-xs rounded-full shadow-[0_4px_16px_rgba(246,199,68,0.35)] hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                      >
                        {loading ? 'Sending Link...' : 'Submit'}
                      </button>

                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => setMode('signin')}
                          className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                        >
                          &larr; Back to Sign in
                        </button>
                      </div>
                    </>
                  )}
                </form>
              ) : (
                /* MAIN LOGIN / SIGN IN FORM */
                <form onSubmit={handleLogin} className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1 ml-3">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3.5 bg-[#F0EDE6] border border-transparent focus:border-amber-400 focus:bg-white rounded-full text-xs font-semibold text-slate-900 focus:outline-none transition-all shadow-inner"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1 ml-3 mr-3">
                      <label className="text-[11px] font-semibold text-slate-500">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setMode('forgot')}
                        className="text-[11px] font-bold text-amber-700 hover:text-amber-800 transition-colors cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-4 pr-10 py-3.5 bg-[#F0EDE6] border border-transparent focus:border-amber-400 focus:bg-white rounded-full text-xs font-semibold text-slate-900 focus:outline-none transition-all shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-6 bg-[#F6C744] hover:bg-[#ebbb38] text-slate-950 font-bold text-xs rounded-full shadow-[0_4px_16px_rgba(246,199,68,0.35)] hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 mt-3 cursor-pointer"
                  >
                    {loading ? 'Authenticating...' : 'Submit'}
                  </button>
                </form>
              )}
            </div>

            {/* Bottom Footer */}
            <div className="pt-6 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span>Creative Flow Enterprise Portal</span>
              <span>Terms &amp; Conditions</span>
            </div>
          </div>

          {/* Right Column (6 / 12): Pure Clean Video Animation */}
          <div className="lg:col-span-6 p-4 lg:p-6 flex items-center justify-center">
            <div className="w-full h-full min-h-[460px] lg:min-h-[520px] rounded-[30px] overflow-hidden relative shadow-sm bg-white border border-slate-200/70 flex items-center justify-center p-4">
              {/* Clean Active Video Animation (Seamlessly Blended) */}
              <video
                ref={videoRef}
                key={currentVideoSrc}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-contain mix-blend-multiply transition-all duration-700"
              >
                <source src={currentVideoSrc} type="video/mp4" />
                Your browser does not support video playback.
              </video>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
