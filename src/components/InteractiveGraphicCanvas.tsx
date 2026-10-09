'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Upload,
  Sparkles,
  Send,
  RefreshCw,
  Download,
  Palette,
  Eye,
  User,
  Image as ImageIcon,
  Check,
  Layers,
  Cake,
  Users,
  Briefcase,
  UserCheck,
} from 'lucide-react';

interface InteractiveGraphicCanvasProps {
  requirement: any;
  onSubmitVersion: (data: { fileUrl: string; fileName: string; designerNotes: string }) => Promise<void>;
  isSubmitting?: boolean;
}

// XML safe string escaper
function escapeXml(unsafe: string = '') {
  return String(unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const COLOR_PALETTES = [
  { name: 'Royal Navy & Indigo', c1: '#1e3a8a', c2: '#0f172a', accent: '#38bdf8', text: '#ffffff' },
  { name: 'Imperial Purple & Violet', c1: '#581c87', c2: '#1e1b4b', accent: '#f472b6', text: '#ffffff' },
  { name: 'Gold & Obsidian Dark', c1: '#18181b', c2: '#09090b', accent: '#fbbf24', text: '#fef08a' },
  { name: 'Crimson Ruby & Rose', c1: '#881337', c2: '#4c0519', accent: '#fb7185', text: '#ffffff' },
  { name: 'Emerald Forest & Mint', c1: '#064e3b', c2: '#022c22', accent: '#34d399', text: '#ffffff' },
  { name: 'Sunset Amber & Coral', c1: '#7c2d12', c2: '#451a03', accent: '#fb923c', text: '#ffffff' },
];

export default function InteractiveGraphicCanvas({
  requirement,
  onSubmitVersion,
  isSubmitting = false,
}: InteractiveGraphicCanvasProps) {
  const [mode, setMode] = useState<'generate' | 'upload'>('generate');

  // Parse fields from requirement description
  const parsed = useMemo(() => {
    const desc = requirement?.description || '';
    const title = requirement?.title || '';

    const getField = (label: string) => {
      const regex = new RegExp(`(?:\\*\\*|#+\\s*)?${label}(?:\\*\\*)?\\s*:\\s*([^\\n]+)`, 'i');
      const m = desc.match(regex);
      return m ? m[1].trim() : '';
    };

    let detectedTemplate: 'birthday' | 'referral_meeting' | 'business' | 'kym' | 'custom' = 'custom';
    const lower = (title + ' ' + desc).toLowerCase();
    if (lower.includes('birthday')) {
      detectedTemplate = 'birthday';
    } else if (lower.includes('business presentation') || lower.includes('presentation creative')) {
      detectedTemplate = 'business';
    } else if (lower.includes('kym') || lower.includes('know your member')) {
      detectedTemplate = 'kym';
    } else if (lower.includes('referral meeting') || lower.includes('meeting announcement')) {
      detectedTemplate = 'referral_meeting';
    }

    return {
      template: detectedTemplate,
      referralGroupName: getField('Referral Group Name') || getField('Group Name') || 'Dynamic Business Chapter',
      memberName: getField('Member Name') || getField('Member') || requirement?.requester?.name || 'Valued Member',
      meetingDate: getField('Meeting Date') || getField('Presentation Date') || getField('Date') || 'Every Wednesday',
      meetingTime: getField('Meeting Time') || getField('Presentation Time') || getField('Time') || '07:30 AM to 09:30 AM',
      venue: getField('Meeting Venue / Location') || getField('Venue') || 'The Grand Metropolitan Hotel & Suites',
      stimulant: getField('Meeting Stimulant / Theme') || getField('Meeting Stimulant') || 'Power Referrals & B2B Expansion',
      dressCode: getField('Dress Code') || 'Business Formal Attire',
      visitorFees: getField('Visitor Fees') || '₹800 (Includes Executive Breakfast)',
      companyName: getField('Company Name') || getField('Company') || 'Apex Global Enterprises',
      category: getField('Business Category') || getField('Category') || 'Strategic Business Consulting',
      mobileNumber: getField('Mobile Number') || getField('Mobile') || '+91 98765 43210',
      emailId: getField('Email ID') || getField('Email') || 'contact@businessdomain.com',
      website: getField('Website') || 'www.businessdomain.com',
      specificAsk: getField('Specific Ask') || getField('Ask') || 'Corporate CFOs & Growing Tech Startups looking for scaling advisory',
      birthDay: getField('Birthday Date') || getField('Birth Date') || getField('Day') || '15th',
      birthMonth: getField('Birth Month') || getField('Month') || 'October',
      birthdayWish: getField('Birthday Wish') || getField('Wish') || 'Wishing you grand success, joyful milestones, good health, and prosperous heights on your special day!',
    };
  }, [requirement]);

  // Form State initialized from parsed fields
  const [templateType, setTemplateType] = useState<'birthday' | 'referral_meeting' | 'business' | 'kym' | 'custom'>(
    parsed.template
  );
  const [paletteIndex, setPaletteIndex] = useState(0);
  const [referralGroupName, setReferralGroupName] = useState(parsed.referralGroupName);
  const [memberName, setMemberName] = useState(parsed.memberName);
  const [companyName, setCompanyName] = useState(parsed.companyName);
  const [category, setCategory] = useState(parsed.category);
  const [meetingDate, setMeetingDate] = useState(parsed.meetingDate);
  const [meetingTime, setMeetingTime] = useState(parsed.meetingTime);
  const [venue, setVenue] = useState(parsed.venue);
  const [stimulant, setStimulant] = useState(parsed.stimulant);
  const [dressCode, setDressCode] = useState(parsed.dressCode);
  const [visitorFees, setVisitorFees] = useState(parsed.visitorFees);
  const [mobileNumber, setMobileNumber] = useState(parsed.mobileNumber);
  const [emailId, setEmailId] = useState(parsed.emailId);
  const [website, setWebsite] = useState(parsed.website);
  const [specificAsk, setSpecificAsk] = useState(parsed.specificAsk);
  const [birthDay, setBirthDay] = useState(parsed.birthDay);
  const [birthMonth, setBirthMonth] = useState(parsed.birthMonth);
  const [birthdayWish, setBirthdayWish] = useState(parsed.birthdayWish);

  // Custom generic template fields
  const [headline, setHeadline] = useState(requirement?.title || 'Brand Creative Announcement');
  const [subheading, setSubheading] = useState('Official High-Resolution Digital Asset');
  const [badgeText, setBadgeText] = useState('OFFICIAL RELEASE');

  // Photo state
  const initialPhoto = requirement?.files?.[0]?.fileUrl || null;
  const [memberPhotoUrl, setMemberPhotoUrl] = useState<string | null>(initialPhoto);
  const [designerNotes, setDesignerNotes] = useState('');
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState('design-creative.png');

  // Sync if requirement changes
  useEffect(() => {
    setTemplateType(parsed.template);
    setReferralGroupName(parsed.referralGroupName);
    setMemberName(parsed.memberName);
    setCompanyName(parsed.companyName);
    setCategory(parsed.category);
    setMeetingDate(parsed.meetingDate);
    setMeetingTime(parsed.meetingTime);
    setVenue(parsed.venue);
    setStimulant(parsed.stimulant);
    setDressCode(parsed.dressCode);
    setVisitorFees(parsed.visitorFees);
    setMobileNumber(parsed.mobileNumber);
    setEmailId(parsed.emailId);
    setWebsite(parsed.website);
    setSpecificAsk(parsed.specificAsk);
    setBirthDay(parsed.birthDay);
    setBirthMonth(parsed.birthMonth);
    setBirthdayWish(parsed.birthdayWish);
    if (requirement?.files?.[0]?.fileUrl) {
      setMemberPhotoUrl(requirement.files[0].fileUrl);
    }
  }, [parsed, requirement]);

  const activePalette = COLOR_PALETTES[paletteIndex];

  // Handle manual photo upload for member circle
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setMemberPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle external completed design file upload
  const handleExternalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedFileUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Generate SVG vector markup
  const generateSvgContent = () => {
    const c1 = activePalette.c1;
    const c2 = activePalette.c2;
    const accent = activePalette.accent;

    if (templateType === 'birthday') {
      const initials = (memberName || 'M')
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="100%" height="100%" style="display:block;width:100%;height:100%;">
  <defs>
    <linearGradient id="bg_grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}" />
      <stop offset="100%" stop-color="${c2}" />
    </linearGradient>
    <linearGradient id="gold_grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f59e0b" />
      <stop offset="50%" stop-color="#fef08a" />
      <stop offset="100%" stop-color="#f59e0b" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#000000" flood-opacity="0.5"/>
    </filter>
    <clipPath id="avatarCircle">
      <circle cx="540" cy="450" r="160" />
    </clipPath>
  </defs>

  <!-- Background -->
  <rect width="1080" height="1080" fill="url(#bg_grad)" />

  <!-- Decorative Sparkles & Confetti -->
  <circle cx="120" cy="140" r="180" fill="${accent}" fill-opacity="0.12" />
  <circle cx="960" cy="920" r="240" fill="${accent}" fill-opacity="0.10" />
  <circle cx="940" cy="180" r="40" fill="#fef08a" fill-opacity="0.25" />
  <circle cx="160" cy="880" r="30" fill="#fef08a" fill-opacity="0.25" />
  <polygon points="540,80 545,95 560,95 548,105 552,120 540,110 528,120 532,105 520,95 535,95" fill="#fef08a" opacity="0.8"/>
  <polygon points="180,260 183,272 195,272 185,280 188,292 180,284 172,292 175,280 165,272 177,272" fill="${accent}" opacity="0.8"/>
  <polygon points="900,320 903,332 915,332 905,340 908,352 900,344 892,352 895,340 885,332 897,332" fill="${accent}" opacity="0.8"/>

  <!-- Outer Border Frame -->
  <rect x="40" y="40" width="1000" height="1000" rx="32" fill="none" stroke="url(#gold_grad)" stroke-width="3" stroke-opacity="0.6" />

  <!-- Top Referral Group Banner -->
  <rect x="240" y="75" width="600" height="50" rx="25" fill="#ffffff" fill-opacity="0.12" stroke="#ffffff" stroke-width="1.5" stroke-opacity="0.3" filter="url(#glow)" />
  <text x="540" y="107" fill="#ffffff" font-size="20" font-family="system-ui, -apple-system, sans-serif" font-weight="800" text-anchor="middle" letter-spacing="3">${escapeXml(referralGroupName.toUpperCase())}</text>

  <!-- Birthday Title -->
  <text x="540" y="195" fill="url(#gold_grad)" font-size="62" font-family="system-ui, -apple-system, sans-serif" font-weight="900" text-anchor="middle" letter-spacing="4" filter="url(#glow)">HAPPY BIRTHDAY</text>
  <text x="540" y="240" fill="#f8fafc" font-size="22" font-family="system-ui, -apple-system, sans-serif" font-weight="600" text-anchor="middle" letter-spacing="2">CELEBRATING EXCELLENCE &amp; LEADERSHIP</text>

  <!-- Portrait Frame -->
  <circle cx="540" cy="450" r="172" fill="none" stroke="url(#gold_grad)" stroke-width="8" filter="url(#glow)" />
  <circle cx="540" cy="450" r="160" fill="#1e293b" />
  ${
    memberPhotoUrl
      ? `<image href="${memberPhotoUrl}" x="380" y="290" width="320" height="320" preserveAspectRatio="xMidYMid slice" clip-path="url(#avatarCircle)" />`
      : `<text x="540" y="475" fill="#fef08a" font-size="72" font-family="system-ui, -apple-system, sans-serif" font-weight="900" text-anchor="middle">${initials}</text>`
  }

  <!-- Birthday Date Badge -->
  <rect x="390" y="640" width="300" height="48" rx="24" fill="#f59e0b" filter="url(#glow)" />
  <text x="540" y="672" fill="#0f172a" font-size="22" font-family="system-ui, -apple-system, sans-serif" font-weight="900" text-anchor="middle" letter-spacing="1">${escapeXml((birthDay + ' ' + birthMonth).toUpperCase())}</text>

  <!-- Member Name -->
  <text x="540" y="745" fill="#ffffff" font-size="46" font-family="system-ui, -apple-system, sans-serif" font-weight="900" text-anchor="middle" filter="url(#glow)">${escapeXml(memberName)}</text>

  <!-- Birthday Wish Text Box -->
  <rect x="120" y="785" width="840" height="120" rx="20" fill="#ffffff" fill-opacity="0.10" stroke="#ffffff" stroke-width="1" stroke-opacity="0.2" />
  <text x="540" y="835" fill="#f1f5f9" font-size="22" font-family="system-ui, -apple-system, sans-serif" font-weight="500" text-anchor="middle">${escapeXml(birthdayWish.slice(0, 75))}</text>
  <text x="540" y="870" fill="#cbd5e1" font-size="20" font-family="system-ui, -apple-system, sans-serif" font-weight="400" text-anchor="middle">${escapeXml(birthdayWish.slice(75, 160))}</text>

  <!-- Footer Contact Info -->
  <rect x="360" y="935" width="360" height="44" rx="22" fill="#000000" fill-opacity="0.3" />
  <text x="540" y="963" fill="${accent}" font-size="18" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle" letter-spacing="1">📞 ${escapeXml(mobileNumber)}</text>
</svg>`;
    }

    if (templateType === 'referral_meeting') {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="100%" height="100%" style="display:block;width:100%;height:100%;">
  <defs>
    <linearGradient id="bg_grad_meet" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}" />
      <stop offset="100%" stop-color="${c2}" />
    </linearGradient>
    <filter id="boxShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="10" stdDeviation="18" flood-color="#000000" flood-opacity="0.45"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1080" height="1080" fill="url(#bg_grad_meet)" />

  <circle cx="980" cy="150" r="300" fill="${accent}" fill-opacity="0.1" />
  <circle cx="100" cy="980" r="350" fill="${accent}" fill-opacity="0.08" />

  <!-- Frame -->
  <rect x="45" y="45" width="990" height="990" rx="30" fill="none" stroke="#ffffff" stroke-width="2" stroke-opacity="0.3" />

  <!-- Top Group Header -->
  <rect x="220" y="70" width="640" height="52" rx="26" fill="#ffffff" fill-opacity="0.15" stroke="#ffffff" stroke-width="1.5" stroke-opacity="0.3" />
  <text x="540" y="103" fill="#ffffff" font-size="22" font-family="system-ui, -apple-system, sans-serif" font-weight="800" text-anchor="middle" letter-spacing="3">${escapeXml(referralGroupName.toUpperCase())}</text>

  <!-- Headline -->
  <text x="540" y="200" fill="#ffffff" font-size="54" font-family="system-ui, -apple-system, sans-serif" font-weight="900" text-anchor="middle" letter-spacing="2">REFERRAL MEETING ANNOUNCEMENT</text>
  <text x="540" y="245" fill="${accent}" font-size="24" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle" letter-spacing="1">JOIN LEADERS &amp; GROW YOUR BUSINESS NETWORK</text>

  <!-- Main Details Card -->
  <rect x="90" y="285" width="900" height="470" rx="24" fill="#ffffff" fill-opacity="0.1" stroke="#ffffff" stroke-width="1.5" stroke-opacity="0.25" filter="url(#boxShadow)" />

  <!-- Date & Time Row -->
  <g transform="translate(130, 325)">
    <rect width="400" height="95" rx="16" fill="#000000" fill-opacity="0.3" />
    <text x="25" y="38" fill="${accent}" font-size="18" font-family="system-ui, -apple-system, sans-serif" font-weight="800">📅 DATE</text>
    <text x="25" y="72" fill="#ffffff" font-size="24" font-family="system-ui, -apple-system, sans-serif" font-weight="800">${escapeXml(meetingDate)}</text>
  </g>

  <g transform="translate(550, 325)">
    <rect width="400" height="95" rx="16" fill="#000000" fill-opacity="0.3" />
    <text x="25" y="38" fill="${accent}" font-size="18" font-family="system-ui, -apple-system, sans-serif" font-weight="800">⏰ TIME</text>
    <text x="25" y="72" fill="#ffffff" font-size="22" font-family="system-ui, -apple-system, sans-serif" font-weight="800">${escapeXml(meetingTime)}</text>
  </g>

  <!-- Venue Row -->
  <g transform="translate(130, 440)">
    <rect width="820" height="95" rx="16" fill="#000000" fill-opacity="0.3" />
    <text x="25" y="38" fill="${accent}" font-size="18" font-family="system-ui, -apple-system, sans-serif" font-weight="800">📍 VENUE</text>
    <text x="25" y="72" fill="#ffffff" font-size="22" font-family="system-ui, -apple-system, sans-serif" font-weight="700">${escapeXml(venue)}</text>
  </g>

  <!-- Stimulant / Theme Row -->
  <g transform="translate(130, 555)">
    <rect width="820" height="95" rx="16" fill="#000000" fill-opacity="0.3" />
    <text x="25" y="38" fill="${accent}" font-size="18" font-family="system-ui, -apple-system, sans-serif" font-weight="800">💡 MEETING STIMULANT / THEME</text>
    <text x="25" y="72" fill="#fef08a" font-size="22" font-family="system-ui, -apple-system, sans-serif" font-weight="800">${escapeXml(stimulant)}</text>
  </g>

  <g transform="translate(130, 670)">
    <text x="0" y="45" fill="#e2e8f0" font-size="20" font-family="system-ui, -apple-system, sans-serif" font-weight="600">👔 Dress Code: <tspan fill="#ffffff" font-weight="800">${escapeXml(dressCode)}</tspan></text>
    <text x="460" y="45" fill="#e2e8f0" font-size="20" font-family="system-ui, -apple-system, sans-serif" font-weight="600">🎟️ Visitor Fees: <tspan fill="#fef08a" font-weight="800">${escapeXml(visitorFees)}</tspan></text>
  </g>

  <!-- CTA Box -->
  <rect x="290" y="790" width="500" height="74" rx="37" fill="${accent}" filter="url(#boxShadow)" />
  <text x="540" y="836" fill="#0f172a" font-size="26" font-family="system-ui, -apple-system, sans-serif" font-weight="900" text-anchor="middle" letter-spacing="2">REGISTER AS VISITOR TODAY</text>

  <!-- Footer -->
  <text x="540" y="940" fill="#cbd5e1" font-size="18" font-family="system-ui, -apple-system, sans-serif" font-weight="600" text-anchor="middle" letter-spacing="1">GROWTH • HIGH TRUST CONNECTIONS • QUALITY REFERRALS</text>
</svg>`;
    }

    if (templateType === 'business') {
      const initials = (memberName || 'M')
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="100%" height="100%" style="display:block;width:100%;height:100%;">
  <defs>
    <linearGradient id="bg_grad_biz" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}" />
      <stop offset="100%" stop-color="${c2}" />
    </linearGradient>
    <filter id="cardShadow2" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="10" stdDeviation="16" flood-color="#000000" flood-opacity="0.45"/>
    </filter>
    <clipPath id="bizAvatar">
      <circle cx="540" cy="360" r="140" />
    </clipPath>
  </defs>

  <rect width="1080" height="1080" fill="url(#bg_grad_biz)" />
  <rect x="40" y="40" width="1000" height="1000" rx="28" fill="none" stroke="#ffffff" stroke-width="2" stroke-opacity="0.25" />

  <!-- Top Ribbon -->
  <rect x="220" y="70" width="640" height="48" rx="24" fill="#ffffff" fill-opacity="0.15" />
  <text x="540" y="102" fill="#ffffff" font-size="20" font-family="system-ui, -apple-system, sans-serif" font-weight="800" text-anchor="middle" letter-spacing="3">${escapeXml(referralGroupName.toUpperCase())}</text>

  <text x="540" y="175" fill="${accent}" font-size="44" font-family="system-ui, -apple-system, sans-serif" font-weight="900" text-anchor="middle" letter-spacing="2">BUSINESS PRESENTATION FEATURE</text>

  <!-- Member Avatar -->
  <circle cx="540" cy="360" r="148" fill="none" stroke="${accent}" stroke-width="6" filter="url(#cardShadow2)" />
  <circle cx="540" cy="360" r="140" fill="#1e293b" />
  ${
    memberPhotoUrl
      ? `<image href="${memberPhotoUrl}" x="400" y="220" width="280" height="280" preserveAspectRatio="xMidYMid slice" clip-path="url(#bizAvatar)" />`
      : `<text x="540" y="380" fill="#ffffff" font-size="64" font-family="system-ui, -apple-system, sans-serif" font-weight="900" text-anchor="middle">${initials}</text>`
  }

  <!-- Member Info -->
  <text x="540" y="550" fill="#ffffff" font-size="42" font-family="system-ui, -apple-system, sans-serif" font-weight="900" text-anchor="middle">${escapeXml(memberName)}</text>
  <text x="540" y="590" fill="#fef08a" font-size="26" font-family="system-ui, -apple-system, sans-serif" font-weight="800" text-anchor="middle">${escapeXml(companyName)}</text>
  
  <rect x="360" y="615" width="360" height="38" rx="19" fill="#ffffff" fill-opacity="0.2" />
  <text x="540" y="640" fill="#ffffff" font-size="18" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">${escapeXml(category)}</text>

  <!-- Specific Ask Spotlight Box -->
  <rect x="100" y="680" width="880" height="120" rx="18" fill="#000000" fill-opacity="0.35" stroke="${accent}" stroke-width="1.5" stroke-opacity="0.6" filter="url(#cardShadow2)" />
  <text x="130" y="718" fill="${accent}" font-size="18" font-family="system-ui, -apple-system, sans-serif" font-weight="800" letter-spacing="1">🎯 SPECIFIC REFERRAL ASK:</text>
  <text x="130" y="755" fill="#ffffff" font-size="22" font-family="system-ui, -apple-system, sans-serif" font-weight="600">${escapeXml(specificAsk.slice(0, 68))}</text>
  <text x="130" y="785" fill="#e2e8f0" font-size="20" font-family="system-ui, -apple-system, sans-serif" font-weight="500">${escapeXml(specificAsk.slice(68, 140))}</text>

  <!-- Presentation Date & Venue -->
  <text x="540" y="845" fill="#f8fafc" font-size="20" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">📅 ${escapeXml(meetingDate)} at ${escapeXml(meetingTime)} • 📍 ${escapeXml(venue)}</text>

  <!-- Contact Grid Footer -->
  <rect x="90" y="890" width="900" height="70" rx="20" fill="#ffffff" fill-opacity="0.12" />
  <text x="150" y="933" fill="#ffffff" font-size="18" font-family="system-ui, -apple-system, sans-serif" font-weight="700">📞 ${escapeXml(mobileNumber)}</text>
  <text x="540" y="933" fill="#ffffff" font-size="18" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">✉️ ${escapeXml(emailId)}</text>
  <text x="910" y="933" fill="#ffffff" font-size="18" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="end">🌐 ${escapeXml(website)}</text>
</svg>`;
    }

    if (templateType === 'kym') {
      const initials = (memberName || 'M')
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="100%" height="100%" style="display:block;width:100%;height:100%;">
  <defs>
    <linearGradient id="bg_kym" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}" />
      <stop offset="100%" stop-color="${c2}" />
    </linearGradient>
    <filter id="kymShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="10" stdDeviation="16" flood-color="#000000" flood-opacity="0.45"/>
    </filter>
    <clipPath id="kymAvatar">
      <circle cx="540" cy="400" r="160" />
    </clipPath>
  </defs>

  <rect width="1080" height="1080" fill="url(#bg_kym)" />
  <rect x="40" y="40" width="1000" height="1000" rx="30" fill="none" stroke="#ffffff" stroke-width="2" stroke-opacity="0.3" />

  <!-- Top Ribbon -->
  <rect x="260" y="75" width="560" height="50" rx="25" fill="#ffffff" fill-opacity="0.15" />
  <text x="540" y="108" fill="#ffffff" font-size="22" font-family="system-ui, -apple-system, sans-serif" font-weight="800" text-anchor="middle" letter-spacing="3">${escapeXml(referralGroupName.toUpperCase())}</text>

  <text x="540" y="195" fill="${accent}" font-size="52" font-family="system-ui, -apple-system, sans-serif" font-weight="900" text-anchor="middle" letter-spacing="3">KNOW YOUR MEMBER (KYM)</text>
  <text x="540" y="240" fill="#ffffff" font-size="22" font-family="system-ui, -apple-system, sans-serif" font-weight="600" text-anchor="middle" letter-spacing="1">MEMBER SPOTLIGHT &amp; 1-TO-1 FEATURE</text>

  <!-- Avatar -->
  <circle cx="540" cy="400" r="170" fill="none" stroke="${accent}" stroke-width="6" filter="url(#kymShadow)" />
  <circle cx="540" cy="400" r="160" fill="#1e293b" />
  ${
    memberPhotoUrl
      ? `<image href="${memberPhotoUrl}" x="380" y="240" width="320" height="320" preserveAspectRatio="xMidYMid slice" clip-path="url(#kymAvatar)" />`
      : `<text x="540" y="425" fill="#ffffff" font-size="70" font-family="system-ui, -apple-system, sans-serif" font-weight="900" text-anchor="middle">${initials}</text>`
  }

  <!-- Member Name -->
  <text x="540" y="625" fill="#ffffff" font-size="44" font-family="system-ui, -apple-system, sans-serif" font-weight="900" text-anchor="middle">${escapeXml(memberName)}</text>
  <text x="540" y="670" fill="#fef08a" font-size="28" font-family="system-ui, -apple-system, sans-serif" font-weight="800" text-anchor="middle">${escapeXml(companyName)}</text>
  
  <rect x="340" y="695" width="400" height="42" rx="21" fill="#ffffff" fill-opacity="0.2" />
  <text x="540" y="723" fill="#ffffff" font-size="20" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">${escapeXml(category)}</text>

  <!-- Info Box -->
  <rect x="120" y="770" width="840" height="150" rx="20" fill="#000000" fill-opacity="0.3" stroke="#ffffff" stroke-width="1" stroke-opacity="0.25" filter="url(#kymShadow)" />
  <text x="540" y="815" fill="#ffffff" font-size="22" font-family="system-ui, -apple-system, sans-serif" font-weight="700" text-anchor="middle">📅 Meeting: ${escapeXml(meetingDate)} at ${escapeXml(meetingTime)}</text>
  <text x="540" y="855" fill="#e2e8f0" font-size="20" font-family="system-ui, -apple-system, sans-serif" font-weight="500" text-anchor="middle">📍 ${escapeXml(venue)}</text>
  <text x="540" y="895" fill="${accent}" font-size="22" font-family="system-ui, -apple-system, sans-serif" font-weight="800" text-anchor="middle">📞 Direct Contact: ${escapeXml(mobileNumber)}</text>

  <text x="540" y="970" fill="#cbd5e1" font-size="18" font-family="system-ui, -apple-system, sans-serif" font-weight="600" text-anchor="middle" letter-spacing="1">SCHEDULE A 1-TO-1 DANCE SESSION TODAY</text>
</svg>`;
    }

    // Default Custom Graphic Template
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="100%" height="100%" style="display:block;width:100%;height:100%;">
  <defs>
    <linearGradient id="bg_grad_custom" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}" />
      <stop offset="100%" stop-color="${c2}" />
    </linearGradient>
    <filter id="customShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="20" flood-color="#000000" flood-opacity="0.4"/>
    </filter>
  </defs>

  <rect width="1080" height="1080" fill="url(#bg_grad_custom)" />
  <circle cx="950" cy="180" r="320" fill="${accent}" fill-opacity="0.12" />
  <circle cx="120" cy="980" r="420" fill="${accent}" fill-opacity="0.08" />
  
  <rect x="50" y="50" width="980" height="980" rx="36" fill="none" stroke="#ffffff" stroke-width="2" stroke-opacity="0.25" />
  
  <rect x="100" y="100" width="280" height="54" rx="27" fill="#ffffff" fill-opacity="0.2" filter="url(#customShadow)" />
  <text x="240" y="135" fill="#ffffff" font-size="20" font-family="system-ui, -apple-system, sans-serif" font-weight="800" text-anchor="middle" letter-spacing="2">${escapeXml(badgeText.toUpperCase())}</text>
  
  <text x="540" y="440" fill="#ffffff" font-size="52" font-family="system-ui, -apple-system, sans-serif" font-weight="900" text-anchor="middle" filter="url(#customShadow)">${escapeXml(headline)}</text>
  <text x="540" y="510" fill="#e2e8f0" font-size="28" font-family="system-ui, -apple-system, sans-serif" font-weight="500" text-anchor="middle">${escapeXml(subheading)}</text>
  
  <g transform="translate(390, 620)">
    <rect width="300" height="74" rx="37" fill="${accent}" filter="url(#customShadow)" />
    <text x="150" y="47" fill="#0f172a" font-size="24" font-family="system-ui, -apple-system, sans-serif" font-weight="900" text-anchor="middle">OFFICIAL CREATIVE</text>
  </g>
  
  <text x="540" y="960" fill="#cbd5e1" font-size="18" font-family="system-ui, -apple-system, sans-serif" font-weight="500" text-anchor="middle" letter-spacing="1">DIMENSIONS: ${requirement?.dimensions || '1080 x 1080'} &bull; HIGH-RESOLUTION PRODUCTION</text>
</svg>`;
  };

  const handleDownloadSvg = () => {
    const svg = generateSvgContent();
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${templateType}_creative_${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalFileUrl = uploadedFileUrl;
    let fileName = uploadedFileName;

    if (mode === 'generate' || !finalFileUrl) {
      const svg = generateSvgContent();
      finalFileUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
      fileName = `${templateType}_${(memberName || headline).toLowerCase().replace(/[^a-z0-9]/g, '_')}_v${Date.now()}.png`;
    }

    await onSubmitVersion({
      fileUrl: finalFileUrl,
      fileName,
      designerNotes,
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Studio Top Bar */}
      <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Live Asset Render Studio</h3>
            <p className="text-[11px] text-slate-400">Real-time vector generator &amp; production uploader</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
            <button
              type="button"
              onClick={() => setMode('generate')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                mode === 'generate' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Studio Generator</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('upload')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                mode === 'upload' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Custom File</span>
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Render Preview Display (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center bg-slate-950 p-4 sm:p-6 rounded-2xl border border-slate-800">
          <div className="w-full flex items-center justify-between text-[11px] font-bold text-slate-400 mb-3 uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-indigo-400">
              <Eye className="w-3.5 h-3.5" />
              LIVE ASSET RENDER PREVIEW
            </span>
            {mode === 'generate' && (
              <button
                type="button"
                onClick={handleDownloadSvg}
                className="text-[10px] font-semibold text-slate-300 hover:text-white flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 transition-colors"
                title="Download SVG vector file"
              >
                <Download className="w-3 h-3" /> Export SVG
              </button>
            )}
          </div>

          {/* Canvas Frame */}
          <div className="w-full max-w-[340px] aspect-square rounded-xl shadow-2xl overflow-hidden bg-slate-900 border border-slate-700 relative flex items-center justify-center">
            {mode === 'generate' || !uploadedFileUrl ? (
              <div
                className="w-full h-full flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: generateSvgContent() }}
              />
            ) : (
              <img src={uploadedFileUrl} alt="Uploaded design preview" className="w-full h-full object-cover" />
            )}
          </div>

          <div className="w-full flex items-center justify-between mt-3 text-[11px] text-slate-400 font-mono">
            <span>{requirement?.dimensions || '1080 x 1080'}</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Ready for approval review
            </span>
          </div>
        </div>

        {/* Right: Studio Customization Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-4 text-xs">
          {mode === 'generate' ? (
            <>
              {/* Template Selection Pills */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Creative Template Layout</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setTemplateType('birthday')}
                    className={`p-2 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                      templateType === 'birthday'
                        ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold ring-2 ring-amber-500/20 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                    }`}
                  >
                    <Cake className="w-4 h-4 text-amber-600" />
                    <span className="text-[11px]">Birthday Creative</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTemplateType('referral_meeting')}
                    className={`p-2 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                      templateType === 'referral_meeting'
                        ? 'border-blue-500 bg-blue-50 text-blue-900 font-bold ring-2 ring-blue-500/20 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                    }`}
                  >
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="text-[11px]">Referral Meeting</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTemplateType('business')}
                    className={`p-2 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                      templateType === 'business'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-900 font-bold ring-2 ring-indigo-500/20 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                    }`}
                  >
                    <Briefcase className="w-4 h-4 text-indigo-600" />
                    <span className="text-[11px]">Business Feature</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTemplateType('kym')}
                    className={`p-2 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                      templateType === 'kym'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-500/20 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span className="text-[11px]">KYM Spotlight</span>
                  </button>
                </div>
              </div>

              {/* Color Scheme Picker */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Color Theme &amp; Gradient</span>
                  <span className="text-[11px] font-normal text-slate-500">{activePalette.name}</span>
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {COLOR_PALETTES.map((pal, idx) => (
                    <button
                      key={pal.name}
                      type="button"
                      onClick={() => setPaletteIndex(idx)}
                      className={`w-9 h-9 rounded-xl border-2 transition-transform flex items-center justify-center relative shrink-0 ${
                        paletteIndex === idx ? 'scale-110 border-slate-900 shadow-md' : 'border-transparent opacity-80 hover:opacity-100'
                      }`}
                      style={{ background: `linear-gradient(135deg, ${pal.c1}, ${pal.c2})` }}
                      title={pal.name}
                    >
                      {paletteIndex === idx && <Check className="w-4 h-4 text-white drop-shadow" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Form Fields Based on Template */}
              {templateType === 'birthday' && (
                <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Referral Group Name</label>
                      <input
                        type="text"
                        value={referralGroupName}
                        onChange={(e) => setReferralGroupName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                        placeholder="e.g., Royal Pioneers Group"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Member Name</label>
                      <input
                        type="text"
                        value={memberName}
                        onChange={(e) => setMemberName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-bold"
                        placeholder="e.g., John Doe"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Day</label>
                      <input
                        type="text"
                        value={birthDay}
                        onChange={(e) => setBirthDay(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                        placeholder="e.g., 15th"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Month</label>
                      <input
                        type="text"
                        value={birthMonth}
                        onChange={(e) => setBirthMonth(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                        placeholder="e.g., October"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Mobile Number</label>
                      <input
                        type="text"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                        placeholder="e.g., +91 98765 43210"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Birthday Celebration Wish</label>
                    <input
                      type="text"
                      value={birthdayWish}
                      onChange={(e) => setBirthdayWish(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                    />
                  </div>

                  {/* Photo attachment toggle */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Member Portrait Photo</label>
                    <div className="flex items-center gap-2">
                      <label className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 hover:border-indigo-500 cursor-pointer flex items-center justify-center gap-1.5 font-medium transition-colors">
                        <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                        <span>{memberPhotoUrl ? 'Change Portrait Photo' : 'Upload Portrait Photo'}</span>
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                      </label>
                      {memberPhotoUrl && (
                        <button
                          type="button"
                          onClick={() => setMemberPhotoUrl(null)}
                          className="px-2.5 py-1.5 bg-rose-50 text-rose-600 rounded-lg border border-rose-200 text-[11px] font-semibold hover:bg-rose-100"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {templateType === 'referral_meeting' && (
                <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Referral Group Name</label>
                      <input
                        type="text"
                        value={referralGroupName}
                        onChange={(e) => setReferralGroupName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Meeting Date &amp; Time</label>
                      <input
                        type="text"
                        value={meetingDate}
                        onChange={(e) => setMeetingDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                        placeholder="e.g., Wednesday, 15 Oct"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Meeting Venue</label>
                      <input
                        type="text"
                        value={venue}
                        onChange={(e) => setVenue(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Meeting Stimulant</label>
                      <input
                        type="text"
                        value={stimulant}
                        onChange={(e) => setStimulant(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Dress Code</label>
                      <input
                        type="text"
                        value={dressCode}
                        onChange={(e) => setDressCode(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Visitor Fees</label>
                      <input
                        type="text"
                        value={visitorFees}
                        onChange={(e) => setVisitorFees(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              )}

              {templateType === 'business' && (
                <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Member Name</label>
                      <input
                        type="text"
                        value={memberName}
                        onChange={(e) => setMemberName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Company Name</label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Category</label>
                      <input
                        type="text"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Specific Ask</label>
                      <input
                        type="text"
                        value={specificAsk}
                        onChange={(e) => setSpecificAsk(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                      <input
                        type="text"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Email</label>
                      <input
                        type="text"
                        value={emailId}
                        onChange={(e) => setEmailId(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Website</label>
                      <input
                        type="text"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Member Portrait Photo</label>
                    <div className="flex items-center gap-2">
                      <label className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 hover:border-indigo-500 cursor-pointer flex items-center justify-center gap-1.5 font-medium transition-colors">
                        <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                        <span>{memberPhotoUrl ? 'Change Portrait Photo' : 'Upload Portrait Photo'}</span>
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                      </label>
                      {memberPhotoUrl && (
                        <button
                          type="button"
                          onClick={() => setMemberPhotoUrl(null)}
                          className="px-2.5 py-1.5 bg-rose-50 text-rose-600 rounded-lg border border-rose-200 text-[11px] font-semibold hover:bg-rose-100"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {templateType === 'kym' && (
                <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Member Name</label>
                      <input
                        type="text"
                        value={memberName}
                        onChange={(e) => setMemberName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Company Name</label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Category</label>
                      <input
                        type="text"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Mobile Number</label>
                      <input
                        type="text"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Member Portrait Photo</label>
                    <div className="flex items-center gap-2">
                      <label className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 hover:border-indigo-500 cursor-pointer flex items-center justify-center gap-1.5 font-medium transition-colors">
                        <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                        <span>{memberPhotoUrl ? 'Change Portrait Photo' : 'Upload Portrait Photo'}</span>
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                      </label>
                      {memberPhotoUrl && (
                        <button
                          type="button"
                          onClick={() => setMemberPhotoUrl(null)}
                          className="px-2.5 py-1.5 bg-rose-50 text-rose-600 rounded-lg border border-rose-200 text-[11px] font-semibold hover:bg-rose-100"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {templateType === 'custom' && (
                <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Headline Text</label>
                    <input
                      type="text"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Subheading Message</label>
                    <input
                      type="text"
                      value={subheading}
                      onChange={(e) => setSubheading(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Badge Tag</label>
                    <input
                      type="text"
                      value={badgeText}
                      onChange={(e) => setBadgeText(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono"
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Upload File Mode */
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Upload Finished Graphic</label>
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:border-indigo-500 transition-colors bg-slate-50 cursor-pointer relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleExternalFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <Upload className="w-9 h-9 mx-auto text-slate-400 mb-2" />
                <p className="font-bold text-slate-800 text-sm">Click to select graphic file from computer</p>
                <p className="text-[11px] text-slate-500 mt-1">Supports PNG, JPG, JPEG, WEBP, SVG (up to 50MB)</p>
                {uploadedFileName && (
                  <p className="text-xs text-indigo-600 font-bold mt-3 bg-indigo-50 py-1.5 px-3 rounded-lg inline-block">
                    Selected: {uploadedFileName}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Designer Comments */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Designer Notes / Submission Comments</label>
            <textarea
              rows={2}
              value={designerNotes}
              onChange={(e) => setDesignerNotes(e.target.value)}
              placeholder="e.g., Exported high-contrast vector asset, aligned with brand guidelines."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 text-xs"
            />
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 text-xs tracking-wide"
          >
            {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>SUBMIT GRAPHIC FOR APPROVER REVIEW</span>
          </button>
        </div>
      </form>
    </div>
  );
}
