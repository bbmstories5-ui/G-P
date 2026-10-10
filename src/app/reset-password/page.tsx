'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Lock, Check, AlertCircle, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Missing recovery token. Please request a new password recovery link.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password. Please try again.');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred while resetting your password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Outer Pill Card */}
      <div className="bg-[#FAF9F5] text-slate-800 rounded-[32px] md:rounded-[36px] shadow-[0_25px_70px_rgba(0,0,0,0.18)] border border-white/80 overflow-hidden relative backdrop-blur-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
          {/* Left Column: Form */}
          <div className="lg:col-span-6 p-8 md:p-12 lg:p-14 flex flex-col justify-between">
            <div className="my-auto py-4">
              {/* Header */}
              <div className="mb-8">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold tracking-wide uppercase mb-3">
                  <KeyRound className="w-3 h-3 text-amber-700" /> Account Security
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                  Set New Password
                </h2>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Enter your new password below to regain access to Creative Portal
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Missing Token Warning */}
              {!token && !success && (
                <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-3">
                  <div className="font-bold flex items-center gap-1.5 text-amber-800">
                    <AlertCircle className="w-4 h-4 text-amber-600" /> Invalid or Missing Link
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    No recovery token was found in the URL. Please use the link sent to your email or request a new one.
                  </p>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800 underline"
                  >
                    Go to Login & Request Link &rarr;
                  </Link>
                </div>
              )}

              {/* SUCCESS VIEW */}
              {success ? (
                <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-3xl text-xs text-emerald-950 space-y-4 animate-in fade-in zoom-in-95">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
                    <Check className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-emerald-900 mb-1">
                      Password Updated Successfully!
                    </h3>
                    <p className="text-slate-600 text-xs leading-relaxed">
                      Your account password has been safely updated. You can now sign in with your new credentials.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push('/login')}
                    className="w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-full shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Proceed to Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* FORM */
                token && (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* New Password */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1.5 ml-3">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          placeholder="At least 6 characters"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-4 pr-11 py-3.5 bg-[#F0EDE6] border border-transparent focus:border-amber-400 focus:bg-white rounded-full text-xs font-semibold text-slate-900 focus:outline-none transition-all shadow-inner"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1.5 ml-3">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          placeholder="Re-enter your password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full pl-4 pr-11 py-3.5 bg-[#F0EDE6] border border-transparent focus:border-amber-400 focus:bg-white rounded-full text-xs font-semibold text-slate-900 focus:outline-none transition-all shadow-inner"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full mt-2 py-3.5 px-6 bg-[#F6C744] hover:bg-[#ebbb38] text-slate-950 font-bold text-xs rounded-full shadow-[0_4px_16px_rgba(246,199,68,0.35)] hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <span>Updating Password...</span>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>Update Password & Save</span>
                        </>
                      )}
                    </button>

                    <div className="text-center pt-3">
                      <Link
                        href="/login"
                        className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                      >
                        &larr; Return to Sign In
                      </Link>
                    </div>
                  </form>
                )
              )}
            </div>

            {/* Bottom Security Footer */}
            <div className="pt-6 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
              <span>256-Bit Encrypted Portal</span>
              <span>Creative Flow Enterprise</span>
            </div>
          </div>

          {/* Right Column: Visual Video Container */}
          <div className="lg:col-span-6 bg-[#EBE7DF] p-6 lg:p-8 flex items-center justify-center border-t lg:border-t-0 lg:border-l border-slate-200/60">
            <div className="w-full h-full min-h-[380px] lg:min-h-[480px] rounded-[28px] overflow-hidden bg-slate-950 relative flex items-center justify-center shadow-lg">
              <video
                src="/videos/forgot-password.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex flex-col justify-end p-8 text-white">
                <span className="text-[10px] font-bold tracking-widest text-amber-400 uppercase">
                  Account Protection
                </span>
                <h3 className="text-lg font-bold mt-1">Multi-Tier Security Protocol</h3>
                <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                  Session token isolation and end-to-end credential integrity for Creative Flow Enterprise.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#D6DCE5] bg-gradient-to-br from-[#E4E8EE] via-[#D5DBE5] to-[#C8CFDC] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Background Soft Glows */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <Suspense
        fallback={
          <div className="text-xs font-semibold text-slate-600 bg-white/80 backdrop-blur-md px-6 py-4 rounded-full shadow-lg">
            Loading secure reset interface...
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
