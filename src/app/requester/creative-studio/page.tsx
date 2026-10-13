'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  User,
  FolderOpen,
  History,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileDown,
  Layers,
  ArrowRight,
  ArrowLeft,
  Shield,
  Palette,
  Check,
  Search,
  Filter,
  Eye,
  Download,
  Clock,
  Send,
  X,
  FileText,
  Building,
  Phone,
  Mail,
  Globe,
  Camera,
  Calendar,
  AlertTriangle,
  ChevronRight,
  Maximize2,
  Trash2,
  Columns,
  Image as ImageIcon,
  Edit3,
  Users,
} from 'lucide-react';
import CategoryCards from '@/components/creatives/CategoryCards';
import DynamicMemberForm from '@/components/creatives/DynamicMemberForm';
import CreativeFormSection from '@/components/creatives/CreativeFormSection';
import TemplateGallery from '@/components/creatives/TemplateGallery';
import LogoSelector, { BrandLogoItem } from '@/components/creatives/LogoSelector';
import InteractiveCreativeCanvas, { InteractiveCanvasElement } from '@/components/creatives/InteractiveCreativeCanvas';
import MySavedCreatives from '@/components/creatives/MySavedCreatives';
import BulkMemberGeneratorModal from '@/components/creatives/BulkMemberGeneratorModal';
import { renderCreativeOnCanvas } from '@/lib/creativeCanvasRenderer';
import { tabFetch, clearTabAuth } from '@/lib/tabAuth';

type MainTab = 'create' | 'requests' | 'graphics' | 'profile';
type CreationStep = 1 | 2 | 3 | 4;

