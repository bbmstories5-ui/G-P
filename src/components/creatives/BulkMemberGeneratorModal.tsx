'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Users,
  UserCheck,
  Sparkles,
  Download,
  CheckCircle2,
  Trash2,
  Plus,
  Search,
  X,
  Layers,
  RefreshCw,
  Check,
  Calendar,
  Phone,
  Upload,
  ArrowRight,
  FolderOpen,
  Camera,
  Image as ImageIcon,
  CheckSquare,
  Square,
  ShieldAlert,
} from 'lucide-react';
import { renderCreativeOnCanvas } from '@/lib/creativeCanvasRenderer';
import { tabFetch } from '@/lib/tabAuth';

export interface PlaceholderColDef {
  key: string;
  name: string;
  type: 'text' | 'image' | 'textarea';
  isRequired?: boolean;
}

/**
 * Dynamically extract all placeholders actually used by the selected template
 */
export function getTemplatePlaceholders(template: any, categoryCode: string): PlaceholderColDef[] {
  if (!template) return [];

  // 1. If template has elements defined (Super Admin configured elements)
  const dynamicElements = (template.elements || []).filter(
    (el: any) =>
      (el.elementType === 'DYNAMIC_FIELD' || el.elementType === 'MEMBER_PHOTO' || el.elementType === 'COMPANY_LOGO') &&
      !el.isLocked &&
      el.isVisible !== false
  );

  if (dynamicElements.length > 0) {
    const cols: PlaceholderColDef[] = [];
    const seenKeys = new Set<string>();

    dynamicElements.forEach((el: any) => {
      let key = el.fieldKey;
      if (!key) {
        if (el.elementType === 'MEMBER_PHOTO') key = 'photoUrl';
        else key = el.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      }

      if (key === 'photo') key = 'photoUrl';
      if (seenKeys.has(key)) return;
      seenKeys.add(key);

      const isImage = el.elementType === 'MEMBER_PHOTO' || key === 'photoUrl' || key === 'avatar';
      const isTextarea =
        (el.maxLines && el.maxLines > 1) ||
        key === 'birthdayWish' ||
        key === 'specificAsk' ||
        key === 'meetingStimulant';

      cols.push({
        key,
        name: el.name || (isImage ? 'Member Photo' : key),
        type: isImage ? 'image' : isTextarea ? 'textarea' : 'text',
        isRequired: el.isRequired !== false,
      });
    });

    // Sort to put memberName first, image last or sensible order
    cols.sort((a, b) => {
      if (a.key === 'memberName') return -1;
      if (b.key === 'memberName') return 1;
      if (a.type === 'image') return 1;
      if (b.type === 'image') return -1;
      return 0;
    });

    return cols;
  }

  // 2. Fallback based on Category Code
  const cat = template.category?.code || categoryCode;
  if (cat === 'BIRTHDAY') {
    return [
      { key: 'memberName', name: 'Member Name', type: 'text', isRequired: true },
      { key: 'phone', name: 'Mobile / Phone', type: 'text', isRequired: true },
      { key: 'birthDay', name: 'Birthday Date', type: 'text', isRequired: true },
      { key: 'birthdayWish', name: 'Birthday Wish', type: 'textarea', isRequired: false },
      { key: 'photoUrl', name: 'Member Photo', type: 'image', isRequired: false },
    ];
  } else if (cat === 'BUSINESS_PRESENTATION') {
    return [
      { key: 'memberName', name: 'Member Name', type: 'text', isRequired: true },
      { key: 'companyName', name: 'Company Name', type: 'text', isRequired: true },
      { key: 'businessCategory', name: 'Business Category', type: 'text', isRequired: false },
      { key: 'phone', name: 'Mobile / Phone', type: 'text', isRequired: true },
      { key: 'specificAsk', name: 'Specific Ask', type: 'textarea', isRequired: false },
      { key: 'photoUrl', name: 'Member Photo', type: 'image', isRequired: false },
    ];
  } else if (cat === 'KYM') {
    return [
      { key: 'memberName', name: 'Member Name', type: 'text', isRequired: true },
      { key: 'companyName', name: 'Company Name', type: 'text', isRequired: true },
      { key: 'businessCategory', name: 'Business Category', type: 'text', isRequired: false },
      { key: 'phone', name: 'Mobile / Phone', type: 'text', isRequired: true },
      { key: 'photoUrl', name: 'Member Photo', type: 'image', isRequired: false },
    ];
  } else {
    // MEETING_ANNOUNCEMENT
    return [
      { key: 'memberName', name: 'Member Name', type: 'text', isRequired: false },
      { key: 'date', name: 'Meeting Date', type: 'text', isRequired: true },
      { key: 'time', name: 'Meeting Time', type: 'text', isRequired: true },
      { key: 'venue', name: 'Venue Location', type: 'text', isRequired: true },
      { key: 'meetingStimulant', name: 'Meeting Stimulant', type: 'textarea', isRequired: false },
      { key: 'photoUrl', name: 'Member Photo', type: 'image', isRequired: false },
    ];
  }
}

