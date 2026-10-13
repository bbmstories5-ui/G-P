'use client';

import React, { useState } from 'react';
import {
  Sliders,
  Type,
  ImageIcon,
  Layers,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Maximize2,
  Minimize2,
  Sparkles,
  Upload,
  User,
  Share2,
  Move,
  Plus,
  Palette,
  Check,
  Shapes,
  Square,
  Circle,
  Minus,
  ArrowUp,
  ArrowDown,
  Hexagon,
  Heart,
  Star,
  Shield,
  Diamond,
  Gem,
  Ban,
  Frame,
} from 'lucide-react';
import { tabFetch } from '@/lib/tabAuth';

export interface BuilderElement {
  id: string;
  elementType: 'LOGO' | 'FIXED_TEXT' | 'DYNAMIC_FIELD' | 'MEMBER_PHOTO' | 'COMPANY_LOGO' | 'IMAGE' | 'SOCIAL_ICONS' | 'SHAPE';
  fieldKey?: string;
  name: string;
  posX: number;
  posY: number;
  width: number;
  height: number;
  rotation?: number;
  flipX?: boolean;
  flipY?: boolean;
  opacity?: number;
  aspectRatioLocked?: boolean;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  textColor: string;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  lineSpacing: number;
  letterSpacing?: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  maxLines: number;
  overflowBehavior: 'wrap' | 'truncate' | 'shrink';
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  borderRadius?: number;
  shadowEnabled?: boolean;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  blendMode?: string;
  shape?: string;
  hasFrame?: boolean;
  zIndex: number;
  isLocked: boolean;
  isVisible: boolean;
  isRequired: boolean;
  defaultValue?: string;
  styleConfig?: any;
}

interface ElementPropertiesPanelProps {
  selectedElement: BuilderElement | null;
  elements: BuilderElement[];
  onUpdateElement: (fields: Partial<BuilderElement>) => void;
  onSelectElement: (id: string | null) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  onReorderElement: (id: string, direction: 'front' | 'back' | 'up' | 'down') => void;
  onAlignElement: (type: 'left' | 'center-x' | 'right' | 'top' | 'center-y' | 'bottom') => void;
  onClose: () => void;
  logoLibrary: Array<{ id: string; name: string; logoUrl: string }>;
  canvasWidth: number;
  canvasHeight: number;
  onAddElement?: (type: string, payload?: any) => void;
}

const FONT_FAMILIES = [
  'Inter',
  'Outfit',
  'Roboto',
  'Playfair Display',
  'Montserrat',
  'Poppins',
  'Merriweather',
  'Oswald',
  'Cinzel',
  'Arial',
  'Georgia',
  'Courier New',
];

const PRESET_COLORS = [
  '#000000',
  '#FFFFFF',
  '#1E293B',
  '#0F172A',
  '#2563EB',
  '#3B82F6',
  '#6366F1',
  '#7C3AED',
  '#EC4899',
  '#EF4444',
  '#F59E0B',
  '#10B981',
  '#065F46',
  '#D97706',
  '#92400E',
  '#475569',
];

