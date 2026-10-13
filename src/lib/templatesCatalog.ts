/**
 * Master 200 Modern Creative Templates Catalog
 * Exactly 200 unique, professionally designed templates across 4 categories:
 * - A. Referral Meeting Announcement: 50 templates (meeting-01 to meeting-50)
 * - B. Business Presentation: 50 templates (pres-01 to pres-50)
 * - C. KYM (Know Your Member): 50 templates (kym-01 to kym-50)
 * - D. Birthday Creative: 50 templates (bday-01 to bday-50)
 */

export interface TemplateDefinition {
  slug: string;
  name: string;
  categoryCode: 'MEETING_ANNOUNCEMENT' | 'BUSINESS_PRESENTATION' | 'KYM' | 'BIRTHDAY';
  description: string;
  width: number;
  height: number;
  orientation: 'SQUARE' | 'PORTRAIT' | 'LANDSCAPE';
  themeStyle: string;
  layoutVariant: string;
  logoPosition: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  logoMaxWidth: number;
  logoMaxHeight: number;
  isDefault?: boolean;
  sortOrder: number;
  placeholders: any[];
  stylingConfig: {
    primaryColor: string;
    accentColor: string;
    backgroundColor: string;
    cardBg: string;
    textColor: string;
    borderAccent: string;
    badgeBg?: string;
    fontHeading?: string;
    fontBody?: string;
    goldGradient?: boolean;
    headerBanner?: boolean;
  };
}