interface BulkMemberGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTemplate: any;
  allTemplates: any[];
  membersList: any[];
  selectedLogo: any;
  formData: any;
  activeCategoryCode: string;
  onCreativesGenerated: (newCreatives: any[]) => void;
  onGoToGraphicsTab: () => void;
}

export default function BulkMemberGeneratorModal({
  isOpen,
  onClose,
  selectedTemplate,
  allTemplates = [],
  membersList = [],
  selectedLogo,
  formData,
  activeCategoryCode,
  onCreativesGenerated,
  onGoToGraphicsTab,
}: BulkMemberGeneratorModalProps) {
  // Modal Mode: 'config' | 'generating' | 'completed'
  const [modalMode, setModalMode] = useState<'config' | 'generating' | 'completed'>('config');

  // Input Tab: 'directory' | 'manual'
  const [inputTab, setInputTab] = useState<'directory' | 'manual'>('manual');

  // Directory Selection
  const [searchQuery, setSearchQuery] = useState('');
  const [monthFilter, setMonthFilter] = useState('ALL');
  const [selectedDirectoryMemberIds, setSelectedDirectoryMemberIds] = useState<Set<string>>(new Set());

  // Dynamically extract active placeholders for selected template
  const placeholderColumns = useMemo(() => {
    return getTemplatePlaceholders(selectedTemplate, activeCategoryCode);
  }, [selectedTemplate, activeCategoryCode]);

  // Dynamic Manual Member Rows (stores all placeholder keys dynamically)
  const [manualRows, setManualRows] = useState<Record<string, any>[]>([
    {
      id: 'row-1',
      memberName: formData?.memberName || '',
      phone: formData?.mobileNumber || formData?.phone || '',
      mobileNumber: formData?.mobileNumber || formData?.phone || '',
      companyName: formData?.companyName || '',
      businessCategory: formData?.businessCategory || '',
      birthDay: formData?.birthDay || '15th',
      birthMonth: formData?.birthMonth || 'October',
      photoUrl: formData?.photoUrl || '',
      birthdayWish: formData?.birthdayWish || 'Wishing you great success, happiness and prosperity!',
    },
  ]);

  // Track all uploaded photo URLs in this session so they can be deleted/cleaned up next
  const [uploadedPhotoUrls, setUploadedPhotoUrls] = useState<string[]>([]);
  const [autoDeletePhotosAfterGen, setAutoDeletePhotosAfterGen] = useState(true);
  const [isUploadingPhotoRowId, setIsUploadingPhotoRowId] = useState<string | null>(null);

  // Quick Paste
  const [quickPasteText, setQuickPasteText] = useState('');
  const [showQuickPaste, setShowQuickPaste] = useState(false);

  // Selected Templates for Generation (Multiple templates supported!)
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<string>>(new Set());

  // Output format: PNG | JPG
  const [outputFormat, setOutputFormat] = useState<'PNG' | 'JPG'>('PNG');

  // Generation Progress
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalToGenerate, setTotalToGenerate] = useState(0);
  const [currentStatusText, setCurrentStatusText] = useState('');
  const [generatedResults, setGeneratedResults] = useState<any[]>([]);
  const [photosCleanedUpCount, setPhotosCleanedUpCount] = useState<number | null>(null);

  // Hidden offscreen canvas
  const offscreenCanvasRef = useRef<HTMLCanvasElement>(null);
  const isCancelledRef = useRef(false);

  // Initialize selected templates when modal opens
  useEffect(() => {
    if (isOpen) {
      setModalMode('config');
      setGeneratedResults([]);
      setPhotosCleanedUpCount(null);
      isCancelledRef.current = false;
      if (selectedTemplate?.id) {
        setSelectedTemplateIds(new Set([selectedTemplate.id]));
      }
    }
  }, [isOpen, selectedTemplate]);

  if (!isOpen) return null;

  // Filter templates belonging to current category
  const categoryTemplates = allTemplates.filter(
    (t) =>
      t.categoryId === selectedTemplate?.categoryId ||
      t.category?.code === (selectedTemplate?.category?.code || activeCategoryCode)
  );

  // Filter directory members
  const filteredDirectoryMembers = membersList.filter((m) => {
    const matchesSearch =
      !searchQuery ||
      m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phone?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesMonth =
      monthFilter === 'ALL' ||
      (m.birthMonth && m.birthMonth.toLowerCase() === monthFilter.toLowerCase());

    return matchesSearch && matchesMonth;
  });

  // Toggle directory member selection
  const toggleDirectoryMember = (id: string) => {
    setSelectedDirectoryMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllFilteredDirectory = () => {
    setSelectedDirectoryMemberIds((prev) => {
      const next = new Set(prev);
      filteredDirectoryMembers.forEach((m) => next.add(m.id));
      return next;
    });
  };

  const deselectAllFilteredDirectory = () => {
    setSelectedDirectoryMemberIds(new Set());
  };

  // Toggle template selection
  const toggleTemplate = (id: string) => {
    setSelectedTemplateIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id); // Keep at least one
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Add / Edit / Remove Manual Rows
  const addManualRow = () => {
    const newRow: Record<string, any> = {
      id: `row-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    placeholderColumns.forEach((col) => {
      newRow[col.key] = col.key === 'birthDay' ? '15th' : '';
    });
    setManualRows((prev) => [...prev, newRow]);
  };

  const updateManualRowValue = (rowId: string, fieldKey: string, value: any) => {
    setManualRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, [fieldKey]: value } : row))
    );
  };

  const removeManualRow = (rowId: string) => {
    setManualRows((prev) => prev.filter((row) => row.id !== rowId));
  };

  // Upload Photo for a specific Row
  const handleUploadPhotoForRow = async (rowId: string, colKey: string, file: File) => {
    if (!file) return;
    setIsUploadingPhotoRowId(rowId);

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

      // Save url to row
      updateManualRowValue(rowId, colKey, json.url);
      setUploadedPhotoUrls((prev) => [...prev, json.url]);
    } catch (err: any) {
      console.error('Photo upload failed:', err);
      alert(err.message || 'Photo upload failed. Please try a valid PNG or JPG.');
    } finally {
      setIsUploadingPhotoRowId(null);
    }
  };

  // Delete / Remove Photo from a specific Row
  const handleRemovePhoto = async (rowId: string, colKey: string) => {
    const targetRow = manualRows.find((r) => r.id === rowId);
    const photoUrl = targetRow?.[colKey];

    // Remove from row state immediately
    updateManualRowValue(rowId, colKey, '');

    // If it was uploaded during this session, delete file from storage
    if (photoUrl && photoUrl.startsWith('/uploads/')) {
      try {
        await tabFetch(`/api/upload?url=${encodeURIComponent(photoUrl)}`, { method: 'DELETE' });
        setUploadedPhotoUrls((prev) => prev.filter((u) => u !== photoUrl));
      } catch (err) {
        console.warn('Could not delete photo from storage:', err);
      }
    }
  };

  // Quick Paste parsing
  const handleApplyQuickPaste = () => {
    if (!quickPasteText.trim()) return;
    const lines = quickPasteText.split('\n').filter((l) => l.trim().length > 0);
    const parsedRows: Record<string, any>[] = lines.map((line, idx) => {
      const parts = line.split(/[,;\t]/).map((p) => p.trim());
      const row: Record<string, any> = {
        id: `paste-${Date.now()}-${idx}`,
      };

      // Assign sequentially to placeholder columns
      placeholderColumns.forEach((col, cIdx) => {
        if (col.type !== 'image') {
          row[col.key] = parts[cIdx] || '';
        } else {
          row[col.key] = '';
        }
      });

      // Special fallback if first column wasn't memberName
      if (!row.memberName && parts[0]) row.memberName = parts[0];
      if (!row.phone && parts[1]) row.phone = parts[1];

      return row;
    });

    setManualRows((prev) => [
      ...prev.filter((r) => r.memberName && r.memberName.trim() !== ''),
      ...parsedRows,
    ]);
    setQuickPasteText('');
    setShowQuickPaste(false);
  };

  // Compile active members for generation
  const getActiveMembersToGenerate = (): Record<string, any>[] => {
    if (inputTab === 'directory') {
      return membersList
        .filter((m) => selectedDirectoryMemberIds.has(m.id))
        .map((m) => ({
          id: m.id,
          memberName: m.name,
          phone: m.phone || m.mobileNumber || '',
          mobileNumber: m.phone || m.mobileNumber || '',
          companyName: m.company || '',
          photoUrl: m.avatar || m.photoUrl || '',
          birthDay: m.birthDay || '15th',
          birthMonth: m.birthMonth || 'October',
          birthdayWish: formData?.birthdayWish || 'Wishing you boundless success and joy!',
        }));
    } else {
      return manualRows.filter((r) => (r.memberName || '').trim().length > 0);
    }
  };

  const activeMembers = getActiveMembersToGenerate();
  const activeTemplates = allTemplates.filter((t) => selectedTemplateIds.has(t.id));
  const totalGenerations = activeMembers.length * activeTemplates.length;

  // Run Bulk Generation
  const handleStartBulkGeneration = async () => {
    if (activeMembers.length === 0) {
      alert('Please select or enter at least one member with a Member Name.');
      return;
    }
    if (activeTemplates.length === 0) {
      alert('Please select at least one template.');
      return;
    }

    setModalMode('generating');
    setCurrentIndex(0);
    setTotalToGenerate(totalGenerations);
    setGeneratedResults([]);
    isCancelledRef.current = false;

    const canvas = offscreenCanvasRef.current;
    if (!canvas) {
      alert('Offscreen canvas unavailable');
      setModalMode('config');
      return;
    }

    const createdCreatives: any[] = [];
    let count = 0;

    for (const member of activeMembers) {
      for (const tpl of activeTemplates) {
        if (isCancelledRef.current) break;

        count++;
        setCurrentIndex(count);
        setCurrentStatusText(
          `Rendering "${member.memberName}" on "${tpl.name}" (${count}/${totalGenerations})...`
        );

        try {
          // Prepare member-specific data incorporating all placeholder fields
          const memberData = {
            ...formData,
            ...member,
            phone: member.phone || member.mobileNumber || formData?.phone || '',
            mobileNumber: member.mobileNumber || member.phone || formData?.mobileNumber || '',
            companyName: member.companyName || formData?.companyName || '',
            photoUrl: member.photoUrl || formData?.photoUrl || '',
            birthDay: member.birthDay || formData?.birthDay || '15th',
            birthMonth: member.birthMonth || formData?.birthMonth || 'October',
          };

          // Parse stylingConfig
          let stylingCfg: any = null;
          try {
            stylingCfg =
              typeof tpl.stylingConfig === 'string'
                ? JSON.parse(tpl.stylingConfig)
                : tpl.stylingConfig;
          } catch {}

          // Render onto canvas
          await renderCreativeOnCanvas(canvas, {
            categoryCode:
              tpl.category?.code || selectedTemplate?.category?.code || activeCategoryCode,
            templateSlug: tpl.slug,
            themeStyle: tpl.themeStyle || 'white-gold',
            layoutVariant: tpl.layoutVariant || 'variant-1',
            width: tpl.width || 1080,
            height: tpl.height || 1080,
            baseDesignUrl: tpl.baseDesignUrl,
            elements: tpl.elements && tpl.elements.length > 0 ? tpl.elements : undefined,
            stylingConfig: stylingCfg,
            logoUrl: selectedLogo?.logoUrl,
            darkLogoUrl: selectedLogo?.darkLogoUrl,
            logoPosition: tpl.logoPosition || 'top-left',
            logoMaxWidth: tpl.logoMaxWidth || 190,
            logoMaxHeight: tpl.logoMaxHeight || 65,
            data: memberData,
          });

          // Convert to dataUrl
          const mime = outputFormat === 'PNG' ? 'image/png' : 'image/jpeg';
          const ext = outputFormat === 'PNG' ? 'png' : 'jpg';
          const dataUrl = canvas.toDataURL(mime, 0.95);

          const title = `${tpl.name} - ${member.memberName}`;

          // Save to database
          const res = await tabFetch('/api/creatives', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              categoryId: tpl.categoryId || selectedTemplate?.categoryId,
              templateId: tpl.id,
              logoId: selectedLogo?.id || null,
              title,
              referralGroupName: formData?.referralGroupName,
              memberName: member.memberName,
              formData: memberData,
              imageData: dataUrl,
              outputFormat,
              dimensions: `${tpl.width || 1080}x${tpl.height || 1080}`,
            }),
          });

          const json = await res.json();
          if (res.ok && json.creative) {
            createdCreatives.push({
              ...json.creative,
              dataUrl,
              memberName: member.memberName,
              templateName: tpl.name,
              ext,
            });
            setGeneratedResults([...createdCreatives]);
          }
        } catch (err) {
          console.error(`Failed to generate creative for ${member.memberName} on ${tpl.name}:`, err);
        }

        // Brief delay between renders for UI responsiveness
        await new Promise((r) => setTimeout(r, 60));
      }
    }

    // "one time bulk tampleted create next deleted this member photo"
    // Auto-clean up / delete temporary uploaded photos from disk storage after batch generation finishes
    if (autoDeletePhotosAfterGen && uploadedPhotoUrls.length > 0) {
      let cleaned = 0;
      for (const pUrl of uploadedPhotoUrls) {
        if (pUrl && pUrl.startsWith('/uploads/')) {
          try {
            await tabFetch(`/api/upload?url=${encodeURIComponent(pUrl)}`, { method: 'DELETE' });
            cleaned++;
          } catch (e) {
            console.warn('Failed to auto-delete uploaded photo:', pUrl, e);
          }
        }
      }
      setPhotosCleanedUpCount(cleaned);

      // Clear photoUrl from manual rows so they are removed
      setManualRows((prev) =>
        prev.map((r) => ({
          ...r,
          photoUrl: '',
        }))
      );
      setUploadedPhotoUrls([]);
    }

    if (createdCreatives.length > 0) {
      onCreativesGenerated(createdCreatives);
    }
    setModalMode('completed');
  };

  // Manual trigger to clean up all uploaded photos immediately
  const handlePurgeAllUploadedPhotos = async () => {
    if (uploadedPhotoUrls.length === 0) {
      alert('No temporary uploaded photos to delete.');
      return;
    }
    let count = 0;
    for (const pUrl of uploadedPhotoUrls) {
      if (pUrl && pUrl.startsWith('/uploads/')) {
        try {
          await tabFetch(`/api/upload?url=${encodeURIComponent(pUrl)}`, { method: 'DELETE' });
          count++;
        } catch {}
      }
    }
    setManualRows((prev) =>
      prev.map((r) => ({
        ...r,
        photoUrl: '',
      }))
    );
    setUploadedPhotoUrls([]);
    alert(`Successfully deleted ${count} uploaded member photos from storage.`);
  };

  // Download a single generated item
  const handleDownloadItem = (item: any) => {
    const link = document.createElement('a');
    link.href = item.dataUrl || item.fileUrl;
    const safeTitle = (item.title || 'Creative').replace(/[^a-zA-Z0-9_-]/g, '_');
    link.download = `${safeTitle}.${item.ext || 'png'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download all generated items sequentially
  const handleDownloadAllBatch = () => {
    generatedResults.forEach((item, index) => {
      setTimeout(() => {
        handleDownloadItem(item);
      }, index * 250);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Hidden Canvas for High-Resolution Offscreen Rendering */}
      <canvas ref={offscreenCanvasRef} className="hidden" />

      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* ================= MODAL HEADER ================= */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-gradient-to-r from-indigo-50/50 via-white to-blue-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Bulk Member Creative Generator</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                  Batch Multi-Generation
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Using selected template placeholders with photo upload & auto-cleanup after batch creation.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              isCancelledRef.current = true;
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================= MODAL BODY ================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* MODE 1: CONFIGURATION VIEW */}
          {modalMode === 'config' && (
            <>
              {/* 1. USED PLACEHOLDERS SUMMARY CARD */}
              <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-bold text-slate-900">
                      Active Template: <span className="text-blue-700">{selectedTemplate?.name}</span>
                    </h4>
                  </div>
                  <span className="text-[11px] font-semibold text-blue-700">
                    {placeholderColumns.length} Configured Placeholders in this Template
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-500 mr-1">Placeholders:</span>
                  {placeholderColumns.map((col) => (
                    <span
                      key={col.key}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                        col.type === 'image'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : col.isRequired
                          ? 'bg-blue-100 text-blue-800 border-blue-200'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      {col.type === 'image' && <Camera className="w-3 h-3 text-purple-600" />}
                      <span>{col.name}</span>
                      {col.isRequired && <span className="text-rose-500">*</span>}
                    </span>
                  ))}
                </div>
              </div>

              {/* 2. TEMPLATE SELECTION ROW */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Select Templates to Generate ({selectedTemplateIds.size} Selected)
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    You can check multiple templates to generate all members at once!
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-36 overflow-y-auto pr-1">
                  {categoryTemplates.map((tpl) => {
                    const isChecked = selectedTemplateIds.has(tpl.id);
                    return (
                      <div
                        key={tpl.id}
                        onClick={() => toggleTemplate(tpl.id)}
                        className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-indigo-50/80 border-indigo-400 text-indigo-900 font-bold shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                            isChecked
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="truncate text-xs">{tpl.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. MEMBER DETAILS INPUT (DYNAMIC PLACEHOLDERS + IMAGE UPLOAD) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setInputTab('manual')}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        inputTab === 'manual'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Custom / Manual Entry ({manualRows.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setInputTab('directory')}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        inputTab === 'directory'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Select Chapter Members ({membersList.length})</span>
                    </button>
                  </div>

                  <span className="text-xs font-bold text-indigo-700">
                    {activeMembers.length} Members Picked
                  </span>
                </div>

                {/* TAB CONTENT A: CUSTOM / MANUAL ENTRY (DYNAMIC PLACEHOLDER COLUMNS + IMAGE UPLOAD) */}
                {inputTab === 'manual' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="text-xs text-slate-500">
                        Enter details for each placeholder used by this template. Upload photos directly from your device.
                      </p>
                      <div className="flex items-center gap-2">
                        {uploadedPhotoUrls.length > 0 && (
                          <button
                            type="button"
                            onClick={handlePurgeAllUploadedPhotos}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
                            title="Delete all uploaded member photos from storage"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete Uploaded Photos ({uploadedPhotoUrls.length})</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowQuickPaste(!showQuickPaste)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                        >
                          {showQuickPaste ? 'Hide Quick Paste' : '📋 Quick Paste List'}
                        </button>
                        <button
                          type="button"
                          onClick={addManualRow}
                          className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Member Row</span>
                        </button>
                      </div>
                    </div>

                    {/* Quick Paste Accordion */}
                    {showQuickPaste && (
                      <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-2xl space-y-2 text-xs">
                        <p className="font-bold text-indigo-950">
                          Paste Names (one per line, format: <code>Name, Mobile, Birthday</code>):
                        </p>
                        <textarea
                          rows={4}
                          value={quickPasteText}
                          onChange={(e) => setQuickPasteText(e.target.value)}
                          placeholder={"Dhruvik Vanol, +91 83207 63694, 15th\nRajesh Patel, +91 98251 12345, 20th\nSunita Shah, +91 94260 54321, 28th"}
                          className="w-full p-2 bg-white border border-indigo-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                        <button
                          type="button"
                          onClick={handleApplyQuickPaste}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                          Parse & Add to Table
                        </button>
                      </div>
                    )}

                    {/* DYNAMIC PLACEHOLDER TABLE WITH IMAGE UPLOAD & DELETE */}
                    <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-80 overflow-y-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-600 font-bold text-[10px] uppercase border-b border-slate-200 sticky top-0 z-10">
                          <tr>
                            <th className="p-3 w-10">#</th>
                            {placeholderColumns.map((col) => (
                              <th key={col.key} className="p-3 whitespace-nowrap">
                                <span className="flex items-center gap-1">
                                  {col.type === 'image' && <Camera className="w-3 h-3 text-purple-600" />}
                                  <span>{col.name}</span>
                                  {col.isRequired && <span className="text-rose-500">*</span>}
                                </span>
                              </th>
                            ))}
                            <th className="p-3 text-center w-14">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {manualRows.map((row, idx) => (
                            <tr key={row.id} className="hover:bg-slate-50/50">
                              <td className="p-3 text-slate-400 font-semibold">{idx + 1}</td>

                              {placeholderColumns.map((col) => {
                                const val = row[col.key] || '';

                                // A. IMAGE UPLOAD COLUMN (MEMBER PHOTO)
                                if (col.type === 'image') {
                                  const isUploadingThis = isUploadingPhotoRowId === row.id;
                                  return (
                                    <td key={col.key} className="p-3 min-w-[200px]">
                                      <div className="flex items-center gap-2.5">
                                        {/* Thumbnail Preview */}
                                        <div className="relative group/photo w-10 h-10 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 shrink-0 shadow-2xs flex items-center justify-center">
                                          {isUploadingThis ? (
                                            <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
                                          ) : val ? (
                                            <>
                                              <img
                                                src={val}
                                                alt="Member Photo"
                                                className="w-full h-full object-cover"
                                              />
                                              <button
                                                type="button"
                                                onClick={() => handleRemovePhoto(row.id, col.key)}
                                                title="Delete member photo"
                                                className="absolute inset-0 bg-rose-600/80 text-white flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            </>
                                          ) : (
                                            <Camera className="w-4 h-4 text-slate-400" />
                                          )}
                                        </div>

                                        {/* Upload & Delete Actions */}
                                        <div className="flex flex-col gap-1">
                                          <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-bold shadow-2xs transition-colors shrink-0">
                                            <Upload className="w-3 h-3 text-indigo-600" />
                                            <span>{val ? 'Change' : 'Upload Photo'}</span>
                                            <input
                                              type="file"
                                              accept="image/*"
                                              disabled={isUploadingThis}
                                              onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleUploadPhotoForRow(row.id, col.key, file);
                                              }}
                                              className="hidden"
                                            />
                                          </label>

                                          {val && (
                                            <button
                                              type="button"
                                              onClick={() => handleRemovePhoto(row.id, col.key)}
                                              className="inline-flex items-center gap-1 text-[10px] text-rose-600 hover:text-rose-800 font-semibold"
                                            >
                                              <Trash2 className="w-2.5 h-2.5" />
                                              <span>Delete Photo</span>
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </td>
                                  );
                                }

                                // B. TEXTAREA COLUMN (e.g. Birthday Wish, Specific Ask)
                                if (col.type === 'textarea') {
                                  return (
                                    <td key={col.key} className="p-3 min-w-[180px]">
                                      <textarea
                                        rows={1}
                                        value={val}
                                        onChange={(e) =>
                                          updateManualRowValue(row.id, col.key, e.target.value)
                                        }
                                        placeholder={`Enter ${col.name.toLowerCase()}...`}
                                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white resize-none"
                                      />
                                    </td>
                                  );
                                }

                                // C. DEFAULT TEXT COLUMN (Member Name, Phone, Birthday Date, etc.)
                                return (
                                  <td key={col.key} className="p-3 min-w-[150px]">
                                    <input
                                      type="text"
                                      value={val}
                                      onChange={(e) =>
                                        updateManualRowValue(row.id, col.key, e.target.value)
                                      }
                                      placeholder={
                                        col.key === 'birthDay'
                                          ? '15th'
                                          : col.key === 'phone'
                                          ? '+91 83207 63694'
                                          : `Enter ${col.name.toLowerCase()}...`
                                      }
                                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white"
                                    />
                                  </td>
                                );
                              })}

                              <td className="p-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => removeManualRow(row.id)}
                                  disabled={manualRows.length === 1}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded-lg transition-colors"
                                  title="Remove member row"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB CONTENT B: CHAPTER DIRECTORY SELECTION */}
                {inputTab === 'directory' && (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search members by name, company, or phone..."
                          className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={monthFilter}
                          onChange={(e) => setMonthFilter(e.target.value)}
                          className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white"
                        >
                          <option value="ALL">All Months</option>
                          <option value="January">January</option>
                          <option value="February">February</option>
                          <option value="March">March</option>
                          <option value="April">April</option>
                          <option value="May">May</option>
                          <option value="June">June</option>
                          <option value="July">July</option>
                          <option value="August">August</option>
                          <option value="September">September</option>
                          <option value="October">October</option>
                          <option value="November">November</option>
                          <option value="December">December</option>
                        </select>

                        <button
                          type="button"
                          onClick={selectAllFilteredDirectory}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors shrink-0"
                        >
                          Select All ({filteredDirectoryMembers.length})
                        </button>

                        <button
                          type="button"
                          onClick={deselectAllFilteredDirectory}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors shrink-0"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    {filteredDirectoryMembers.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
                        No members found matching your filter criteria.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
                        {filteredDirectoryMembers.map((m) => {
                          const isSelected = selectedDirectoryMemberIds.has(m.id);
                          return (
                            <div
                              key={m.id}
                              onClick={() => toggleDirectoryMember(m.id)}
                              className={`flex items-center justify-between p-2.5 rounded-2xl border cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-indigo-50/80 border-indigo-400 shadow-2xs'
                                  : 'bg-white border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                                  {m.avatar || m.photoUrl ? (
                                    <img
                                      src={m.avatar || m.photoUrl}
                                      alt={m.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-xs font-bold text-slate-600">
                                      {m.name?.[0] || 'M'}
                                    </span>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-900 truncate">
                                    {m.name}
                                  </p>
                                  <p className="text-[10px] text-slate-500 truncate">
                                    {m.birthDay
                                      ? `🎂 ${m.birthDay} ${m.birthMonth || ''}`
                                      : m.company || m.phone || 'Member'}
                                  </p>
                                </div>
                              </div>

                              <div
                                className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ml-2 border ${
                                  isSelected
                                    ? 'bg-indigo-600 border-indigo-600 text-white'
                                    : 'border-slate-300 bg-white'
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* MODE 2: ACTIVE GENERATING VIEW */}
          {modalMode === 'generating' && (
            <div className="py-12 px-4 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 mx-auto flex items-center justify-center animate-spin">
                <RefreshCw className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-slate-900">
                  Generating High-Resolution Creatives in Bulk...
                </h4>
                <p className="text-xs text-slate-500 font-medium">{currentStatusText}</p>
              </div>

              {/* Progress Bar */}
              <div className="max-w-md mx-auto space-y-2">
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${totalToGenerate > 0 ? (currentIndex / totalToGenerate) * 100 : 0}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span>
                    {currentIndex} of {totalToGenerate} Generated
                  </span>
                  <span>
                    {totalToGenerate > 0 ? Math.round((currentIndex / totalToGenerate) * 100) : 0}%
                  </span>
                </div>
              </div>

              {/* Live Finished Previews Strip */}
              {generatedResults.length > 0 && (
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Completed Graphics ({generatedResults.length})
                  </p>
                  <div className="flex items-center justify-center gap-2 overflow-x-auto py-2">
                    {generatedResults.slice(-5).map((item, idx) => (
                      <div
                        key={idx}
                        className="w-16 h-16 rounded-xl border border-slate-200 overflow-hidden shadow-2xs shrink-0"
                      >
                        <img src={item.dataUrl} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  isCancelledRef.current = true;
                  setModalMode('completed');
                }}
                className="text-xs text-rose-600 hover:text-rose-800 font-semibold"
              >
                Cancel Remaining Generations
              </button>
            </div>
          )}

          {/* MODE 3: GENERATION COMPLETED VIEW */}
          {modalMode === 'completed' && (
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-emerald-950">
                      Successfully Generated {generatedResults.length} High-Resolution Creatives!
                    </h4>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      All graphics are saved to your account in &quot;My Generated Graphics&quot; (retained for 15 days).
                    </p>
                    {photosCleanedUpCount !== null && (
                      <p className="text-[11px] text-emerald-700 font-medium mt-1">
                        🗑️ {photosCleanedUpCount} temporary uploaded member photos were automatically deleted from storage after baking into graphics.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleDownloadAllBatch}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download All ({generatedResults.length})</span>
                  </button>
                </div>
              </div>

              {/* Grid of Results */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-96 overflow-y-auto pr-1">
                {generatedResults.map((item, idx) => (
                  <div
                    key={idx}
                    className="border border-slate-200 rounded-2xl p-2.5 bg-white shadow-2xs space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="aspect-square rounded-xl bg-slate-50 border border-slate-100 overflow-hidden mb-2">
                        <img
                          src={item.dataUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-xs font-bold text-slate-900 truncate" title={item.memberName}>
                        {item.memberName}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate" title={item.templateName}>
                        {item.templateName}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDownloadItem(item)}
                      className="w-full py-1.5 rounded-lg text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 flex items-center justify-center gap-1 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ================= MODAL FOOTER ================= */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          {modalMode === 'config' ? (
            <>
              {/* Summary Stats, Format & Auto-delete Toggle */}
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <div>
                  <span className="text-slate-500">Total Graphics: </span>
                  <span className="font-bold text-slate-900">
                    {activeMembers.length} Members × {activeTemplates.length} Templates ={' '}
                    <strong className="text-indigo-600 text-sm">{totalGenerations}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
                  <span className="text-slate-500">Format:</span>
                  <button
                    type="button"
                    onClick={() => setOutputFormat('PNG')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      outputFormat === 'PNG'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    PNG
                  </button>
                  <button
                    type="button"
                    onClick={() => setOutputFormat('JPG')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      outputFormat === 'JPG'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    JPG
                  </button>
                </div>

                {/* Auto-Delete Member Photos Checkbox */}
                <label className="flex items-center gap-2 border-l border-slate-200 pl-4 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={autoDeletePhotosAfterGen}
                    onChange={(e) => setAutoDeletePhotosAfterGen(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-[11px] font-semibold">
                    Auto-delete uploaded photos after batch creation
                  </span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleStartBulkGeneration}
                  disabled={totalGenerations === 0}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 shadow-md shadow-indigo-600/20 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Start Bulk Generation ({totalGenerations})</span>
                </button>
              </div>
            </>
          ) : modalMode === 'completed' ? (
            <>
              <button
                type="button"
                onClick={() => {
                  onGoToGraphicsTab();
                  onClose();
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
              >
                <FolderOpen className="w-4 h-4 text-slate-600" />
                <span>View All in My Generated Graphics</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalMode('config')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Generate More
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                >
                  Done
                </button>
              </div>
            </>
          ) : (
            <div className="w-full text-center text-xs text-slate-400">
              Please wait while your graphics are being generated...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
