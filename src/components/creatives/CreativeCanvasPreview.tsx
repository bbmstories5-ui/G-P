'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Download,
  Save,
  CheckCircle2,
  Maximize2,
  RefreshCw,
  Sparkles,
  FileImage,
  Layers,
  ZoomIn,
} from 'lucide-react';
import { renderCreativeOnCanvas, RenderCreativeOptions } from '@/lib/creativeCanvasRenderer';

interface CreativeCanvasPreviewProps {
  categoryCode: 'MEETING_ANNOUNCEMENT' | 'BUSINESS_PRESENTATION' | 'KYM' | 'BIRTHDAY';
  selectedTemplate: any;
  selectedLogo?: any;
  formData: any;
  onSaveCreative?: (creativeRecord: any) => void;
}

export default function CreativeCanvasPreview({
  categoryCode,
  selectedTemplate,
  selectedLogo,
  formData,
  onSaveCreative,
}: CreativeCanvasPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Trigger render when template, logo, or form data changes
  const renderCanvas = useCallback(async () => {
    if (!canvasRef.current || !selectedTemplate) return;
    setIsRendering(true);

    try {
      let stylingConfig = {};
      try {
        stylingConfig =
          typeof selectedTemplate.stylingConfig === 'string'
            ? JSON.parse(selectedTemplate.stylingConfig)
            : selectedTemplate.stylingConfig || {};
      } catch {}

      const options: RenderCreativeOptions = {
        categoryCode,
        templateSlug: selectedTemplate.slug,
        themeStyle: selectedTemplate.themeStyle,
        layoutVariant: selectedTemplate.layoutVariant || 'variant-1',
        logoPosition: selectedTemplate.logoPosition || 'top-left',
        logoMaxWidth: selectedTemplate.logoMaxWidth || 190,
        logoMaxHeight: selectedTemplate.logoMaxHeight || 65,
        logoUrl: selectedLogo?.logoUrl || '/logos/logo-1-apex-crest.svg',
        darkLogoUrl: selectedLogo?.darkLogoUrl || '/logos/logo-1-apex-crest-dark.svg',
        stylingConfig,
        baseDesignUrl: selectedTemplate.baseDesignUrl,
        elements: selectedTemplate.elements,
        width: selectedTemplate.width || 1080,
        height: selectedTemplate.height || 1080,
        data: {
          ...formData,
          ...(formData.customFields || {}),
          referralGroupName: formData.referralGroupName,
          memberName: formData.memberName,
          companyName: formData.companyName,
          businessCategory: formData.businessCategory,
          photoUrl: formData.photoUrl,
          phone: formData.phone,
          email: formData.email,
          website: formData.website,
          specificAsk: formData.specificAsk,
          date: formData.date,
          time: formData.time,
          venue: formData.venue,
          meetingStimulant: formData.meetingStimulant,
          dressCode: formData.dressCode,
          visitorFees: formData.visitorFees,
          birthDay: formData.birthDay,
          birthMonth: formData.birthMonth,
          birthdayWish: formData.birthdayWish,
          monthlyMembers: formData.monthlyMembers,
        },
      };

      await renderCreativeOnCanvas(canvasRef.current, options);
    } catch (err) {
      console.error('Error rendering creative on canvas:', err);
    } finally {
      setIsRendering(false);
    }
  }, [categoryCode, selectedTemplate, selectedLogo, formData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      renderCanvas();
    }, 120);
    return () => clearTimeout(timer);
  }, [renderCanvas]);

  // Download Handler (PNG or JPG)
  const handleDownload = async (format: 'PNG' | 'JPG') => {
    if (!canvasRef.current) return;
    setDownloadSuccess(false);

    const mime = format === 'PNG' ? 'image/png' : 'image/jpeg';
    const ext = format === 'PNG' ? 'png' : 'jpg';
    const dataUrl = canvasRef.current.toDataURL(mime, 0.95);

    const safeTitle = (formData.memberName || formData.referralGroupName || 'Creative')
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${categoryCode}_${safeTitle}_${Date.now()}.${ext}`;

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);

    // Auto-save generation to history
    saveToDatabase(dataUrl, format, filename);
  };

  // Save to database
  const saveToDatabase = async (dataUrl?: string, format: string = 'PNG', titleOverride?: string) => {
    if (!canvasRef.current || isSaving) return;
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const imgData = dataUrl || canvasRef.current.toDataURL('image/png', 0.95);
      const title =
        titleOverride ||
        `${categoryCode.replace(/_/g, ' ')} - ${formData.memberName || formData.referralGroupName || 'Creative'}`;

      const res = await fetch('/api/creatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: selectedTemplate.categoryId,
          templateId: selectedTemplate.id,
          logoId: selectedLogo?.id || null,
          title,
          referralGroupName: formData.referralGroupName,
          memberName: formData.memberName,
          formData,
          imageData: imgData,
          outputFormat: format,
          dimensions: `${selectedTemplate.width || 1080}x${selectedTemplate.height || 1080}`,
        }),
      });

      const json = await res.json();
      if (res.ok && json.creative) {
        setSaveSuccess(true);
        if (onSaveCreative) onSaveCreative(json.creative);
        setTimeout(() => setSaveSuccess(false), 3500);
      }
    } catch (err) {
      console.error('Failed to save creative:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 md:p-6 flex flex-col h-full">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-base font-semibold text-slate-900">Live Graphic Preview</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Template: <span className="font-semibold text-slate-800">{selectedTemplate?.name || 'Selected'}</span> •{' '}
            {selectedTemplate?.width || 1080}×{selectedTemplate?.height || 1080}px ({selectedTemplate?.orientation || 'SQUARE'})
          </p>
        </div>

        <button
          onClick={renderCanvas}
          disabled={isRendering}
          title="Re-render preview"
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isRendering ? 'animate-spin text-blue-600' : ''}`} />
        </button>
      </div>

      {/* Canvas Container */}
      <div className="relative flex-1 flex items-center justify-center bg-slate-50 border border-slate-200/80 rounded-xl overflow-hidden min-h-[360px] md:min-h-[460px] p-3">
        {isRendering && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold text-slate-700">Rendering high-res graphics...</span>
          </div>
        )}

        {/* The actual HTML5 Canvas element */}
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-[520px] object-contain rounded-lg shadow-md border border-slate-200/60 transition-all duration-200"
          style={{ width: '100%', height: 'auto', aspectRatio: `${selectedTemplate?.width || 1080} / ${selectedTemplate?.height || 1080}` }}
        />
      </div>

      {/* Bottom Actions */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Save Status / Button */}
        <div className="w-full sm:w-auto flex items-center gap-2">
          <button
            onClick={() => saveToDatabase()}
            disabled={isSaving}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
              saveSuccess
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-sm'
            }`}
          >
            {saveSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Saved to My Creatives</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-slate-600" />
                <span>{isSaving ? 'Saving...' : 'Save to Creatives'}</span>
              </>
            )}
          </button>
        </div>

        {/* Download Group */}
        <div className="w-full sm:w-auto flex items-center gap-2">
          <button
            onClick={() => handleDownload('JPG')}
            disabled={isRendering}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>JPG</span>
          </button>

          <button
            onClick={() => handleDownload('PNG')}
            disabled={isRendering}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 transition-all hover:shadow-md"
          >
            <Download className="w-4 h-4" />
            <span>Download PNG (HD)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