export default function ElementPropertiesPanel({
  selectedElement,
  elements,
  onUpdateElement,
  onSelectElement,
  onDeleteElement,
  onDuplicateElement,
  onReorderElement,
  onAlignElement,
  onClose,
  logoLibrary,
  canvasWidth,
  canvasHeight,
  onAddElement,
}: ElementPropertiesPanelProps) {
  // Collapsible section states
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    transform: true,
    typography: true,
    media: true,
    appearance: true,
    layers: true,
    advanced: true,
  });

  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Helper to safely get styleConfig object
  const getStyleObj = () => {
    if (!selectedElement) return {};
    if (typeof selectedElement.styleConfig === 'string') {
      try {
        return JSON.parse(selectedElement.styleConfig);
      } catch {
        return {};
      }
    }
    return selectedElement.styleConfig || {};
  };

  const updateStyleConfig = (fields: Record<string, any>) => {
    if (!selectedElement) return;
    const current = getStyleObj();
    onUpdateElement({
      styleConfig: { ...current, ...fields },
    });
  };

  // Handle direct file upload for Image or Logo
  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedElement) return;

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'image');

      const res = await tabFetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        if (selectedElement.elementType === 'LOGO') {
          updateStyleConfig({ logoUrl: data.url });
        } else {
          updateStyleConfig({ imageUrl: data.url });
        }
      } else {
        alert(data.error || 'Failed to upload image');
      }
    } catch (err: any) {
      alert(err.message || 'Error uploading image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Center on Canvas
  const centerOnCanvas = () => {
    if (!selectedElement) return;
    onUpdateElement({
      posX: Math.round((canvasWidth - selectedElement.width) / 2),
      posY: Math.round((canvasHeight - selectedElement.height) / 2),
    });
  };

  // Reset Transform
  const resetTransform = () => {
    onUpdateElement({
      rotation: 0,
      flipX: false,
      flipY: false,
    });
  };

  // If no element is selected, render a comprehensive Canva/Figma-style Inspector Empty State
  if (!selectedElement) {
    return (
      <aside className="w-80 sm:w-88 bg-white border-l border-slate-200/90 flex flex-col shrink-0 z-20 shadow-xs overflow-y-auto animate-in slide-in-from-right-4 duration-150">
        {/* Header */}
        <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-blue-600" />
            Inspector & Canvas
          </span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-200 transition-colors"
            title="Close Panel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-4 space-y-4 text-xs">
          {/* Canvas Properties Summary */}
          <div className="p-3.5 bg-blue-50/60 border border-blue-200/80 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-900 text-xs">Canvas Information</span>
              <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                {canvasWidth} × {canvasHeight} px
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div className="p-2 bg-white rounded-xl border border-blue-100 shadow-2xs">
                <span className="block text-[10px] text-slate-400">Total</span>
                <span className="font-bold text-slate-800 text-xs">{elements.length}</span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-blue-100 shadow-2xs">
                <span className="block text-[10px] text-slate-400">Visible</span>
                <span className="font-bold text-emerald-700 text-xs">
                  {elements.filter((e) => e.isVisible !== false).length}
                </span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-blue-100 shadow-2xs">
                <span className="block text-[10px] text-slate-400">Locked</span>
                <span className="font-bold text-amber-700 text-xs">
                  {elements.filter((e) => e.isLocked).length}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Add Section */}
          {onAddElement && (
            <div className="space-y-1.5">
              <span className="font-bold text-slate-700 block text-[11px]">Quick Add to Canvas</span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => onAddElement('headline')}
                  className="p-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-left font-semibold text-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <Type className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="truncate">Headline</span>
                </button>
                <button
                  type="button"
                  onClick={() => onAddElement('photo')}
                  className="p-2 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-xl text-left font-semibold text-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="truncate">Member Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => onAddElement('shape')}
                  className="p-2 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl text-left font-semibold text-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <Square className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="truncate">Shape / Box</span>
                </button>
                <button
                  type="button"
                  onClick={() => onAddElement('social')}
                  className="p-2 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl text-left font-semibold text-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">Social Bar</span>
                </button>
              </div>
            </div>
          )}

          {/* Canvas Layers List */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="font-bold text-slate-700 block text-[11px] flex items-center justify-between">
              <span>Canvas Layers ({elements.length})</span>
              <span className="text-[10px] font-normal text-slate-400">Click to inspect</span>
            </span>

            {elements.length === 0 ? (
              <div className="p-4 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                No elements yet on canvas.
              </div>
            ) : (
              <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                {elements
                  .slice()
                  .reverse()
                  .map((el) => (
                    <div
                      key={el.id}
                      onClick={() => onSelectElement(el.id)}
                      className="p-2 rounded-xl border border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50/40 text-xs flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {el.elementType === 'FIXED_TEXT' || el.elementType === 'DYNAMIC_FIELD' ? (
                          <Type className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        ) : el.elementType === 'MEMBER_PHOTO' ? (
                          <User className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        ) : el.elementType === 'LOGO' || el.elementType === 'COMPANY_LOGO' ? (
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        ) : el.elementType === 'SHAPE' ? (
                          <Square className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        ) : (
                          <ImageIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        )}
                        <span className="font-medium text-slate-800 truncate">{el.name}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {el.isLocked && <Lock className="w-3 h-3 text-amber-500" />}
                        {el.isVisible === false && <EyeOff className="w-3 h-3 text-slate-400" />}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </aside>
    );
  }

  const styleObj = getStyleObj();
  const isText = selectedElement.elementType === 'FIXED_TEXT' || selectedElement.elementType === 'DYNAMIC_FIELD';
  const isImageOrLogo =
    selectedElement.elementType === 'LOGO' ||
    selectedElement.elementType === 'IMAGE' ||
    selectedElement.elementType === 'COMPANY_LOGO' ||
    selectedElement.elementType === 'MEMBER_PHOTO';
  const isShape = selectedElement.elementType === 'SHAPE';
  const isSocial = selectedElement.elementType === 'SOCIAL_ICONS';

  return (
    <aside className="w-80 sm:w-88 bg-white border-l border-slate-200/90 flex flex-col shrink-0 z-20 shadow-xs overflow-y-auto animate-in slide-in-from-right-4 duration-150">
      {/* 1. TOP HEADER & QUICK TOOLBAR */}
      <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="p-1 rounded-md bg-blue-100 text-blue-700 shrink-0">
            {isText ? (
              <Type className="w-3.5 h-3.5" />
            ) : isImageOrLogo ? (
              <ImageIcon className="w-3.5 h-3.5" />
            ) : isShape ? (
              <Shapes className="w-3.5 h-3.5" />
            ) : (
              <Sliders className="w-3.5 h-3.5" />
            )}
          </span>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {selectedElement.elementType.replace('_', ' ')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onDuplicateElement(selectedElement.id)}
            className="text-slate-500 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
            title="Duplicate (Ctrl+D)"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDeleteElement(selectedElement.id)}
            className="text-rose-600 hover:text-rose-800 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
            title="Delete (Delete/Backspace)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
            title="Close Panel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4 text-xs">
        {/* ELEMENT NAME & LOCK / VISIBILITY BAR */}
        <div className="space-y-2">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Element Label / Name</label>
            <input
              type="text"
              value={selectedElement.name}
              onChange={(e) => onUpdateElement({ name: e.target.value })}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-bold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => onUpdateElement({ isLocked: !selectedElement.isLocked })}
              className={`py-1.5 px-2.5 rounded-xl border font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors ${
                selectedElement.isLocked
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {selectedElement.isLocked ? <Lock className="w-3.5 h-3.5 text-amber-600" /> : <Unlock className="w-3.5 h-3.5 text-slate-400" />}
              <span>{selectedElement.isLocked ? 'Locked' : 'Unlocked'}</span>
            </button>

            <button
              type="button"
              onClick={() => onUpdateElement({ isVisible: selectedElement.isVisible === false ? true : false })}
              className={`py-1.5 px-2.5 rounded-xl border font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors ${
                selectedElement.isVisible === false
                  ? 'bg-slate-200 text-slate-600 border-slate-300'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {selectedElement.isVisible === false ? <EyeOff className="w-3.5 h-3.5 text-slate-500" /> : <Eye className="w-3.5 h-3.5 text-blue-600" />}
              <span>{selectedElement.isVisible === false ? 'Hidden' : 'Visible'}</span>
            </button>
          </div>
        </div>

        {/* 2. TRANSFORM & POSITIONING (COLLAPSIBLE) */}
        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => toggleSection('transform')}
            className="flex items-center justify-between w-full font-bold text-slate-800 text-xs py-1"
          >
            <span className="flex items-center gap-1.5">
              <Move className="w-3.5 h-3.5 text-blue-600" />
              Transform & Alignment
            </span>
            {openSections.transform ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          {openSections.transform && (
            <div className="mt-2.5 space-y-3">
              {/* Coordinates & Dimensions */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">X Position (px)</span>
                  <input
                    type="number"
                    value={Math.round(selectedElement.posX)}
                    onChange={(e) => onUpdateElement({ posX: Number(e.target.value) })}
                    className="w-full px-2 py-1 border border-slate-200 rounded-lg text-slate-800 bg-slate-50 font-mono text-xs"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Y Position (px)</span>
                  <input
                    type="number"
                    value={Math.round(selectedElement.posY)}
                    onChange={(e) => onUpdateElement({ posY: Number(e.target.value) })}
                    className="w-full px-2 py-1 border border-slate-200 rounded-lg text-slate-800 bg-slate-50 font-mono text-xs"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] text-slate-400">Width</span>
                    <button
                      type="button"
                      onClick={() => onUpdateElement({ aspectRatioLocked: !selectedElement.aspectRatioLocked })}
                      className={`text-[9px] px-1 rounded ${selectedElement.aspectRatioLocked ? 'bg-blue-100 text-blue-700 font-bold' : 'text-slate-400'}`}
                      title="Lock aspect ratio"
                    >
                      {selectedElement.aspectRatioLocked ? 'Locked' : 'Free'}
                    </button>
                  </div>
                  <input
                    type="number"
                    value={Math.round(selectedElement.width)}
                    onChange={(e) => {
                      const newW = Math.max(10, Number(e.target.value));
                      if (selectedElement.aspectRatioLocked && selectedElement.width > 0) {
                        const ratio = selectedElement.height / selectedElement.width;
                        onUpdateElement({ width: newW, height: Math.round(newW * ratio) });
                      } else {
                        onUpdateElement({ width: newW });
                      }
                    }}
                    className="w-full px-2 py-1 border border-slate-200 rounded-lg text-slate-800 bg-slate-50 font-mono text-xs"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Height (px)</span>
                  <input
                    type="number"
                    value={Math.round(selectedElement.height)}
                    onChange={(e) => {
                      const newH = Math.max(10, Number(e.target.value));
                      if (selectedElement.aspectRatioLocked && selectedElement.height > 0) {
                        const ratio = selectedElement.width / selectedElement.height;
                        onUpdateElement({ height: newH, width: Math.round(newH * ratio) });
                      } else {
                        onUpdateElement({ height: newH });
                      }
                    }}
                    className="w-full px-2 py-1 border border-slate-200 rounded-lg text-slate-800 bg-slate-50 font-mono text-xs"
                  />
                </div>
              </div>

              {/* Rotation & Flip */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-bold">Rotation</span>
                  <span className="font-mono text-[10px] text-slate-600">
                    {Math.round(selectedElement.rotation || 0)}°
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    value={selectedElement.rotation || 0}
                    onChange={(e) => onUpdateElement({ rotation: Number(e.target.value) })}
                    className="flex-1 accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <input
                    type="number"
                    value={Math.round(selectedElement.rotation || 0)}
                    onChange={(e) => onUpdateElement({ rotation: Number(e.target.value) })}
                    className="w-14 px-1.5 py-0.5 border border-slate-200 rounded text-center font-mono text-xs"
                  />
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => onUpdateElement({ flipX: !selectedElement.flipX })}
                    className={`flex-1 py-1 px-2 rounded-lg border text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors ${
                      selectedElement.flipX
                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                    title="Flip Horizontally"
                  >
                    <FlipHorizontal className="w-3 h-3" />
                    <span>Flip H</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateElement({ flipY: !selectedElement.flipY })}
                    className={`flex-1 py-1 px-2 rounded-lg border text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors ${
                      selectedElement.flipY
                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                    title="Flip Vertically"
                  >
                    <FlipVertical className="w-3 h-3" />
                    <span>Flip V</span>
                  </button>
                  <button
                    type="button"
                    onClick={resetTransform}
                    className="py-1 px-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[10px] font-semibold"
                    title="Reset Rotation & Flip"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Alignment Buttons */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-bold">Canvas Alignment</span>
                  <button
                    type="button"
                    onClick={centerOnCanvas}
                    className="text-[10px] text-blue-600 hover:underline font-bold"
                  >
                    Center Canvas
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    type="button"
                    onClick={() => onAlignElement('left')}
                    className="py-1 px-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] font-semibold text-slate-700 text-center"
                  >
                    Left
                  </button>
                  <button
                    type="button"
                    onClick={() => onAlignElement('center-x')}
                    className="py-1 px-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] font-semibold text-slate-700 text-center"
                  >
                    Center X
                  </button>
                  <button
                    type="button"
                    onClick={() => onAlignElement('right')}
                    className="py-1 px-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] font-semibold text-slate-700 text-center"
                  >
                    Right
                  </button>
                  <button
                    type="button"
                    onClick={() => onAlignElement('top')}
                    className="py-1 px-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] font-semibold text-slate-700 text-center"
                  >
                    Top
                  </button>
                  <button
                    type="button"
                    onClick={() => onAlignElement('center-y')}
                    className="py-1 px-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] font-semibold text-slate-700 text-center"
                  >
                    Center Y
                  </button>
                  <button
                    type="button"
                    onClick={() => onAlignElement('bottom')}
                    className="py-1 px-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] font-semibold text-slate-700 text-center"
                  >
                    Bottom
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. TYPOGRAPHY PROPERTIES (FOR TEXT & DYNAMIC FIELDS) */}
        {isText && (
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => toggleSection('typography')}
              className="flex items-center justify-between w-full font-bold text-slate-800 text-xs py-1"
            >
              <span className="flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-blue-600" />
                Typography & Content
              </span>
              {openSections.typography ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
            </button>

            {openSections.typography && (
              <div className="mt-2.5 space-y-3">
                {/* Content Editor */}
                {selectedElement.elementType === 'FIXED_TEXT' ? (
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-1">Fixed Headline / Text Content</label>
                    <textarea
                      rows={2}
                      value={selectedElement.defaultValue || ''}
                      onChange={(e) => onUpdateElement({ defaultValue: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-800 bg-slate-50 focus:bg-white text-xs font-semibold"
                      placeholder="Enter headline..."
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold block mb-1">Field Data Key (API / Member Form)</label>
                      <input
                        type="text"
                        value={selectedElement.fieldKey || ''}
                        onChange={(e) => onUpdateElement({ fieldKey: e.target.value })}
                        className="w-full px-2 py-1 border border-slate-200 rounded-lg font-mono text-xs text-slate-800 bg-slate-50"
                        placeholder="e.g. memberName, bloodGroup"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold block mb-1">Sample / Default Preview Value</label>
                      <input
                        type="text"
                        value={selectedElement.defaultValue || ''}
                        onChange={(e) => onUpdateElement({ defaultValue: e.target.value })}
                        className="w-full px-2 py-1 border border-slate-200 rounded-lg text-slate-800 bg-slate-50 text-xs font-medium"
                        placeholder="e.g. Dr. Ketan Patel"
                      />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={selectedElement.isRequired !== false}
                        onChange={(e) => onUpdateElement({ isRequired: e.target.checked })}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-[11px] text-slate-700 font-semibold">Required field for members</span>
                    </label>
                  </div>
                )}

                {/* Font Family & Size */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Font Family</span>
                    <select
                      value={selectedElement.fontFamily || 'Inter'}
                      onChange={(e) => onUpdateElement({ fontFamily: e.target.value })}
                      className="w-full px-2 py-1 border border-slate-200 rounded-lg text-slate-800 bg-slate-50 text-xs font-medium"
                    >
                      {FONT_FAMILIES.map((f) => (
                        <option key={f} value={f} style={{ fontFamily: f }}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Font Size (px)</span>
                    <input
                      type="number"
                      value={selectedElement.fontSize || 24}
                      onChange={(e) => onUpdateElement({ fontSize: Number(e.target.value) })}
                      className="w-full px-2 py-1 border border-slate-200 rounded-lg text-slate-800 bg-slate-50 font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Font Weight & Styles */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Font Weight</span>
                    <select
                      value={selectedElement.fontWeight || 'normal'}
                      onChange={(e) => onUpdateElement({ fontWeight: e.target.value })}
                      className="w-full px-2 py-1 border border-slate-200 rounded-lg text-slate-800 bg-slate-50 text-xs font-medium"
                    >
                      <option value="300">300 - Light</option>
                      <option value="normal">400 - Regular</option>
                      <option value="medium">500 - Medium</option>
                      <option value="semibold">600 - SemiBold</option>
                      <option value="bold">700 - Bold</option>
                      <option value="800">800 - ExtraBold</option>
                      <option value="900">900 - Black</option>
                    </select>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Text Style</span>
                    <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateElement({
                            fontWeight: selectedElement.fontWeight === 'bold' || selectedElement.fontWeight === '700' ? 'normal' : 'bold',
                          })
                        }
                        className={`flex-1 py-1 text-center font-bold text-xs ${
                          selectedElement.fontWeight === 'bold' || selectedElement.fontWeight === '700' || selectedElement.fontWeight === '900'
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-600 hover:bg-slate-200'
                        }`}
                        title="Bold"
                      >
                        <Bold className="w-3 h-3 mx-auto" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateElement({
                            fontStyle: selectedElement.fontStyle === 'italic' ? 'normal' : 'italic',
                          })
                        }
                        className={`flex-1 py-1 text-center italic text-xs ${
                          selectedElement.fontStyle === 'italic' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200'
                        }`}
                        title="Italic"
                      >
                        <Italic className="w-3 h-3 mx-auto" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateElement({
                            textDecoration: selectedElement.textDecoration === 'underline' ? 'none' : 'underline',
                          })
                        }
                        className={`flex-1 py-1 text-center underline text-xs ${
                          selectedElement.textDecoration === 'underline' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200'
                        }`}
                        title="Underline"
                      >
                        <Underline className="w-3 h-3 mx-auto" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Text Alignment & Text Transform */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Alignment</span>
                    <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                      {(['left', 'center', 'right', 'justify'] as const).map((align) => (
                        <button
                          key={align}
                          type="button"
                          onClick={() => onUpdateElement({ textAlign: align })}
                          className={`flex-1 py-1 flex items-center justify-center ${
                            selectedElement.textAlign === align ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200'
                          }`}
                          title={`Align ${align}`}
                        >
                          {align === 'left' && <AlignLeft className="w-3 h-3" />}
                          {align === 'center' && <AlignCenter className="w-3 h-3" />}
                          {align === 'right' && <AlignRight className="w-3 h-3" />}
                          {align === 'justify' && <AlignJustify className="w-3 h-3" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Transform</span>
                    <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                      {[
                        { id: 'none', label: '—' },
                        { id: 'uppercase', label: 'AA' },
                        { id: 'lowercase', label: 'aa' },
                        { id: 'capitalize', label: 'Aa' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => onUpdateElement({ textTransform: t.id as any })}
                          className={`flex-1 py-1 font-bold text-[10px] text-center ${
                            (selectedElement.textTransform || 'none') === t.id
                              ? 'bg-blue-600 text-white'
                              : 'text-slate-600 hover:bg-slate-200'
                          }`}
                          title={`Transform: ${t.id}`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Line Height & Letter Spacing */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Line Spacing ({selectedElement.lineSpacing || 1.2})</span>
                    <input
                      type="range"
                      min="0.8"
                      max="2.5"
                      step="0.05"
                      value={selectedElement.lineSpacing || 1.2}
                      onChange={(e) => onUpdateElement({ lineSpacing: Number(e.target.value) })}
                      className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Letter Spacing ({selectedElement.letterSpacing || 0}px)</span>
                    <input
                      type="range"
                      min="-2"
                      max="12"
                      step="0.5"
                      value={selectedElement.letterSpacing || 0}
                      onChange={(e) => onUpdateElement({ letterSpacing: Number(e.target.value) })}
                      className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                {/* Text Color Picker */}
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Text Color</span>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="color"
                      value={selectedElement.textColor || '#000000'}
                      onChange={(e) => onUpdateElement({ textColor: e.target.value })}
                      className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={selectedElement.textColor || '#000000'}
                      onChange={(e) => onUpdateElement({ textColor: e.target.value })}
                      className="w-24 px-2 py-1 border border-slate-200 rounded font-mono text-xs uppercase"
                    />
                  </div>
                  {/* Swatches */}
                  <div className="flex flex-wrap gap-1">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => onUpdateElement({ textColor: c })}
                        style={{ backgroundColor: c }}
                        className="w-5 h-5 rounded-md border border-slate-200/80 hover:scale-110 transition-transform shadow-2xs"
                        title={c}
                      />
                    ))}
                  </div>
                </div>

                {/* Text Box Background / Highlight */}
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Text Box Background Fill (Optional)</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedElement.backgroundColor || '#FFFFFF'}
                      onChange={(e) => onUpdateElement({ backgroundColor: e.target.value })}
                      className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0.5"
                    />
                    <button
                      type="button"
                      onClick={() => onUpdateElement({ backgroundColor: undefined })}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px] font-semibold"
                    >
                      Clear Fill (Transparent)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. IMAGE, LOGO & MEMBER PHOTO PROPERTIES */}
        {isImageOrLogo && (
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => toggleSection('media')}
              className="flex items-center justify-between w-full font-bold text-slate-800 text-xs py-1"
            >
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                Image & Media Settings
              </span>
              {openSections.media ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
            </button>

            {openSections.media && (
              <div className="mt-2.5 space-y-3">
                {/* Official Logo Switcher if LOGO */}
                {selectedElement.elementType === 'LOGO' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 p-1 flex items-center justify-center shrink-0">
                        <img
                          src={styleObj.logoUrl || '/logos/official/jito-ahmedabad.png'}
                          alt={selectedElement.name}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-800 text-xs truncate">{selectedElement.name}</p>
                        <p className="text-[10px] text-slate-500">Official Brand Logo</p>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">Switch to Logo from Library</span>
                      <select
                        value={styleObj.logoUrl || ''}
                        onChange={(e) => {
                          const matched = logoLibrary.find((l) => l.logoUrl === e.target.value);
                          onUpdateElement({
                            name: matched ? matched.name : selectedElement.name,
                            styleConfig: { ...styleObj, logoUrl: e.target.value },
                          });
                        }}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 font-medium"
                      >
                        {logoLibrary.map((l) => (
                          <option key={l.id} value={l.logoUrl}>
                            {l.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Member Photo & Image Frame Geometry */}
                {(selectedElement.elementType === 'MEMBER_PHOTO' || selectedElement.elementType === 'IMAGE') && (() => {
                  const resolvedShape = (selectedElement.shape || styleObj.shape || (selectedElement as any).frameShape || 'none').toLowerCase().trim();
                  const isFrameActive = resolvedShape !== 'none' && resolvedShape !== 'without-frame' && styleObj.hasFrame !== false;
                  const currentShape = isFrameActive ? resolvedShape : 'none';

                  return (
                  <div className="space-y-3 p-3 bg-slate-50 border border-slate-200/90 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                        <Frame className="w-3.5 h-3.5 text-blue-600" />
                        <span>Photo Frame Geometry</span>
                      </span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase bg-blue-100 text-blue-700">
                        {isFrameActive ? currentShape : 'No Frame'}
                      </span>
                    </div>

                    {/* Frame Mode Segmented Control: With Frame vs Without Frame */}
                    <div className="grid grid-cols-2 p-1 bg-white border border-slate-200 rounded-xl shadow-2xs gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const currentSt = getStyleObj();
                          const prev = (currentSt.shape && currentSt.shape !== 'none' && currentSt.shape !== 'without-frame') ? currentSt.shape : 'circle';
                          const targetBw = (currentSt.borderWidth && currentSt.borderWidth > 0) ? currentSt.borderWidth : 4;
                          const targetColor = currentSt.borderColor || '#D97706';
                          const nextStyle = {
                            ...currentSt,
                            shape: prev,
                            hasFrame: true,
                            borderWidth: targetBw,
                            borderColor: targetColor,
                          };
                          onUpdateElement({
                            shape: prev,
                            hasFrame: true,
                            borderWidth: targetBw,
                            borderColor: targetColor,
                            styleConfig: nextStyle,
                          });
                        }}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          isFrameActive
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <Frame className="w-3.5 h-3.5" />
                        <span>With Frame</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const currentSt = getStyleObj();
                          const nextStyle = {
                            ...currentSt,
                            shape: 'none',
                            hasFrame: false,
                            borderWidth: 0,
                          };
                          onUpdateElement({
                            shape: 'none',
                            hasFrame: false,
                            borderWidth: 0,
                            styleConfig: nextStyle,
                          });
                        }}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          !isFrameActive
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Without Frame</span>
                      </button>
                    </div>

                    {/* WITHOUT FRAME (RAW PHOTO) ACTIVE BANNER */}
                    {!isFrameActive && (
                      <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1.5 text-amber-900">
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          <Check className="w-3.5 h-3.5 text-amber-700" />
                          <span>Frameless Raw Photo Mode Active</span>
                        </div>
                        <p className="text-[10px] text-amber-800 leading-relaxed">
                          The image is rendered unclipped and unmasked at its natural rectangular geometry with 0 frame distortion.
                        </p>
                      </div>
                    )}

                    {/* MULTIPLE FRAMES SHAPE SELECTION GRID */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                        Choose Frame Shape
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { id: 'none', label: 'Without Frame', icon: Ban, isFrameless: true },
                          { id: 'circle', label: 'Circular', icon: Circle },
                          { id: 'squircle', label: 'Rounded Card', icon: Square, radius: 24 },
                          { id: 'arch', label: 'Arch / Portal', icon: Frame },
                          { id: 'oval', label: 'Oval', icon: Circle },
                          { id: 'hexagon', label: 'Hexagon', icon: Hexagon },
                          { id: 'octagon', label: 'Octagon', icon: Gem },
                          { id: 'diamond', label: 'Diamond', icon: Diamond },
                          { id: 'shield', label: 'Shield / Crest', icon: Shield },
                          { id: 'heart', label: 'Heart', icon: Heart },
                          { id: 'star', label: 'Star Badge', icon: Star },
                        ].map((frame) => {
                          const IconComp = frame.icon;
                          const isSelected = frame.isFrameless
                            ? !isFrameActive
                            : isFrameActive && currentShape === frame.id;

                          return (
                            <button
                              key={frame.id}
                              type="button"
                              onClick={() => {
                                const currentSt = getStyleObj();
                                if (frame.isFrameless) {
                                  const nextStyle = {
                                    ...currentSt,
                                    shape: 'none',
                                    hasFrame: false,
                                    borderWidth: 0,
                                    borderRadius: 0,
                                  };
                                  onUpdateElement({
                                    shape: 'none',
                                    hasFrame: false,
                                    borderWidth: 0,
                                    borderRadius: 0,
                                    styleConfig: nextStyle,
                                  });
                                } else {
                                  const targetBw = (currentSt.borderWidth !== undefined && currentSt.borderWidth > 0)
                                    ? currentSt.borderWidth
                                    : (selectedElement.borderWidth && selectedElement.borderWidth > 0 ? selectedElement.borderWidth : 4);
                                  const targetRadius = frame.radius ?? currentSt.borderRadius ?? 20;
                                  const targetColor = currentSt.borderColor || selectedElement.borderColor || '#D97706';

                                  const nextStyle = {
                                    ...currentSt,
                                    shape: frame.id,
                                    hasFrame: true,
                                    borderRadius: targetRadius,
                                    borderWidth: targetBw,
                                    borderColor: targetColor,
                                  };
                                  onUpdateElement({
                                    shape: frame.id,
                                    hasFrame: true,
                                    borderWidth: targetBw,
                                    borderRadius: targetRadius,
                                    borderColor: targetColor,
                                    styleConfig: nextStyle,
                                  });
                                }
                              }}
                              className={`p-2 rounded-xl border text-left transition-all flex items-center gap-2 ${
                                isSelected
                                  ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold shadow-2xs ring-1 ring-blue-500/30'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                              }`}
                            >
                              <IconComp className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                              <span className="text-xs truncate">{frame.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* FRAME BORDER STYLING CONTROLS */}
                    <div className="pt-2 border-t border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Frame Border Stroke
                        </span>
                        <span className="text-[10px] font-mono text-slate-600">
                          {styleObj.borderWidth ?? (styleObj.shape === 'none' ? 0 : 4)}px
                        </span>
                      </div>

                      {/* Border Width Quick Presets */}
                      <div className="grid grid-cols-6 gap-1">
                        {[0, 2, 4, 6, 8, 12].map((bw) => {
                          const currentBw = Number(styleObj.borderWidth ?? (styleObj.shape === 'none' ? 0 : 4));
                          const isSel = currentBw === bw;
                          return (
                            <button
                              key={bw}
                              type="button"
                              onClick={() => {
                                const currentSt = getStyleObj();
                                const nextStyle = { ...currentSt, borderWidth: bw };
                                onUpdateElement({ borderWidth: bw, styleConfig: nextStyle });
                              }}
                              className={`py-1 rounded-lg border text-[10px] font-bold transition-all text-center ${
                                isSel
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              {bw === 0 ? 'None' : `${bw}px`}
                            </button>
                          );
                        })}
                      </div>

                      {/* Border Color Swatches */}
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-1">Border Color Palette</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {[
                            { name: 'Gold', hex: '#D97706' },
                            { name: 'Blue', hex: '#2563EB' },
                            { name: 'White', hex: '#FFFFFF' },
                            { name: 'Dark', hex: '#0F172A' },
                            { name: 'Emerald', hex: '#059669' },
                            { name: 'Crimson', hex: '#DC2626' },
                            { name: 'Amber', hex: '#F59E0B' },
                          ].map((c) => (
                            <button
                              key={c.hex}
                              type="button"
                              onClick={() => {
                                const currentSt = getStyleObj();
                                const nextStyle = { ...currentSt, borderColor: c.hex };
                                onUpdateElement({ borderColor: c.hex, styleConfig: nextStyle });
                              }}
                              style={{ backgroundColor: c.hex }}
                              className={`w-5 h-5 rounded-full border shadow-2xs transition-transform hover:scale-110 ${
                                (styleObj.borderColor || '#D97706').toLowerCase() === c.hex.toLowerCase()
                                  ? 'ring-2 ring-blue-600 ring-offset-1 scale-110 border-slate-400'
                                  : 'border-slate-300'
                              }`}
                              title={c.name}
                            />
                          ))}

                          <input
                            type="color"
                            value={styleObj.borderColor || '#D97706'}
                            onChange={(e) => {
                              const currentSt = getStyleObj();
                              const nextStyle = { ...currentSt, borderColor: e.target.value };
                              onUpdateElement({ borderColor: e.target.value, styleConfig: nextStyle });
                            }}
                            className="w-6 h-6 p-0 border border-slate-200 rounded-md cursor-pointer ml-auto"
                            title="Custom border color"
                          />
                        </div>
                      </div>

                      {/* Border Style: Solid vs Dashed */}
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => updateStyleConfig({ borderStyle: 'solid' })}
                          className={`py-1 rounded-lg border text-xs font-semibold ${
                            (styleObj.borderStyle || 'solid') === 'solid'
                              ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold'
                              : 'bg-white border-slate-200 text-slate-600'
                          }`}
                        >
                          Solid Stroke
                        </button>
                        <button
                          type="button"
                          onClick={() => updateStyleConfig({ borderStyle: 'dashed' })}
                          className={`py-1 rounded-lg border text-xs font-semibold ${
                            styleObj.borderStyle === 'dashed'
                              ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold'
                              : 'bg-white border-slate-200 text-slate-600'
                          }`}
                        >
                          Dashed Stroke
                        </button>
                      </div>

                      {/* Drop Shadow Elevation Presets */}
                      <div className="pt-1">
                        <span className="text-[10px] text-slate-400 block mb-1">Frame Outer Shadow / Glow</span>
                        <div className="grid grid-cols-4 gap-1">
                          {[
                            { label: 'None', blur: 0 },
                            { label: 'Soft', blur: 8 },
                            { label: 'Deep', blur: 16 },
                            { label: 'Glow', blur: 24, shadowColor: 'rgba(217, 119, 6, 0.45)' },
                          ].map((sh) => {
                            const curBlur = Number(styleObj.shadowBlur || 0);
                            const isSel = curBlur === sh.blur;
                            return (
                              <button
                                key={sh.label}
                                type="button"
                                onClick={() => {
                                  updateStyleConfig({
                                    shadowBlur: sh.blur,
                                    shadowColor: sh.shadowColor || 'rgba(0,0,0,0.25)',
                                    shadowOffsetY: sh.blur > 0 ? 4 : 0,
                                  });
                                }}
                                className={`py-1 rounded-lg border text-[10px] font-bold text-center ${
                                  isSel
                                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                {sh.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Photo Blend Mode & Opacity */}
                      <div className="pt-2 border-t border-slate-200/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Photo Blend Mode &amp; Compositing
                          </span>
                          <span className="text-[10px] font-mono text-blue-600 font-bold uppercase">
                            {selectedElement.blendMode || styleObj.blendMode || 'normal'}
                          </span>
                        </div>

                        {/* Blend Mode Select */}
                        <div>
                          <select
                            value={selectedElement.blendMode || styleObj.blendMode || 'normal'}
                            onChange={(e) => {
                              const val = e.target.value;
                              const currentSt = getStyleObj();
                              const nextStyle = { ...currentSt, blendMode: val };
                              onUpdateElement({ blendMode: val, styleConfig: nextStyle });
                            }}
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl text-slate-800 bg-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs cursor-pointer"
                          >
                            <optgroup label="Standard">
                              <option value="normal">Normal (Source Over)</option>
                            </optgroup>
                            <optgroup label="Darken (Blends White Away)">
                              <option value="multiply">Multiply (Darken &amp; Blend)</option>
                              <option value="darken">Darken (Retain Darkest Pixels)</option>
                              <option value="color-burn">Color Burn (Deep Contrast)</option>
                            </optgroup>
                            <optgroup label="Lighten (Blends Black Away)">
                              <option value="screen">Screen (Lighten &amp; Glow)</option>
                              <option value="lighten">Lighten (Retain Lightest Pixels)</option>
                              <option value="color-dodge">Color Dodge (Bright Vivid)</option>
                              <option value="lighter">Lighter / Add (Additive Wash)</option>
                            </optgroup>
                            <optgroup label="Contrast &amp; Lighting">
                              <option value="overlay">Overlay (Dual Tone Contrast)</option>
                              <option value="soft-light">Soft Light (Subtle Ambient)</option>
                              <option value="hard-light">Hard Light (Direct Spotlight)</option>
                            </optgroup>
                            <optgroup label="Inversion &amp; Creative">
                              <option value="difference">Difference (Inverted Color)</option>
                              <option value="exclusion">Exclusion (Soft Invert)</option>
                            </optgroup>
                            <optgroup label="Color &amp; Luminance">
                              <option value="hue">Hue (Tone Blend)</option>
                              <option value="saturation">Saturation (Purity Blend)</option>
                              <option value="color">Color (Hue + Chroma Blend)</option>
                              <option value="luminosity">Luminosity (Brightness Blend)</option>
                            </optgroup>
                          </select>
                        </div>

                        {/* Opacity Slider */}
                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[10px] text-slate-400">Photo Opacity</span>
                            <span className="font-mono text-[10px] text-slate-600 font-bold">
                              {Math.round((selectedElement.opacity !== undefined ? selectedElement.opacity : (styleObj.opacity !== undefined ? styleObj.opacity : 1)) * 100)}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={selectedElement.opacity !== undefined ? selectedElement.opacity : (styleObj.opacity !== undefined ? styleObj.opacity : 1)}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              const currentSt = getStyleObj();
                              const nextStyle = { ...currentSt, opacity: val };
                              onUpdateElement({ opacity: val, styleConfig: nextStyle });
                            }}
                            className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ); })()}

                {/* Upload / Replace Image File */}
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Replace Image File</span>
                  <label className="flex items-center justify-center gap-1.5 w-full py-2 px-3 border border-dashed border-blue-300 bg-blue-50/50 hover:bg-blue-50 text-blue-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingImage ? 'Uploading Image...' : 'Upload New Image File'}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={handleUploadImage}
                      disabled={isUploadingImage}
                    />
                  </label>
                </div>

                {/* Fit Mode */}
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Object Fit Mode</span>
                  <div className="grid grid-cols-3 gap-1">
                    {(['cover', 'contain', 'fill'] as const).map((fit) => (
                      <button
                        key={fit}
                        type="button"
                        onClick={() => updateStyleConfig({ objectFit: fit })}
                        className={`py-1 rounded-lg border text-xs capitalize font-bold ${
                          (styleObj.objectFit || 'cover') === fit
                            ? 'bg-blue-50 text-blue-700 border-blue-400'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {fit}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Corner Radius */}
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] text-slate-400">Corner Radius</span>
                    <span className="font-mono text-[10px] text-slate-600">
                      {selectedElement.borderRadius || styleObj.borderRadius || 0}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={selectedElement.borderRadius || styleObj.borderRadius || 0}
                    onChange={(e) => {
                      const r = Number(e.target.value);
                      onUpdateElement({ borderRadius: r });
                      updateStyleConfig({ borderRadius: r });
                    }}
                    className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. APPEARANCE (BORDER, RADIUS & SHADOW) */}
        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => toggleSection('appearance')}
            className="flex items-center justify-between w-full font-bold text-slate-800 text-xs py-1"
          >
            <span className="flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-blue-600" />
              Border, Fill & Shadow
            </span>
            {openSections.appearance ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          {openSections.appearance && (
            <div className="mt-2.5 space-y-3">
              {/* Fill color for Shapes */}
              {isShape && (
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Fill Color</span>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="color"
                      value={selectedElement.backgroundColor || styleObj.fillColor || '#3B82F6'}
                      onChange={(e) => {
                        onUpdateElement({ backgroundColor: e.target.value });
                        updateStyleConfig({ fillColor: e.target.value });
                      }}
                      className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={selectedElement.backgroundColor || styleObj.fillColor || '#3B82F6'}
                      onChange={(e) => {
                        onUpdateElement({ backgroundColor: e.target.value });
                        updateStyleConfig({ fillColor: e.target.value });
                      }}
                      className="w-24 px-2 py-1 border border-slate-200 rounded font-mono text-xs uppercase"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          onUpdateElement({ backgroundColor: c });
                          updateStyleConfig({ fillColor: c });
                        }}
                        style={{ backgroundColor: c }}
                        className="w-5 h-5 rounded-md border border-slate-200 hover:scale-110 transition-transform shadow-2xs"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Border Stroke */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 block">Border Stroke</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Border Width ({selectedElement.borderWidth || styleObj.borderWidth || 0}px)</span>
                    <input
                      type="range"
                      min="0"
                      max="24"
                      value={selectedElement.borderWidth || styleObj.borderWidth || 0}
                      onChange={(e) => {
                        const bw = Number(e.target.value);
                        onUpdateElement({ borderWidth: bw });
                        updateStyleConfig({ borderWidth: bw });
                      }}
                      className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Border Color</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={selectedElement.borderColor || styleObj.borderColor || '#D97706'}
                        onChange={(e) => {
                          onUpdateElement({ borderColor: e.target.value });
                          updateStyleConfig({ borderColor: e.target.value });
                        }}
                        className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={selectedElement.borderColor || styleObj.borderColor || '#D97706'}
                        onChange={(e) => {
                          onUpdateElement({ borderColor: e.target.value });
                          updateStyleConfig({ borderColor: e.target.value });
                        }}
                        className="w-20 px-1.5 py-0.5 border border-slate-200 rounded font-mono text-[11px] uppercase"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Box Shadow */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-bold">Drop Shadow</span>
                  <input
                    type="checkbox"
                    checked={Boolean(selectedElement.shadowEnabled || styleObj.shadowEnabled)}
                    onChange={(e) => {
                      onUpdateElement({ shadowEnabled: e.target.checked });
                      updateStyleConfig({ shadowEnabled: e.target.checked });
                    }}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>

                {(selectedElement.shadowEnabled || styleObj.shadowEnabled) && (
                  <div className="space-y-2 pl-2 border-l-2 border-blue-200">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">Blur Radius</span>
                        <input
                          type="number"
                          value={selectedElement.shadowBlur ?? styleObj.shadowBlur ?? 8}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            onUpdateElement({ shadowBlur: v });
                            updateStyleConfig({ shadowBlur: v });
                          }}
                          className="w-full px-2 py-0.5 border border-slate-200 rounded font-mono text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">Shadow Color</span>
                        <input
                          type="color"
                          value={selectedElement.shadowColor || styleObj.shadowColor || '#000000'}
                          onChange={(e) => {
                            onUpdateElement({ shadowColor: e.target.value });
                            updateStyleConfig({ shadowColor: e.target.value });
                          }}
                          className="w-full h-7 rounded border border-slate-200 cursor-pointer p-0.5"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 6. SOCIAL MEDIA BAR CONFIG (IF SOCIAL_ICONS) */}
        {isSocial && (
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-blue-600" />
              Social Media Bar Properties
            </span>

            {/* Layout Orientation */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updateStyleConfig({ layout: 'horizontal' })}
                className={`py-1.5 rounded-lg border font-bold text-xs ${
                  styleObj.layout !== 'vertical' ? 'bg-blue-600 text-white' : 'border-slate-200 text-slate-700'
                }`}
              >
                Horizontal Row
              </button>
              <button
                type="button"
                onClick={() => updateStyleConfig({ layout: 'vertical' })}
                className={`py-1.5 rounded-lg border font-bold text-xs ${
                  styleObj.layout === 'vertical' ? 'bg-blue-600 text-white' : 'border-slate-200 text-slate-700'
                }`}
              >
                Vertical Column
              </button>
            </div>

            {/* Username / Handle */}
            <div>
              <span className="text-[10px] text-slate-400 block mb-0.5">Handle / Username</span>
              <input
                type="text"
                value={selectedElement.defaultValue || styleObj.username || ''}
                onChange={(e) => {
                  onUpdateElement({ defaultValue: e.target.value });
                  updateStyleConfig({ username: e.target.value });
                }}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-800 bg-slate-50 text-xs font-semibold"
                placeholder="@jbn_ahmedabad"
              />
            </div>
          </div>
        )}

        {/* 7. LAYER STACKING & REORDERING */}
        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => toggleSection('layers')}
            className="flex items-center justify-between w-full font-bold text-slate-800 text-xs py-1"
          >
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              Layer Order & Hierarchy
            </span>
            {openSections.layers ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          {openSections.layers && (
            <div className="mt-2.5 space-y-2.5">
              <div className="grid grid-cols-4 gap-1">
                <button
                  type="button"
                  onClick={() => onReorderElement(selectedElement.id, 'front')}
                  className="py-1 px-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] font-semibold text-slate-700 text-center"
                  title="Bring to Front"
                >
                  To Front
                </button>
                <button
                  type="button"
                  onClick={() => onReorderElement(selectedElement.id, 'up')}
                  className="py-1 px-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] font-semibold text-slate-700 text-center flex items-center justify-center gap-0.5"
                  title="Move Forward"
                >
                  <ArrowUp className="w-3 h-3" /> Up
                </button>
                <button
                  type="button"
                  onClick={() => onReorderElement(selectedElement.id, 'down')}
                  className="py-1 px-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] font-semibold text-slate-700 text-center flex items-center justify-center gap-0.5"
                  title="Move Backward"
                >
                  <ArrowDown className="w-3 h-3" /> Down
                </button>
                <button
                  type="button"
                  onClick={() => onReorderElement(selectedElement.id, 'back')}
                  className="py-1 px-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] font-semibold text-slate-700 text-center"
                  title="Send to Back"
                >
                  To Back
                </button>
              </div>

              {/* Full Layer Hierarchy List */}
              <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                {elements
                  .slice()
                  .reverse()
                  .map((el) => {
                    const isCurrent = el.id === selectedElement.id;
                    return (
                      <div
                        key={el.id}
                        onClick={() => onSelectElement(el.id)}
                        className={`p-1.5 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                          isCurrent
                            ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate max-w-[170px]">{el.name}</span>
                        <div className="flex items-center gap-1">
                          {el.isLocked && <Lock className="w-3 h-3 text-amber-500" />}
                          {el.isVisible === false && <EyeOff className="w-3 h-3 text-slate-400" />}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {/* 8. ADVANCED (OPACITY & BLEND MODE) */}
        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => toggleSection('advanced')}
            className="flex items-center justify-between w-full font-bold text-slate-800 text-xs py-1"
          >
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              Advanced & Compositing
            </span>
            {openSections.advanced ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          {openSections.advanced && (
            <div className="mt-2.5 space-y-3">
              {/* Opacity */}
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] text-slate-400">Opacity</span>
                  <span className="font-mono text-[10px] text-slate-600">
                    {Math.round((selectedElement.opacity !== undefined ? selectedElement.opacity : (styleObj.opacity !== undefined ? styleObj.opacity : 1)) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={selectedElement.opacity !== undefined ? selectedElement.opacity : (styleObj.opacity !== undefined ? styleObj.opacity : 1)}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    const currentSt = getStyleObj();
                    const nextStyle = { ...currentSt, opacity: val };
                    onUpdateElement({ opacity: val, styleConfig: nextStyle });
                  }}
                  className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>

              {/* Blend Mode */}
              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">Blend Mode &amp; Compositing</span>
                <select
                  value={selectedElement.blendMode || styleObj.blendMode || 'normal'}
                  onChange={(e) => {
                    const val = e.target.value;
                    const currentSt = getStyleObj();
                    const nextStyle = { ...currentSt, blendMode: val };
                    onUpdateElement({ blendMode: val, styleConfig: nextStyle });
                  }}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl text-slate-800 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs cursor-pointer"
                >
                  <optgroup label="Standard">
                    <option value="normal">Normal (Source Over)</option>
                  </optgroup>
                  <optgroup label="Darken (Blends White Away)">
                    <option value="multiply">Multiply (Darken &amp; Blend)</option>
                    <option value="darken">Darken (Retain Darkest Pixels)</option>
                    <option value="color-burn">Color Burn (Deep Contrast)</option>
                  </optgroup>
                  <optgroup label="Lighten (Blends Black Away)">
                    <option value="screen">Screen (Lighten &amp; Glow)</option>
                    <option value="lighten">Lighten (Retain Lightest Pixels)</option>
                    <option value="color-dodge">Color Dodge (Bright Vivid)</option>
                    <option value="lighter">Lighter / Add (Additive Wash)</option>
                  </optgroup>
                  <optgroup label="Contrast &amp; Lighting">
                    <option value="overlay">Overlay (Dual Tone Contrast)</option>
                    <option value="soft-light">Soft Light (Subtle Ambient)</option>
                    <option value="hard-light">Hard Light (Direct Spotlight)</option>
                  </optgroup>
                  <optgroup label="Inversion &amp; Creative">
                    <option value="difference">Difference (Inverted Color)</option>
                    <option value="exclusion">Exclusion (Soft Invert)</option>
                  </optgroup>
                  <optgroup label="Color &amp; Luminance">
                    <option value="hue">Hue (Tone Blend)</option>
                    <option value="saturation">Saturation (Purity Blend)</option>
                    <option value="color">Color (Hue + Chroma Blend)</option>
                    <option value="luminosity">Luminosity (Brightness Blend)</option>
                  </optgroup>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