// 20 Aesthetic Style Palettes
const STYLES = {
  minimalWhite: {
    themeStyle: 'minimal-corporate',
    primaryColor: '#0F172A',
    accentColor: '#2563EB',
    backgroundColor: '#FFFFFF',
    cardBg: '#F8FAFC',
    textColor: '#0F172A',
    borderAccent: '#E2E8F0',
    badgeBg: '#F1F5F9',
  },
  premiumCorporate: {
    themeStyle: 'corporate-slate',
    primaryColor: '#1E293B',
    accentColor: '#0284C7',
    backgroundColor: '#F8FAFC',
    cardBg: '#FFFFFF',
    textColor: '#0F172A',
    borderAccent: '#CBD5E1',
    badgeBg: '#E2E8F0',
  },
  modernEditorial: {
    themeStyle: 'clean-editorial',
    primaryColor: '#18181B',
    accentColor: '#E11D48',
    backgroundColor: '#FAFAFA',
    cardBg: '#FFFFFF',
    textColor: '#18181B',
    borderAccent: '#E4E4E7',
    badgeBg: '#F4F4F5',
  },
  swissTypography: {
    themeStyle: 'swiss-grid',
    primaryColor: '#09090B',
    accentColor: '#EA580C',
    backgroundColor: '#FFFFFF',
    cardBg: '#F4F4F5',
    textColor: '#09090B',
    borderAccent: '#D4D4D8',
    badgeBg: '#E4E4E7',
  },
  luxuryBlackGold: {
    themeStyle: 'luxury-black-gold',
    primaryColor: '#F59E0B',
    accentColor: '#D97706',
    backgroundColor: '#0A0A0A',
    cardBg: '#171717',
    textColor: '#F5F5F5',
    borderAccent: '#B45309',
    badgeBg: '#262626',
    goldGradient: true,
  },
  navyBlueWhite: {
    themeStyle: 'navy-white',
    primaryColor: '#1E3A8A',
    accentColor: '#3B82F6',
    backgroundColor: '#F0F9FF',
    cardBg: '#FFFFFF',
    textColor: '#0F172A',
    borderAccent: '#BAE6FD',
    badgeBg: '#E0F2FE',
  },
  cleanGeometric: {
    themeStyle: 'clean-geometric',
    primaryColor: '#0F766E',
    accentColor: '#14B8A6',
    backgroundColor: '#F0FDFA',
    cardBg: '#FFFFFF',
    textColor: '#134E4A',
    borderAccent: '#99F6E4',
    badgeBg: '#CCFBF1',
  },
  modernBusinessCard: {
    themeStyle: 'modern-card',
    primaryColor: '#334155',
    accentColor: '#6366F1',
    backgroundColor: '#F8FAFC',
    cardBg: '#FFFFFF',
    textColor: '#1E293B',
    borderAccent: '#E2E8F0',
    badgeBg: '#EEF2FF',
  },
  elegantBeigeNeutral: {
    themeStyle: 'beige-neutral',
    primaryColor: '#44403C',
    accentColor: '#B45309',
    backgroundColor: '#FAF8F5',
    cardBg: '#FFFFFF',
    textColor: '#292524',
    borderAccent: '#E7E5E4',
    badgeBg: '#F5F5F4',
  },
  boldTypography: {
    themeStyle: 'bold-typography',
    primaryColor: '#000000',
    accentColor: '#7C3AED',
    backgroundColor: '#FFFFFF',
    cardBg: '#F9FAFB',
    textColor: '#111827',
    borderAccent: '#E5E7EB',
    badgeBg: '#EDE9FE',
  },
  asymmetricEditorial: {
    themeStyle: 'asymmetric-editorial',
    primaryColor: '#27272A',
    accentColor: '#059669',
    backgroundColor: '#F4F4F5',
    cardBg: '#FFFFFF',
    textColor: '#18181B',
    borderAccent: '#D4D4D8',
    badgeBg: '#ECFDF5',
  },
  modernGradientAccent: {
    themeStyle: 'gradient-accent',
    primaryColor: '#1E1B4B',
    accentColor: '#6366F1',
    backgroundColor: '#EEF2FF',
    cardBg: '#FFFFFF',
    textColor: '#1E1B4B',
    borderAccent: '#C7D2FE',
    badgeBg: '#E0E7FF',
  },
  minimalCalendar: {
    themeStyle: 'minimal-calendar',
    primaryColor: '#047857',
    accentColor: '#10B981',
    backgroundColor: '#F0FDF4',
    cardBg: '#FFFFFF',
    textColor: '#064E3B',
    borderAccent: '#BBF7D0',
    badgeBg: '#DCFCE7',
  },
  executivePresentation: {
    themeStyle: 'executive-spotlight',
    primaryColor: '#1E293B',
    accentColor: '#D97706',
    backgroundColor: '#F8FAFC',
    cardBg: '#FFFFFF',
    textColor: '#0F172A',
    borderAccent: '#FDE68A',
    badgeBg: '#FEF3C7',
    goldGradient: true,
  },
  premiumEventPoster: {
    themeStyle: 'event-poster',
    primaryColor: '#0F172A',
    accentColor: '#EF4444',
    backgroundColor: '#FFF1F2',
    cardBg: '#FFFFFF',
    textColor: '#881337',
    borderAccent: '#FECDD3',
    badgeBg: '#FFE4E6',
  },
  elegantBirthdayComp: {
    themeStyle: 'white-gold',
    primaryColor: '#B45309',
    accentColor: '#F59E0B',
    backgroundColor: '#FAF9F6',
    cardBg: '#FFFFFF',
    textColor: '#1E293B',
    borderAccent: '#FDE68A',
    badgeBg: '#FEF3C7',
    goldGradient: true,
  },
  modernSocialGraphic: {
    themeStyle: 'modern-blue',
    primaryColor: '#0369A1',
    accentColor: '#0284C7',
    backgroundColor: '#F0F9FF',
    cardBg: '#FFFFFF',
    textColor: '#0C4A6E',
    borderAccent: '#BAE6FD',
    badgeBg: '#E0F2FE',
  },
  corporateMagazine: {
    themeStyle: 'clean-editorial',
    primaryColor: '#1C1917',
    accentColor: '#D97706',
    backgroundColor: '#FAF8F5',
    cardBg: '#FFFFFF',
    textColor: '#292524',
    borderAccent: '#E7E5E4',
    badgeBg: '#FEF3C7',
  },
  refinedNetworking: {
    themeStyle: 'minimal-corporate',
    primaryColor: '#1E3A8A',
    accentColor: '#059669',
    backgroundColor: '#F8FAFC',
    cardBg: '#FFFFFF',
    textColor: '#0F172A',
    borderAccent: '#E2E8F0',
    badgeBg: '#F1F5F9',
  },
  celebrationSparkle: {
    themeStyle: 'colorful-celebration',
    primaryColor: '#DC2626',
    accentColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
    cardBg: '#FFFFFF',
    textColor: '#1E293B',
    borderAccent: '#FDE68A',
    badgeBg: '#FEF3C7',
  },
};

