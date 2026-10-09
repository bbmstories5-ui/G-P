'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Layers,
  Info,
  CheckCircle2,
  FileImage,
  Upload,
  X,
  Plus,
  Clock,
  AlertCircle,
  ChevronDown,
  Check,
  User,
  Image as ImageIcon,
  Users,
  Briefcase,
  Cake,
  UserCheck,
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  Sparkles,
  HelpCircle,
  Eye,
  Shirt,
  DollarSign,
  Compass,
  FileText,
  FileSpreadsheet,
  Download,
  Trash2,
  Edit3,
  RefreshCw
} from 'lucide-react';
import { tabFetch } from '@/lib/tabAuth';
import { toast } from '@/components/ui/ToastProvider';

// 4 Exact Member Creative Request Types
export type CreativeTypeId = 'referral_meeting' | 'business_presentation' | 'kym' | 'birthday';

interface CreativeTypeConfig {
  id: CreativeTypeId;
  code: 'A' | 'B' | 'C' | 'D';
  title: string;
  subtitle: string;
  category: string;
  defaultPlatform: string;
  defaultDimensions: string;
  icon: any;
  color: string;
  badgeBg: string;
  badgeText: string;
  description: string;
}

const CREATIVE_TYPES: CreativeTypeConfig[] = [
  {
    id: 'referral_meeting',
    code: 'A',
    title: 'Referral Meeting Announcement Creative',
    subtitle: 'Chapter Meeting, Venue, Stimulant & Dress Code',
    category: 'Referral Meeting Announcement',
    defaultPlatform: 'Instagram & WhatsApp',
    defaultDimensions: '1080 x 1080',
    icon: Users,
    color: 'border-blue-500 text-blue-600 bg-blue-50',
    badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
    badgeText: 'Type A • Meeting Announcement',
    description: 'Promote upcoming referral group weekly meetings, visitor days, or special chapters with stimulant and fees.'
  },
  {
    id: 'business_presentation',
    code: 'B',
    title: 'Business Presentation Creative',
    subtitle: 'Member Spotlight, Category, Specific Ask & Profile',
    category: 'Business Presentation',
    defaultPlatform: 'WhatsApp & Social Media',
    defaultDimensions: '1080 x 1080',
    icon: Briefcase,
    color: 'border-indigo-500 text-indigo-600 bg-indigo-50',
    badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    badgeText: 'Type B • Feature Presentation',
    description: 'Showcase an 8-10 minute business presentation with professional photo, company details, and specific referral asks.'
  },
  {
    id: 'kym',
    code: 'C',
    title: 'KYM Creative (Know Your Member)',
    subtitle: '1-to-1 Member Introduction & Category Spotlight',
    category: 'KYM Creative',
    defaultPlatform: 'Instagram & Status',
    defaultDimensions: '1080 x 1080',
    icon: UserCheck,
    color: 'border-emerald-500 text-emerald-600 bg-emerald-50',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    badgeText: 'Type C • Member Spotlight',
    description: 'Know Your Member creative featuring member portrait, company profile, meeting date, time, and contact info.'
  },
  {
    id: 'birthday',
    code: 'D',
    title: 'BIRTHDAY Creative',
    subtitle: 'Month-wise formatted warm birthday greetings & bulk CSV import',
    category: 'Birthday Creative',
    defaultPlatform: 'WhatsApp Status & Socials',
    defaultDimensions: '1080 x 1080',
    icon: Cake,
    color: 'border-amber-500 text-amber-600 bg-amber-50',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
    badgeText: 'Type D • Birthday Greeting',
    description: 'Month-wise word format birthday greeting flyer with member photo, group name, and celebration wishes.'
  }
];

