'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Sparkles,
  Download,
  RefreshCw,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { renderCreativeOnCanvas, RenderCreativeOptions } from '@/lib/creativeCanvasRenderer';

export interface InteractiveCanvasElement {
  id: string;
  name: string;
  elementType: 'DYNAMIC_FIELD' | 'MEMBER_PHOTO' | 'FIXED_TEXT' | 'LOGO' | 'IMAGE' | 'COMPANY_LOGO' | 'SOCIAL_ICONS' | string;
  fieldKey?: string;
  posX: number;
  posY: number;
  width: number;
  height: number;
  zIndex?: number;
  fontSize?: number;
  textColor?: string;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  fontFamily?: string;
  styleConfig?: any;
  defaultValue?: string;
  isRequired?: boolean;
  isLocked?: boolean;
  isVisible?: boolean;
  initialPosX?: number;
  initialPosY?: number;
  initialWidth?: number;
  initialHeight?: number;
  initialFontSize?: number;
  initialTextColor?: string;
}

interface InteractiveCreativeCanvasProps {
  categoryCode: 'MEETING_ANNOUNCEMENT' | 'BUSINESS_PRESENTATION' | 'KYM' | 'BIRTHDAY';
  selectedTemplate: any;
  selectedLogo?: any;
  formData: any;
  setFormData?: React.Dispatch<React.SetStateAction<any>>;
  elements?: InteractiveCanvasElement[];
  onElementsChange?: (elements: InteractiveCanvasElement[]) => void;
  onSaveCreative?: (creativeRecord: any) => void;
  showDownloadButtons?: boolean;
  compactMode?: boolean;
  externalCanvasRef?: React.RefObject<HTMLCanvasElement | null>;
}

export default function InteractiveCreativeCanvas({
  categoryCode,
  selectedTemplate,
  selectedLogo,
  formData,
  elements = [],
  onSaveCreative,
  showDownloadButtons = true,
  compactMode = false,
  externalCanvasRef,
}: InteractiveCreativeCanvasProps) {
  const internalCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = externalCanvasRef || internalCanvasRef;
  const containerRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState<number>(1);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const templateWidth = Number(selectedTemplate?.width) || 1080;
  const templateHeight = Number(selectedTemplate?.height) || 1080;

  // Compute container scale to map client coordinates to canvas pixels
  const updateZoomScale = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width > 0) {
      const scale = rect.width / templateWidth;
      setZoom(scale);
    }
  }, [templateWidth]);

  useEffect(() => {
    updateZoomScale();
    window.addEventListener('resize', updateZoomScale);
    return () => window.removeEventListener('resize', updateZoomScale);
  }, [updateZoomScale]);

  // Main Render Routine
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
        logoUrl: selectedLogo?.logoUrl || '/logos/official/jito-business-network.png',
        darkLogoUrl: selectedLogo?.darkLogoUrl || selectedLogo?.logoUrl || '/logos/official/jito-business-network.png',
        stylingConfig,
        baseDesignUrl: selectedTemplate.baseDesignUrl,
        elements,
        width: templateWidth,
        height: templateHeight,
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
          fieldFontSizes: formData.fieldFontSizes || {},
        },
      };

      await renderCreativeOnCanvas(canvasRef.current, options);
    } catch (err) {
      console.error('Error rendering creative canvas:', err);
    } finally {
      setIsRendering(false);
    }
  }, [categoryCode, selectedTemplate, selectedLogo, formData, elements, templateWidth, templateHeight]);

  // Auto re-render on data changes with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      renderCanvas();
    }, 70);
    return () => clearTimeout(timer);
  }, [renderCanvas]);

  // Download graphic
  const handleDownload = (format: 'PNG' | 'JPG') => {
    if (!canvasRef.current) return;
    const mime = format === 'PNG' ? 'image/png' : 'image/jpeg';
    const ext = format === 'PNG' ? 'png' : 'jpg';
    const dataUrl = canvasRef.current.toDataURL(mime, 0.95);

    const title = (formData.memberName || formData.referralGroupName || 'Creative')
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${selectedTemplate?.slug || 'creative'}_${title}_${Date.now()}.${ext}`;

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(format);
    setTimeout(() => setDownloadSuccess(null), 3000);

    if (onSaveCreative) {
      onSaveCreative({ dataUrl, format, filename });
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
      {/* 1. Header Toolbar */}
      <div className="p-3.5 sm:p-4 bg-slate-50/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200/90 rounded-lg shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-800">Live Studio Canvas</span>
          </div>
          <span className="text-[11px] font-semibold text-slate-500">
            {templateWidth}×{templateHeight}px
          </span>
          <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full border border-blue-200/60 hidden sm:inline">
            Auto-Synced with Form
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={renderCanvas}
            disabled={isRendering}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
            title="Refresh canvas"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRendering ? 'animate-spin text-blue-600' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Main Live Canvas Container (Clean WYSIWYG) */}
      <div className="relative bg-slate-100/90 p-3 sm:p-5 flex items-center justify-center overflow-hidden min-h-[380px] md:min-h-[460px]">
        {/* Loading Spinner */}
        {isRendering && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-30 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-bold text-slate-700">Updating live canvas...</span>
          </div>
        )}

        {/* Scaled Canvas Frame */}
        <div
          ref={containerRef}
          className="relative max-w-full shadow-lg rounded-xl overflow-hidden bg-white border border-slate-300/80"
          style={{
            width: '100%',
            maxWidth: `${compactMode ? '540px' : '620px'}`,
            aspectRatio: `${templateWidth} / ${templateHeight}`,
          }}
        >
          {/* Real HTML5 Graphic Canvas */}
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain pointer-events-none block"
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      </div>

      {/* 3. Bottom Actions & Direct Downloads */}
      {showDownloadButtons && (
        <div className="p-3.5 sm:p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>High-Res Export Ready (300 DPI WYSIWYG)</span>
            {downloadSuccess && (
              <span className="text-emerald-600 font-bold ml-2 animate-pulse">
                ✓ Downloaded {downloadSuccess}!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownload('JPG')}
              disabled={isRendering}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download JPG</span>
            </button>

            <button
              onClick={() => handleDownload('PNG')}
              disabled={isRendering}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PNG (HD)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
