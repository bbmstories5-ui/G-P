'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  Upload,
  User,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  Globe,
  FileText,
  DollarSign,
  Shirt,
  Briefcase,
  Layers,
  FileDown,
  CheckCircle2,
  Trash2,
  Plus,
  Cake,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Shield,
  HelpCircle,
  Eye,
  Users,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface DynamicMemberFormProps {
  template: any;
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  userProfile?: any;
  onProceedToPreview: () => void;
  onBackToTemplates: () => void;
  membersList?: any[];
  onGenerateDocx?: (membersToExport: any[], month: string, group: string) => void;
  isGeneratingDocx?: boolean;
  onOpenBulkModal?: () => void;
  templateElements?: any[];
  onElementsChange?: (elements: any[]) => void;
}

export default function DynamicMemberForm({
  template,
  formData,
  setFormData,
  userProfile,
  onProceedToPreview,
  onBackToTemplates,
  membersList = [],
  onGenerateDocx,
  isGeneratingDocx = false,
  onOpenBulkModal,
  templateElements = [],
  onElementsChange,
}: DynamicMemberFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // 1. Identify which fields are configured by Super Admin for this specific template
  const configuredElements = (template?.elements || []).filter(
    (el: any) =>
      (el.elementType === 'DYNAMIC_FIELD' || el.elementType === 'MEMBER_PHOTO') &&
      !el.isLocked
  );

  // Reset fieldFontSizes when template changes so font adjustments in one template NEVER leak into another template
  const prevTemplateIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (template?.id) {
      if (prevTemplateIdRef.current && prevTemplateIdRef.current !== template.id) {
        setFormData((prev: any) => ({
          ...prev,
          fieldFontSizes: {},
        }));
      }
      prevTemplateIdRef.current = template.id;
    }
  }, [template?.id, setFormData]);

  // If no dynamic elements were explicitly saved, fall back to standard category fields
  const useFallbackCategory = configuredElements.length === 0;

  // Handle Input Changes
  const handleChange = (fieldKey: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [fieldKey]: value,
      customFields: {
        ...(prev.customFields || {}),
        [fieldKey]: value,
      },
    }));

    if (validationErrors[fieldKey]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[fieldKey];
        return next;
      });
    }
  };

  // Adjust Field Font Size (Small A- vs Big A+)
  const handleAdjustFontSize = (fieldKey: string, delta: number) => {
    const matchingEl = (templateElements.length > 0 ? templateElements : configuredElements).find(
      (e: any) => e.fieldKey === fieldKey || e.id === fieldKey || e.name === fieldKey
    );
    const currentSize = formData?.fieldFontSizes?.[fieldKey] ?? matchingEl?.fontSize ?? 24;
    const nextSize = Math.max(10, Math.min(96, currentSize + delta));

    // 1. Store in formData.fieldFontSizes
    setFormData((prev: any) => ({
      ...prev,
      fieldFontSizes: {
        ...(prev.fieldFontSizes || {}),
        [fieldKey]: nextSize,
      },
    }));

    // 2. Update templateElements so live canvas instantly updates
    if (onElementsChange && templateElements && templateElements.length > 0) {
      const updated = templateElements.map((item: any) => {
        if (item.fieldKey === fieldKey || item.id === fieldKey || item.name === fieldKey) {
          return { ...item, fontSize: nextSize };
        }
        return item;
      });
      onElementsChange(updated);
    }
  };

  // Photo Upload Handler
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
      if (!res.ok || !json.url) {
        throw new Error(json.error || 'Failed to upload photo');
      }

      handleChange('photoUrl', json.url);
    } catch (err: any) {
      console.error('Photo upload failed:', err);
      setUploadError(err.message || 'Upload failed. Please try a valid PNG or JPG.');
    } finally {
      setIsUploading(false);
    }
  };

  // Validate only the configured fields
  const handleValidateAndProceed = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (useFallbackCategory) {
      const catCode = template?.category?.code;
      if (catCode === 'BUSINESS_PRESENTATION' || catCode === 'KYM') {
        if (!formData.memberName?.trim()) errors.memberName = 'Member Name is required.';
        if (!formData.companyName?.trim()) errors.companyName = 'Company Name is required.';
      } else if (catCode === 'MEETING_ANNOUNCEMENT') {
        if (!formData.date?.trim()) errors.date = 'Meeting Date is required.';
        if (!formData.venue?.trim()) errors.venue = 'Venue Location is required.';
      } else if (catCode === 'BIRTHDAY') {
        if (!formData.memberName?.trim()) errors.memberName = 'Birthday Member Name is required.';
      }
    } else {
      configuredElements.forEach((el: any) => {
        const key = el.fieldKey || el.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        if (el.isRequired) {
          const val = formData[key] || formData.customFields?.[key];
          if (!val || (typeof val === 'string' && !val.trim())) {
            errors[key] = `${el.name} is required by template designer.`;
          }
        }
      });
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    onProceedToPreview();
  };

  // Helper to determine field input type
  const renderFieldInput = (el: any) => {
    const key = el.fieldKey || el.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const label = el.name || key;
    const isRequired = el.isRequired !== false;
    const error = validationErrors[key];
    const value =
      formData[key] !== undefined
        ? formData[key]
        : formData.customFields?.[key] !== undefined
        ? formData.customFields[key]
        : el.defaultValue || '';

    // A. Photo Upload with remove.bg guidance
    if (el.elementType === 'MEMBER_PHOTO' || key === 'photoUrl') {
      return (
        <div key={key} className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <User className="w-4 h-4 text-blue-600" />
              <span>{label}</span>
              {isRequired && <span className="text-rose-500">*</span>}
            </label>
            <span className="text-[10px] text-slate-400">Positioned automatically by template</span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-1">
            {/* Checkerboard container for transparent PNG preview */}
            <div className="w-20 h-20 rounded-2xl border-2 border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-xs relative bg-white bg-[linear-gradient(45deg,#f1f5f9_25%,transparent_25%),linear-gradient(-45deg,#f1f5f9_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f1f5f9_75%),linear-gradient(-45deg,transparent_75%,#f1f5f9_75%)] bg-[size:10px_10px]">
              {formData.photoUrl ? (
                <img
                  src={formData.photoUrl}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              ) : (
                <User className="w-8 h-8 text-slate-300" />
              )}
            </div>

            <div className="flex-1 space-y-2.5 w-full">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploading ? 'Uploading...' : 'Upload Professional Photo'}</span>
                </button>

                {userProfile?.avatar && userProfile.avatar !== formData.photoUrl && (
                  <button
                    type="button"
                    onClick={() => handleChange('photoUrl', userProfile.avatar)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    Use Profile Photo
                  </button>
                )}

                {formData.photoUrl && (
                  <button
                    type="button"
                    onClick={() => handleChange('photoUrl', '')}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Remove Photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Remove.bg Helper Guide Banner */}
              <div className="p-3 bg-gradient-to-r from-blue-50/80 to-indigo-50/60 border border-blue-200/80 rounded-xl space-y-1.5 text-xs text-slate-700">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 font-bold text-blue-900">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>How to get a 100% clean transparent background:</span>
                  </div>
                  <a
                    href="https://www.remove.bg/upload"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shadow-2xs transition-colors shrink-0"
                  >
                    <span>Open remove.bg</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <ol className="text-[11px] text-slate-600 space-y-0.5 list-decimal list-inside pl-0.5">
                  <li>Open <strong>remove.bg</strong> and upload your photo</li>
                  <li>Click <strong>Download</strong> to get the clean transparent cutout (PNG)</li>
                  <li>Click <strong>Upload Professional Photo</strong> above to insert your transparent cutout!</li>
                </ol>
              </div>

              {uploadError && <p className="text-xs text-rose-600 font-semibold">{uploadError}</p>}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </div>
      );
    }

    // Helper to get current font size for this field
    const matchingEl = (templateElements.length > 0 ? templateElements : configuredElements).find(
      (e: any) => e.fieldKey === key || e.id === el?.id || e.name === label
    );
    const baseSize = matchingEl?.initialFontSize || matchingEl?.fontSize || el?.fontSize || 24;
    const currentFontSize = formData?.fieldFontSizes?.[key] ?? matchingEl?.fontSize ?? baseSize;

    // Render Font Size Controls (Big / Small)
    const renderFontSizeControls = () => (
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="flex items-center bg-slate-100 border border-slate-200/90 rounded-lg p-0.5 shadow-2xs">
          <button
            type="button"
            onClick={() => handleAdjustFontSize(key, -2)}
            className="px-2 py-0.5 rounded-md text-slate-700 hover:text-slate-900 hover:bg-white text-[11px] font-bold transition-all flex items-center gap-0.5 active:scale-95"
            title="Make Text Smaller (A-)"
          >
            <span className="text-xs">A-</span>
            <span className="text-[9px] font-medium hidden sm:inline">Small</span>
          </button>
          <span className="text-[10px] font-mono font-bold text-blue-700 px-1.5 min-w-[34px] text-center bg-white rounded shadow-2xs py-0.5">
            {currentFontSize}px
          </span>
          <button
            type="button"
            onClick={() => handleAdjustFontSize(key, +2)}
            className="px-2 py-0.5 rounded-md text-slate-700 hover:text-slate-900 hover:bg-white text-[11px] font-bold transition-all flex items-center gap-0.5 active:scale-95"
            title="Make Text Bigger (A+)"
          >
            <span className="text-xs">A+</span>
            <span className="text-[9px] font-medium hidden sm:inline">Big</span>
          </button>
        </div>
      </div>
    );

    // B. Multiline Text (e.g. Specific Ask, Topic, Wording, or Elements configured with maxLines > 1)
    if (
      key === 'specificAsk' ||
      key === 'meetingStimulant' ||
      key === 'birthdayWish' ||
      el.maxLines > 1
    ) {
      return (
        <div key={key} className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-bold text-slate-800 min-w-0 truncate">
              {label} {isRequired && <span className="text-rose-500">*</span>}
            </label>
            {renderFontSizeControls()}
          </div>
          <textarea
            rows={3}
            value={value}
            onChange={(e) => handleChange(key, e.target.value)}
            placeholder={`Enter ${label.toLowerCase()}... (Press Enter to write on next line)`}
            className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
              error ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-200'
            }`}
          />
          <p className="text-[10px] text-slate-400">Press Enter in text to write on next line</p>
          {error && <p className="text-[11px] text-rose-600 font-semibold">{error}</p>}
        </div>
      );
    }

    // C. Date or Time
    if (key === 'date' || key === 'time') {
      return (
        <div key={key} className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1 min-w-0 truncate">
              {key === 'date' ? <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" /> : <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
              <span className="truncate">{label}</span> {isRequired && <span className="text-rose-500">*</span>}
            </label>
            {renderFontSizeControls()}
          </div>
          <textarea
            rows={2}
            value={value}
            onChange={(e) => handleChange(key, e.target.value)}
            placeholder={key === 'date' ? 'e.g. Wednesday,\n16th October 2026' : 'e.g. 07:00 AM -\n09:30 AM'}
            className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
              error ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-200'
            }`}
          />
          <p className="text-[10px] text-slate-400">Press Enter in text to write on next line</p>
          {error && <p className="text-[11px] text-rose-600 font-semibold">{error}</p>}
        </div>
      );
    }

    // D. Phone Number
    if (key === 'phone') {
      return (
        <div key={key} className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1 min-w-0 truncate">
              <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate">{label}</span> {isRequired && <span className="text-rose-500">*</span>}
            </label>
            {renderFontSizeControls()}
          </div>
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(key, e.target.value)}
            placeholder="+91 98250 11223"
            className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
              error ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-200'
            }`}
          />
          {error && <p className="text-[11px] text-rose-600 font-semibold">{error}</p>}
        </div>
      );
    }

    // E. Email Address
    if (key === 'email') {
      return (
        <div key={key} className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1 min-w-0 truncate">
              <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate">{label}</span> {isRequired && <span className="text-rose-500">*</span>}
            </label>
            {renderFontSizeControls()}
          </div>
          <input
            type="email"
            value={value}
            onChange={(e) => handleChange(key, e.target.value)}
            placeholder="member@company.com"
            className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
              error ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-200'
            }`}
          />
          {error && <p className="text-[11px] text-rose-600 font-semibold">{error}</p>}
        </div>
      );
    }

    // F. Venue Location
    if (key === 'venue') {
      return (
        <div key={key} className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1 min-w-0 truncate">
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate">{label}</span> {isRequired && <span className="text-rose-500">*</span>}
            </label>
            {renderFontSizeControls()}
          </div>
          <textarea
            rows={2}
            value={value}
            onChange={(e) => handleChange(key, e.target.value)}
            placeholder="e.g. Grand Ballroom,\nThe Oberoi, Marine Drive"
            className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
              error ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-200'
            }`}
          />
          <p className="text-[10px] text-slate-400">Press Enter in text to write on next line</p>
          {error && <p className="text-[11px] text-rose-600 font-semibold">{error}</p>}
        </div>
      );
    }

    // G. Default Text (Supports Multiline + Font Size)
    return (
      <div key={key} className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1 min-w-0 truncate">
            <span className="truncate">{label}</span> {isRequired && <span className="text-rose-500">*</span>}
          </label>
          {renderFontSizeControls()}
        </div>
        <textarea
          rows={2}
          value={value}
          onChange={(e) => handleChange(key, e.target.value)}
          placeholder={`Enter ${label.toLowerCase()}... (Press Enter to write on next line)`}
          className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
            error ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-200'
          }`}
        />
        <p className="text-[10px] text-slate-400">Press Enter in text to write on next line</p>
        {error && <p className="text-[11px] text-rose-600 font-semibold">{error}</p>}
      </div>
    );
  };

  return (
    <form onSubmit={handleValidateAndProceed} className="space-y-6">
      {/* Main Dynamic Fields Container */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Enter Your Information</h3>
            <span className="text-[11px] font-semibold text-slate-500">
              * Indicates required fields
            </span>
          </div>

          {onOpenBulkModal && (
            <button
              type="button"
              onClick={onOpenBulkModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all shadow-2xs"
              title="Add bulk members and generate multiple creatives at once"
            >
              <Users className="w-3.5 h-3.5" />
              <span>⚡ Bulk Member Details & Generate</span>
            </button>
          )}
        </div>

        {useFallbackCategory ? (
          /* Fallback when template has no custom elements */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {renderFieldInput({ name: 'Member Name', fieldKey: 'memberName', isRequired: true })}
            {renderFieldInput({ name: 'Professional Photo', fieldKey: 'photoUrl', elementType: 'MEMBER_PHOTO' })}
            {renderFieldInput({ name: 'Company Name', fieldKey: 'companyName', isRequired: true })}
            {renderFieldInput({ name: 'Business Category', fieldKey: 'businessCategory' })}
            {renderFieldInput({ name: 'Mobile Number', fieldKey: 'phone' })}
            {renderFieldInput({ name: 'Email Address', fieldKey: 'email' })}
            {renderFieldInput({ name: 'Event / Meeting Date', fieldKey: 'date' })}
            {renderFieldInput({ name: 'Time', fieldKey: 'time' })}
            <div className="sm:col-span-2">
              {renderFieldInput({ name: 'Venue Location', fieldKey: 'venue' })}
            </div>
            <div className="sm:col-span-2">
              {renderFieldInput({ name: 'Specific Ask / Highlight', fieldKey: 'specificAsk', maxLines: 2 })}
            </div>
          </div>
        ) : (
          /* Render ONLY the fields explicitly configured by Super Admin on this template */
          <div className="space-y-4">
            {configuredElements.map((el: any) => renderFieldInput(el))}
          </div>
        )}
      </div>

      {/* Month-wise Birthday Support & DOCX Export */}
      {template.category?.code === 'BIRTHDAY' && onGenerateDocx && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cake className="w-5 h-5 text-amber-500" />
              <h4 className="text-xs font-bold text-slate-800">Month-Wise Birthday Roster Export</h4>
            </div>
            <button
              type="button"
              onClick={() => onGenerateDocx(membersList, formData.birthMonth || 'October', formData.referralGroupName)}
              disabled={isGeneratingDocx}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors shadow-2xs disabled:opacity-50"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>{isGeneratingDocx ? 'Generating Word...' : 'Export Word (.docx)'}</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            Export a Microsoft Word DOCX roster for all members celebrating birthdays in {formData.birthMonth || 'October'}.
          </p>
        </div>
      )}

      {/* Bottom Step Actions */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-xs">
        <button
          type="button"
          onClick={onBackToTemplates}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Templates</span>
        </button>

        <button
          type="submit"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors"
        >
          <span>Proceed to Live Preview</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </form>
  );
}