const PRESET_DIMENSIONS = [
  '1080 x 1080 (Square 1:1)',
  '1080 x 1920 (Story / Status 9:16)',
  '1920 x 1080 (Presentation 16:9)',
  '1080 x 1350 (Portrait 4:5)',
  'A4 (2480 x 3508 Print)'
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface BirthdayCsvRow {
  id: string;
  referralGroupName: string;
  memberName: string;
  mobileNumber: string;
  birthDay: string;
  birthMonth: string;
  birthdayWish: string;
  additionalNotes: string;
}

export default function NewRequirementPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<CreativeTypeId>('referral_meeting');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [designers, setDesigners] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'form' | 'preview' | 'bulk_csv'>('form');

  // Shared Common State
  const [priority, setPriority] = useState('MEDIUM');
  const [deadline, setDeadline] = useState(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [dimensions, setDimensions] = useState('1080 x 1080');
  const [platform, setPlatform] = useState('WhatsApp & Social Media');
  const [assignedDesignerId, setAssignedDesignerId] = useState('AUTO');
  const [referenceFileUrl, setReferenceFileUrl] = useState('');
  const [referenceFileName, setReferenceFileName] = useState('');
  const [customTitle, setCustomTitle] = useState('');

  // 1. Type A State (Referral Meeting Announcement)
  const [typeA, setTypeA] = useState({
    referralGroupName: '',
    meetingDate: '',
    meetingTime: '07:00 AM to 09:30 AM',
    venue: '',
    meetingStimulant: '',
    dressCode: 'Business Formal',
    visitorFees: '₹800 (Including Breakfast)',
    additionalNotes: ''
  });

  // 2. Type B State (Business Presentation Creative)
  const [typeB, setTypeB] = useState({
    referralGroupName: '',
    companyName: '',
    category: '',
    memberName: '',
    mobileNumber: '',
    emailId: '',
    website: '',
    specificAsk: '',
    presentationDate: '',
    presentationTime: '07:30 AM',
    venue: '',
    additionalNotes: ''
  });

  // 3. Type C State (KYM Creative)
  const [typeC, setTypeC] = useState({
    referralGroupName: '',
    memberName: '',
    meetingDate: '',
    meetingTime: '07:00 AM to 09:30 AM',
    venue: '',
    companyName: '',
    category: '',
    mobileNumber: '',
    additionalNotes: ''
  });

  // 4. Type D State (BIRTHDAY Creative)
  const [typeD, setTypeD] = useState({
    referralGroupName: '',
    memberName: '',
    mobileNumber: '',
    birthDay: '15th',
    birthMonth: 'October',
    birthdayWish: 'Wishing you grand success, joyful milestones, good health, and prosperous heights on your special day!',
    additionalNotes: ''
  });

  // Bulk CSV Upload State
  const [csvRows, setCsvRows] = useState<BirthdayCsvRow[]>([]);
  const [csvFileName, setCsvFileName] = useState('');
  const [csvParseError, setCsvParseError] = useState('');
  const [bulkBatchName, setBulkBatchName] = useState('October Birthday List');
  const [bulkDefaultGroup, setBulkDefaultGroup] = useState('');
  const [bulkProgress, setBulkProgress] = useState<{ total: number; current: number } | null>(null);
  const [bulkResult, setBulkResult] = useState<{ count: number; requirements: any[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    tabFetch('/api/designers')
      .then((res) => res.json())
      .then((data) => {
        if (data.designers) setDesigners(data.designers);
      })
      .catch((err) => console.error('Failed to load designers:', err));
  }, []);

  // Handle Photo / Reference Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 25 * 1024 * 1024) {
        toast.error('File too large', 'Please upload a photo under 25MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setReferenceFileUrl(reader.result as string);
        setReferenceFileName(file.name);
        toast.success('Photo uploaded', `${file.name} ready for graphic integration.`);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setReferenceFileUrl('');
    setReferenceFileName('');
  };

  const setDaysFromNow = (days: number) => {
    const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    setDeadline(d.toISOString().split('T')[0]);
  };

  // Generate dynamic request title
  const computedTitle = useMemo(() => {
    if (customTitle.trim()) return customTitle.trim();
    if (selectedType === 'referral_meeting') {
      const grp = typeA.referralGroupName || 'Referral Group';
      const dt = typeA.meetingDate ? ` - ${typeA.meetingDate}` : '';
      return `[Referral Meeting] ${grp}${dt}`;
    }
    if (selectedType === 'business_presentation') {
      const mem = typeB.memberName || 'Member Presentation';
      const comp = typeB.companyName ? ` (${typeB.companyName})` : '';
      return `[Business Presentation] ${mem}${comp}`;
    }
    if (selectedType === 'kym') {
      const mem = typeC.memberName || 'KYM Member';
      const comp = typeC.companyName ? ` - ${typeC.companyName}` : '';
      return `[KYM Creative] ${mem}${comp}`;
    }
    if (selectedType === 'birthday') {
      const mem = typeD.memberName || 'Member Birthday';
      const dateText = `${typeD.birthDay || ''} ${typeD.birthMonth || ''}`.trim();
      return `[Birthday Creative] ${mem} (${dateText || 'Birthday Greeting'})`;
    }
    return 'Creative Request';
  }, [selectedType, customTitle, typeA, typeB, typeC, typeD]);

  // Generate structured markdown description for Designer & Approver
  const structuredDescription = useMemo(() => {
    if (selectedType === 'referral_meeting') {
      return `### 📢 REFERRAL MEETING ANNOUNCEMENT CREATIVE BRIEF

- **Referral Group Name**: ${typeA.referralGroupName || 'N/A'}
- **Meeting Date**: ${typeA.meetingDate || 'N/A'}
- **Meeting Time**: ${typeA.meetingTime || 'N/A'}
- **Meeting Venue / Location**: ${typeA.venue || 'N/A'}
- **Meeting Stimulant / Theme**: ${typeA.meetingStimulant || 'N/A'}
- **Dress Code**: ${typeA.dressCode || 'N/A'}
- **Visitor Fees**: ${typeA.visitorFees || 'N/A'}

${typeA.additionalNotes ? `**Special Instructions / Notes**:\n${typeA.additionalNotes}` : ''}`.trim();
    }

    if (selectedType === 'business_presentation') {
      return `### 💼 BUSINESS PRESENTATION CREATIVE BRIEF

- **Referral Group Name**: ${typeB.referralGroupName || 'N/A'}
- **Company Name**: ${typeB.companyName || 'N/A'}
- **Business Category**: ${typeB.category || 'N/A'}
- **Member Name**: ${typeB.memberName || 'N/A'}
- **Professional Photo**: ${referenceFileName ? `Attached (${referenceFileName})` : 'To be incorporated from attachment'}
- **Mobile Number**: ${typeB.mobileNumber || 'N/A'}
- **Email ID**: ${typeB.emailId || 'N/A'}
- **Website**: ${typeB.website || 'N/A'}
- **Specific Ask**: ${typeB.specificAsk || 'N/A'}
- **Presentation Date, Time & Venue**: ${typeB.presentationDate || 'N/A'} | ${typeB.presentationTime || 'N/A'} | ${typeB.venue || 'N/A'}

${typeB.additionalNotes ? `**Special Instructions / Brand Notes**:\n${typeB.additionalNotes}` : ''}`.trim();
    }

    if (selectedType === 'kym') {
      return `### 🤝 KYM (KNOW YOUR MEMBER) CREATIVE BRIEF

- **Referral Group Name**: ${typeC.referralGroupName || 'N/A'}
- **Member Name**: ${typeC.memberName || 'N/A'}
- **Professional Photo**: ${referenceFileName ? `Attached (${referenceFileName})` : 'To be incorporated from attachment'}
- **Company Name**: ${typeC.companyName || 'N/A'}
- **Business Category**: ${typeC.category || 'N/A'}
- **Mobile Number**: ${typeC.mobileNumber || 'N/A'}
- **Meeting Date, Time & Venue**: ${typeC.meetingDate || 'N/A'} | ${typeC.meetingTime || 'N/A'} | ${typeC.venue || 'N/A'}

${typeC.additionalNotes ? `**Special Instructions / Highlights**:\n${typeC.additionalNotes}` : ''}`.trim();
    }

    if (selectedType === 'birthday') {
      return `### 🎂 BIRTHDAY CREATIVE BRIEF (Month-Wise Word Format)

- **Referral Group Name**: ${typeD.referralGroupName || 'N/A'}
- **Member Name**: ${typeD.memberName || 'N/A'}
- **Professional Photo**: ${referenceFileName ? `Attached (${referenceFileName})` : 'To be incorporated from attachment'}
- **Mobile Number**: ${typeD.mobileNumber || 'N/A'}
- **Birthday Date & Month**: ${typeD.birthDay} ${typeD.birthMonth}
- **Birthday Wish Message**: "${typeD.birthdayWish || 'Wishing you grand success and good health!'}"

${typeD.additionalNotes ? `**Special Instructions / Design Theme**:\n${typeD.additionalNotes}` : ''}`.trim();
    }

    return '';
  }, [selectedType, typeA, typeB, typeC, typeD, referenceFileName]);

  // Validation check for single submission
  const isFormValid = useMemo(() => {
    if (!deadline) return false;

    if (selectedType === 'referral_meeting') {
      return Boolean(typeA.referralGroupName.trim() && (typeA.meetingDate || typeA.venue));
    }
    if (selectedType === 'business_presentation') {
      return Boolean(
        typeB.referralGroupName.trim() &&
        typeB.companyName.trim() &&
        typeB.memberName.trim()
      );
    }
    if (selectedType === 'kym') {
      return Boolean(
        typeC.referralGroupName.trim() &&
        typeC.memberName.trim() &&
        typeC.companyName.trim()
      );
    }
    if (selectedType === 'birthday') {
      return Boolean(
        typeD.referralGroupName.trim() &&
        typeD.memberName.trim() &&
        typeD.birthMonth.trim()
      );
    }
    return false;
  }, [selectedType, deadline, typeA, typeB, typeC, typeD]);

  // Download Sample CSV Template
  const handleDownloadCsvTemplate = () => {
    const csvContent = `ReferralGroupName,MemberName,MobileNumber,BirthDay,BirthMonth,BirthdayWish,AdditionalNotes
Apex Chapter,Amit Sharma,+91 98250 11223,15th,October,"Wishing you a magnificent year filled with boundless success, joy and good health!","Warm gold celebratory theme with confetti"
Apex Chapter,Dr. Sneha Desai,+91 98765 44332,22nd,October,"Wishing you great achievements and milestones ahead on your special day!","Include medical insignia subtly"
Apex Chapter,Vikram Patel,+91 97123 55667,28th,October,"Happy Birthday Vikram! Wishing you endless success and happiness!",""
`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'birthday_creatives_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Template downloaded', 'birthday_creatives_template.csv is ready to fill in Excel or Sheets.');
  };

  // Parse CSV helper function
  const parseCsvText = (text: string) => {
    setCsvParseError('');
    try {
      const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
      if (lines.length <= 1) {
        setCsvParseError('The CSV file does not contain any data rows.');
        return;
      }

      // Helper to split CSV row with quotes support
      const splitRow = (rowStr: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < rowStr.length; i++) {
          const char = rowStr[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if ((char === ',' || char === '\t') && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      const header = splitRow(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z]/g, ''));
      const rows: BirthdayCsvRow[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = splitRow(lines[i]);
        if (values.length === 0 || values.every((v) => !v)) continue;

        // Auto map by header index or fallback position
        const groupIdx = header.findIndex((h) => h.includes('group') || h.includes('chapter'));
        const nameIdx = header.findIndex((h) => h.includes('name') || h.includes('member'));
        const mobileIdx = header.findIndex((h) => h.includes('mobile') || h.includes('phone') || h.includes('contact'));
        const dayIdx = header.findIndex((h) => h.includes('day') || h.includes('date'));
        const monthIdx = header.findIndex((h) => h.includes('month'));
        const wishIdx = header.findIndex((h) => h.includes('wish') || h.includes('message'));
        const notesIdx = header.findIndex((h) => h.includes('note') || h.includes('instruction'));

        const referralGroupName = (groupIdx >= 0 ? values[groupIdx] : values[0]) || bulkDefaultGroup || typeD.referralGroupName || 'Chapter Group';
        const memberName = (nameIdx >= 0 ? values[nameIdx] : values[1]) || '';
        const mobileNumber = (mobileIdx >= 0 ? values[mobileIdx] : values[2]) || '';
        const birthDay = (dayIdx >= 0 ? values[dayIdx] : values[3]) || '15th';
        const birthMonth = (monthIdx >= 0 ? values[monthIdx] : values[4]) || typeD.birthMonth || 'October';
        const birthdayWish = (wishIdx >= 0 ? values[wishIdx] : values[5]) || 'Wishing you a magnificent year filled with boundless success, joy and good health!';
        const additionalNotes = (notesIdx >= 0 ? values[notesIdx] : values[6]) || '';

        if (memberName) {
          rows.push({
            id: `row-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
            referralGroupName,
            memberName,
            mobileNumber,
            birthDay,
            birthMonth,
            birthdayWish,
            additionalNotes
          });
        }
      }

      if (rows.length === 0) {
        setCsvParseError('Could not find valid member rows. Ensure "MemberName" column exists.');
        return;
      }

      setCsvRows(rows);
      toast.success('CSV parsed successfully', `${rows.length} birthday requests loaded for review.`);
    } catch (err: any) {
      setCsvParseError(`CSV Parsing Error: ${err.message}`);
    }
  };

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFileName(file.name);
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        if (text) {
          parseCsvText(text);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleAddBlankCsvRow = () => {
    setCsvRows((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        referralGroupName: bulkDefaultGroup || typeD.referralGroupName || 'Apex Chapter',
        memberName: '',
        mobileNumber: '',
        birthDay: '1st',
        birthMonth: typeD.birthMonth || 'October',
        birthdayWish: 'Wishing you grand success and good health!',
        additionalNotes: ''
      }
    ]);
  };

  const handleUpdateCsvRow = (id: string, field: keyof BirthdayCsvRow, val: string) => {
    setCsvRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: val } : r))
    );
  };

  const handleDeleteCsvRow = (id: string) => {
    setCsvRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleApplyGroupToAll = () => {
    if (!bulkDefaultGroup.trim()) return;
    setCsvRows((prev) =>
      prev.map((r) => ({ ...r, referralGroupName: bulkDefaultGroup.trim() }))
    );
    toast.success('Group applied', `Updated referral group to "${bulkDefaultGroup}" across all rows.`);
  };

  // Submit Bulk Requests
  const handleBulkSubmit = async () => {
    if (csvRows.length === 0) {
      toast.warning('No data to import', 'Please upload a CSV file or add rows.');
      return;
    }

    const invalidRows = csvRows.filter((r) => !r.memberName.trim());
    if (invalidRows.length > 0) {
      toast.error('Validation error', `${invalidRows.length} rows have missing member names. Please fill or remove them.`);
      return;
    }

    setLoading(true);
    setBulkProgress({ total: csvRows.length, current: 0 });

    try {
      const items = csvRows.map((r) => {
        const title = `[Birthday Creative] ${r.memberName.trim()} (${r.birthDay || ''} ${r.birthMonth || ''})`.trim();
        const description = `### 🎂 BIRTHDAY CREATIVE BRIEF (Month-Wise Word Format)

- **Referral Group Name**: ${r.referralGroupName || 'Chapter Group'}
- **Member Name**: ${r.memberName}
- **Mobile Number**: ${r.mobileNumber || 'N/A'}
- **Birthday Date & Month**: ${r.birthDay} ${r.birthMonth}
- **Birthday Wish Message**: "${r.birthdayWish || 'Wishing you grand success and good health!'}"

${r.additionalNotes ? `**Special Instructions / Design Theme**:\n${r.additionalNotes}` : ''}`.trim();

        return {
          title,
          description,
          category: 'Birthday Creative',
          platform: platform || 'WhatsApp Status & Socials',
          dimensions: dimensions.split(' (')[0] || '1080 x 1080',
          priority,
          deadline,
          additionalInstructions: `Creative Type: BIRTHDAY Creative\nBatch: ${bulkBatchName || 'Bulk Birthday List'}`,
        };
      });

      const res = await tabFetch('/api/requirements/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchName: bulkBatchName || 'Bulk Birthday Upload',
          items,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create bulk requests');
      }

      setBulkResult(data);
      toast.success(
        'Bulk birthday requests created',
        `Successfully created ${data.count} birthday graphic requirements.`
      );
    } catch (err: any) {
      toast.error('Bulk submission failed', err.message || 'An error occurred during bulk creation');
      setError(err.message);
    } finally {
      setLoading(false);
      setBulkProgress(null);
    }
  };

  // Submit Single Request
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isFormValid) {
      toast.error('Missing details', 'Please complete the required fields for this creative type.');
      return;
    }

    setLoading(true);
    const activeConfig = CREATIVE_TYPES.find((t) => t.id === selectedType)!;

    const payload = {
      title: computedTitle,
      description: structuredDescription,
      category: activeConfig.category,
      platform: platform || activeConfig.defaultPlatform,
      dimensions: dimensions.split(' (')[0] || activeConfig.defaultDimensions,
      priority,
      deadline,
      additionalInstructions: `Creative Type: ${activeConfig.title}\nTemplate: ${activeConfig.code}`,
      referenceFileUrl: referenceFileUrl || undefined,
      referenceFileName: referenceFileName || (selectedType === 'referral_meeting' ? 'Chapter-Logo.png' : 'Member-Professional-Photo.png'),
      assignedDesignerId
    };

    try {
      const res = await tabFetch('/api/requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create request');
      }

      toast.success(
        'Creative request submitted',
        `Request ${data.requirement?.reqCode || ''} (${activeConfig.title}) has been queued for production.`
      );

      router.push(`/requester/requests/${data.requirement.id}`);
      router.refresh();
    } catch (err: any) {
      toast.error('Submission failed', err.message || 'An unexpected error occurred');
      setError(err.message || 'An unexpected error occurred');
      setLoading(false);
    }
  };

  const activeConfig = CREATIVE_TYPES.find((t) => t.id === selectedType)!;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/requester/dashboard"
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-medium">Member Portal</span>
              <span className="text-slate-300">/</span>
              <span className="text-[11px] font-semibold text-indigo-600">New Creative Request</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Create Graphic Requirement
            </h1>
          </div>
        </div>

        {/* Form / Preview / Bulk CSV Switcher */}
        <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'form'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Fill Request Form</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'preview'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Live Brief Preview</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedType('birthday');
              setActiveTab('bulk_csv');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'bulk_csv'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-700 bg-amber-50 hover:bg-amber-100'
              }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>⚡ Bulk Birthday CSV</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 4 Creative Types Selector (Cards Grid) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span>Select Creative Request Type</span>
            <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              4 Official Member Templates
            </span>
          </label>

          {selectedType === 'birthday' && (
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'bulk_csv' ? 'form' : 'bulk_csv')}
              className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 px-3 py-1 rounded-lg border border-amber-200 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{activeTab === 'bulk_csv' ? 'Switch to Single Form' : 'Upload Month List via CSV'}</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {CREATIVE_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.id;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => {
                  setSelectedType(type.id);
                  setDimensions(type.defaultDimensions);
                  setPlatform(type.defaultPlatform);
                  if (activeTab === 'bulk_csv' && type.id !== 'birthday') {
                    setActiveTab('form');
                  }
                }}
                className={`text-left p-4 rounded-2xl border-2 transition-all relative overflow-hidden flex flex-col justify-between ${isSelected
                    ? 'border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/10 ring-2 ring-slate-900/10'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70 text-slate-800'
                  }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${isSelected
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider border ${isSelected
                          ? 'bg-white/10 text-white border-white/20'
                          : type.badgeBg
                        }`}
                    >
                      Type {type.code}
                    </span>
                  </div>

                  <h3 className="font-bold text-xs sm:text-[13px] leading-snug line-clamp-2">
                    {type.title}
                  </h3>
                  <p
                    className={`text-[11px] mt-1 line-clamp-2 ${isSelected ? 'text-slate-300' : 'text-slate-500'
                      }`}
                  >
                    {type.subtitle}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-200/20 flex items-center justify-between text-[10px] font-medium">
                  <span className={isSelected ? 'text-slate-300' : 'text-slate-400'}>
                    {type.defaultDimensions}
                  </span>
                  {isSelected && (
                    <span className="flex items-center gap-1 font-bold text-emerald-300">
                      <Check className="w-3 h-3" /> Selected
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* BULK CSV IMPORT TAB VIEW */}
      {activeTab === 'bulk_csv' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Bulk Success Modal / Banner */}
          {bulkResult && (
            <div className="bg-emerald-950 border border-emerald-500/40 rounded-2xl p-6 text-white shadow-xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-emerald-300">
                    Bulk Creation Successful! ({bulkResult.count} Birthday Graphic Requests)
                  </h3>
                  <p className="text-xs text-slate-300">
                    All requirements have been assigned unique sequential tracking IDs and queued for graphic makers.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                {bulkResult.requirements.slice(0, 8).map((r) => (
                  <Link
                    key={r.id}
                    href={`/requester/requests/${r.id}`}
                    className="p-2.5 bg-slate-900/80 hover:bg-slate-800 rounded-xl border border-slate-700 text-xs transition-colors flex items-center justify-between"
                  >
                    <span className="font-mono font-bold text-emerald-400">{r.reqCode}</span>
                    <span className="text-[11px] text-slate-300 truncate max-w-[90px]">{r.title.split('] ')[1] || r.title}</span>
                  </Link>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-emerald-900/50">
                <Link
                  href="/requester/requests"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  View All Created Requests →
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setBulkResult(null);
                    setCsvRows([]);
                    setCsvFileName('');
                  }}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Create another bulk batch
                </button>
              </div>
            </div>
          )}

          {/* Bulk Settings & Upload Dropzone */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                    <Cake className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900">
                      Bulk BIRTHDAY Creatives Upload (CSV Type)
                    </h2>
                    <p className="text-xs text-slate-500">
                      Upload your entire chapter’s month-wise or year-wise birthday list at once.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadCsvTemplate}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-200 transition-colors shadow-2xs shrink-0"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span>Download Sample CSV Template</span>
              </button>
            </div>

            {/* Batch Options Row */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Batch Name / Reference
                </label>
                <input
                  type="text"
                  value={bulkBatchName}
                  onChange={(e) => setBulkBatchName(e.target.value)}
                  placeholder="e.g. October 2026 Birthday List"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Default Referral Group Name
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={bulkDefaultGroup}
                    onChange={(e) => setBulkDefaultGroup(e.target.value)}
                    placeholder="e.g. Apex Chapter"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  {csvRows.length > 0 && (
                    <button
                      type="button"
                      onClick={handleApplyGroupToAll}
                      title="Apply to all loaded rows"
                      className="px-2 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-[10px] font-bold shrink-0"
                    >
                      Apply
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Required By (Deadline for all)
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Batch Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>

            {/* CSV File Upload Dropzone */}
            <div className="space-y-3">
              <label className="border-2 border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/40 hover:bg-amber-50/80 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-amber-200 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform text-amber-600">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-slate-900">
                  {csvFileName ? `File selected: ${csvFileName}` : 'Select or Drop CSV Spreadsheet here'}
                </div>
                <p className="text-xs text-slate-500 mt-1 max-w-md">
                  Supports <code className="font-mono font-bold text-amber-800">.csv</code>, <code className="font-mono font-bold text-amber-800">.tsv</code> formatted files with Member Name, Date, Month, Mobile Number.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.tsv,.txt"
                  onChange={handleCsvFileChange}
                  className="hidden"
                />
              </label>

              {csvParseError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{csvParseError}</span>
                </div>
              )}
            </div>

            {/* Interactive Preview & Edit Table */}
            {csvRows.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                      Parsed Birthday Entries ({csvRows.length} Members)
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                      Ready to process
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddBlankCsvRow}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Member Row</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCsvRows([])}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-lg text-xs font-bold transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px] sticky top-0 z-10">
                        <tr>
                          <th className="py-2.5 px-3 w-8">#</th>
                          <th className="py-2.5 px-3 min-w-[140px]">Referral Group</th>
                          <th className="py-2.5 px-3 min-w-[150px]">Member Name *</th>
                          <th className="py-2.5 px-3 min-w-[110px]">Mobile</th>
                          <th className="py-2.5 px-3 min-w-[90px]">Day (e.g. 15th)</th>
                          <th className="py-2.5 px-3 min-w-[110px]">Month *</th>
                          <th className="py-2.5 px-3 min-w-[180px]">Custom Wish Message</th>
                          <th className="py-2.5 px-3 w-10 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {csvRows.map((row, index) => {
                          const isInvalid = !row.memberName.trim();
                          return (
                            <tr
                              key={row.id}
                              className={`hover:bg-slate-50/80 transition-colors ${isInvalid ? 'bg-rose-50/40' : ''
                                }`}
                            >
                              <td className="py-2 px-3 font-mono text-[10px] text-slate-400">
                                {index + 1}
                              </td>
                              <td className="py-1 px-2">
                                <input
                                  type="text"
                                  value={row.referralGroupName}
                                  onChange={(e) => handleUpdateCsvRow(row.id, 'referralGroupName', e.target.value)}
                                  className="w-full px-2 py-1 bg-transparent hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded text-xs font-semibold text-slate-800 focus:bg-white focus:border-amber-400"
                                />
                              </td>
                              <td className="py-1 px-2">
                                <input
                                  type="text"
                                  required
                                  placeholder="Member Name"
                                  value={row.memberName}
                                  onChange={(e) => handleUpdateCsvRow(row.id, 'memberName', e.target.value)}
                                  className={`w-full px-2 py-1 bg-transparent hover:bg-slate-50 border rounded text-xs font-bold text-slate-900 focus:bg-white focus:border-amber-400 ${isInvalid ? 'border-rose-400 bg-rose-50 text-rose-800' : 'border-transparent hover:border-slate-200'
                                    }`}
                                />
                              </td>
                              <td className="py-1 px-2">
                                <input
                                  type="text"
                                  placeholder="+91..."
                                  value={row.mobileNumber}
                                  onChange={(e) => handleUpdateCsvRow(row.id, 'mobileNumber', e.target.value)}
                                  className="w-full px-2 py-1 bg-transparent hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded text-xs text-slate-800 focus:bg-white focus:border-amber-400"
                                />
                              </td>
                              <td className="py-1 px-2">
                                <input
                                  type="text"
                                  placeholder="15th"
                                  value={row.birthDay}
                                  onChange={(e) => handleUpdateCsvRow(row.id, 'birthDay', e.target.value)}
                                  className="w-full px-2 py-1 bg-transparent hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-amber-400"
                                />
                              </td>
                              <td className="py-1 px-2">
                                <select
                                  value={row.birthMonth}
                                  onChange={(e) => handleUpdateCsvRow(row.id, 'birthMonth', e.target.value)}
                                  className="w-full px-2 py-1 bg-transparent hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded text-xs font-semibold text-slate-800 focus:bg-white focus:border-amber-400"
                                >
                                  {MONTHS.map((m) => (
                                    <option key={m} value={m}>
                                      {m}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-1 px-2">
                                <input
                                  type="text"
                                  placeholder="Wish text..."
                                  value={row.birthdayWish}
                                  onChange={(e) => handleUpdateCsvRow(row.id, 'birthdayWish', e.target.value)}
                                  className="w-full px-2 py-1 bg-transparent hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded text-xs text-slate-800 focus:bg-white focus:border-amber-400"
                                />
                              </td>
                              <td className="py-1 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCsvRow(row.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                                  title="Delete entry"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Bulk Submit Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors text-center"
              >
                ← Return to Single Form
              </button>

              <button
                type="button"
                disabled={loading || csvRows.length === 0}
                onClick={handleBulkSubmit}
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-600/20 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing {csvRows.length} Birthday Creatives...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Submit & Create {csvRows.length} Birthday Requests</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE FORM & PREVIEW TAB VIEW */}
      {activeTab !== 'bulk_csv' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main 2-Column Content: Active Template Fields */}
            <div className="lg:col-span-2 space-y-6">
              {activeTab === 'preview' ? (
                /* Live Preview Mode */
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Generated Creative Brief Preview
                      </h2>
                    </div>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {activeConfig.title}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Requirement Title</div>
                      <div className="text-sm font-black text-slate-900 mt-0.5">{computedTitle}</div>
                    </div>

                    <div className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs whitespace-pre-wrap leading-relaxed border border-slate-800 shadow-inner">
                      {structuredDescription}
                    </div>

                    {referenceFileUrl && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                        <img
                          src={referenceFileUrl}
                          alt="Preview"
                          className="w-12 h-12 rounded-lg object-cover border border-slate-300"
                        />
                        <div>
                          <div className="text-xs font-bold text-slate-800">{referenceFileName}</div>
                          <div className="text-[10px] text-slate-400">Attached Member / Asset Photo</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Form Fields Mode */
                <>
                  {/* 1. Referral Meeting Announcement Creative Form */}
                  {selectedType === 'referral_meeting' && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                            A
                          </div>
                          <div>
                            <h2 className="text-sm font-bold text-slate-900">
                              Referral Meeting Announcement Details
                            </h2>
                            <p className="text-[11px] text-slate-500">
                              Provide all meeting information required for the flyer.
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          Template A
                        </span>
                      </div>

                      <div className="space-y-4">
                        {/* Referral Group Name */}
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            Referral Group Name <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <Users className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              required
                              placeholder="e.g. Apex Chapter, Titans Business Network, Synergy Group"
                              value={typeA.referralGroupName}
                              onChange={(e) => setTypeA({ ...typeA, referralGroupName: e.target.value })}
                              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                          </div>
                        </div>

                        {/* Date & Time Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1">
                              Meeting Date <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input
                                type="date"
                                required
                                value={typeA.meetingDate}
                                onChange={(e) => setTypeA({ ...typeA, meetingDate: e.target.value })}
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1">
                              Meeting Time <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                              <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input
                                type="text"
                                required
                                placeholder="e.g. 07:00 AM to 09:30 AM"
                                value={typeA.meetingTime}
                                onChange={(e) => setTypeA({ ...typeA, meetingTime: e.target.value })}
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Venue */}
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            Venue & Location <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                            <textarea
                              rows={2}
                              required
                              placeholder="e.g. The Grand Bhagwati, Ballroom B, SG Highway, Ahmedabad / Online Zoom"
                              value={typeA.venue}
                              onChange={(e) => setTypeA({ ...typeA, venue: e.target.value })}
                              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                          </div>
                        </div>

                        {/* Meeting Stimulant */}
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            Meeting Stimulant / Special Theme <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <Sparkles className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              required
                              placeholder="e.g. Mega Visitors Conclave & 1-to-1 Power Networking, Cross Chapter Synergy"
                              value={typeA.meetingStimulant}
                              onChange={(e) => setTypeA({ ...typeA, meetingStimulant: e.target.value })}
                              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                          </div>
                        </div>

                        {/* Dress Code & Visitor Fees */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1">
                              Dress Code <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                              <Shirt className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input
                                type="text"
                                required
                                placeholder="e.g. Business Formal / Suit & Tie, Traditional"
                                value={typeA.dressCode}
                                onChange={(e) => setTypeA({ ...typeA, dressCode: e.target.value })}
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1">
                              Visitor Fees <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                              <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input
                                type="text"
                                required
                                placeholder="e.g. ₹800 (Including Breakfast) / Free Entry"
                                value={typeA.visitorFees}
                                onChange={(e) => setTypeA({ ...typeA, visitorFees: e.target.value })}
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Additional Notes */}
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            Special Instructions or Chapter Logo Guidelines (Optional)
                          </label>
                          <textarea
                            rows={2}
                            placeholder="e.g. Highlight the guest speaker banner, place dress code icon at footer..."
                            value={typeA.additionalNotes}
                            onChange={(e) => setTypeA({ ...typeA, additionalNotes: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2. Business Presentation Creative Form */}
                  {selectedType === 'business_presentation' && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                            B
                          </div>
                          <div>
                            <h2 className="text-sm font-bold text-slate-900">
                              Business Presentation Creative Details
                            </h2>
                            <p className="text-[11px] text-slate-500">
                              8-10 Minute feature presentation flyer with member photo & specific ask.
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Template B
                        </span>
                      </div>

                      <div className="space-y-4">
                        {/* Referral Group Name */}
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            Referral Group Name <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <Users className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              required
                              placeholder="e.g. Apex Chapter, Titans Business Network"
                              value={typeB.referralGroupName}
                              onChange={(e) => setTypeB({ ...typeB, referralGroupName: e.target.value })}
                              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            />
                          </div>
                        </div>

                        {/* Company Name & Category Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1">
                              Company Name <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                              <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input
                                type="text"
                                required
                                placeholder="e.g. Vertex Architecture & Interior Studio"
                                value={typeB.companyName}
                                onChange={(e) => setTypeB({ ...typeB, companyName: e.target.value })}
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1">
                              Business Category <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                              <Briefcase className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input
                                type="text"
                                required
                                placeholder="e.g. Architecture & Interior Design, Chartered Accountant"
                                value={typeB.category}
                                onChange={(e) => setTypeB({ ...typeB, category: e.target.value })}
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Member Name */}
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            Member Name (with Professional Photo upload on right) <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              required
                              placeholder="e.g. Ar. Rahul Sharma"
                              value={typeB.memberName}
                              onChange={(e) => setTypeB({ ...typeB, memberName: e.target.value })}
                              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            />
                          </div>
                        </div>

                        {/* Contact Details Grid (Mobile, Email, Website) */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1">
                              Mobile Number <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                              <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input
                                type="text"
                                required
                                placeholder="e.g. +91 98250 12345"
                                value={typeB.mobileNumber}
                                onChange={(e) => setTypeB({ ...typeB, mobileNumber: e.target.value })}
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1">
                              Email ID
                            </label>
                            <div className="relative">
                              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input
                                type="email"
                                placeholder="e.g. rahul@vertexstudio.in"
                                value={typeB.emailId}
                                onChange={(e) => setTypeB({ ...typeB, emailId: e.target.value })}
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1">
                              Website
                            </label>
                            <div className="relative">
                              <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input
                                type="text"
                                placeholder="e.g. www.vertexstudio.in"
                                value={typeB.website}
                                onChange={(e) => setTypeB({ ...typeB, website: e.target.value })}
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Specific Ask */}
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            Specific Ask (Target Referrals) <span className="text-rose-500">*</span>
                          </label>
                          <textarea
                            rows={2}
                            required
                            placeholder="e.g. Commercial Real Estate Developers, Bungalow Owners planning 5000+ sq ft interior design, Corporate offices in Ahmedabad..."
                            value={typeB.specificAsk}
                            onChange={(e) => setTypeB({ ...typeB, specificAsk: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                          />
                        </div>

                        {/* Presentation Date, Time & Venue */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1">
                              Presentation Date <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="date"
                              required
                              value={typeB.presentationDate}
                              onChange={(e) => setTypeB({ ...typeB, presentationDate: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1">
                              Time
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. 07:30 AM"
                              value={typeB.presentationTime}
                              onChange={(e) => setTypeB({ ...typeB, presentationTime: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1">
                              Venue
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. The Grand Bhagwati"
                              value={typeB.venue}
                              onChange={(e) => setTypeB({ ...typeB, venue: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            />
                          </div>
                        </div>

                        {/* Additional Notes */}
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            Brand Slogan / Tagline / Additional Notes (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Shaping luxury spaces with passion & precision."
                            value={typeB.additionalNotes}
                            onChange={(e) => setTypeB({ ...typeB, additionalNotes: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. KYM Creative Form */}
                  {selectedType === 'kym' && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                            C
                          </div>
                          <div>
                            <h2 className="text-sm font-bold text-slate-900">
                              KYM Creative (Know Your Member) Details
                            </h2>
                            <p className="text-[11px] text-slate-500">
                              1-to-1 Member introduction slot & business profile.
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Template C
                        </span>
                      </div>

                      <div className="space-y-4">
                        {/* Referral Group Name */}
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            Referral Group Name <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <Users className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              required
                              placeholder="e.g. Apex Chapter, Titans Business Network"
                              value={typeC.referralGroupName}
                              onChange={(e) => setTypeC({ ...typeC, referralGroupName: e.target.value })}
                              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                            />
                          </div>
                        </div>

                        {/* Member Name */}
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            Member Name (with Professional Photo upload on right) <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              required
                              placeholder="e.g. Priya Patel"
                              value={typeC.memberName}
                              onChange={(e) => setTypeC({ ...typeC, memberName: e.target.value })}
                              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                            />
                          </div>
                        </div>

                        {/* Date, Time, Venue */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1">
                              Meeting Date <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="date"
                              required
                              value={typeC.meetingDate}
                              onChange={(e) => setTypeC({ ...typeC, meetingDate: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1">
                              Time
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. 07:00 AM"
                              value={typeC.meetingTime}
                              onChange={(e) => setTypeC({ ...typeC, meetingTime: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1">
                              Venue
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Courtyard by Marriott"
                              value={typeC.venue}
                              onChange={(e) => setTypeC({ ...typeC, venue: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                            />
                          </div>
                        </div>

                        {/* Company Name, Category, Mobile */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1">
                              Company Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. FinServe Wealth Advisory"
                              value={typeC.companyName}
                              onChange={(e) => setTypeC({ ...typeC, companyName: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1">
                              Category <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Financial Planning & Mutual Funds"
                              value={typeC.category}
                              onChange={(e) => setTypeC({ ...typeC, category: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1">
                              Mobile Number <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. +91 98765 43210"
                              value={typeC.mobileNumber}
                              onChange={(e) => setTypeC({ ...typeC, mobileNumber: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                            />
                          </div>
                        </div>

                        {/* Additional Instructions */}
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            Highlights / Instructions (Optional)
                          </label>
                          <textarea
                            rows={2}
                            placeholder="e.g. Place company logo top right, member photo with circular gold frame..."
                            value={typeC.additionalNotes}
                            onChange={(e) => setTypeC({ ...typeC, additionalNotes: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 4. BIRTHDAY Creative Single Form */}
                  {selectedType === 'birthday' && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                            D
                          </div>
                          <div>
                            <h2 className="text-sm font-bold text-slate-900">
                              BIRTHDAY Creative Details (Single Request)
                            </h2>
                            <p className="text-[11px] text-slate-500">
                              Festive celebratory birthday graphic flyer with member photo & wishes.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveTab('bulk_csv')}
                            className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors flex items-center gap-1 shadow-2xs"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            <span>Bulk Upload CSV</span>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* Referral Group Name */}
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            Referral Group Name <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <Users className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              required
                              placeholder="e.g. Apex Chapter, Titans Business Network"
                              value={typeD.referralGroupName}
                              onChange={(e) => setTypeD({ ...typeD, referralGroupName: e.target.value })}
                              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                            />
                          </div>
                        </div>

                        {/* Member Name */}
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            Member Name (with Professional Photo upload on right) <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              required
                              placeholder="e.g. Amit Sharma / Dr. Sneha Desai"
                              value={typeD.memberName}
                              onChange={(e) => setTypeD({ ...typeD, memberName: e.target.value })}
                              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                            />
                          </div>
                        </div>

                        {/* Birthday Month & Day Format */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1">
                              Birthday Month (Month-Wise Word Format) <span className="text-rose-500">*</span>
                            </label>
                            <select
                              value={typeD.birthMonth}
                              onChange={(e) => setTypeD({ ...typeD, birthMonth: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                            >
                              {MONTHS.map((m) => (
                                <option key={m} value={m}>
                                  {m}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1">
                              Birth Date / Day <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. 15th, 22nd, 3rd"
                              value={typeD.birthDay}
                              onChange={(e) => setTypeD({ ...typeD, birthDay: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                            />
                          </div>
                        </div>

                        {/* Mobile Number */}
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            Mobile Number <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              required
                              placeholder="e.g. +91 99887 76655"
                              value={typeD.mobileNumber}
                              onChange={(e) => setTypeD({ ...typeD, mobileNumber: e.target.value })}
                              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                            />
                          </div>
                        </div>

                        {/* Birthday Message / Wishes */}
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            Custom Birthday Message / Wishes
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Wishing you a year filled with grand success, joyful milestones, good health, and prosperous business heights!"
                            value={typeD.birthdayWish}
                            onChange={(e) => setTypeD({ ...typeD, birthdayWish: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                          />
                        </div>

                        {/* Additional Notes */}
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            Additional Design Notes (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Elegant gold confetti and dark blue celebratory background."
                            value={typeD.additionalNotes}
                            onChange={(e) => setTypeD({ ...typeD, additionalNotes: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Right Column: Member Photo Upload, Format Specs & Delivery Date */}
            <div className="space-y-5">
              {/* Member Professional Photo / Asset Upload */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-600" />
                    {selectedType === 'referral_meeting'
                      ? 'Chapter Logo / Reference Asset'
                      : 'Member Professional Photo'}
                  </h3>
                  {selectedType !== 'referral_meeting' && (
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      Recommended
                    </span>
                  )}
                </div>

                {!referenceFileUrl ? (
                  <label className="border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-2xl p-5 bg-slate-50/50 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-slate-50 group">
                    <div className="w-10 h-10 rounded-full bg-white shadow-2xs border border-slate-200 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                      <Upload className="w-5 h-5 text-slate-500" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">
                      {selectedType === 'referral_meeting'
                        ? 'Upload Group Logo / Banner Asset'
                        : 'Upload Member HD Photo'}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1">
                      PNG, JPG, WEBP (Clear professional portrait)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-800 truncate max-w-[180px]">
                        {referenceFileName || 'Uploaded Photo'}
                      </span>
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                        title="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="aspect-square max-h-48 w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center">
                      <img
                        src={referenceFileUrl}
                        alt="Uploaded preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Photo attached for graphic designer.
                    </p>
                  </div>
                )}
              </div>

              {/* Delivery Timeline & Priority */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Schedule & Priority
                </h3>

                {/* Priority */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Priority Level
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'LOW', label: 'Low', color: 'bg-slate-100 text-slate-700 border-slate-200' },
                      { id: 'MEDIUM', label: 'Medium', color: 'bg-slate-900 text-white border-slate-900' },
                      { id: 'HIGH', label: 'High', color: 'bg-amber-600 text-white border-amber-600' },
                      { id: 'URGENT', label: 'Urgent', color: 'bg-rose-600 text-white border-rose-600' },
                    ].map((p) => {
                      const isSelected = priority === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setPriority(p.id)}
                          className={`py-1.5 rounded-xl text-xs font-bold border transition-all text-center ${isSelected
                              ? p.color
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Deadline */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Required By Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                  <div className="flex items-center gap-1.5 mt-2">
                    <button
                      type="button"
                      onClick={() => setDaysFromNow(2)}
                      className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 transition-colors"
                    >
                      +2 days
                    </button>
                    <button
                      type="button"
                      onClick={() => setDaysFromNow(4)}
                      className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 transition-colors"
                    >
                      +4 days
                    </button>
                    <button
                      type="button"
                      onClick={() => setDaysFromNow(7)}
                      className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 transition-colors"
                    >
                      +1 week
                    </button>
                  </div>
                </div>

                {/* Format & Dimensions */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Graphic Dimensions
                    </label>
                    <input
                      type="text"
                      value={dimensions}
                      onChange={(e) => setDimensions(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none"
                    />
                    <div className="flex items-center gap-1 flex-wrap mt-1.5">
                      {PRESET_DIMENSIONS.map((dim) => (
                        <button
                          key={dim}
                          type="button"
                          onClick={() => setDimensions(dim.split(' (')[0])}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 font-mono"
                        >
                          {dim.split(' (')[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Assignee Routing
                    </label>
                    <select
                      value={assignedDesignerId}
                      onChange={(e) => setAssignedDesignerId(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
                    >
                      <option value="AUTO">Auto Queue (First Available Designer)</option>
                      {designers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.designerProfile?.designerCode || 'Designer'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Action Bar for Single Form */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-200 bg-white p-4 rounded-2xl shadow-2xs">
            <Link
              href="/requester/dashboard"
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors text-center"
            >
              Cancel & Return
            </Link>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={loading || !isFormValid}
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-md shadow-slate-900/10 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Submitting Creative Request...</span>
                  </>
                ) : (
                  <>
                    <span>Submit {activeConfig.title}</span>
                    <Check className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
