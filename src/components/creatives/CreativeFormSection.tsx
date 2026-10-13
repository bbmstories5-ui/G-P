'use client';

import React, { useRef, useState } from 'react';
import {
  Upload,
  User,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Phone,
  Mail,
  Globe,
  FileText,
  DollarSign,
  Shirt,
  Briefcase,
  Layers,
  FileDown,
  Users,
  CheckCircle2,
  Trash2,
  Plus,
  Cake,
} from 'lucide-react';

interface CreativeFormSectionProps {
  categoryCode: 'MEETING_ANNOUNCEMENT' | 'BUSINESS_PRESENTATION' | 'KYM' | 'BIRTHDAY';
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  membersList?: any[];
  onGenerateDocx?: (membersToExport: any[], month: string, group: string) => void;
  isGeneratingDocx?: boolean;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export default function CreativeFormSection({
  categoryCode,
  formData,
  setFormData,
  membersList = [],
  onGenerateDocx,
  isGeneratingDocx = false,
}: CreativeFormSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Handle generic field change
  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  // Handle Photo Upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError('');

    try {
      const data = new FormData();
      data.append('file', file);
      data.append('type', 'avatar');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: data,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to upload photo');
      }

      handleChange('photoUrl', json.url);
    } catch (err: any) {
      console.error('Upload error:', err);
      setUploadError(err.message || 'Photo upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Birthday Month change: auto-select first member in that month if available
  const handleMonthChange = (month: string) => {
    handleChange('birthMonth', month);
    const monthMembers = membersList.filter(
      (m) => m.birthMonth && m.birthMonth.toLowerCase() === month.toLowerCase()
    );
    if (monthMembers.length > 0) {
      const first = monthMembers[0];
      setFormData((prev: any) => ({
        ...prev,
        birthMonth: month,
        memberName: first.name,
        photoUrl: first.avatar || prev.photoUrl,
        phone: first.phone || prev.phone,
        birthDay: first.birthDay || '1st',
        referralGroupName: first.referralGroupName || prev.referralGroupName,
      }));
    }
  };

  // Member selection helper (for Birthday or KYM)
  const handleSelectMember = (member: any) => {
    setFormData((prev: any) => ({
      ...prev,
      memberName: member.name,
      companyName: member.company || prev.companyName,
      businessCategory: member.businessCategory || prev.businessCategory,
      phone: member.phone || prev.phone,
      email: member.email || prev.email,
      website: member.website || prev.website,
      photoUrl: member.avatar || prev.photoUrl,
      referralGroupName: member.referralGroupName || prev.referralGroupName,
      birthDay: member.birthDay || prev.birthDay,
      birthMonth: member.birthMonth || prev.birthMonth,
      specificAsk: member.specificAsk || prev.specificAsk,
    }));
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 md:p-6">
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            {categoryCode === 'MEETING_ANNOUNCEMENT' && 'Meeting Announcement Details'}
            {categoryCode === 'BUSINESS_PRESENTATION' && 'Business Presentation Details'}
            {categoryCode === 'KYM' && 'Know Your Member (KYM) Details'}
            {categoryCode === 'BIRTHDAY' && 'Monthly Birthday Creatives & Word Export'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Fields are auto-filled from your profile. Customize values anytime.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* ===================================================================
            A. REFERRAL MEETING ANNOUNCEMENT FORM
            =================================================================== */}
        {categoryCode === 'MEETING_ANNOUNCEMENT' && (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Referral Group Name *
              </label>
              <div className="relative">
                <Users className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={formData.referralGroupName || ''}
                  onChange={(e) => handleChange('referralGroupName', e.target.value)}
                  placeholder="e.g. Apex Chapter"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Date *
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.date || ''}
                    onChange={(e) => handleChange('date', e.target.value)}
                    placeholder="e.g. Wednesday, 16th October 2026"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Time *
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.time || ''}
                    onChange={(e) => handleChange('time', e.target.value)}
                    placeholder="e.g. 07:00 AM - 09:30 AM"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Venue *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={formData.venue || ''}
                  onChange={(e) => handleChange('venue', e.target.value)}
                  placeholder="e.g. Grand Ballroom, The Oberoi, Marine Drive"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Meeting Stimulant *
              </label>
              <div className="relative">
                <Sparkles className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <textarea
                  rows={2}
                  value={formData.meetingStimulant || ''}
                  onChange={(e) => handleChange('meetingStimulant', e.target.value)}
                  placeholder="e.g. Mastering High-Ticket Cross-Chapter Referrals"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all resize-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Dress Code
                </label>
                <div className="relative">
                  <Shirt className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.dressCode || ''}
                    onChange={(e) => handleChange('dressCode', e.target.value)}
                    placeholder="e.g. Business Formals"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Visitor Fees
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.visitorFees || ''}
                    onChange={(e) => handleChange('visitorFees', e.target.value)}
                    placeholder="e.g. ₹1,200 (Buffet Included)"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* ===================================================================
            B. BUSINESS PRESENTATION FORM
            =================================================================== */}
        {categoryCode === 'BUSINESS_PRESENTATION' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Referral Group Name *
                </label>
                <input
                  type="text"
                  value={formData.referralGroupName || ''}
                  onChange={(e) => handleChange('referralGroupName', e.target.value)}
                  placeholder="e.g. Apex Chapter"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Member Name *
                </label>
                <input
                  type="text"
                  value={formData.memberName || ''}
                  onChange={(e) => handleChange('memberName', e.target.value)}
                  placeholder="e.g. Vikram Patel"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            {/* Photo Upload Row */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Professional Photo Upload *
              </label>
              <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                {formData.photoUrl ? (
                  <img
                    src={formData.photoUrl}
                    alt="Preview"
                    className="w-16 h-16 rounded-full object-cover border-2 border-amber-500 shadow-sm"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                    <User className="w-8 h-8" />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploading ? 'Uploading...' : 'Choose Headshot Photo'}</span>
                  </button>
                  <p className="text-[11px] text-slate-500 mt-1">
                    PNG, JPG, or WebP up to 5MB. Automatically cropped to fit.
                  </p>
                  {uploadError && <p className="text-xs text-rose-600 mt-1">{uploadError}</p>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={formData.companyName || ''}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  placeholder="e.g. Apex Architectural Solutions"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Business Category *
                </label>
                <input
                  type="text"
                  value={formData.businessCategory || ''}
                  onChange={(e) => handleChange('businessCategory', e.target.value)}
                  placeholder="e.g. Commercial Architecture"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mobile Number *
                </label>
                <input
                  type="text"
                  value={formData.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+91 97123 55667"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email ID
                </label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="name@company.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Website
                </label>
                <input
                  type="text"
                  value={formData.website || ''}
                  onChange={(e) => handleChange('website', e.target.value)}
                  placeholder="www.company.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Specific Ask (Ideal Referrals) *
              </label>
              <textarea
                rows={2}
                value={formData.specificAsk || ''}
                onChange={(e) => handleChange('specificAsk', e.target.value)}
                placeholder="e.g. Warm introductions to Commercial Builders, Coworking Spaces & Real Estate Developers in BKC"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Date
                </label>
                <input
                  type="text"
                  value={formData.date || ''}
                  onChange={(e) => handleChange('date', e.target.value)}
                  placeholder="Wed, 16th Oct 2026"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Time
                </label>
                <input
                  type="text"
                  value={formData.time || ''}
                  onChange={(e) => handleChange('time', e.target.value)}
                  placeholder="08:15 AM - 08:30 AM"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Venue
                </label>
                <input
                  type="text"
                  value={formData.venue || ''}
                  onChange={(e) => handleChange('venue', e.target.value)}
                  placeholder="The Oberoi, Marine Drive"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>
          </>
        )}

        {/* ===================================================================
            C. KYM (KNOW YOUR MEMBER) FORM
            =================================================================== */}
        {categoryCode === 'KYM' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Referral Group Name *
                </label>
                <input
                  type="text"
                  value={formData.referralGroupName || ''}
                  onChange={(e) => handleChange('referralGroupName', e.target.value)}
                  placeholder="e.g. Apex Chapter"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Member Name *
                </label>
                <input
                  type="text"
                  value={formData.memberName || ''}
                  onChange={(e) => handleChange('memberName', e.target.value)}
                  placeholder="e.g. Dr. Sneha Desai"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Professional Photo Upload *
              </label>
              <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                {formData.photoUrl ? (
                  <img
                    src={formData.photoUrl}
                    alt="Preview"
                    className="w-16 h-16 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                    <User className="w-8 h-8" />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploading ? 'Uploading...' : 'Choose Headshot Photo'}</span>
                  </button>
                  <p className="text-[11px] text-slate-500 mt-1">High-resolution portrait recommended.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={formData.companyName || ''}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  placeholder="e.g. Desai Multispeciality Dental"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Business Category *
                </label>
                <input
                  type="text"
                  value={formData.businessCategory || ''}
                  onChange={(e) => handleChange('businessCategory', e.target.value)}
                  placeholder="e.g. Cosmetic & Implant Dentistry"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mobile Number *
                </label>
                <input
                  type="text"
                  value={formData.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+91 98765 44332"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Date
                </label>
                <input
                  type="text"
                  value={formData.date || ''}
                  onChange={(e) => handleChange('date', e.target.value)}
                  placeholder="Wed, 16th Oct 2026"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Time
                </label>
                <input
                  type="text"
                  value={formData.time || ''}
                  onChange={(e) => handleChange('time', e.target.value)}
                  placeholder="07:00 AM Onwards"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Venue
              </label>
              <input
                type="text"
                value={formData.venue || ''}
                onChange={(e) => handleChange('venue', e.target.value)}
                placeholder="Grand Ballroom, The Oberoi"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
            </div>
          </>
        )}

        {/* ===================================================================
            D. BIRTHDAY CREATIVE & WORD FORMAT ROSTER
            =================================================================== */}
        {categoryCode === 'BIRTHDAY' && (
          <>
            {/* Output Mode Selector: Single Member vs Monthly Roster */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  handleChange('monthlyMembers', []);
                }}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  (!formData.monthlyMembers || formData.monthlyMembers.length === 0)
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🎂 Single Birthday Creative
              </button>
              <button
                type="button"
                onClick={() => {
                  const month = formData.birthMonth || 'October';
                  const monthMembers = membersList.filter(
                    (m) => m.birthMonth && m.birthMonth.toLowerCase() === month.toLowerCase()
                  );
                  handleChange('monthlyMembers', monthMembers);
                }}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  formData.monthlyMembers && formData.monthlyMembers.length > 0
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                👥 Monthly Birthday Directory ({membersList.filter(
                  (m) => m.birthMonth && m.birthMonth.toLowerCase() === (formData.birthMonth || 'October').toLowerCase()
                ).length} Celebrants)
              </button>
            </div>

            {/* Month Selector Bar */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">
                    Select Birthday Month *
                  </label>
                  <p className="text-xs text-amber-800/80">
                    Filters authorized member records from database and arranges monthly graphics & Word (.docx) roster.
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={formData.birthMonth || 'October'}
                    onChange={(e) => {
                      handleMonthChange(e.target.value);
                      if (formData.monthlyMembers && formData.monthlyMembers.length > 0) {
                        const mList = membersList.filter(
                          (m) => m.birthMonth && m.birthMonth.toLowerCase() === e.target.value.toLowerCase()
                        );
                        handleChange('monthlyMembers', mList);
                      }
                    }}
                    className="px-3.5 py-2 bg-white border border-amber-300 rounded-lg text-sm font-semibold text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {MONTHS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>

                  {/* Word Format Export Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (onGenerateDocx) {
                        const month = formData.birthMonth || 'October';
                        const monthMembers = membersList.filter(
                          (m) => m.birthMonth && m.birthMonth.toLowerCase() === month.toLowerCase()
                        );
                        const listToExport =
                          monthMembers.length > 0
                            ? monthMembers
                            : [
                                {
                                  name: formData.memberName || 'Member',
                                  birthDay: formData.birthDay || '15th',
                                  phone: formData.phone || '',
                                  company: formData.companyName || '',
                                  businessCategory: formData.businessCategory || '',
                                  birthdayWish: formData.birthdayWish || '',
                                },
                              ];
                        onGenerateDocx(listToExport, month, formData.referralGroupName || 'Apex Chapter');
                      }
                    }}
                    disabled={isGeneratingDocx}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all whitespace-nowrap"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>{isGeneratingDocx ? 'Generating Word...' : 'Download Word (.docx)'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Select Member from Selected Month */}
            {membersList.length > 0 && (!formData.monthlyMembers || formData.monthlyMembers.length === 0) && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Celebrant for {formData.birthMonth || 'October'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {membersList
                    .filter(
                      (m) =>
                        m.birthMonth &&
                        m.birthMonth.toLowerCase() === (formData.birthMonth || 'October').toLowerCase()
                    )
                    .map((m) => {
                      const isSelected = formData.memberName === m.name;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => handleSelectMember(m)}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            isSelected
                              ? 'bg-amber-100 text-amber-900 border-amber-400 font-semibold shadow-xs'
                              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          <Cake className="w-3.5 h-3.5 text-amber-600" />
                          <span>
                            {m.name} ({m.birthDay})
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Referral Group Name *
                </label>
                <input
                  type="text"
                  value={formData.referralGroupName || ''}
                  onChange={(e) => handleChange('referralGroupName', e.target.value)}
                  placeholder="Apex Chapter"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Member Name *
                </label>
                <input
                  type="text"
                  value={formData.memberName || ''}
                  onChange={(e) => handleChange('memberName', e.target.value)}
                  placeholder="e.g. Amit Sharma"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Professional Photo Upload *
              </label>
              <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                {formData.photoUrl ? (
                  <img
                    src={formData.photoUrl}
                    alt="Preview"
                    className="w-16 h-16 rounded-full object-cover border-2 border-red-500 shadow-sm"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                    <User className="w-8 h-8" />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploading ? 'Uploading...' : 'Choose Celebrant Photo'}</span>
                  </button>
                  <p className="text-[11px] text-slate-500 mt-1">High-quality portrait for celebratory card.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Birthday Date *
                </label>
                <input
                  type="text"
                  value={formData.birthDay || ''}
                  onChange={(e) => handleChange('birthDay', e.target.value)}
                  placeholder="e.g. 15th"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mobile Number
                </label>
                <input
                  type="text"
                  value={formData.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+91 98250 11223"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Personalized Birthday Wish *
              </label>
              <textarea
                rows={2}
                value={formData.birthdayWish || ''}
                onChange={(e) => handleChange('birthdayWish', e.target.value)}
                placeholder="Wishing you a magnificent year filled with boundless success, good health and prosperity on your special day!"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all resize-none"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