export default function MemberCreativeStudioPage() {
  const router = useRouter();

  // Tab State
  const [activeTab, setActiveTab] = useState<MainTab>('create');
  const [step, setStep] = useState<CreationStep>(1);

  // Core Data
  const [user, setUser] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCategoryCode, setActiveCategoryCode] = useState<string>('MEETING_ANNOUNCEMENT');
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [logos, setLogos] = useState<BrandLogoItem[]>([]);
  const [selectedLogo, setSelectedLogo] = useState<BrandLogoItem | null>(null);
  const [membersList, setMembersList] = useState<any[]>([]);
  const [savedCreatives, setSavedCreatives] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]);

  // Filtering for Step 1 Gallery
  const [galleryCategory, setGalleryCategory] = useState<string>('ALL');
  const [gallerySearch, setGallerySearch] = useState('');
  const [galleryOrientation, setGalleryOrientation] = useState('ALL');
  const [previewModalTemplate, setPreviewModalTemplate] = useState<any>(null);

  // Generation / Submission States
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [isGeneratingDirect, setIsGeneratingDirect] = useState(false);
  const [isGeneratingDocx, setIsGeneratingDocx] = useState(false);
  const [lastSubmissionResult, setLastSubmissionResult] = useState<any>(null);
  const [lastGeneratedGraphic, setLastGeneratedGraphic] = useState<any>(null);
  const [generatedImageDataUrl, setGeneratedImageDataUrl] = useState<string | null>(null);
  const [editingCreative, setEditingCreative] = useState<any>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Step 3 Live Preview Canvas Ref
  const step3CanvasRef = useRef<HTMLCanvasElement>(null);

  // Studio Live Preview Elements State
  const [templateElements, setTemplateElements] = useState<InteractiveCanvasElement[]>([]);
  const [step2ViewMode, setStep2ViewMode] = useState<'split' | 'form'>('split');

  // Helper to initialize elements from template or synthesize default movable placeholders
  const initTemplateElements = useCallback((tpl: any): InteractiveCanvasElement[] => {
    if (!tpl) return [];
    if (tpl.elements && Array.isArray(tpl.elements) && tpl.elements.length > 0) {
      return tpl.elements.map((el: any) => ({
        ...el,
        initialPosX: Number(el.posX) || 0,
        initialPosY: Number(el.posY) || 0,
        initialWidth: Number(el.width) || 100,
        initialHeight: Number(el.height) || 40,
        initialFontSize: Number(el.fontSize) || 24,
        initialTextColor: el.textColor || '#000000',
      }));
    }

    const w = Number(tpl.width) || 1080;
    const h = Number(tpl.height) || 1080;
    const catCode = tpl.category?.code || activeCategoryCode;

    if (catCode === 'BUSINESS_PRESENTATION' || catCode === 'KYM') {
      return [
        {
          id: 'def-photo',
          name: 'Professional Photo',
          elementType: 'MEMBER_PHOTO',
          fieldKey: 'photoUrl',
          posX: Math.round(w * 0.08),
          posY: Math.round(h * 0.22),
          width: 320,
          height: 320,
          initialPosX: Math.round(w * 0.08),
          initialPosY: Math.round(h * 0.22),
          initialWidth: 320,
          initialHeight: 320,
          zIndex: 10,
        },
        {
          id: 'def-name',
          name: 'Member Name',
          elementType: 'DYNAMIC_FIELD',
          fieldKey: 'memberName',
          posX: Math.round(w * 0.44),
          posY: Math.round(h * 0.25),
          width: 520,
          height: 60,
          fontSize: 42,
          textColor: '#0F172A',
          fontWeight: 'bold',
          initialPosX: Math.round(w * 0.44),
          initialPosY: Math.round(h * 0.25),
          initialWidth: 520,
          initialHeight: 60,
          initialFontSize: 42,
          initialTextColor: '#0F172A',
          zIndex: 11,
        },
        {
          id: 'def-company',
          name: 'Company Name',
          elementType: 'DYNAMIC_FIELD',
          fieldKey: 'companyName',
          posX: Math.round(w * 0.44),
          posY: Math.round(h * 0.35),
          width: 520,
          height: 45,
          fontSize: 28,
          textColor: '#D97706',
          fontWeight: 'bold',
          initialPosX: Math.round(w * 0.44),
          initialPosY: Math.round(h * 0.35),
          initialWidth: 520,
          initialHeight: 45,
          initialFontSize: 28,
          initialTextColor: '#D97706',
          zIndex: 12,
        },
        {
          id: 'def-category',
          name: 'Business Category',
          elementType: 'DYNAMIC_FIELD',
          fieldKey: 'businessCategory',
          posX: Math.round(w * 0.44),
          posY: Math.round(h * 0.43),
          width: 520,
          height: 40,
          fontSize: 24,
          textColor: '#475569',
          fontWeight: 'normal',
          initialPosX: Math.round(w * 0.44),
          initialPosY: Math.round(h * 0.43),
          initialWidth: 520,
          initialHeight: 40,
          initialFontSize: 24,
          initialTextColor: '#475569',
          zIndex: 13,
        },
        {
          id: 'def-phone',
          name: 'Mobile Number',
          elementType: 'DYNAMIC_FIELD',
          fieldKey: 'phone',
          posX: Math.round(w * 0.44),
          posY: Math.round(h * 0.51),
          width: 420,
          height: 35,
          fontSize: 22,
          textColor: '#1E293B',
          fontWeight: 'bold',
          initialPosX: Math.round(w * 0.44),
          initialPosY: Math.round(h * 0.51),
          initialWidth: 420,
          initialHeight: 35,
          initialFontSize: 22,
          initialTextColor: '#1E293B',
          zIndex: 14,
        },
      ];
    } else if (catCode === 'MEETING_ANNOUNCEMENT') {
      return [
        {
          id: 'def-group',
          name: 'Referral Group Name',
          elementType: 'DYNAMIC_FIELD',
          fieldKey: 'referralGroupName',
          posX: Math.round(w * 0.1),
          posY: Math.round(h * 0.18),
          width: 800,
          height: 50,
          fontSize: 36,
          textColor: '#0F172A',
          fontWeight: 'bold',
          initialPosX: Math.round(w * 0.1),
          initialPosY: Math.round(h * 0.18),
          initialWidth: 800,
          initialHeight: 50,
          initialFontSize: 36,
          initialTextColor: '#0F172A',
          zIndex: 10,
        },
        {
          id: 'def-date',
          name: 'Meeting Date',
          elementType: 'DYNAMIC_FIELD',
          fieldKey: 'date',
          posX: Math.round(w * 0.1),
          posY: Math.round(h * 0.32),
          width: 800,
          height: 45,
          fontSize: 32,
          textColor: '#D97706',
          fontWeight: 'bold',
          initialPosX: Math.round(w * 0.1),
          initialPosY: Math.round(h * 0.32),
          initialWidth: 800,
          initialHeight: 45,
          initialFontSize: 32,
          initialTextColor: '#D97706',
          zIndex: 11,
        },
        {
          id: 'def-time',
          name: 'Meeting Time',
          elementType: 'DYNAMIC_FIELD',
          fieldKey: 'time',
          posX: Math.round(w * 0.1),
          posY: Math.round(h * 0.42),
          width: 500,
          height: 40,
          fontSize: 26,
          textColor: '#1E293B',
          fontWeight: 'bold',
          initialPosX: Math.round(w * 0.1),
          initialPosY: Math.round(h * 0.42),
          initialWidth: 500,
          initialHeight: 40,
          initialFontSize: 26,
          initialTextColor: '#1E293B',
          zIndex: 12,
        },
        {
          id: 'def-venue',
          name: 'Venue Location',
          elementType: 'DYNAMIC_FIELD',
          fieldKey: 'venue',
          posX: Math.round(w * 0.1),
          posY: Math.round(h * 0.52),
          width: 800,
          height: 80,
          fontSize: 24,
          textColor: '#334155',
          fontWeight: 'normal',
          initialPosX: Math.round(w * 0.1),
          initialPosY: Math.round(h * 0.52),
          initialWidth: 800,
          initialHeight: 80,
          initialFontSize: 24,
          initialTextColor: '#334155',
          zIndex: 13,
        },
      ];
    } else {
      return [
        {
          id: 'def-name',
          name: 'Birthday Member Name',
          elementType: 'DYNAMIC_FIELD',
          fieldKey: 'memberName',
          posX: Math.round(w * 0.15),
          posY: Math.round(h * 0.35),
          width: 700,
          height: 60,
          fontSize: 42,
          textColor: '#0F172A',
          fontWeight: 'bold',
          initialPosX: Math.round(w * 0.15),
          initialPosY: Math.round(h * 0.35),
          initialWidth: 700,
          initialHeight: 60,
          initialFontSize: 42,
          initialTextColor: '#0F172A',
          zIndex: 10,
        },
        {
          id: 'def-photo',
          name: 'Birthday Photo',
          elementType: 'MEMBER_PHOTO',
          fieldKey: 'photoUrl',
          posX: Math.round(w * 0.35),
          posY: Math.round(h * 0.15),
          width: 280,
          height: 280,
          initialPosX: Math.round(w * 0.35),
          initialPosY: Math.round(h * 0.15),
          initialWidth: 280,
          initialHeight: 280,
          zIndex: 11,
        },
      ];
    }
  }, [activeCategoryCode]);

  // Form Data State
  const [formData, setFormData] = useState<any>({
    referralGroupName: 'Apex Referral Chapter',
    memberName: '',
    companyName: '',
    businessCategory: '',
    photoUrl: '',
    phone: '',
    email: '',
    website: '',
    specificAsk: '',
    date: 'Wednesday, 16th October 2026',
    time: '07:00 AM - 09:30 AM',
    venue: 'Grand Ballroom, The Oberoi, Marine Drive',
    meetingStimulant: 'Unlocking Cross-Chapter Strategic Alliances',
    dressCode: 'Business Formals',
    visitorFees: '₹1,200 (Buffet & Networking Included)',
    birthDay: '15th',
    birthMonth: 'October',
    birthdayWish: 'Wishing you a magnificent year filled with boundless success, good health and prosperity on your special day!',
    monthlyMembers: [],
    customFields: {},
  });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Fetch User Profile
  useEffect(() => {
    async function loadUser() {
      try {
        const res = await tabFetch('/api/auth/profile');
        const json = await res.json();
        if (json.user) {
          const u = json.user;
          const reqProf = u.requesterProfile;
          setUser(u);

          const cleanName = u.name.replace(/\s*\([^)]*\)/, '');
          setFormData((prev: any) => ({
            ...prev,
            memberName: cleanName,
            companyName: reqProf?.company || 'Apex Solutions Ltd',
            businessCategory: reqProf?.businessCategory || 'Digital Marketing & Strategy',
            phone: reqProf?.phone || '+91 98250 11223',
            email: u.email || '',
            website: reqProf?.website || 'www.apexsolutions.example',
            photoUrl: u.avatar || '',
            referralGroupName: reqProf?.referralGroupName || 'Apex Referral Chapter',
            birthDay: reqProf?.birthDay || '15th',
            birthMonth: reqProf?.birthMonth || 'October',
            specificAsk: reqProf?.specificAsk || 'Introductions to B2B SaaS founders and enterprise leaders',
          }));
        }
      } catch (err) {
        console.error('Failed to load user profile:', err);
      }
    }
    loadUser();
  }, []);

  // 2. Fetch Logos
  const fetchLogos = useCallback(async () => {
    try {
      const res = await tabFetch('/api/creatives/logos');
      const json = await res.json();
      if (json.logos && json.logos.length > 0) {
        setLogos(json.logos);
        const def = json.logos.find((l: BrandLogoItem) => l.isDefault) || json.logos[0];
        setSelectedLogo(def);
      }
    } catch (err) {
      console.error('Failed to load logos:', err);
    }
  }, []);

  // 3. Fetch Categories & Published Templates
  const fetchTemplatesAndCategories = useCallback(async () => {
    try {
      const [catRes, tplRes] = await Promise.all([
        tabFetch('/api/creatives/categories'),
        tabFetch('/api/creatives/templates?status=PUBLISHED'),
      ]);
      const catJson = await catRes.json();
      const tplJson = await tplRes.json();

      if (catJson.categories) {
        setCategories(catJson.categories);
      }
      if (tplJson.templates) {
        setTemplates(tplJson.templates);
        if (!selectedTemplate && tplJson.templates.length > 0) {
          setSelectedTemplate(tplJson.templates[0]);
          setTemplateElements(initTemplateElements(tplJson.templates[0]));
        }
      }
    } catch (err) {
      console.error('Failed to load templates/categories:', err);
    }
  }, [selectedTemplate, initTemplateElements]);

  // 4. Fetch Members List
  const fetchMembers = useCallback(async () => {
    try {
      const res = await tabFetch('/api/creatives/members');
      const json = await res.json();
      if (json.members) {
        setMembersList(json.members);
        const octMembers = json.members.filter(
          (m: any) => m.birthMonth && m.birthMonth.toLowerCase() === 'october'
        );
        if (octMembers.length > 0) {
          setFormData((prev: any) => ({
            ...prev,
            monthlyMembers: octMembers,
          }));
        }
      }
    } catch (err) {
      console.error('Failed to load members:', err);
    }
  }, []);

  // 5. Fetch User's Saved Creatives
  const fetchSavedCreatives = useCallback(async () => {
    try {
      const res = await tabFetch('/api/creatives');
      const json = await res.json();
      if (json.creatives) {
        setSavedCreatives(json.creatives);
      }
    } catch (err) {
      console.error('Failed to load saved creatives:', err);
    }
  }, []);

  // 6. Fetch My Creative Requests
  const fetchMyRequests = useCallback(async () => {
    try {
      const res = await tabFetch('/api/creatives/requests');
      const json = await res.json();
      if (json.requests) {
        setMyRequests(json.requests);
      }
    } catch (err) {
      console.error('Failed to load creative requests:', err);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    Promise.all([
      fetchLogos(),
      fetchTemplatesAndCategories(),
      fetchMembers(),
      fetchSavedCreatives(),
      fetchMyRequests(),
    ]).finally(() => {
      setLoadingInitial(false);
    });
  }, [fetchLogos, fetchTemplatesAndCategories, fetchMembers, fetchSavedCreatives, fetchMyRequests]);

  // Handle Template Selection in Step 1
  const handleSelectTemplateAndContinue = (tpl: any) => {
    setSelectedTemplate(tpl);
    if (tpl.category?.code) {
      setActiveCategoryCode(tpl.category.code);
    }
    // Clear any previous template font size overrides so the new template uses its designed typography
    setFormData((prev: any) => ({
      ...prev,
      fieldFontSizes: {},
    }));
    setTemplateElements(initTemplateElements(tpl));
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Submit Request for Admin Approval (Step 3 Action)
  const handleSubmitApprovalRequest = async () => {
    if (!selectedTemplate || isSubmittingRequest) return;
    setIsSubmittingRequest(true);

    try {
      const res = await tabFetch('/api/creatives/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          submittedData: {
            ...formData,
            customElements: templateElements,
          },
          photoUrl: formData.photoUrl || null,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setLastSubmissionResult(json.request);
        setStep(4);
        fetchMyRequests();
        showToast('Creative Request submitted successfully to Super Admin!', 'success');
      } else {
        throw new Error(json.error || 'Failed to submit creative request');
      }
    } catch (err: any) {
      console.error('Error submitting creative request:', err);
      showToast(err.message || 'Submission failed', 'error');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // Direct Generate Graphic (Step 3 Action for Direct Templates)
  const handleDirectGenerateGraphic = async (format: 'PNG' | 'JPG' = 'PNG') => {
    if (!step3CanvasRef.current || !selectedTemplate || isGeneratingDirect) return;
    setIsGeneratingDirect(true);

    try {
      const canvas = step3CanvasRef.current;
      const mime = format === 'PNG' ? 'image/png' : 'image/jpeg';
      const ext = format === 'PNG' ? 'png' : 'jpg';
      const dataUrl = canvas.toDataURL(mime, 0.95);

      const title = `${selectedTemplate.name} - ${formData.memberName || formData.referralGroupName || 'Creative'}`;

      const res = await tabFetch('/api/creatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCreative?.id || undefined,
          categoryId: selectedTemplate.categoryId,
          templateId: selectedTemplate.id,
          logoId: selectedLogo?.id || null,
          title,
          referralGroupName: formData.referralGroupName,
          memberName: formData.memberName,
          formData: {
            ...formData,
            customElements: templateElements,
          },
          imageData: dataUrl,
          outputFormat: format,
          dimensions: `${selectedTemplate.width || 1080}x${selectedTemplate.height || 1080}`,
        }),
      });

      const json = await res.json();
      if (res.ok && json.creative) {
        setGeneratedImageDataUrl(dataUrl);
        setLastGeneratedGraphic(json.creative);
        setSavedCreatives((prev) => {
          if (editingCreative) {
            return [json.creative, ...prev.filter((p) => p.id !== editingCreative.id)];
          }
          return [json.creative, ...prev];
        });
        setStep(4);
        showToast(
          editingCreative
            ? `Creative updated & saved as ${format}!`
            : `Graphic generated & saved as ${format}!`,
          'success'
        );

        // Automatically trigger browser download
        const link = document.createElement('a');
        link.download = `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.${ext}`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        throw new Error(json.error || 'Failed to generate creative');
      }
    } catch (err: any) {
      console.error('Error generating graphic:', err);
      showToast(err.message || 'Generation failed', 'error');
    } finally {
      setIsGeneratingDirect(false);
    }
  };

  // Download directly from Final Graphic screen
  const handleDownloadFinalGraphic = (format: 'PNG' | 'JPG') => {
    const sourceUrl = generatedImageDataUrl || lastGeneratedGraphic?.fileUrl || lastGeneratedGraphic?.previewUrl;
    if (!sourceUrl) {
      showToast('No graphic available to download', 'error');
      return;
    }
    const ext = format === 'PNG' ? 'png' : 'jpg';
    const title = lastGeneratedGraphic?.title || selectedTemplate?.name || 'Graphic';
    const sanitizedTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_');

    if (sourceUrl.startsWith('data:image/')) {
      const img = new window.Image();
      img.onload = () => {
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = img.naturalWidth || selectedTemplate?.width || 1080;
        offscreenCanvas.height = img.naturalHeight || selectedTemplate?.height || 1080;
        const ctx = offscreenCanvas.getContext('2d');
        if (ctx) {
          if (format === 'JPG') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
          }
          ctx.drawImage(img, 0, 0);
          const mime = format === 'PNG' ? 'image/png' : 'image/jpeg';
          const finalDataUrl = offscreenCanvas.toDataURL(mime, 0.95);
          const link = document.createElement('a');
          link.download = `${sanitizedTitle}.${ext}`;
          link.href = finalDataUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          showToast(`Downloaded ${ext.toUpperCase()} file.`, 'success');
        }
      };
      img.src = sourceUrl;
    } else {
      const link = document.createElement('a');
      link.download = `${sanitizedTitle}.${ext}`;
      link.href = sourceUrl;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(`Downloaded ${ext.toUpperCase()} file.`, 'success');
    }
  };

  // Generate Word Document (.docx) for birthdays
  const handleGenerateDocx = async (membersToExport: any[], month: string, group: string) => {
    setIsGeneratingDocx(true);
    try {
      const res = await fetch('/api/creatives/birthday/docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referralGroupName: group,
          month,
          members: membersToExport,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to generate Word document');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Birthday_Roster_${month}_${group.replace(/[^a-zA-Z0-9_-]/g, '_')}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast(`Word Document for ${month} downloaded successfully!`, 'success');
    } catch (err: any) {
      console.error('Docx generation error:', err);
      showToast(err.message || 'Failed to export Word document', 'error');
    } finally {
      setIsGeneratingDocx(false);
    }
  };

  // Delete saved creative
  const handleDeleteCreative = async (id: string) => {
    try {
      const res = await tabFetch(`/api/creatives?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSavedCreatives((prev) => prev.filter((c) => c.id !== id));
        if (editingCreative?.id === id) {
          setEditingCreative(null);
        }
        showToast('Creative removed successfully.', 'success');
      }
    } catch (err) {
      console.error('Failed to delete creative:', err);
    }
  };

  // Edit saved creative
  const handleEditSavedCreative = (c: any) => {
    if (!c) return;
    setEditingCreative(c);

    // 1. Locate template
    let targetTemplate = templates.find((t) => t.id === c.templateId);
    if (!targetTemplate && c.template) {
      targetTemplate = c.template;
    }

    if (targetTemplate) {
      setSelectedTemplate(targetTemplate);
      if (targetTemplate.category?.code) {
        setActiveCategoryCode(targetTemplate.category.code);
      }
    } else if (c.category?.code) {
      setActiveCategoryCode(c.category.code);
    }

    // 2. Restore Logo
    if (c.logoId && logos.length > 0) {
      const matchLogo = logos.find((l) => l.id === c.logoId);
      if (matchLogo) setSelectedLogo(matchLogo);
    } else if (c.logo) {
      setSelectedLogo(c.logo);
    }

    // 3. Parse and restore form data
    let parsed: any = {};
    try {
      parsed = typeof c.formData === 'string' ? JSON.parse(c.formData) : c.formData || {};
    } catch (e) {
      console.warn('Could not parse formData:', e);
    }

    const { customElements, ...restFields } = parsed;

    setFormData((prev) => ({
      ...prev,
      memberName: c.memberName || prev.memberName,
      referralGroupName: c.referralGroupName || prev.referralGroupName,
      ...restFields,
    }));

    // 4. Restore custom elements
    if (customElements && Array.isArray(customElements) && customElements.length > 0) {
      setTemplateElements(customElements);
    } else if (targetTemplate) {
      setTemplateElements(initTemplateElements(targetTemplate));
    }

    // 5. Navigate to Step 2
    setActiveTab('create');
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(`Loaded "${c.title}" for editing!`, 'success');
  };

  // Filtered Templates for Step 1
  const filteredTemplates = templates.filter((tpl) => {
    const matchesCat =
      galleryCategory === 'ALL' ||
      tpl.category?.code === galleryCategory ||
      tpl.categoryId === galleryCategory;

    const matchesSearch =
      !gallerySearch ||
      tpl.name.toLowerCase().includes(gallerySearch.toLowerCase()) ||
      (tpl.description && tpl.description.toLowerCase().includes(gallerySearch.toLowerCase()));

    const matchesOrientation =
      galleryOrientation === 'ALL' || tpl.orientation === galleryOrientation;

    return matchesCat && matchesSearch && matchesOrientation;
  });

  if (loadingInitial) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-600">Loading Member Creative Studio & Templates...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all animate-in fade-in slide-in-from-top-3 ${toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-rose-50 text-rose-900 border-rose-300'
            }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('create')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'create'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Create New Creative</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'create' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
            Step {step}/4
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('requests');
            fetchMyRequests();
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'requests'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          <Clock className="w-4 h-4" />
          <span>My Creative Requests</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'requests' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {myRequests.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('graphics');
            fetchSavedCreatives();
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'graphics'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          <Download className="w-4 h-4" />
          <span>My Generated Graphics</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'graphics' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {savedCreatives.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'profile'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          <User className="w-4 h-4" />
          <span>Member Profile</span>
        </button>
      </div>

      {/* ================= TAB 1: CREATE NEW CREATIVE (TEMPLATE-FIRST WORKFLOW) ================= */}
      {activeTab === 'create' && (
        <div className="space-y-6">
          {/* Step Progress Tracker */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              {/* Step 1 */}
              <button
                onClick={() => setStep(1)}
                className={`flex items-center gap-2.5 text-xs font-bold transition-all ${step === 1 ? 'text-blue-600' : step > 1 ? 'text-emerald-600' : 'text-slate-400'
                  }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${step === 1
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                      : step > 1
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                >
                  {step > 1 ? <Check className="w-4 h-4" /> : '1'}
                </div>
                <div className="hidden sm:block text-left">
                  <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Step 1</span>
                  <span>Select Template</span>
                </div>
              </button>

              <div className={`h-0.5 flex-1 mx-3 ${step > 1 ? 'bg-emerald-500' : 'bg-slate-200'}`} />

              {/* Step 2 */}
              <button
                onClick={() => selectedTemplate && setStep(2)}
                disabled={!selectedTemplate}
                className={`flex items-center gap-2.5 text-xs font-bold transition-all disabled:opacity-50 ${step === 2 ? 'text-blue-600' : step > 2 ? 'text-emerald-600' : 'text-slate-400'
                  }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${step === 2
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                      : step > 2
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                >
                  {step > 2 ? <Check className="w-4 h-4" /> : '2'}
                </div>
                <div className="hidden sm:block text-left">
                  <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Step 2</span>
                  <span>Enter Details</span>
                </div>
              </button>

              <div className={`h-0.5 flex-1 mx-3 ${step > 2 ? 'bg-emerald-500' : 'bg-slate-200'}`} />

              {/* Step 3 */}
              <button
                onClick={() => selectedTemplate && setStep(3)}
                disabled={!selectedTemplate}
                className={`flex items-center gap-2.5 text-xs font-bold transition-all disabled:opacity-50 ${step === 3 ? 'text-blue-600' : step > 3 ? 'text-emerald-600' : 'text-slate-400'
                  }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${step === 3
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                      : step > 3
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                >
                  {step > 3 ? <Check className="w-4 h-4" /> : '3'}
                </div>
                <div className="hidden sm:block text-left">
                  <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Step 3</span>
                  <span>Preview & Generate</span>
                </div>
              </button>

              <div className={`h-0.5 flex-1 mx-3 ${step > 3 ? 'bg-emerald-500' : 'bg-slate-200'}`} />

              {/* Step 4 */}
              <div
                className={`flex items-center gap-2.5 text-xs font-bold ${step === 4 ? 'text-blue-600' : 'text-slate-400'
                  }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${step === 4 ? 'bg-emerald-600 text-white ring-4 ring-emerald-100' : 'bg-slate-100 text-slate-400'
                    }`}
                >
                  4
                </div>
                <div className="hidden sm:block text-left">
                  <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Step 4</span>
                  <span>Final Graphic</span>
                </div>
              </div>
            </div>
          </div>

          {/* ----------------- STEP 1: SELECT TEMPLATE FIRST ----------------- */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Filter & Controls Bar */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Step 1: Select an Approved Template</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Choose from {templates.length} published templates approved by Super Admin. Filter by category, format, or search by name.
                    </p>
                  </div>

                  {selectedTemplate && (
                    <button
                      onClick={() => setStep(2)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors shrink-0"
                    >
                      <span>Continue with Selected ({selectedTemplate.name})</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Category Filter Chips */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <button
                    onClick={() => setGalleryCategory('ALL')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${galleryCategory === 'ALL'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                  >
                    All Categories ({templates.length})
                  </button>
                  {categories.map((c) => {
                    const count = templates.filter((t) => t.category?.code === c.code || t.categoryId === c.id).length;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setGalleryCategory(c.code)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${galleryCategory === c.code
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                      >
                        {c.name} ({count})
                      </button>
                    );
                  })}
                </div>

                {/* Search & Orientation */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-slate-100">
                  <div className="sm:col-span-8 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={gallerySearch}
                      onChange={(e) => setGallerySearch(e.target.value)}
                      placeholder="Search templates by title or keywords..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <select
                      value={galleryOrientation}
                      onChange={(e) => setGalleryOrientation(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="ALL">All Shapes & Sizes</option>
                      <option value="SQUARE">Square (1080×1080)</option>
                      <option value="PORTRAIT">Portrait (1080×1350)</option>
                      <option value="LANDSCAPE">Landscape (1920×1080)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Template Cards Grid */}
              {filteredTemplates.length === 0 ? (
                <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center">
                  <Palette className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-800">No published templates found</h3>
                  <p className="text-xs text-slate-500 mt-1">Try resetting your search query or category filters.</p>
                  <button
                    onClick={() => {
                      setGalleryCategory('ALL');
                      setGallerySearch('');
                      setGalleryOrientation('ALL');
                    }}
                    className="mt-3 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 hover:bg-blue-50"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredTemplates.map((tpl) => {
                    const isSelected = selectedTemplate?.id === tpl.id;
                    const previewImg = tpl.previewImageUrl || tpl.baseDesignUrl;

                    return (
                      <div
                        key={tpl.id}
                        className={`group bg-white rounded-2xl border-2 transition-all p-3 flex flex-col justify-between ${isSelected
                            ? 'border-blue-600 shadow-md ring-2 ring-blue-500/20'
                            : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
                          }`}
                      >
                        {/* Thumbnail View */}
                        <div className="relative w-full aspect-square bg-slate-50 rounded-xl overflow-hidden border border-slate-100 flex items-center justify-center mb-3">
                          {previewImg ? (
                            <img
                              src={previewImg}
                              alt={tpl.name}
                              className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-200"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center p-4 text-center">
                              <Sparkles className="w-6 h-6 text-blue-500 mb-1" />
                              <span className="text-xs font-bold text-slate-800 line-clamp-2">{tpl.name}</span>
                              <span className="text-[10px] text-slate-400 mt-1">
                                {tpl.width}×{tpl.height}
                              </span>
                            </div>
                          )}

                          {/* Quick Preview Button Overlay */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewModalTemplate(tpl);
                            }}
                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white transition-opacity opacity-0 group-hover:opacity-100 shadow-xs"
                            title="Quick preview"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Approval Requirement Badge */}
                          <div className="absolute bottom-2 left-2">
                            {tpl.approvalRequired ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/90 text-white shadow-xs">
                                <Clock className="w-2.5 h-2.5" />
                                Requires Approval
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-600/90 text-white shadow-xs">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                Direct Generation
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Title & Category Info */}
                        <div className="space-y-1 mb-3">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md line-clamp-1">
                              {tpl.category?.name || 'Referral Graphic'}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400">
                              {tpl.orientation || 'SQUARE'}
                            </span>
                          </div>
                          <h3 className="text-xs font-bold text-slate-900 line-clamp-1" title={tpl.name}>
                            {tpl.name}
                          </h3>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => setPreviewModalTemplate(tpl)}
                            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                            title="Preview design"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleSelectTemplateAndContinue(tpl)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${isSelected
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700'
                              }`}
                          >
                            <span>{isSelected ? 'Selected' : 'Select'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ----------------- STEP 2: ENTER DETAILS & INTERACTIVE CANVAS ----------------- */}
          {step === 2 && selectedTemplate && (
            <div className="space-y-6">
              {/* Editing Saved Creative Banner */}
              {editingCreative && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Edit3 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Editing Saved Creative</span>
                      <h4 className="text-xs font-bold text-slate-900">{editingCreative.title}</h4>
                      <p className="text-[11px] text-slate-500">
                        Saved on {new Date(editingCreative.createdAt).toLocaleDateString()} • Generating will update your existing graphic record.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEditingCreative(null);
                      showToast('Switched to create as new creative');
                    }}
                    className="text-xs text-blue-700 hover:text-blue-900 font-semibold bg-white border border-blue-200 px-3.5 py-1.5 rounded-xl hover:bg-blue-50 transition-colors shrink-0"
                  >
                    Save as New Copy Instead
                  </button>
                </div>
              )}

              {/* Selected Template Header Card with View Switcher */}
              <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white border border-blue-200 overflow-hidden shrink-0 flex items-center justify-center">
                    {selectedTemplate.previewImageUrl || selectedTemplate.baseDesignUrl ? (
                      <img
                        src={selectedTemplate.previewImageUrl || selectedTemplate.baseDesignUrl}
                        alt={selectedTemplate.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Palette className="w-6 h-6 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                      Selected Template
                    </span>
                    <h2 className="text-sm font-bold text-slate-900">{selectedTemplate.name}</h2>
                    <p className="text-xs text-slate-600">
                      Category: <span className="font-semibold">{selectedTemplate.category?.name || 'Referral Graphic'}</span> • Output: {selectedTemplate.width}×{selectedTemplate.height}px
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                  {/* View Mode Switcher */}
                  <div className="flex items-center p-1 bg-white border border-blue-200 rounded-xl shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setStep2ViewMode('split')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        step2ViewMode === 'split'
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                      title="Side-by-side: form fields on left, live studio preview on right"
                    >
                      <Columns className="w-3.5 h-3.5" />
                      <span>Split View</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStep2ViewMode('form')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        step2ViewMode === 'form'
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                      title="Standard form fields view"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Form Only</span>
                    </button>
                  </div>

                  <button
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Change</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowBulkModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 hover:text-indigo-800 transition-colors shadow-2xs"
                    title="Add multiple members and generate templates in bulk"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>⚡ Bulk Generator</span>
                  </button>

                  <button
                    onClick={() => setStep(3)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors"
                  >
                    <span>Proceed to Preview</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* VIEW MODE 1: SPLIT VIEW (Form + Live Studio Preview) */}
              {step2ViewMode === 'split' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Column: Dynamic Member Form */}
                  <div className="lg:col-span-7 space-y-6">
                    <DynamicMemberForm
                      template={selectedTemplate}
                      formData={formData}
                      setFormData={setFormData}
                      templateElements={templateElements}
                      onElementsChange={setTemplateElements}
                      userProfile={user}
                      membersList={membersList}
                      isGeneratingDocx={isGeneratingDocx}
                      onGenerateDocx={handleGenerateDocx}
                      onOpenBulkModal={() => setShowBulkModal(true)}
                      onProceedToPreview={() => {
                        setStep(3);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      onBackToTemplates={() => setStep(1)}
                    />
                  </div>

                  {/* Right Column: Live Studio Preview */}
                  <div className="lg:col-span-5 sticky top-4 space-y-4">
                    <InteractiveCreativeCanvas
                      categoryCode={selectedTemplate.category?.code || activeCategoryCode}
                      selectedTemplate={selectedTemplate}
                      selectedLogo={selectedLogo}
                      formData={formData}
                      setFormData={setFormData}
                      elements={templateElements}
                      onElementsChange={setTemplateElements}
                      showDownloadButtons={true}
                      compactMode={true}
                    />

                    {/* Member Quick Summary */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Auto-Filled Member Data
                      </h3>
                      <div className="space-y-2 text-xs">
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {formData.memberName ? formData.memberName[0] : 'M'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 truncate">{formData.memberName || 'Member Name'}</p>
                            <p className="text-[11px] text-slate-500 truncate">{formData.companyName || 'Company'}</p>
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-600 space-y-1 px-1">
                          <p><span className="font-semibold text-slate-700">Category:</span> {formData.businessCategory || 'Not specified'}</p>
                          <p><span className="font-semibold text-slate-700">Mobile:</span> {formData.phone || 'Not specified'}</p>
                          <p><span className="font-semibold text-slate-700">Group:</span> {formData.referralGroupName}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-900 space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Shield className="w-4 h-4 text-amber-700" />
                        <span>Approval Requirement</span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        {selectedTemplate.approvalRequired
                          ? 'This template requires Super Admin approval. After previewing, you will submit a creative request for review.'
                          : 'This template is configured for direct instant generation. You can download HD PNG/JPG immediately.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW MODE 2: FORM ONLY */}
              {step2ViewMode === 'form' && (
                <div className="max-w-4xl mx-auto">
                  <DynamicMemberForm
                    template={selectedTemplate}
                    formData={formData}
                    setFormData={setFormData}
                    templateElements={templateElements}
                    onElementsChange={setTemplateElements}
                    userProfile={user}
                    membersList={membersList}
                    isGeneratingDocx={isGeneratingDocx}
                    onGenerateDocx={handleGenerateDocx}
                    onOpenBulkModal={() => setShowBulkModal(true)}
                    onProceedToPreview={() => {
                      setStep(3);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    onBackToTemplates={() => setStep(1)}
                  />
                </div>
              )}
            </div>
          )}

          {/* ----------------- STEP 3: PREVIEW & GENERATE / SUBMIT ----------------- */}
          {step === 3 && selectedTemplate && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Step 3: Live Graphic Preview & Generation</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Review your high-resolution graphic with your customized member details before final generation.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setStep(2)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Edit Details</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Central Interactive High-Res Canvas */}
                <div className="lg:col-span-8">
                  <InteractiveCreativeCanvas
                    categoryCode={selectedTemplate.category?.code || activeCategoryCode}
                    selectedTemplate={selectedTemplate}
                    selectedLogo={selectedLogo}
                    formData={formData}
                    setFormData={setFormData}
                    elements={templateElements}
                    onElementsChange={setTemplateElements}
                    externalCanvasRef={step3CanvasRef}
                    showDownloadButtons={!selectedTemplate.approvalRequired}
                    compactMode={false}
                  />
                </div>

                {/* Right Action Column */}
                <div className="lg:col-span-4 space-y-4">
                  {/* Action Card */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-slate-900">Confirm & Generate</h3>

                    {selectedTemplate.approvalRequired ? (
                      /* APPROVAL WORKFLOW */
                      <div className="space-y-3">
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                          <p className="font-bold flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-amber-700" />
                            Approval Required Template
                          </p>
                          <p className="text-[11px] text-amber-800 leading-relaxed">
                            Clicking submit sends your request to the Super Admin review queue. You will be able to track status in <strong>My Creative Requests</strong>.
                          </p>
                        </div>

                        <button
                          onClick={handleSubmitApprovalRequest}
                          disabled={isSubmittingRequest}
                          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors disabled:opacity-50"
                        >
                          {isSubmittingRequest ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Submitting Request...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              <span>Submit Creative Request for Admin Approval</span>
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      /* DIRECT GENERATION WORKFLOW */
                      <div className="space-y-3">
                        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
                          <p className="font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                            Direct Generation Available
                          </p>
                          <p className="text-[11px] text-emerald-800 leading-relaxed">
                            This design can be generated directly without admin delay. Your graphic will be saved to your account and downloaded immediately.
                          </p>
                        </div>

                        <button
                          onClick={() => handleDirectGenerateGraphic('PNG')}
                          disabled={isGeneratingDirect}
                          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors disabled:opacity-50"
                        >
                          {isGeneratingDirect ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Generating High-Res Graphic...</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4" />
                              <span>Generate & Download HD PNG</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleDirectGenerateGraphic('JPG')}
                          disabled={isGeneratingDirect}
                          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Generate & Download JPG</span>
                        </button>
                      </div>
                    )}

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <button
                        onClick={() => setStep(2)}
                        className="text-slate-500 hover:text-slate-800 font-semibold"
                      >
                        ← Edit Information
                      </button>
                    </div>
                  </div>

                  {/* Summary of Info Card */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs space-y-2">
                    <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">
                      Render Summary
                    </h4>
                    <p><span className="text-slate-500">Member:</span> <span className="font-semibold text-slate-800">{formData.memberName}</span></p>
                    <p><span className="text-slate-500">Company:</span> <span className="font-semibold text-slate-800">{formData.companyName}</span></p>
                    <p><span className="text-slate-500">Logo:</span> <span className="font-semibold text-slate-800">{selectedLogo?.name || 'Selected Logo'}</span></p>
                    <p><span className="text-slate-500">Template:</span> <span className="font-semibold text-slate-800">{selectedTemplate.name}</span></p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ----------------- STEP 4: FINAL GRAPHIC & DOWNLOAD ----------------- */}
          {step === 4 && (
            <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs text-center space-y-6">
              {lastSubmissionResult ? (
                /* APPROVAL SUBMITTED CONFIRMATION */
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 mx-auto flex items-center justify-center">
                    <Send className="w-8 h-8" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Creative Request Submitted!</h2>
                  <div className="inline-block px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-bold">
                    Request Code: {lastSubmissionResult.reqCode}
                  </div>
                  <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                    Your request for template <span className="font-bold text-slate-800">{selectedTemplate?.name}</span> has been successfully placed into the Super Admin approval queue.
                  </p>

                  <div className="flex items-center justify-center gap-3 pt-4">
                    <button
                      onClick={() => {
                        setActiveTab('requests');
                        fetchMyRequests();
                      }}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors"
                    >
                      Track in My Creative Requests
                    </button>
                    <button
                      onClick={() => {
                        setStep(1);
                        setLastSubmissionResult(null);
                        setEditingCreative(null);
                      }}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                      Create Another Creative
                    </button>
                  </div>
                </div>
              ) : (
                /* DIRECT GENERATION SUCCESS */
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">High-Resolution Graphic Ready!</h2>
                  <p className="text-xs text-slate-600 max-w-md mx-auto">
                    Your creative has been rendered, stored in your account, and downloaded. You can re-download anytime.
                  </p>

                  {/* Graphic Preview */}
                  <div className="max-w-md mx-auto p-2 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-xs flex items-center justify-center min-h-[320px]">
                    {generatedImageDataUrl || lastGeneratedGraphic?.fileUrl || lastGeneratedGraphic?.previewUrl ? (
                      <img
                        src={generatedImageDataUrl || lastGeneratedGraphic?.fileUrl || lastGeneratedGraphic?.previewUrl}
                        alt={selectedTemplate?.name || 'High-Resolution Graphic'}
                        className="w-full h-auto rounded-lg shadow-2xs object-contain block mx-auto border border-slate-200/60"
                        style={{
                          aspectRatio: `${selectedTemplate?.width || 1080} / ${selectedTemplate?.height || 1080}`,
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8 text-slate-400">
                        <ImageIcon className="w-12 h-12 mb-2 stroke-1" />
                        <span className="text-xs">No graphic preview available</span>
                      </div>
                    )}
                  </div>

                  {/* Download Actions */}
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => handleDownloadFinalGraphic('PNG')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download PNG (HD)</span>
                    </button>

                    <button
                      onClick={() => handleDownloadFinalGraphic('JPG')}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download JPG</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('graphics');
                        fetchSavedCreatives();
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>View in My Generated Graphics</span>
                    </button>

                    <button
                      onClick={() => {
                        setStep(1);
                        setLastGeneratedGraphic(null);
                        setGeneratedImageDataUrl(null);
                        setEditingCreative(null);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                    >
                      <span>+ Create Another</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: MY CREATIVE REQUESTS ================= */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">My Creative Requests</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Track creative requests that required Super Admin approval. Review approval status, revision notes, and download approved graphics.
              </p>
            </div>

            <button
              onClick={fetchMyRequests}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Queue</span>
            </button>
          </div>

          {myRequests.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center">
              <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">No Creative Requests Yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Templates configured to require Super Admin approval will show their review status here once submitted.
              </p>
              <button
                onClick={() => {
                  setActiveTab('create');
                  setStep(1);
                }}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs"
              >
                + Create New Creative
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myRequests.map((req) => {
                let submitted: any = {};
                try {
                  submitted = typeof req.submittedData === 'string' ? JSON.parse(req.submittedData) : req.submittedData || {};
                } catch { }

                const statusBg =
                  req.status === 'APPROVED' || req.status === 'COMPLETED'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : req.status === 'REJECTED'
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200';

                return (
                  <div
                    key={req.id}
                    className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-bold text-slate-900">{req.reqCode}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBg}`}>
                          {req.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {req.template?.previewImageUrl || req.photoUrl ? (
                            <img
                              src={req.template?.previewImageUrl || req.photoUrl}
                              alt="Creative"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <FileText className="w-6 h-6 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-800 truncate">
                            {req.template?.name || 'Referral Template'}
                          </h4>
                          <p className="text-[11px] text-slate-500 truncate">
                            Member: {submitted.memberName || user?.name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {new Date(req.createdAt).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Admin Feedback note */}
                      {req.adminFeedback && (
                        <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] space-y-0.5">
                          <span className="font-bold text-slate-700">Admin Feedback:</span>
                          <p className="text-slate-600">{req.adminFeedback}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions if Approved or Generated */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      {req.generatedCreative?.fileUrl ? (
                        <a
                          href={req.generatedCreative.fileUrl}
                          download
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download Approved Graphic</span>
                        </a>
                      ) : req.status === 'APPROVED' ? (
                        <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approved by Super Admin
                        </span>
                      ) : req.status === 'REJECTED' ? (
                        <span className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Revision Required
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-amber-600 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Under Review
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: MY GENERATED GRAPHICS ================= */}
      {activeTab === 'graphics' && (
        <div className="space-y-4">
          <MySavedCreatives
            creatives={savedCreatives}
            onDeleteCreative={handleDeleteCreative}
            onEditCreative={handleEditSavedCreative}
            onRefresh={fetchSavedCreatives}
          />
        </div>
      )}

      {/* ================= TAB 4: MEMBER PROFILE ================= */}
      {activeTab === 'profile' && (
        <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-bold border border-blue-200 overflow-hidden">
                {formData.photoUrl ? (
                  <img src={formData.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  formData.memberName?.[0] || 'M'
                )}
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">{formData.memberName || user?.name}</h2>
                <p className="text-xs text-slate-500">
                  Member Code: <span className="font-semibold text-slate-700">{user?.requesterProfile?.memberCode || 'N/A'}</span> • {formData.referralGroupName}
                </p>
              </div>
            </div>

            <Link
              href="/requester/profile"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
            >
              Edit Profile
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Company Name</span>
              <span className="font-semibold text-slate-800">{formData.companyName || 'Not specified'}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Business Category</span>
              <span className="font-semibold text-slate-800">{formData.businessCategory || 'Not specified'}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Phone Number</span>
              <span className="font-semibold text-slate-800">{formData.phone || 'Not specified'}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Email Address</span>
              <span className="font-semibold text-slate-800">{formData.email || user?.email}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Website</span>
              <span className="font-semibold text-slate-800">{formData.website || 'Not specified'}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Birthday</span>
              <span className="font-semibold text-slate-800">{formData.birthDay} {formData.birthMonth}</span>
            </div>
          </div>

          <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-blue-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Auto-fill is enabled
            </p>
            <p className="text-[11px] text-blue-800">
              Your profile information automatically pre-fills every creative template you create, saving you time.
            </p>
          </div>
        </div>
      )}

      {/* QUICK PREVIEW MODAL */}
      {previewModalTemplate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{previewModalTemplate.name}</h3>
                <p className="text-[11px] text-slate-500">
                  {previewModalTemplate.width}×{previewModalTemplate.height}px • {previewModalTemplate.orientation}
                </p>
              </div>
              <button
                onClick={() => setPreviewModalTemplate(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="w-full aspect-square bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200">
              {previewModalTemplate.previewImageUrl || previewModalTemplate.baseDesignUrl ? (
                <img
                  src={previewModalTemplate.previewImageUrl || previewModalTemplate.baseDesignUrl}
                  alt={previewModalTemplate.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center p-6">
                  <Sparkles className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">{previewModalTemplate.name}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setPreviewModalTemplate(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>

              <button
                onClick={() => {
                  const tpl = previewModalTemplate;
                  setPreviewModalTemplate(null);
                  handleSelectTemplateAndContinue(tpl);
                }}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs"
              >
                <span>Select & Start Customizing</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK MEMBER GENERATOR POPUP MODAL */}
      <BulkMemberGeneratorModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        selectedTemplate={selectedTemplate}
        allTemplates={templates}
        membersList={membersList}
        selectedLogo={selectedLogo}
        formData={formData}
        activeCategoryCode={selectedTemplate?.category?.code || activeCategoryCode}
        onCreativesGenerated={(newCreatives) => {
          setSavedCreatives((prev) => [...newCreatives, ...prev]);
          showToast(`Generated ${newCreatives.length} creatives in bulk!`, 'success');
        }}
        onGoToGraphicsTab={() => {
          setActiveTab('graphics');
          fetchSavedCreatives();
        }}
      />
    </div>
  );
}
