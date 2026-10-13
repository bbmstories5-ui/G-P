'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Save,
  CheckCircle,
  Eye,
  Upload,
  Image as ImageIcon,
  Type,
  User,
  Sliders,
  Layers,
  Sparkles,
  Move,
  Trash2,
  Copy,
  Lock,
  Unlock,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Check,
  AlertCircle,
  AlertTriangle,
  Building,
  Calendar,
  Clock,
  Phone,
  Mail,
  Globe,
  HelpCircle,
  Shield,
  FileCheck,
  Maximize2,
  Minimize2,
  X,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Plus,
  ArrowRight,
  ArrowLeft,
  Settings,
  Grid,
  Share2,
  ArrowUp,
  ArrowDown,
  Edit2,
  FolderPlus,
  RotateCw,
} from 'lucide-react';
import { tabFetch } from '@/lib/tabAuth';
import { renderCreativeOnCanvas } from '@/lib/creativeCanvasRenderer';
import ElementPropertiesPanel, { BuilderElement } from '@/components/admin/ElementPropertiesPanel';


const WIZARD_STEPS = [
  { num: 1, label: 'Basic Info', icon: Settings },
  { num: 2, label: 'Artwork', icon: ImageIcon },
  { num: 3, label: 'Official Logos', icon: Shield },
  { num: 4, label: 'Fixed Content', icon: Building },
  { num: 5, label: 'Placeholders', icon: Type },
  { num: 6, label: 'Form Setup', icon: Layers },
  { num: 7, label: 'Live Preview', icon: Eye },
  { num: 8, label: 'Publish', icon: CheckCircle },
];