const STYLE_KEYS = Object.keys(STYLES) as (keyof typeof STYLES)[];

const LOGO_POSITIONS: TemplateDefinition['logoPosition'][] = [
  'top-left',
  'top-center',
  'top-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
];

// Helper to determine dimensions
function getDimensions(index: number): { width: number; height: number; orientation: 'SQUARE' | 'PORTRAIT' | 'LANDSCAPE' } {
  // 60% Square, 25% Portrait, 15% Landscape
  if (index % 4 === 1) {
    return { width: 1080, height: 1350, orientation: 'PORTRAIT' };
  } else if (index % 7 === 0) {
    return { width: 1200, height: 630, orientation: 'LANDSCAPE' };
  }
  return { width: 1080, height: 1080, orientation: 'SQUARE' };
}

// =========================================================================
// 1. CATEGORY A: 50 REFERRAL MEETING ANNOUNCEMENT TEMPLATES
// =========================================================================
export const MEETING_TEMPLATES: TemplateDefinition[] = Array.from({ length: 50 }, (_, i) => {
  const num = i + 1;
  const pad = num < 10 ? `0${num}` : `${num}`;
  const slug = `meeting-announcement-${pad}`;
  const styleKey = STYLE_KEYS[i % STYLE_KEYS.length];
  const style = STYLES[styleKey];
  const dims = getDimensions(i);
  const logoPos = LOGO_POSITIONS[i % LOGO_POSITIONS.length];

  const layoutVariants = [
    'meeting-classic-grid',
    'meeting-split-column',
    'meeting-editorial-hero',
    'meeting-calendar-tile',
    'meeting-luxury-regal',
    'meeting-swiss-stark',
    'meeting-modern-badges',
    'meeting-navy-strip',
    'meeting-geometric-angle',
    'meeting-floating-card',
  ];
  const layoutVariant = layoutVariants[i % layoutVariants.length];

  const titlePrefixes = [
    'Executive Referral Summit',
    'Weekly Chapter Assembly',
    'High-Impact Network Meeting',
    'Strategic Business Exchange',
    'Apex Enterprise Gathering',
    'B2B Growth Forum',
    'Synergy Breakfast Meet',
    'Titans Business Conclave',
    'Vanguard Trade Circle',
    'Nexus Leadership Session',
  ];
  const titleName = `${titlePrefixes[i % titlePrefixes.length]} ${pad}`;

  return {
    slug,
    name: titleName,
    categoryCode: 'MEETING_ANNOUNCEMENT',
    description: `Professional announcement template featuring ${styleKey.replace(/([A-Z])/g, ' $1').toLowerCase()} aesthetics and ${layoutVariant.replace('meeting-', '').replace(/-/g, ' ')} structure.`,
    width: dims.width,
    height: dims.height,
    orientation: dims.orientation,
    themeStyle: style.themeStyle,
    layoutVariant,
    logoPosition: logoPos,
    logoMaxWidth: 190,
    logoMaxHeight: 65,
    isDefault: i === 0,
    sortOrder: num,
    placeholders: [
      { key: 'referralGroupName', label: 'Referral Group Name', type: 'text', default: 'Apex Referral Chapter' },
      { key: 'date', label: 'Date', type: 'date', default: 'Wednesday, 16th October 2026' },
      { key: 'time', label: 'Time', type: 'text', default: '07:00 AM - 09:30 AM' },
      { key: 'venue', label: 'Venue', type: 'text', default: 'Grand Ballroom, The Oberoi, Marine Drive' },
      { key: 'meetingStimulant', label: 'Meeting Stimulant', type: 'text', default: 'Unlocking Cross-Chapter Strategic Referral Synergies' },
      { key: 'dressCode', label: 'Dress Code', type: 'text', default: 'Business Formals' },
      { key: 'visitorFees', label: 'Visitor Fees', type: 'text', default: '₹1,200 (Buffet & Networking Included)' },
    ],
    stylingConfig: { ...style },
  };
});

// =========================================================================
// 2. CATEGORY B: 50 BUSINESS PRESENTATION TEMPLATES
// =========================================================================
export const PRESENTATION_TEMPLATES: TemplateDefinition[] = Array.from({ length: 50 }, (_, i) => {
  const num = i + 1;
  const pad = num < 10 ? `0${num}` : `${num}`;
  const slug = `presentation-feature-${pad}`;
  const styleKey = STYLE_KEYS[(i + 3) % STYLE_KEYS.length];
  const style = STYLES[styleKey];
  const dims = getDimensions(i);
  const logoPos = LOGO_POSITIONS[(i + 2) % LOGO_POSITIONS.length];

  const layoutVariants = [
    'pres-classic-split',
    'pres-top-portrait',
    'pres-quote-focal',
    'pres-badge-hero',
    'pres-editorial-column',
    'pres-modern-card',
    'pres-swiss-grid',
    'pres-geometric-prism',
    'pres-executive-spotlight',
    'pres-clean-showcase',
  ];
  const layoutVariant = layoutVariants[i % layoutVariants.length];

  const titlePrefixes = [
    'Keynote Spotlight Showcase',
    'Executive Feature Presentation',
    'Member 10-Minute Keynote',
    'Strategic Business Showcase',
    'Industry Masterclass Spotlight',
    'Enterprise Feature Roster',
    'Distinguished Speaker Deck',
    'Corporate Showcase Feature',
    'Commercial Leader Spotlight',
    'Founder Feature Keynote',
  ];
  const titleName = `${titlePrefixes[i % titlePrefixes.length]} ${pad}`;

  return {
    slug,
    name: titleName,
    categoryCode: 'BUSINESS_PRESENTATION',
    description: `High-conversion presentation showcase template with ${styleKey.replace(/([A-Z])/g, ' $1').toLowerCase()} styling and prominent specific ask placement.`,
    width: dims.width,
    height: dims.height,
    orientation: dims.orientation,
    themeStyle: style.themeStyle,
    layoutVariant,
    logoPosition: logoPos,
    logoMaxWidth: 200,
    logoMaxHeight: 70,
    isDefault: i === 0,
    sortOrder: num,
    placeholders: [
      { key: 'referralGroupName', label: 'Referral Group Name', type: 'text', default: 'Apex Referral Chapter' },
      { key: 'memberName', label: 'Member Name', type: 'text', default: 'Vikram Patel' },
      { key: 'companyName', label: 'Company Name', type: 'text', default: 'Apex Architectural Solutions' },
      { key: 'businessCategory', label: 'Business Category', type: 'text', default: 'Commercial & Interior Architecture' },
      { key: 'photoUrl', label: 'Professional Photo', type: 'image', default: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400' },
      { key: 'phone', label: 'Mobile Number', type: 'text', default: '+91 97123 55667' },
      { key: 'email', label: 'Email ID', type: 'text', default: 'vikram@apexarchitects.com' },
      { key: 'website', label: 'Website', type: 'text', default: 'www.apexarchitects.com' },
      { key: 'specificAsk', label: 'Specific Ask', type: 'text', default: 'Warm introductions to Commercial Real Estate Developers and Corporate Office Fit-out Heads in BKC.' },
      { key: 'date', label: 'Date', type: 'date', default: 'Wednesday, 16th October 2026' },
      { key: 'time', label: 'Time', type: 'text', default: '08:15 AM - 08:30 AM' },
      { key: 'venue', label: 'Venue', type: 'text', default: 'Grand Ballroom, The Oberoi' },
    ],
    stylingConfig: { ...style },
  };
});

// =========================================================================
// 3. CATEGORY C: 50 KYM (KNOW YOUR MEMBER) TEMPLATES
// =========================================================================
export const KYM_TEMPLATES: TemplateDefinition[] = Array.from({ length: 50 }, (_, i) => {
  const num = i + 1;
  const pad = num < 10 ? `0${num}` : `${num}`;
  const slug = `kym-spotlight-${pad}`;
  const styleKey = STYLE_KEYS[(i + 7) % STYLE_KEYS.length];
  const style = STYLES[styleKey];
  const dims = getDimensions(i);
  const logoPos = LOGO_POSITIONS[(i + 4) % LOGO_POSITIONS.length];

  const layoutVariants = [
    'kym-center-spotlight',
    'kym-id-card',
    'kym-split-profile',
    'kym-luxury-medallion',
    'kym-modern-pills',
    'kym-swiss-bio',
    'kym-editorial-portrait',
    'kym-shield-crest',
    'kym-horizontal-credential',
    'kym-clean-directory',
  ];
  const layoutVariant = layoutVariants[i % layoutVariants.length];

  const titlePrefixes = [
    'Member Profile Spotlight',
    'Executive Identity Showcase',
    'Know Your Member Feature',
    'Official Member Introduction',
    'Distinguished Member Showcase',
    'Business Leader Dossier',
    'Chapter Entrepreneur Profile',
    'Premier Partner Introduction',
    'Professional Credential Showcase',
    'Industry Specialist Bio',
  ];
  const titleName = `${titlePrefixes[i % titlePrefixes.length]} ${pad}`;

  return {
    slug,
    name: titleName,
    categoryCode: 'KYM',
    description: `Official member spotlight template engineered with ${styleKey.replace(/([A-Z])/g, ' $1').toLowerCase()} layout for clear member identification and category authority.`,
    width: dims.width,
    height: dims.height,
    orientation: dims.orientation,
    themeStyle: style.themeStyle,
    layoutVariant,
    logoPosition: logoPos,
    logoMaxWidth: 190,
    logoMaxHeight: 65,
    isDefault: i === 0,
    sortOrder: num,
    placeholders: [
      { key: 'referralGroupName', label: 'Referral Group Name', type: 'text', default: 'Apex Referral Chapter' },
      { key: 'memberName', label: 'Member Name', type: 'text', default: 'Dr. Sneha Desai' },
      { key: 'photoUrl', label: 'Professional Photo', type: 'image', default: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400' },
      { key: 'companyName', label: 'Company Name', type: 'text', default: 'Desai Multispeciality Dental' },
      { key: 'businessCategory', label: 'Business Category', type: 'text', default: 'Cosmetic & Implant Dentistry' },
      { key: 'phone', label: 'Mobile Number', type: 'text', default: '+91 98765 44332' },
      { key: 'date', label: 'Date', type: 'date', default: 'Wednesday, 16th October 2026' },
      { key: 'time', label: 'Time', type: 'text', default: '07:00 AM Onwards' },
      { key: 'venue', label: 'Venue', type: 'text', default: 'Grand Ballroom, The Oberoi' },
    ],
    stylingConfig: { ...style },
  };
});

// =========================================================================
// 4. CATEGORY D: 50 BIRTHDAY CREATIVE TEMPLATES
// =========================================================================
export const BIRTHDAY_TEMPLATES: TemplateDefinition[] = Array.from({ length: 50 }, (_, i) => {
  const num = i + 1;
  const pad = num < 10 ? `0${num}` : `${num}`;
  const slug = `birthday-celebration-${pad}`;
  const styleKey = STYLE_KEYS[(i + 11) % STYLE_KEYS.length];
  const style = STYLES[styleKey];
  const dims = getDimensions(i);
  const logoPos = LOGO_POSITIONS[(i + 1) % LOGO_POSITIONS.length];

  const isMonthlyRoster = num >= 41; // Templates 41-50 are dedicated clean monthly birthday directories / multi-member grids!

  const layoutVariants = isMonthlyRoster
    ? ['bday-monthly-roster-grid', 'bday-monthly-card-deck', 'bday-monthly-directory-clean']
    : [
        'bday-confetti-festive',
        'bday-gold-laurel',
        'bday-royal-festive',
        'bday-luxury-dark',
        'bday-floral-botanical',
        'bday-portrait-focal',
        'bday-swiss-clean',
        'bday-minimal-corporate',
        'bday-executive-salute',
        'bday-modern-card',
      ];
  const layoutVariant = layoutVariants[i % layoutVariants.length];

  const titlePrefixes = isMonthlyRoster
    ? [
        'Monthly Chapter Birthday Directory',
        'All-Members Monthly Birthday Roster',
        'Celebrants of the Month Showcase',
        'Monthly Birthday Tribute Grid',
        'Executive Birthday Directory',
      ]
    : [
        'Regal Gold Birthday Tribute',
        'Festive Confetti Celebration',
        'Executive Birthday Honour',
        'Minimal Corporate Birthday',
        'Champagne & Laurel Greeting',
        'Modern Portrait Celebration',
        'Royal Sapphire Birthday Card',
        'Refined Typographic Birthday',
        'Floral Botanical Greetings',
        'Distinguished Milestone Celebration',
      ];
  const titleName = `${titlePrefixes[i % titlePrefixes.length]} ${pad}`;

  return {
    slug,
    name: titleName,
    categoryCode: 'BIRTHDAY',
    description: isMonthlyRoster
      ? `Dedicated monthly roster template designed to celebrate multiple chapter celebrants on a single cohesive monthly graphic.`
      : `Personalized member celebration layout featuring ${styleKey.replace(/([A-Z])/g, ' $1').toLowerCase()} visual accents and warm tribute framing.`,
    width: dims.width,
    height: dims.height,
    orientation: dims.orientation,
    themeStyle: style.themeStyle,
    layoutVariant,
    logoPosition: logoPos,
    logoMaxWidth: 190,
    logoMaxHeight: 65,
    isDefault: i === 0,
    sortOrder: num,
    placeholders: [
      { key: 'referralGroupName', label: 'Referral Group Name', type: 'text', default: 'Apex Referral Chapter' },
      { key: 'memberName', label: 'Member Name', type: 'text', default: 'Amit Sharma' },
      { key: 'photoUrl', label: 'Professional Photo', type: 'image', default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400' },
      { key: 'phone', label: 'Mobile Number', type: 'text', default: '+91 98250 11223' },
      { key: 'birthDay', label: 'Birthday Date', type: 'text', default: '15th' },
      { key: 'birthMonth', label: 'Birthday Month', type: 'text', default: 'October' },
      { key: 'birthdayWish', label: 'Birthday Wish', type: 'text', default: 'Wishing you a magnificent year filled with boundless success, good health and prosperity on your special day!' },
    ],
    stylingConfig: { ...style },
  };
});

// All 200 Combined
export const ALL_200_TEMPLATES: TemplateDefinition[] = [
  ...MEETING_TEMPLATES,
  ...PRESENTATION_TEMPLATES,
  ...KYM_TEMPLATES,
  ...BIRTHDAY_TEMPLATES,
];