export default function SuperAdminTemplateBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateIdParam = searchParams.get('id');

  // Wizard Step (1-8)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // UI Panels State
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightInspector, setShowRightInspector] = useState(false);

  // Categories & Logos & Shared Config
  const [categories, setCategories] = useState<any[]>([]);
  const [logoLibrary, setLogoLibrary] = useState<any[]>([]);
  const [sharedFooterConfig, setSharedFooterConfig] = useState<any>(null);

  // Template State
  const [templateId, setTemplateId] = useState<string | null>(templateIdParam);
  const [templateName, setTemplateName] = useState('New Referral Creative Template');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [width, setWidth] = useState(1080);
  const [height, setHeight] = useState(1080);
  const [orientation, setOrientation] = useState<'SQUARE' | 'PORTRAIT' | 'LANDSCAPE'>('SQUARE');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED' | 'INACTIVE'>('DRAFT');
  const [approvalRequired, setApprovalRequired] = useState(false);
  const [baseDesignUrl, setBaseDesignUrl] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Dynamic Elements on Canvas
  const [elements, setElements] = useState<BuilderElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // Canvas Viewport & Tool state
  const [zoom, setZoom] = useState(0.55);
  const [previewMode, setPreviewMode] = useState<'edit' | 'final'>('edit');
  const [sampleMemberIndex, setSampleMemberIndex] = useState(0);
  const [history, setHistory] = useState<BuilderElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [uploadingBase, setUploadingBase] = useState(false);
  const lastSavedSnapshotRef = useRef<string>('');

  // Social Media Bar Config
  const [socialIconsConfig, setSocialIconsConfig] = useState<{
    icons: string[];
    iconSize: number;
    spacing: number;
    layout: 'horizontal' | 'vertical';
    colorMode: 'brand' | 'custom';
    iconColor: string;
    username: string;
  }>({
    icons: ['instagram', 'facebook', 'linkedin', 'youtube', 'whatsapp', 'x'],
    iconSize: 28,
    spacing: 12,
    layout: 'horizontal',
    colorMode: 'brand',
    iconColor: '#1E293B',
    username: '@jbn_ahmedabad',
  });

  // Logo Library Management State
  const [showUploadLogoBox, setShowUploadLogoBox] = useState(false);
  const [newLogoName, setNewLogoName] = useState('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [editingLogoItem, setEditingLogoItem] = useState<any | null>(null);
  const [editLogoName, setEditLogoName] = useState('');
  const [isReplacingLogo, setIsReplacingLogo] = useState(false);

  // Custom Member Placeholder Creator State
  const [customFieldLabel, setCustomFieldLabel] = useState('');
  const [customFieldKey, setCustomFieldKey] = useState('');
  const [customFieldType, setCustomFieldType] = useState<'text' | 'multiline' | 'date' | 'phone' | 'photo'>('text');
  const [customFieldDefault, setCustomFieldDefault] = useState('');
  const [customFieldRequired, setCustomFieldRequired] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Sample Members for Live Previewing
  const sampleMembers = [
    {
      memberName: 'Dr. Ketan Patel',
      companyName: 'DHS Multi Speciality Hospital',
      businessCategory: 'Healthcare & Multispeciality Care',
      referralGroupName: 'JBN PEARL',
      phone: '+91 98250 12345',
      email: 'dr.ketan@dhshospital.com',
      website: 'www.dhshospital.com',
      specificAsk: 'Looking for Corporate Tie-ups and Health Checkup Packages',
      date: 'Friday, 16th October 2026',
      time: '07:30 AM onwards',
      venue: 'The Grand Bhagwati, SG Highway, Ahmedabad',
      meetingStimulant: 'Power of Healthcare Networking',
      dressCode: 'Formal Business Suit',
      visitorFees: '₹1,500 Inclusive of Breakfast',
      birthDay: '16th October',
      birthMonth: 'October',
      photoUrl: '/images/samples/dr-ketan-patel-hero.png',
      customText: 'Special Guest Attendee',
      customNotes: 'Please arrive 15 minutes prior for registration and open networking.',
    },
    {
      memberName: 'Amit Sharma',
      companyName: 'Apex Architectural Systems',
      businessCategory: 'Facade Design & Architecture',
      referralGroupName: 'JBN PEARL',
      phone: '+91 98765 43210',
      email: 'amit@apexarchitectural.com',
      website: 'www.apexarch.com',
      specificAsk: 'Interior Designers and Commercial Real Estate Developers',
      date: 'Tuesday, 20th October 2026',
      time: '08:00 AM',
      venue: 'Courtyard by Marriott, Ramdevnagar, Ahmedabad',
      meetingStimulant: 'Referral Dynamics in Construction',
      dressCode: 'Smart Formals',
      visitorFees: '₹1,200 (Includes Breakfast)',
      birthDay: '20th October',
      birthMonth: 'October',
      photoUrl: '/images/samples/chatgpt_ref_oct9.png',
      customText: 'Keynote Speaker & Business Mentor',
      customNotes: 'Bring 50+ business cards and your company presentation one-pager.',
    },
  ];

  // Delete Template Modal State
  const [showDeleteTemplateModal, setShowDeleteTemplateModal] = useState(false);
  const [confirmDeleteTemplateName, setConfirmDeleteTemplateName] = useState('');
  const [isDeletingTemplate, setIsDeletingTemplate] = useState(false);

  const handleConfirmPermanentDelete = async () => {
    if (!templateIdParam) return;
    if (confirmDeleteTemplateName.trim() !== templateName.trim()) return;

    setIsDeletingTemplate(true);
    try {
      const res = await tabFetch(`/api/creatives/templates?id=${templateIdParam}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (res.ok) {
        alert(json.message || 'Template and all related database records permanently deleted.');
        router.push('/admin/templates');
      } else {
        alert(json.error || 'Failed to delete template');
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      alert(err.message || 'Network error deleting template');
    } finally {
      setIsDeletingTemplate(false);
    }
  };

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        const [catsRes, logosRes, sharedRes] = await Promise.all([
          tabFetch('/api/creatives/categories?all=true'),
          tabFetch('/api/creatives/logos?all=true'),
          tabFetch('/api/creatives/shared-content'),
        ]);

        const catsJson = await catsRes.json();
        const logosJson = await logosRes.json();
        const sharedJson = await sharedRes.json();

        if (catsJson.categories) {
          setCategories(catsJson.categories);
          if (!categoryId && catsJson.categories.length > 0) {
            setCategoryId(catsJson.categories[0].id);
          }
        }
        if (logosJson.logos) setLogoLibrary(logosJson.logos);
        if (sharedJson.config) setSharedFooterConfig(sharedJson.config);

        // If editing existing template
        if (templateIdParam) {
          const tRes = await tabFetch(`/api/creatives/templates?id=${templateIdParam}`);
          const tJson = await tRes.json();
          if (tJson.template) {
            const t = tJson.template;
            setTemplateId(t.id);
            setTemplateName(t.name);
            setCategoryId(t.categoryId);
            setDescription(t.description || '');
            setWidth(t.width || 1080);
            setHeight(t.height || 1080);
            setOrientation(t.orientation || 'SQUARE');
            setStatus(t.status || 'DRAFT');
            setApprovalRequired(t.approvalRequired || false);
            setBaseDesignUrl(t.baseDesignUrl || null);
            setPreviewImageUrl(t.previewImageUrl || null);
            if (t.elements && t.elements.length > 0) {
              setElements(t.elements);
            }
            lastSavedSnapshotRef.current = JSON.stringify({
              name: (t.name || '').trim(),
              categoryId: t.categoryId,
              description: (t.description || '').trim(),
              width: t.width || 1080,
              height: t.height || 1080,
              orientation: t.orientation || 'SQUARE',
              status: t.status || 'DRAFT',
              approvalRequired: Boolean(t.approvalRequired),
              baseDesignUrl: t.baseDesignUrl || null,
              elementsCount: (t.elements || []).length,
            });
          }
        }
      } catch (err) {
        console.error('Error loading template builder data:', err);
      }
    }
    loadData();
  }, [templateIdParam]);

  // Fit Canvas to Screen
  const fitToScreen = useCallback(() => {
    if (containerRef.current) {
      const availW = containerRef.current.clientWidth - 80;
      const availH = containerRef.current.clientHeight - 80;
      if (availW > 100 && availH > 100) {
        const scaleX = availW / width;
        const scaleY = availH / height;
        const fit = Math.min(scaleX, scaleY, 0.95);
        setZoom(Math.max(0.2, Math.round(fit * 100) / 100));
      }
    }
  }, [width, height]);

  // Initial Auto-fit on load & resize
  useEffect(() => {
    const timer = setTimeout(() => {
      fitToScreen();
    }, 150);
    window.addEventListener('resize', fitToScreen);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', fitToScreen);
    };
  }, [fitToScreen]);

  // Open inspector automatically when an element is selected
  useEffect(() => {
    if (selectedElementId) {
      setShowRightInspector(true);
    }
  }, [selectedElementId]);

  // History Undo/Redo
  const pushHistory = useCallback((newElements: BuilderElement[]) => {
    setHistory((prev) => {
      const sliced = prev.slice(0, historyIndex + 1);
      return [...sliced, newElements];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  const updateElementsWithHistory = (newElements: BuilderElement[]) => {
    setElements(newElements);
    pushHistory(newElements);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setElements(history[nextIndex]);
    }
  };

  const clipboardRef = useRef<BuilderElement | null>(null);

  // Dragging & Resizing & Rotation State
  const [dragState, setDragState] = useState<{
    elementId: string;
    mode: 'move' | 'resize-se' | 'resize-sw' | 'resize-ne' | 'resize-nw' | 'rotate';
    startMouseX: number;
    startMouseY: number;
    initPosX: number;
    initPosY: number;
    initW: number;
    initH: number;
    initRotation: number;
    centerScreenX: number;
    centerScreenY: number;
  } | null>(null);

  // Mouse Down Drag Starter
  const handleStartDrag = (
    e: React.MouseEvent,
    el: BuilderElement,
    mode: 'move' | 'resize-se' | 'resize-sw' | 'resize-ne' | 'resize-nw' | 'rotate' = 'move'
  ) => {
    e.stopPropagation();
    e.preventDefault();
    if (el.isLocked && mode === 'move') return;

    setSelectedElementId(el.id);
    setShowRightInspector(true);

    const target = e.currentTarget as HTMLElement;
    const box = target.closest('[data-element-box]') as HTMLElement || target;
    const rect = box.getBoundingClientRect();
    const centerScreenX = rect.left + rect.width / 2;
    const centerScreenY = rect.top + rect.height / 2;

    setDragState({
      elementId: el.id,
      mode,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      initPosX: el.posX,
      initPosY: el.posY,
      initW: el.width,
      initH: el.height,
      initRotation: el.rotation || 0,
      centerScreenX,
      centerScreenY,
    });
  };

  // Global Mouse Move & Up Listeners for Smooth Dragging, Resizing & Rotating
  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = (e.clientX - dragState.startMouseX) / zoom;
      const deltaY = (e.clientY - dragState.startMouseY) / zoom;

      setElements((prev) =>
        prev.map((el) => {
          if (el.id !== dragState.elementId) return el;

          if (dragState.mode === 'move') {
            const newX = Math.round(dragState.initPosX + deltaX);
            const newY = Math.round(dragState.initPosY + deltaY);
            return {
              ...el,
              posX: Math.max(0, Math.min(width - el.width, newX)),
              posY: Math.max(0, Math.min(height - el.height, newY)),
            };
          }

          if (dragState.mode === 'rotate') {
            const angleRad = Math.atan2(e.clientY - dragState.centerScreenY, e.clientX - dragState.centerScreenX);
            let angleDeg = Math.round(angleRad * (180 / Math.PI) + 90);
            if (e.shiftKey) {
              angleDeg = Math.round(angleDeg / 15) * 15;
            }
            if (angleDeg > 180) angleDeg -= 360;
            if (angleDeg < -180) angleDeg += 360;
            return {
              ...el,
              rotation: angleDeg,
            };
          }

          const isAspectLocked = el.aspectRatioLocked || e.shiftKey;

          if (dragState.mode === 'resize-se') {
            let newW = Math.round(Math.max(30, dragState.initW + deltaX));
            let newH = Math.round(Math.max(20, dragState.initH + deltaY));
            if (isAspectLocked && dragState.initW > 0 && dragState.initH > 0) {
              const ratio = dragState.initH / dragState.initW;
              newH = Math.round(newW * ratio);
            }
            return {
              ...el,
              width: Math.min(width - el.posX, newW),
              height: Math.min(height - el.posY, newH),
            };
          }

          if (dragState.mode === 'resize-sw') {
            const newW = Math.round(Math.max(30, dragState.initW - deltaX));
            let newH = Math.round(Math.max(20, dragState.initH + deltaY));
            const newX = Math.round(Math.max(0, dragState.initPosX + deltaX));
            if (isAspectLocked && dragState.initW > 0 && dragState.initH > 0) {
              const ratio = dragState.initH / dragState.initW;
              newH = Math.round(newW * ratio);
            }
            return {
              ...el,
              posX: newX,
              width: newW,
              height: Math.min(height - el.posY, newH),
            };
          }

          if (dragState.mode === 'resize-ne') {
            let newW = Math.round(Math.max(30, dragState.initW + deltaX));
            const newH = Math.round(Math.max(20, dragState.initH - deltaY));
            const newY = Math.round(Math.max(0, dragState.initPosY + deltaY));
            if (isAspectLocked && dragState.initW > 0 && dragState.initH > 0) {
              const ratio = dragState.initH / dragState.initW;
              newW = Math.round(newH / ratio);
            }
            return {
              ...el,
              posY: newY,
              width: Math.min(width - el.posX, newW),
              height: newH,
            };
          }

          if (dragState.mode === 'resize-nw') {
            const newW = Math.round(Math.max(30, dragState.initW - deltaX));
            const newH = Math.round(Math.max(20, dragState.initH - deltaY));
            const newX = Math.round(Math.max(0, dragState.initPosX + deltaX));
            const newY = Math.round(Math.max(0, dragState.initPosY + deltaY));
            return {
              ...el,
              posX: newX,
              posY: newY,
              width: newW,
              height: newH,
            };
          }

          return el;
        })
      );
    };

    const handleMouseUp = () => {
      setElements((current) => {
        pushHistory(current);
        return current;
      });
      setDragState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, zoom, width, height, pushHistory]);

  // Keyboard Shortcuts (Undo/Redo, Copy/Paste, Duplicate, Delete, Esc, Arrow Nudge)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
        return;
      }

      // Copy & Paste
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        if (selectedElementId) {
          const el = elements.find((item) => item.id === selectedElementId);
          if (el) clipboardRef.current = el;
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        if (clipboardRef.current) {
          e.preventDefault();
          const source = clipboardRef.current;
          const dup: BuilderElement = {
            ...source,
            id: `el-paste-${Date.now()}`,
            name: `${source.name} (Copy)`,
            posX: Math.min(width - source.width, source.posX + 30),
            posY: Math.min(height - source.height, source.posY + 30),
            zIndex: elements.length + 1,
          };
          updateElementsWithHistory([...elements, dup]);
          setSelectedElementId(dup.id);
        }
        return;
      }

      // Escape to clear selection
      if (e.key === 'Escape') {
        setSelectedElementId(null);
        return;
      }

      if (!selectedElementId) return;

      // Duplicate shortcut
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        duplicateSelectedElement();
        return;
      }

      const step = e.shiftKey ? 10 : 1;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setElements((prev) =>
          prev.map((el) =>
            el.id === selectedElementId ? { ...el, posX: Math.max(0, el.posX - step) } : el
          )
        );
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setElements((prev) =>
          prev.map((el) =>
            el.id === selectedElementId
              ? { ...el, posX: Math.min(width - el.width, el.posX + step) }
              : el
          )
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setElements((prev) =>
          prev.map((el) =>
            el.id === selectedElementId ? { ...el, posY: Math.max(0, el.posY - step) } : el
          )
        );
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setElements((prev) =>
          prev.map((el) =>
            el.id === selectedElementId
              ? { ...el, posY: Math.min(height - el.height, el.posY + step) }
              : el
          )
        );
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelectedElement();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, elements, width, height, historyIndex, history]);


  // Re-render Canvas whenever elements, base design, sample data, or dimensions change
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const baseSample = sampleMembers[sampleMemberIndex] || sampleMembers[0];
    const currentSample: Record<string, any> = { ...baseSample };

    // Dynamically populate preview values for custom placeholders so next member displays distinct values
    elements.forEach((el) => {
      if (el.fieldKey) {
        if (currentSample[el.fieldKey] === undefined) {
          if (sampleMemberIndex === 0) {
            currentSample[el.fieldKey] = el.defaultValue || el.name;
          } else {
            const k = el.fieldKey.toLowerCase();
            if (k.includes('blood')) {
              currentSample[el.fieldKey] = 'B Positive (B+)';
            } else if (k.includes('branch') || k.includes('location')) {
              currentSample[el.fieldKey] = 'Navrangpura Chapter';
            } else if (k.includes('anniversary')) {
              currentSample[el.fieldKey] = '25th November';
            } else if (k.includes('text') || k.includes('title') || k.includes('ask') || k.includes('headline')) {
              currentSample[el.fieldKey] = 'Keynote Speaker & Business Mentor';
            } else {
              currentSample[el.fieldKey] = el.defaultValue ? `${el.defaultValue} (Member 02)` : el.name;
            }
          }
        }
      }
    });

    const activeCategory = categories.find((c) => c.id === categoryId);
    const categoryCode = (activeCategory?.code || 'KYM') as any;

    renderCreativeOnCanvas(canvas, {
      categoryCode,
      width,
      height,
      baseDesignUrl: baseDesignUrl || undefined,
      elements,
      sharedFixedContent: sharedFooterConfig ? { config: sharedFooterConfig } : undefined,
      data: currentSample,
    });
  }, [elements, baseDesignUrl, width, height, categoryId, sampleMemberIndex, sharedFooterConfig, categories]);

  // Quick Add Element Handlers
  const addLogoElement = (logo: any) => {
    const newEl: BuilderElement = {
      id: `el-logo-${Date.now()}`,
      elementType: 'LOGO',
      name: logo.name || 'Brand Logo',
      posX: Math.round(width / 2 - 100),
      posY: 40,
      width: 200,
      height: 70,
      fontFamily: 'Inter',
      fontSize: 24,
      fontWeight: 'normal',
      textColor: '#000000',
      textAlign: 'center',
      lineSpacing: 1.2,
      maxLines: 1,
      overflowBehavior: 'wrap',
      zIndex: elements.length + 1,
      isLocked: false,
      isVisible: true,
      isRequired: true,
      styleConfig: { logoUrl: logo.logoUrl },
    };
    updateElementsWithHistory([...elements, newEl]);
    setSelectedElementId(newEl.id);
  };

  const addPhotoElement = () => {
    const newEl: BuilderElement = {
      id: `el-photo-${Date.now()}`,
      elementType: 'MEMBER_PHOTO',
      fieldKey: 'photoUrl',
      name: 'Member Photo',
      posX: Math.round(width - 360),
      posY: 240,
      width: 300,
      height: 300,
      fontFamily: 'Inter',
      fontSize: 24,
      fontWeight: 'normal',
      textColor: '#000000',
      textAlign: 'center',
      lineSpacing: 1.2,
      maxLines: 1,
      overflowBehavior: 'wrap',
      zIndex: elements.length + 1,
      isLocked: false,
      isVisible: true,
      isRequired: true,
      styleConfig: { shape: 'none', hasFrame: false, borderWidth: 0, borderRadius: 0 },
    };
    updateElementsWithHistory([...elements, newEl]);
    setSelectedElementId(newEl.id);
  };

  const addDynamicField = (fieldKey: string, label: string, defaultVal: string = '') => {
    const newEl: BuilderElement = {
      id: `el-field-${Date.now()}`,
      elementType: 'DYNAMIC_FIELD',
      fieldKey,
      name: label,
      defaultValue: defaultVal,
      posX: 80,
      posY: 260 + (elements.length % 6) * 55,
      width: 480,
      height: 50,
      fontFamily: 'Inter',
      fontSize: 28,
      fontWeight: 'bold',
      textColor: '#1E293B',
      textAlign: 'left',
      lineSpacing: 1.2,
      maxLines: 2,
      overflowBehavior: 'wrap',
      zIndex: elements.length + 1,
      isLocked: false,
      isVisible: true,
      isRequired: true,
    };
    updateElementsWithHistory([...elements, newEl]);
    setSelectedElementId(newEl.id);
  };

  const addFixedText = (text: string = 'KNOW YOUR MEMBER') => {
    const newEl: BuilderElement = {
      id: `el-text-${Date.now()}`,
      elementType: 'FIXED_TEXT',
      name: 'Fixed Headline',
      defaultValue: text,
      posX: 80,
      posY: 180,
      width: 500,
      height: 60,
      fontFamily: 'Inter',
      fontSize: 40,
      fontWeight: 'bold',
      textColor: '#0F172A',
      textAlign: 'left',
      lineSpacing: 1.1,
      maxLines: 2,
      overflowBehavior: 'wrap',
      zIndex: elements.length + 1,
      isLocked: false,
      isVisible: true,
      isRequired: true,
    };
    updateElementsWithHistory([...elements, newEl]);
    setSelectedElementId(newEl.id);
  };

  // Add Official Social Media Bar to Canvas
  const addSocialMediaElement = () => {
    const isVert = socialIconsConfig.layout === 'vertical';
    const totalCount = socialIconsConfig.icons.length;
    const barW = isVert
      ? 160
      : Math.max(220, totalCount * (socialIconsConfig.iconSize + socialIconsConfig.spacing) + (socialIconsConfig.username ? 160 : 30));
    const barH = isVert
      ? Math.max(120, totalCount * (socialIconsConfig.iconSize + socialIconsConfig.spacing) + 40)
      : Math.max(45, socialIconsConfig.iconSize + 20);

    const newEl: BuilderElement = {
      id: `el-social-${Date.now()}`,
      elementType: 'SOCIAL_ICONS',
      name: 'Official Social Media Bar',
      defaultValue: socialIconsConfig.username,
      posX: Math.round(width / 2 - barW / 2),
      posY: Math.round(height - 110),
      width: barW,
      height: barH,
      fontFamily: 'Inter',
      fontSize: 16,
      fontWeight: '600',
      textColor: socialIconsConfig.iconColor,
      textAlign: 'left',
      lineSpacing: 1.2,
      maxLines: 1,
      overflowBehavior: 'wrap',
      zIndex: elements.length + 1,
      isLocked: false,
      isVisible: true,
      isRequired: false,
      styleConfig: {
        icons: [...socialIconsConfig.icons],
        iconSize: socialIconsConfig.iconSize,
        spacing: socialIconsConfig.spacing,
        layout: socialIconsConfig.layout,
        colorMode: socialIconsConfig.colorMode,
        iconColor: socialIconsConfig.iconColor,
        username: socialIconsConfig.username,
      },
    };
    updateElementsWithHistory([...elements, newEl]);
    setSelectedElementId(newEl.id);
  };

  // Add Shape Element to Canvas (Rectangle, Circle, Line)
  const addShapeElement = (shapeType: 'rectangle' | 'circle' | 'line' = 'rectangle') => {
    const isLine = shapeType === 'line';
    const newEl: BuilderElement = {
      id: `el-shape-${Date.now()}`,
      elementType: 'SHAPE',
      name: shapeType === 'circle' ? 'Circle' : shapeType === 'line' ? 'Accent Line' : 'Rectangle Card',
      posX: Math.round(width / 2 - 150),
      posY: Math.round(height / 2 - (isLine ? 3 : 100)),
      width: 300,
      height: isLine ? 6 : 200,
      fontFamily: 'Inter',
      fontSize: 24,
      fontWeight: 'normal',
      textColor: '#000000',
      textAlign: 'center',
      lineSpacing: 1.2,
      maxLines: 1,
      overflowBehavior: 'wrap',
      zIndex: elements.length + 1,
      isLocked: false,
      isVisible: true,
      isRequired: false,
      backgroundColor: isLine ? '#2563EB' : '#3B82F6',
      borderColor: '#1D4ED8',
      borderWidth: 0,
      borderRadius: shapeType === 'circle' ? 999 : 16,
      styleConfig: { shapeType, fillColor: isLine ? '#2563EB' : '#3B82F6' },
    };
    updateElementsWithHistory([...elements, newEl]);
    setSelectedElementId(newEl.id);
  };

  // Logo Library Upload & Replace Handlers
  const handleUploadNewLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!newLogoName.trim()) {
      alert('Please enter a name for the new logo first.');
      return;
    }

    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'logo');

      const uploadRes = await tabFetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok || !uploadJson.url) {
        throw new Error(uploadJson.error || 'Failed to upload logo file');
      }

      const logoRes = await tabFetch('/api/creatives/logos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newLogoName.trim(),
          logoUrl: uploadJson.url,
        }),
      });
      const logoJson = await logoRes.json();
      if (!logoRes.ok || !logoJson.logo) {
        throw new Error(logoJson.error || 'Failed to save logo');
      }

      setLogoLibrary((prev) => [...prev, logoJson.logo]);
      setNewLogoName('');
      setShowUploadLogoBox(false);
      setSaveMessage('Logo added to library!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Error uploading logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleReplaceLogoImage = async (logoId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsReplacingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'logo');

      const uploadRes = await tabFetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok || !uploadJson.url) {
        throw new Error(uploadJson.error || 'Failed to upload replacement file');
      }

      const patchRes = await tabFetch('/api/creatives/logos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: logoId,
          logoUrl: uploadJson.url,
        }),
      });
      const patchJson = await patchRes.json();
      if (!patchRes.ok) throw new Error(patchJson.error || 'Failed to update logo');

      const oldLogo = logoLibrary.find((l) => l.id === logoId);
      const oldUrl = oldLogo?.logoUrl;

      setLogoLibrary((prev) =>
        prev.map((l) => (l.id === logoId ? { ...l, logoUrl: uploadJson.url } : l))
      );

      // Update canvas elements using this logo
      if (oldUrl) {
        setElements((prev) =>
          prev.map((el) => {
            if (el.elementType === 'LOGO') {
              const cfg = typeof el.styleConfig === 'string' ? JSON.parse(el.styleConfig) : el.styleConfig || {};
              if (cfg.logoUrl === oldUrl) {
                return { ...el, styleConfig: { ...cfg, logoUrl: uploadJson.url } };
              }
            }
            return el;
          })
        );
      }

      setEditingLogoItem(null);
      setSaveMessage('Logo replaced successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Error replacing logo');
    } finally {
      setIsReplacingLogo(false);
    }
  };

  const handleSaveEditLogoName = async (logoId: string) => {
    if (!editLogoName.trim()) return;
    try {
      const patchRes = await tabFetch('/api/creatives/logos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: logoId,
          name: editLogoName.trim(),
        }),
      });
      if (patchRes.ok) {
        setLogoLibrary((prev) =>
          prev.map((l) => (l.id === logoId ? { ...l, name: editLogoName.trim() } : l))
        );
        setEditingLogoItem(null);
        setSaveMessage('Logo name updated!');
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteLogoFromLibrary = async (logoId: string) => {
    if (!confirm('Are you sure you want to delete this logo from the library?')) return;
    try {
      const res = await tabFetch(`/api/creatives/logos?id=${logoId}`, { method: 'DELETE' });
      if (res.ok) {
        setLogoLibrary((prev) => prev.filter((l) => l.id !== logoId));
        setEditingLogoItem(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Custom Member Field to Canvas
  const addCustomPlaceholderElement = () => {
    if (!customFieldLabel.trim()) {
      alert('Please enter a field name / label.');
      return;
    }

    const key = customFieldKey.trim() || customFieldLabel.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const isPhoto = customFieldType === 'photo';

    if (isPhoto) {
      const newEl: BuilderElement = {
        id: `el-custom-photo-${Date.now()}`,
        elementType: 'MEMBER_PHOTO',
        fieldKey: key,
        name: customFieldLabel.trim(),
        posX: Math.round(width / 2 - 130),
        posY: Math.round(height / 2 - 130),
        width: 260,
        height: 260,
        fontFamily: 'Inter',
        fontSize: 24,
        fontWeight: 'normal',
        textColor: '#000000',
        textAlign: 'center',
        lineSpacing: 1.2,
        maxLines: 1,
        overflowBehavior: 'wrap',
        zIndex: elements.length + 1,
        isLocked: false,
        isVisible: true,
        isRequired: customFieldRequired,
        styleConfig: { shape: 'none', hasFrame: false, borderWidth: 0, borderRadius: 0 },
      };
      updateElementsWithHistory([...elements, newEl]);
      setSelectedElementId(newEl.id);
    } else {
      const isMulti = customFieldType === 'multiline';
      const newEl: BuilderElement = {
        id: `el-custom-${Date.now()}`,
        elementType: 'DYNAMIC_FIELD',
        fieldKey: key,
        name: customFieldLabel.trim(),
        defaultValue: customFieldDefault.trim() || customFieldLabel.trim(),
        posX: 100,
        posY: 300 + (elements.length % 6) * 55,
        width: 480,
        height: isMulti ? 90 : 50,
        fontFamily: 'Inter',
        fontSize: 26,
        fontWeight: 'bold',
        textColor: '#1E293B',
        textAlign: 'left',
        lineSpacing: 1.2,
        maxLines: isMulti ? 3 : 1,
        overflowBehavior: 'wrap',
        zIndex: elements.length + 1,
        isLocked: false,
        isVisible: true,
        isRequired: customFieldRequired,
      };
      updateElementsWithHistory([...elements, newEl]);
      setSelectedElementId(newEl.id);
    }

    setCustomFieldLabel('');
    setCustomFieldKey('');
    setCustomFieldDefault('');
    setSaveMessage('Custom placeholder added to canvas!');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  // Alignment Helpers
  const alignSelectedElement = (type: 'left' | 'center-x' | 'right' | 'top' | 'center-y' | 'bottom') => {
    if (!selectedElementId) return;
    const updated = elements.map((el) => {
      if (el.id !== selectedElementId) return el;
      let newX = el.posX;
      let newY = el.posY;
      if (type === 'left') newX = 40;
      else if (type === 'center-x') newX = Math.round((width - el.width) / 2);
      else if (type === 'right') newX = width - el.width - 40;
      else if (type === 'top') newY = 40;
      else if (type === 'center-y') newY = Math.round((height - el.height) / 2);
      else if (type === 'bottom') newY = height - el.height - 40;
      return { ...el, posX: Math.max(0, newX), posY: Math.max(0, newY) };
    });
    updateElementsWithHistory(updated);
  };

  // Layer Ordering Helpers
  const changeSelectedElementZIndex = (action: 'front' | 'back' | 'up' | 'down') => {
    if (!selectedElementId) return;
    const cur = elements.find((e) => e.id === selectedElementId);
    if (!cur) return;
    const allZ = elements.map((e) => e.zIndex || 0);
    const maxZ = Math.max(...allZ, 1);
    const minZ = Math.min(...allZ, 1);
    let newZ = cur.zIndex;
    if (action === 'front') newZ = maxZ + 1;
    else if (action === 'back') newZ = Math.max(1, minZ - 1);
    else if (action === 'up') newZ = cur.zIndex + 1;
    else if (action === 'down') newZ = Math.max(1, cur.zIndex - 1);
    const updated = elements.map((e) => (e.id === selectedElementId ? { ...e, zIndex: newZ } : e));
    updateElementsWithHistory(updated);
  };

  // Lock / Unlock Helper
  const toggleLockSelectedElement = () => {
    if (!selectedElementId) return;
    const updated = elements.map((el) =>
      el.id === selectedElementId ? { ...el, isLocked: !el.isLocked } : el
    );
    updateElementsWithHistory(updated);
  };

  // Upload Base Artwork
  const handleBaseDesignUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBase(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'template_base');

      const res = await tabFetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.url) {
        setBaseDesignUrl(data.url);
        const img = new Image();
        img.onload = () => {
          if (img.width && img.height) {
            setWidth(img.width);
            setHeight(img.height);
            if (img.width > img.height) setOrientation('LANDSCAPE');
            else if (img.height > img.width) setOrientation('PORTRAIT');
            else setOrientation('SQUARE');
            fitToScreen();
          }
        };
        img.src = data.url;
      }
    } catch (err) {
      console.error('Base design upload failed:', err);
    } finally {
      setUploadingBase(false);
    }
  };

  // Selected element update helper with functional updater to prevent stale closures
  const updateSelectedElement = (updates: Partial<BuilderElement>) => {
    if (!selectedElementId) return;
    setElements((prev) =>
      prev.map((el) => {
        if (el.id === selectedElementId) {
          // Keep root properties and styleConfig synchronized
          let mergedStyle: Record<string, any> =
            typeof el.styleConfig === 'string'
              ? (() => {
                  try {
                    return JSON.parse(el.styleConfig);
                  } catch {
                    return {};
                  }
                })()
              : { ...(el.styleConfig || {}) };

          if (updates.styleConfig) {
            const nextStyle =
              typeof updates.styleConfig === 'string'
                ? (() => {
                    try {
                      return JSON.parse(updates.styleConfig);
                    } catch {
                      return {};
                    }
                  })()
                : updates.styleConfig;
            mergedStyle = { ...mergedStyle, ...nextStyle };
          }

          // Mirror style properties into styleConfig so they serialize to database
          if (updates.blendMode !== undefined) mergedStyle.blendMode = updates.blendMode;
          if (updates.opacity !== undefined) mergedStyle.opacity = updates.opacity;
          if ((updates as any).shape !== undefined) mergedStyle.shape = (updates as any).shape;
          if ((updates as any).hasFrame !== undefined) mergedStyle.hasFrame = (updates as any).hasFrame;
          if (updates.borderWidth !== undefined) mergedStyle.borderWidth = updates.borderWidth;
          if (updates.borderColor !== undefined) mergedStyle.borderColor = updates.borderColor;
          if (updates.borderRadius !== undefined) mergedStyle.borderRadius = updates.borderRadius;

          return {
            ...el,
            ...updates,
            styleConfig: mergedStyle,
          };
        }
        return el;
      })
    );
  };

  // Delete selected element
  const deleteSelectedElement = () => {
    if (!selectedElementId) return;
    const newElements = elements.filter((el) => el.id !== selectedElementId);
    updateElementsWithHistory(newElements);
    setSelectedElementId(null);
  };

  // Duplicate selected element
  const duplicateSelectedElement = () => {
    if (!selectedElementId) return;
    const source = elements.find((el) => el.id === selectedElementId);
    if (!source) return;

    const dup: BuilderElement = {
      ...source,
      id: `el-dup-${Date.now()}`,
      name: `${source.name} (Copy)`,
      posX: source.posX + 30,
      posY: source.posY + 30,
      zIndex: elements.length + 1,
    };
    updateElementsWithHistory([...elements, dup]);
    setSelectedElementId(dup.id);
  };

  // Helper to compute state fingerprint for change detection
  const computeTemplateStateSnapshot = (publishMode?: boolean) => {
    return JSON.stringify({
      name: templateName.trim(),
      categoryId,
      description: description.trim(),
      width,
      height,
      orientation,
      status: publishMode ? 'PUBLISHED' : status,
      approvalRequired,
      baseDesignUrl,
      elements,
    });
  };

  // Save or Publish Handler
  const handleSave = async (publish: boolean = false) => {
    if (isSaving) return;

    if (!templateName.trim() || !categoryId) {
      alert('Please provide a template name and select a category.');
      return;
    }

    const currentSnapshot = computeTemplateStateSnapshot(publish);

    // If template has already been pushed and no modifications exist, prevent duplicate push
    if (templateId && lastSavedSnapshotRef.current && currentSnapshot === lastSavedSnapshotRef.current) {
      setSaveMessage('Template is already up to date. No changes to push.');
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      let previewUrl = previewImageUrl;
      if (canvasRef.current) {
        previewUrl = canvasRef.current.toDataURL('image/jpeg', 0.85);
      }

      const payload = {
        id: templateId || undefined,
        name: templateName.trim(),
        categoryId,
        description: description.trim(),
        width,
        height,
        orientation,
        status: publish ? 'PUBLISHED' : status,
        approvalRequired,
        baseDesignUrl,
        previewImageUrl: previewUrl,
        elements,
      };

      const res = await tabFetch('/api/creatives/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.template) {
        setTemplateId(json.template.id);
        setStatus(json.template.status);
        lastSavedSnapshotRef.current = currentSnapshot;

        // Keep URL in sync without reloading so re-saves update the exact same template
        if (typeof window !== 'undefined' && !templateIdParam) {
          window.history.replaceState(null, '', `/admin/templates/builder?id=${json.template.id}`);
        }

        setSaveMessage(publish ? 'Published to Member Gallery!' : 'Draft Saved Successfully!');
        setTimeout(() => setSaveMessage(null), 4000);
      } else {
        alert(json.error || 'Failed to save template');
      }
    } catch (err: any) {
      console.error('Error saving template:', err);
      alert(err.message || 'Network error saving template');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedElement = elements.find((el) => el.id === selectedElementId);

  return (
    <div className="flex flex-col h-screen w-full bg-slate-100 text-slate-800 overflow-hidden font-sans select-none">
      {/* 1. TOP HEADER NAVIGATION - TWO-TIER DESIGN TOOLBAR */}
      <header className="flex flex-col shrink-0 z-30 select-none shadow-xs border-b border-slate-200 bg-white">
        {/* LINE 1: Starts with Template Name + Status + Dimensions, and Ends with Save Draft + Publish Template */}
        <div className="h-13 px-3 sm:px-4 flex items-center justify-between border-b border-slate-100 bg-white">
          {/* Start (Left): Back + Name + Status + Dimensions */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <Link
              href="/admin/templates"
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
              title="Back to Template Management"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>

            <div className="h-4 w-px bg-slate-200 shrink-0" />

            <div className="flex items-center gap-2 min-w-0">
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="font-bold text-sm text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-600 focus:outline-none px-2 py-0.5 rounded transition-colors w-52 sm:w-80 md:w-96 truncate shrink-0"
                placeholder="Template Name..."
                title="Click to rename template"
              />

              <span
                className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap shadow-2xs ${
                  status === 'PUBLISHED'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    status === 'PUBLISHED' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
                {status}
              </span>

              <span className="hidden sm:inline-flex items-center text-[10px] font-mono font-medium text-slate-500 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200/80 shrink-0 whitespace-nowrap">
                {width}×{height} px
              </span>
            </div>
          </div>

          {/* End (Right): Save Notification + Save Draft + Publish Template Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {saveMessage && (
              <span className="text-xs text-emerald-600 font-bold flex items-center animate-fade-in mr-1 whitespace-nowrap bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                <Check className="w-3.5 h-3.5 mr-1 stroke-[3]" /> {saveMessage}
              </span>
            )}

            {/* Save Draft Button */}
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={isSaving}
              className="h-8.5 inline-flex items-center gap-1.5 px-3 sm:px-3.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-colors disabled:opacity-50 shrink-0 whitespace-nowrap"
            >
              <Save className="w-3.5 h-3.5 text-slate-500" />
              <span>Save Draft</span>
            </button>

            {/* Publish Template Button */}
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={isSaving}
              className="h-8.5 inline-flex items-center gap-1.5 px-3.5 sm:px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 shrink-0 whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Publish Template</span>
            </button>
          </div>
        </div>

        {/* LINE 2: All Tool & Workflow Buttons (Step Selector, Member Switcher, Preview Mode, Undo/Redo, Zoom, Properties) */}
        <div className="h-11 px-3 sm:px-4 flex items-center justify-between gap-2 bg-slate-50/95 backdrop-blur-sm overflow-x-auto">
          {/* Left: Step Selector & Toolbox Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowLeftPanel(!showLeftPanel)}
              className={`h-7.5 px-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 whitespace-nowrap ${
                showLeftPanel
                  ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              title="Toggle Left Toolbox Panel"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Tools</span>
            </button>

            <div className="flex items-center gap-1 bg-white py-0.5 px-1.5 rounded-xl border border-slate-200 shadow-2xs transition-colors shrink-0">
              <button
                type="button"
                onClick={() => {
                  setCurrentStep((s) => Math.max(1, s - 1));
                  setShowLeftPanel(true);
                }}
                disabled={currentStep === 1}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                title="Previous Step"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-1.5 px-1.5 whitespace-nowrap">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">
                  STEP {currentStep}/8:
                </span>
                <span className="text-xs font-bold text-slate-800 max-w-[130px] sm:max-w-[160px] truncate">
                  {WIZARD_STEPS[currentStep - 1]?.label}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCurrentStep((s) => Math.min(8, s + 1));
                  setShowLeftPanel(true);
                }}
                disabled={currentStep === 8}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                title="Next Step"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Center: Sample Member Profiles & Preview Mode Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Sample Member Profile Switcher (Member 01 vs Member 02) */}
            <div className="flex items-center bg-slate-200/70 p-0.5 rounded-xl border border-slate-200 h-8 shrink-0">
              <button
                type="button"
                onClick={() => setSampleMemberIndex(0)}
                className={`h-7 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  sampleMemberIndex === 0
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Test with Sample Member 01: Dr. Ketan Patel"
              >
                <User className="w-3.5 h-3.5 shrink-0" />
                <span>Member 01</span>
              </button>
              <button
                type="button"
                onClick={() => setSampleMemberIndex(1)}
                className={`h-7 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  sampleMemberIndex === 1
                    ? 'bg-white text-purple-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Test with Sample Member 02: Amit Sharma"
              >
                <User className="w-3.5 h-3.5 shrink-0" />
                <span>Member 02</span>
              </button>
            </div>

            {/* Preview Mode Switcher (Admin Edit Mode vs Final Creative Preview) */}
            <div className="flex items-center bg-slate-200/70 p-0.5 rounded-xl border border-slate-200 h-8 shrink-0">
              <button
                type="button"
                onClick={() => setPreviewMode('edit')}
                className={`h-7 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  previewMode === 'edit'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Admin Edit Mode: Shows bounding boxes and drag handles"
              >
                <Move className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Edit Mode</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('final')}
                className={`h-7 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  previewMode === 'final'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Final Creative Preview: 100% clean output without selection guides"
              >
                <Eye className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Final Preview</span>
              </button>
            </div>
          </div>

          {/* Right: Quick Undo/Redo, Zoom Controls & Inspector Panel Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Undo & Redo */}
            <div className="flex items-center bg-white p-0.5 rounded-xl border border-slate-200 h-8 shrink-0 shadow-2xs">
              <button
                type="button"
                onClick={undo}
                disabled={historyIndex <= 0}
                className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 rounded-lg transition-colors"
                title="Undo (Ctrl+Z)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 rounded-lg transition-colors"
                title="Redo (Ctrl+Shift+Z / Ctrl+Y)"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center bg-white p-0.5 rounded-xl border border-slate-200 h-8 shrink-0 shadow-2xs">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.15, Math.round((z - 0.05) * 100) / 100))}
                className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[10px] text-slate-600 px-1 font-bold min-w-[36px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(2.5, Math.round((z + 0.05) * 100) / 100))}
                className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={fitToScreen}
                className="h-7 px-2 text-[10px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors ml-0.5"
                title="Fit Canvas to Screen"
              >
                Fit
              </button>
            </div>

            {/* Inspector Panel Toggle Button */}
            <button
              type="button"
              onClick={() => setShowRightInspector(!showRightInspector)}
              className={`h-8 px-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 whitespace-nowrap ${
                showRightInspector
                  ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              title="Toggle Properties Panel"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Properties</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE (HERO CANVAS + DOCKED / SLIDE-OUT PANELS) */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* LEFT PALETTE & STEP TOOLS (Width: 320px) */}
        {showLeftPanel && (
          <aside className="w-80 bg-white border-r border-slate-200/90 flex flex-col shrink-0 z-20 shadow-xs overflow-y-auto">
            {/* Step Selector Header */}
            <div className="p-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                  Active Step {currentStep} of 8
                </span>
                <h3 className="text-xs font-bold text-slate-900 mt-0.5">
                  {WIZARD_STEPS[currentStep - 1]?.label}
                </h3>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
                  disabled={currentStep === 1}
                  className="p-1 rounded text-slate-400 hover:text-slate-800 disabled:opacity-30"
                  title="Previous Step"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setCurrentStep((s) => Math.min(8, s + 1))}
                  disabled={currentStep === 8}
                  className="p-1 rounded text-slate-400 hover:text-slate-800 disabled:opacity-30"
                  title="Next Step"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* STEP 1: BASIC INFORMATION */}
            {currentStep === 1 && (
              <div className="p-4 space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Creative Category *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Canvas Dimensions</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Width (px)</span>
                      <input
                        type="number"
                        value={width}
                        onChange={(e) => setWidth(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-800 bg-slate-50"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Height (px)</span>
                      <input
                        type="number"
                        value={height}
                        onChange={(e) => setHeight(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-800 bg-slate-50"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Orientation Preset</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'SQUARE', label: 'Square', dim: '1080×1080', w: 1080, h: 1080 },
                      { id: 'PORTRAIT', label: 'Portrait', dim: '1080×1350', w: 1080, h: 1350 },
                      { id: 'LANDSCAPE', label: 'Landscape', dim: '1200×630', w: 1200, h: 630 },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setOrientation(p.id as any);
                          setWidth(p.w);
                          setHeight(p.h);
                        }}
                        className={`p-2 rounded-xl text-center border transition-all ${
                          orientation === p.id
                            ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="block text-xs">{p.label}</span>
                        <span className="text-[9px] opacity-75 font-mono">{p.dim}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <label className="font-bold text-slate-700 block mb-1">Approval Workflow</label>
                  <label className="flex items-center gap-2 cursor-pointer p-2.5 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100/70">
                    <input
                      type="checkbox"
                      checked={approvalRequired}
                      onChange={(e) => setApprovalRequired(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-semibold text-slate-800">Require Super Admin approval</span>
                  </label>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    {approvalRequired
                      ? 'Member requests will be routed to the Admin Approval Queue before graphic generation.'
                      : 'Members can generate and download their graphic directly without admin delay.'}
                  </p>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Description (Optional)</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief notes about design usage..."
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-800 bg-slate-50"
                  />
                </div>
              </div>
            )}

            {/* STEP 2: UPLOAD BASE ARTWORK */}
            {currentStep === 2 && (
              <div className="p-4 space-y-4 text-xs">
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Base Design Artwork</h4>
                  <p className="text-[11px] text-slate-500 mb-3">
                    Upload the background creative design. The canvas preserves aspect ratio and transparency.
                  </p>

                  <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/30 rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer text-center transition-colors">
                    <Upload className="w-6 h-6 text-slate-400 mb-2" />
                    <span className="font-bold text-slate-700 text-xs">Click to upload base design</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, or SVG supported</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBaseDesignUpload}
                      className="hidden"
                    />
                  </label>

                  {uploadingBase && (
                    <div className="flex items-center gap-2 text-blue-600 mt-2 font-medium">
                      <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span>Uploading design artwork...</span>
                    </div>
                  )}

                  {baseDesignUrl && (
                    <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700">Uploaded Artwork:</span>
                        <button
                          onClick={() => setBaseDesignUrl(null)}
                          className="text-rose-600 hover:underline text-[11px]"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="aspect-video bg-slate-200 rounded-lg overflow-hidden flex items-center justify-center">
                        <img src={baseDesignUrl} alt="Base Artwork" className="max-h-full object-contain" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 3: OFFICIAL 6 LOGOS */}
            {currentStep === 3 && (
              <div className="p-4 space-y-4 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-slate-800">Official Logos Library ({logoLibrary.length})</h4>
                    <button
                      type="button"
                      onClick={() => setShowUploadLogoBox(!showUploadLogoBox)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold shadow-2xs transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Upload Logo</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-3">
                    Click any logo to add it to the canvas, or edit / replace existing logos in the library.
                  </p>

                  {/* Upload New Logo Box */}
                  {showUploadLogoBox && (
                    <div className="p-3 mb-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-900 text-[11px]">Upload New Official Logo</span>
                        <button
                          type="button"
                          onClick={() => setShowUploadLogoBox(false)}
                          className="text-slate-400 hover:text-slate-700"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-600 font-medium block mb-1">Logo Name *</span>
                        <input
                          type="text"
                          value={newLogoName}
                          onChange={(e) => setNewLogoName(e.target.value)}
                          placeholder="e.g. Apex Referral Chapter, JITO Crest"
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-800 bg-white text-xs"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-600 font-medium block mb-1">Logo Image File (PNG/SVG transparent recommended)</span>
                        <label className={`flex items-center justify-center gap-2 w-full py-2 px-3 border border-dashed border-blue-400 bg-white rounded-lg text-blue-700 font-bold text-xs cursor-pointer hover:bg-blue-50 transition-colors ${isUploadingLogo ? 'opacity-50 pointer-events-none' : ''}`}>
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isUploadingLogo ? 'Uploading Logo...' : 'Select Image File'}</span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/svg+xml"
                            className="hidden"
                            onChange={handleUploadNewLogo}
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Logo Library List */}
                  <div className="space-y-2">
                    {logoLibrary.map((logo) => {
                      const isEditing = editingLogoItem?.id === logo.id;

                      return (
                        <div
                          key={logo.id}
                          className="p-2.5 bg-white border border-slate-200 rounded-xl hover:border-blue-300 transition-colors shadow-2xs space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <div className="w-9 h-9 bg-slate-50 border border-slate-100 rounded-lg p-1 flex items-center justify-center shrink-0">
                                <img src={logo.logoUrl} alt={logo.name} className="max-w-full max-h-full object-contain" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="font-bold text-slate-800 truncate text-[11px] block">{logo.name}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  if (isEditing) {
                                    setEditingLogoItem(null);
                                  } else {
                                    setEditingLogoItem(logo);
                                    setEditLogoName(logo.name);
                                  }
                                }}
                                className={`p-1.5 rounded-lg border text-xs transition-colors ${
                                  isEditing
                                    ? 'bg-blue-50 text-blue-700 border-blue-300'
                                    : 'border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                                }`}
                                title="Edit / Replace Logo"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>

                              <button
                                type="button"
                                onClick={() => addLogoElement(logo)}
                                className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-bold transition-colors"
                                title="Add to Canvas"
                              >
                                + Add
                              </button>
                            </div>
                          </div>

                          {/* Inline Logo Edit / Replace Box */}
                          {isEditing && (
                            <div className="pt-2 border-t border-slate-100 space-y-2 bg-slate-50/70 p-2 rounded-lg">
                              <div>
                                <span className="text-[10px] text-slate-500 block mb-0.5">Rename Logo</span>
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    value={editLogoName}
                                    onChange={(e) => setEditLogoName(e.target.value)}
                                    className="flex-1 px-2 py-1 border border-slate-200 rounded text-xs bg-white"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEditLogoName(logo.id)}
                                    className="px-2 py-1 bg-slate-800 text-white rounded text-[10px] font-bold hover:bg-black"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 pt-1">
                                <label className={`flex-1 flex items-center justify-center gap-1 py-1 px-2 border border-slate-300 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded text-[10px] font-bold cursor-pointer transition-colors ${isReplacingLogo ? 'opacity-50 pointer-events-none' : ''}`}>
                                  <Upload className="w-3 h-3" />
                                  <span>{isReplacingLogo ? 'Replacing...' : 'Replace Image'}</span>
                                  <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                    className="hidden"
                                    onChange={(e) => handleReplaceLogoImage(logo.id, e)}
                                  />
                                </label>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteLogoFromLibrary(logo.id)}
                                  className="p-1 text-red-500 hover:bg-red-50 rounded border border-transparent hover:border-red-200 transition-colors"
                                  title="Delete Logo from Library"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: FIXED CONTENT & SOCIAL MEDIA ICONS */}
            {currentStep === 4 && (
              <div className="p-4 space-y-5 text-xs">
                {/* 4A: Fixed Branding Content */}
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Fixed Branding & Headings</h4>
                  <p className="text-[11px] text-slate-500 mb-3">
                    Add standard branding text that members cannot modify.
                  </p>

                  <div className="space-y-1.5">
                    <button
                      onClick={() => addFixedText('WEEKLY REFERRAL MEETING')}
                      className="w-full p-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-xl text-left font-bold text-slate-700 flex items-center justify-between"
                    >
                      <span className="truncate">+ Weekly Referral Meeting</span>
                      <Plus className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </button>

                    <button
                      onClick={() => addFixedText('BUSINESS PRESENTATION')}
                      className="w-full p-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-xl text-left font-bold text-slate-700 flex items-center justify-between"
                    >
                      <span className="truncate">+ Business Presentation</span>
                      <Plus className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </button>

                    <button
                      onClick={() => addFixedText('KNOW YOUR MEMBER')}
                      className="w-full p-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-xl text-left font-bold text-slate-700 flex items-center justify-between"
                    >
                      <span className="truncate">+ Know Your Member (KYM)</span>
                      <Plus className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </button>

                    <button
                      onClick={() => addFixedText('HAPPY BIRTHDAY')}
                      className="w-full p-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-xl text-left font-bold text-slate-700 flex items-center justify-between"
                    >
                      <span className="truncate">+ Happy Birthday</span>
                      <Plus className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </button>

                    <button
                      onClick={() => addFixedText('JBN PEARL')}
                      className="w-full p-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-xl text-left font-bold text-slate-700 flex items-center justify-between"
                    >
                      <span className="truncate">+ Chapter: JBN PEARL</span>
                      <Plus className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </button>

                    <button
                      onClick={() => addFixedText('Referral Main Sponsor: Bonica Jewels')}
                      className="w-full p-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-xl text-left font-bold text-slate-700 flex items-center justify-between"
                    >
                      <span className="truncate">+ Sponsor Information</span>
                      <Plus className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </button>
                  </div>
                </div>

                {/* 4B: Dedicated Social Media Icon Editor */}
                <div className="pt-4 border-t border-slate-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-blue-600" />
                    <h4 className="font-bold text-slate-800">Social Media Icon Editor</h4>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Place official vector icons on the creative with custom size, spacing, layout, and handle.
                  </p>

                  {/* Icon Checkboxes */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">
                      Included Social Platforms
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: 'instagram', label: 'Instagram' },
                        { id: 'facebook', label: 'Facebook' },
                        { id: 'youtube', label: 'YouTube' },
                        { id: 'linkedin', label: 'LinkedIn' },
                        { id: 'whatsapp', label: 'WhatsApp' },
                        { id: 'x', label: 'X (Twitter)' },
                      ].map((item) => {
                        const isChecked = socialIconsConfig.icons.includes(item.id);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              const next = isChecked
                                ? socialIconsConfig.icons.filter((i) => i !== item.id)
                                : [...socialIconsConfig.icons, item.id];
                              setSocialIconsConfig((prev) => ({ ...prev, icons: next }));
                            }}
                            className={`p-1.5 rounded-lg border text-left flex items-center justify-between transition-colors ${
                              isChecked
                                ? 'bg-blue-50 text-blue-800 border-blue-400 font-bold'
                                : 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}
                          >
                            <span className="text-[11px]">{item.label}</span>
                            {isChecked && <Check className="w-3 h-3 text-blue-600" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Layout & Color Styling */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Icon Styling & Visibility
                    </span>
                    <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 mb-2">
                      <button
                        type="button"
                        onClick={() => setSocialIconsConfig((prev) => ({ ...prev, colorMode: 'brand' }))}
                        className={`py-1.5 px-2 rounded-lg text-center font-bold text-[10px] transition-all ${
                          socialIconsConfig.colorMode === 'brand'
                            ? 'bg-white text-blue-800 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        🌟 Official Brand Colors
                      </button>
                      <button
                        type="button"
                        onClick={() => setSocialIconsConfig((prev) => ({ ...prev, colorMode: 'custom' }))}
                        className={`py-1.5 px-2 rounded-lg text-center font-bold text-[10px] transition-all ${
                          socialIconsConfig.colorMode === 'custom'
                            ? 'bg-white text-blue-800 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        🎨 Single Color
                      </button>
                    </div>

                    {socialIconsConfig.colorMode === 'brand' ? (
                      <p className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200/80 p-2 rounded-lg font-medium leading-tight mb-2">
                        ✓ Vibrant official brand badges (Instagram pink, Facebook blue, YouTube red, LinkedIn blue, WhatsApp green, X black) with crisp vector cutouts. 100% visible on any background.
                      </p>
                    ) : (
                      <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg mb-2">
                        <span className="text-[10px] text-slate-500">Pick Color:</span>
                        <input
                          type="color"
                          value={socialIconsConfig.iconColor}
                          onChange={(e) => setSocialIconsConfig((prev) => ({ ...prev, iconColor: e.target.value }))}
                          className="w-6 h-6 rounded border border-slate-200 cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={socialIconsConfig.iconColor}
                          onChange={(e) => setSocialIconsConfig((prev) => ({ ...prev, iconColor: e.target.value }))}
                          className="w-20 px-1.5 py-0.5 border border-slate-200 rounded font-mono text-[10px] uppercase"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">Layout</span>
                      <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setSocialIconsConfig((prev) => ({ ...prev, layout: 'horizontal' }))}
                          className={`flex-1 py-1 text-center font-bold text-[10px] ${
                            socialIconsConfig.layout === 'horizontal' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600'
                          }`}
                        >
                          Row
                        </button>
                        <button
                          type="button"
                          onClick={() => setSocialIconsConfig((prev) => ({ ...prev, layout: 'vertical' }))}
                          className={`flex-1 py-1 text-center font-bold text-[10px] ${
                            socialIconsConfig.layout === 'vertical' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600'
                          }`}
                        >
                          Col
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Size & Spacing */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Icon Size ({socialIconsConfig.iconSize}px)</span>
                      <input
                        type="range"
                        min="16"
                        max="48"
                        value={socialIconsConfig.iconSize}
                        onChange={(e) => setSocialIconsConfig((prev) => ({ ...prev, iconSize: Number(e.target.value) }))}
                        className="w-full accent-blue-600"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Spacing ({socialIconsConfig.spacing}px)</span>
                      <input
                        type="range"
                        min="6"
                        max="32"
                        value={socialIconsConfig.spacing}
                        onChange={(e) => setSocialIconsConfig((prev) => ({ ...prev, spacing: Number(e.target.value) }))}
                        className="w-full accent-blue-600"
                      />
                    </div>
                  </div>

                  {/* Username / Handle */}
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Handle / Label (Optional)</span>
                    <input
                      type="text"
                      value={socialIconsConfig.username}
                      onChange={(e) => setSocialIconsConfig((prev) => ({ ...prev, username: e.target.value }))}
                      placeholder="@jbn_ahmedabad"
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-800 bg-slate-50 focus:bg-white"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={addSocialMediaElement}
                    className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all text-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add Social Media Bar to Canvas</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: DYNAMIC PLACEHOLDERS */}
            {currentStep === 5 && (
              <div className="p-4 space-y-4 text-xs">
                {/* 5A: Custom Member Field Creator */}
                <div className="p-3.5 bg-gradient-to-br from-indigo-50/90 via-blue-50/70 to-purple-50/60 border border-blue-200/90 rounded-2xl space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <span>Custom Placeholder Builder</span>
                    </div>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 uppercase">
                      New Field
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-tight">
                    Create any custom placeholder (e.g. Blood Group, Branch, Anniversary, Custom Photo) for members to fill.
                  </p>

                  <div className="space-y-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-700 block mb-0.5">Field Label *</span>
                      <input
                        type="text"
                        value={customFieldLabel}
                        onChange={(e) => {
                          setCustomFieldLabel(e.target.value);
                          if (!customFieldKey) {
                            setCustomFieldKey(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_'));
                          }
                        }}
                        placeholder="e.g. Blood Group, Branch Location"
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-800 bg-white text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-0.5">Field Key</span>
                        <input
                          type="text"
                          value={customFieldKey}
                          onChange={(e) => setCustomFieldKey(e.target.value)}
                          placeholder="e.g. blood_group"
                          className="w-full px-2 py-1 border border-slate-200 rounded-lg font-mono text-[10px] text-slate-800 bg-white"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 block mb-0.5">Field Type</span>
                        <select
                          value={customFieldType}
                          onChange={(e) => setCustomFieldType(e.target.value as any)}
                          className="w-full px-2 py-1 border border-slate-200 rounded-lg text-[11px] text-slate-800 bg-white font-medium"
                        >
                          <option value="text">Single-line Text</option>
                          <option value="multiline">Multiline Notes</option>
                          <option value="date">Date / Time</option>
                          <option value="phone">Contact Number</option>
                          <option value="photo">Custom Photo / Image</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block mb-0.5">Default / Sample Preview Value</span>
                      <input
                        type="text"
                        value={customFieldDefault}
                        onChange={(e) => setCustomFieldDefault(e.target.value)}
                        placeholder="e.g. O Positive (O+), Mumbai Branch"
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-800 bg-white text-xs"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-700 font-medium">
                        <input
                          type="checkbox"
                          checked={customFieldRequired}
                          onChange={(e) => setCustomFieldRequired(e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>Required Field</span>
                      </label>

                      <button
                        type="button"
                        onClick={addCustomPlaceholderElement}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-xs transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Add to Canvas</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 5B: Standard Preset Placeholders */}
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Standard Preset Placeholders</h4>
                  <p className="text-[11px] text-slate-500 mb-3">
                    Click any preset field to drop an editable placeholder onto the canvas:
                  </p>

                  <div className="space-y-1.5">
                    {/* Professional Photo */}
                    <button
                      onClick={addPhotoElement}
                      className="w-full p-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl text-left font-bold text-amber-900 flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <User className="w-4 h-4 text-amber-700" />
                        <span>Member Professional Photo</span>
                      </span>
                      <Plus className="w-3.5 h-3.5 text-amber-700" />
                    </button>

                    {[
                      { key: 'memberName', label: 'Member Name', def: 'Dr. Ketan Patel' },
                      { key: 'companyName', label: 'Company Name', def: 'DHS Multi Speciality Hospital' },
                      { key: 'businessCategory', label: 'Business Category', def: 'Healthcare & Hospital Care' },
                      { key: 'phone', label: 'Mobile Number', def: '+91 98250 12345' },
                      { key: 'email', label: 'Email Address', def: 'dr.ketan@dhshospital.com' },
                      { key: 'website', label: 'Website', def: 'www.dhshospital.com' },
                      { key: 'specificAsk', label: 'Specific Ask', def: 'Corporate Tie-ups & Health Checkup Packages' },
                      { key: 'date', label: 'Meeting / Event Date', def: 'Friday, 16th October 2026' },
                      { key: 'time', label: 'Meeting Time', def: '07:30 AM onwards' },
                      { key: 'venue', label: 'Meeting Venue', def: 'The Grand Bhagwati, SG Highway, Ahmedabad' },
                      { key: 'meetingStimulant', label: 'Meeting Stimulant', def: 'Power of Healthcare Networking' },
                      { key: 'dressCode', label: 'Dress Code', def: 'Formal Business Suit' },
                      { key: 'visitorFees', label: 'Visitor Fees', def: '₹1,500 Inclusive of Breakfast' },
                      { key: 'referralGroupName', label: 'Referral Chapter', def: 'JBN PEARL' },
                      { key: 'customText', label: 'Custom Text Field', def: 'Special Guest Attendee' },
                      { key: 'customNotes', label: 'Custom Multiline Notes', def: 'Please arrive 15 minutes prior for registration and open networking.' },
                    ].map((f) => (
                      <button
                        key={f.key}
                        onClick={() => addDynamicField(f.key, f.label, f.def)}
                        className="w-full p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-left font-semibold text-slate-700 flex items-center justify-between shadow-2xs transition-colors"
                      >
                        <span className="truncate">{f.label}</span>
                        <Plus className="w-3 h-3 text-slate-400 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6: FORM SETUP */}
            {currentStep === 6 && (
              <div className="p-4 space-y-3 text-xs">
                <h4 className="font-bold text-slate-800">Configured Placeholders ({elements.length})</h4>
                <p className="text-[11px] text-slate-500">
                  These fields will appear on the Member Request Form when members customize this template.
                </p>

                <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                  {elements.map((el) => (
                    <div
                      key={el.id}
                      onClick={() => setSelectedElementId(el.id)}
                      className={`p-2 rounded-xl border text-xs flex items-center justify-between cursor-pointer ${
                        selectedElementId === el.id
                          ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{el.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono">
                        {el.elementType}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 7: LIVE PREVIEW SWITCHER */}
            {currentStep === 7 && (
              <div className="p-4 space-y-4 text-xs">
                <h4 className="font-bold text-slate-800">Preview with Sample Data</h4>
                <p className="text-[11px] text-slate-500">
                  Switch between sample member profiles to test text wrapping and photo scaling.
                </p>

                <div className="space-y-2">
                  {sampleMembers.map((sm, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSampleMemberIndex(idx)}
                      className={`w-full p-2.5 rounded-xl border text-left transition-all ${
                        sampleMemberIndex === idx
                          ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="block font-bold text-xs">{sm.memberName}</span>
                      <span className="text-[10px] text-slate-500">{sm.companyName} • {sm.referralGroupName}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 8: PUBLISH PRE-FLIGHT */}
            {currentStep === 8 && (
              <div className="p-4 space-y-4 text-xs">
                <h4 className="font-bold text-slate-800">Ready to Publish</h4>
                <p className="text-[11px] text-slate-500">
                  Once published, this template is instantly accessible to members in their Creative Studio.
                </p>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Template Name:</span>
                    <span className="font-bold text-slate-800">{templateName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Resolution:</span>
                    <span className="font-mono text-slate-800">{width}×{height}px</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Elements:</span>
                    <span className="font-bold text-slate-800">{elements.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Workflow:</span>
                    <span className="font-bold text-slate-800">{approvalRequired ? 'Approval Required' : 'Direct Generation'}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleSave(true)}
                  disabled={isSaving}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Publish to Member Gallery</span>
                </button>

                {/* Danger Zone: Delete Template */}
                {templateIdParam && (
                  <div className="pt-3 border-t border-slate-200 space-y-2">
                    <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block">
                      Danger Zone
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDeleteTemplateModal(true);
                        setConfirmDeleteTemplateName('');
                      }}
                      className="w-full py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Permanently Delete Template</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Step Next / Back Navigation Footer */}
            <div className="mt-auto border-t border-slate-200 p-3 bg-slate-50/70 flex items-center justify-between">
              <button
                onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
                disabled={currentStep === 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 disabled:opacity-30 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                onClick={() => setCurrentStep((s) => Math.min(8, s + 1))}
                disabled={currentStep === 8}
                className="inline-flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-30 shadow-xs transition-colors"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </aside>
        )}

        {/* CENTER INTERACTIVE DESIGN CANVAS (HERO WORKSPACE) */}
        <main
          ref={containerRef}
          className="flex-1 bg-slate-200/60 relative overflow-auto flex items-center justify-center p-8 select-none"
        >
          {/* Canvas Card */}
          <div
            style={{
              width: `${width * zoom}px`,
              height: `${height * zoom}px`,
            }}
            className="relative shadow-2xl bg-white rounded-lg shrink-0 border border-slate-300 transition-all duration-100"
          >
            {/* The Actual HTML5 Canvas */}
            <canvas
              ref={canvasRef}
              width={width}
              height={height}
              className="w-full h-full block rounded-lg"
            />

            {/* Interactive Elements Overlay - Active only in Admin Edit Mode */}
            {previewMode === 'edit' && (
              <div
                className="absolute inset-0 pointer-events-auto"
                onClick={() => setSelectedElementId(null)}
              >
                {elements.map((el) => {
                  const isSelected = selectedElementId === el.id;
                  const left = el.posX * zoom;
                  const top = el.posY * zoom;
                  const w = el.width * zoom;
                  const h = el.height * zoom;
                  const rot = el.rotation || 0;

                  return (
                    <div
                      key={el.id}
                      data-element-box
                      onMouseDown={(e) => handleStartDrag(e, el, 'move')}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedElementId(el.id);
                        setShowRightInspector(true);
                      }}
                      style={{
                        left: `${left}px`,
                        top: `${top}px`,
                        width: `${w}px`,
                        height: `${h}px`,
                        zIndex: el.zIndex,
                        transform: rot !== 0 ? `rotate(${rot}deg)` : undefined,
                        transformOrigin: 'center center',
                      }}
                      className={`absolute transition-shadow rounded select-none ${
                        el.isLocked ? 'cursor-not-allowed' : 'cursor-move'
                      } ${
                        isSelected
                          ? 'ring-2 ring-blue-600 ring-offset-1 bg-blue-500/10 shadow-md'
                          : 'hover:ring-1 hover:ring-blue-400/80 hover:bg-blue-50/20'
                      }`}
                    >
                      {/* Locked element badge */}
                      {el.isLocked && (
                        <div
                          className="absolute top-1 right-1 bg-amber-500/90 text-white rounded p-0.5 pointer-events-none shadow-xs"
                          title="Locked: Position fixed"
                        >
                          <Lock className="w-2.5 h-2.5" />
                        </div>
                      )}

                      {isSelected && (
                        <>
                          {/* Floating Tool Tag */}
                          <div className="absolute -top-6 left-0 bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow pointer-events-none truncate max-w-[180px] flex items-center gap-1">
                            {el.isLocked && <Lock className="w-2.5 h-2.5 text-amber-300" />}
                            <span>{el.name}</span>
                            <span className="opacity-70">
                              ({Math.round(el.posX)}, {Math.round(el.posY)})
                            </span>
                          </div>

                          {/* Rotation Handle Stalk and Knob */}
                          {!el.isLocked && (
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto z-30">
                              <div
                                onMouseDown={(e) => handleStartDrag(e, el, 'rotate')}
                                className="w-4 h-4 rounded-full bg-white border-2 border-blue-600 shadow-md flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-125 transition-transform"
                                title="Drag to rotate element (Shift to snap 15°)"
                              >
                                <RotateCw className="w-2.5 h-2.5 text-blue-600" />
                              </div>
                              <div className="w-0.5 h-2 bg-blue-600" />
                            </div>
                          )}

                          {/* 4 Interactive Corner Resize Handles */}
                          {!el.isLocked && (
                            <>
                              {/* SE Handle (Bottom-Right) */}
                              <div
                                onMouseDown={(e) => handleStartDrag(e, el, 'resize-se')}
                                className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-blue-600 border-2 border-white rounded-full shadow-md cursor-se-resize hover:scale-125 transition-transform z-30"
                                title="Resize Bottom-Right"
                              />
                              {/* SW Handle (Bottom-Left) */}
                              <div
                                onMouseDown={(e) => handleStartDrag(e, el, 'resize-sw')}
                                className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-blue-600 border-2 border-white rounded-full shadow-md cursor-sw-resize hover:scale-125 transition-transform z-30"
                                title="Resize Bottom-Left"
                              />
                              {/* NE Handle (Top-Right) */}
                              <div
                                onMouseDown={(e) => handleStartDrag(e, el, 'resize-ne')}
                                className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-blue-600 border-2 border-white rounded-full shadow-md cursor-ne-resize hover:scale-125 transition-transform z-30"
                                title="Resize Top-Right"
                              />
                              {/* NW Handle (Top-Left) */}
                              <div
                                onMouseDown={(e) => handleStartDrag(e, el, 'resize-nw')}
                                className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-blue-600 border-2 border-white rounded-full shadow-md cursor-nw-resize hover:scale-125 transition-transform z-30"
                                title="Resize Top-Left"
                              />
                            </>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Floating Zoom Bar at Bottom Center */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-lg border border-slate-200 text-xs">
            <button
              onClick={() => setZoom((z) => Math.max(0.2, z - 0.05))}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <span className="font-mono text-xs font-bold text-slate-800 px-1.5 min-w-[45px] text-center">
              {Math.round(zoom * 100)}%
            </span>

            <button
              onClick={() => setZoom((z) => Math.min(1.5, z + 0.05))}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <div className="w-px h-4 bg-slate-200 mx-1" />

            <button
              onClick={fitToScreen}
              className="px-2 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              title="Fit to Screen"
            >
              Fit Screen
            </button>

            <button
              onClick={() => setZoom(1.0)}
              className="px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="100% Actual Scale"
            >
              100%
            </button>
          </div>
        </main>

        {/* RIGHT ELEMENT PROPERTIES INSPECTOR PANEL (SLIDE-OUT / DOCKED) */}
        {showRightInspector && (
          <ElementPropertiesPanel
            selectedElement={selectedElement || null}
            elements={elements}
            onUpdateElement={updateSelectedElement}
            onSelectElement={(id) => setSelectedElementId(id)}
            onDeleteElement={() => deleteSelectedElement()}
            onDuplicateElement={() => duplicateSelectedElement()}
            onReorderElement={(_id, dir) => changeSelectedElementZIndex(dir)}
            onAlignElement={(type) => alignSelectedElement(type)}
            onClose={() => setShowRightInspector(false)}
            logoLibrary={logoLibrary}
            canvasWidth={width}
            canvasHeight={height}
            onAddElement={(type) => {
              if (type === 'headline') addFixedText();
              else if (type === 'photo') addPhotoElement();
              else if (type === 'shape') addShapeElement();
              else if (type === 'social') addSocialMediaElement();
            }}
          />
        )}
      </div>

      {/* =====================================================================
          PERMANENT TEMPLATE DELETE MODAL IN BUILDER
          ===================================================================== */}
      {showDeleteTemplateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-red-100 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 border border-red-200 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 text-base">Permanently Delete Template?</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  This action is irreversible and purges all related records from the database.
                </p>
              </div>
            </div>

            <div className="p-3 bg-red-50/80 border border-red-200/90 rounded-xl text-xs text-red-800 space-y-1.5 leading-relaxed">
              <p className="font-semibold text-red-900">
                ⚠️ All associated data will be completely deleted from the database:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-red-700">
                <li>All template elements and dynamic placeholders</li>
                <li>All pending & completed member requests created from this template</li>
                <li>All generated graphics referencing this template</li>
                <li>The master template record itself</li>
              </ul>
            </div>

            <div className="space-y-2">
              <label className="block text-xs text-slate-700">
                To confirm permanent deletion, please type the template name{' '}
                <span className="font-bold font-mono text-red-700 select-all bg-red-50 px-1 py-0.5 rounded border border-red-200">
                  {templateName}
                </span>{' '}
                below:
              </label>

              <input
                type="text"
                autoFocus
                value={confirmDeleteTemplateName}
                onChange={(e) => setConfirmDeleteTemplateName(e.target.value)}
                placeholder={`Type "${templateName}" to confirm`}
                className={`w-full px-3 py-2 border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 transition-all ${
                  confirmDeleteTemplateName.trim() === templateName.trim()
                    ? 'border-emerald-500 bg-emerald-50/30 text-emerald-900 focus:ring-emerald-500/20'
                    : 'border-slate-300 bg-white text-slate-800 focus:border-red-500 focus:ring-red-500/20'
                }`}
              />

              {confirmDeleteTemplateName && confirmDeleteTemplateName.trim() !== templateName.trim() && (
                <p className="text-[11px] text-amber-600 font-medium">
                  Template name does not match yet.
                </p>
              )}

              {confirmDeleteTemplateName.trim() === templateName.trim() && (
                <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  ✓ Template name matches. Ready to permanently delete.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteTemplateModal(false);
                  setConfirmDeleteTemplateName('');
                }}
                disabled={isDeletingTemplate}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmPermanentDelete}
                disabled={confirmDeleteTemplateName.trim() !== templateName.trim() || isDeletingTemplate}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl text-xs shadow-xs transition-all"
              >
                {isDeletingTemplate ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Deleting all data from database...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Permanently Delete from Database</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
