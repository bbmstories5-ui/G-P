/**
 * Referral Group Creative Studio - Master Graphic Canvas Rendering Engine
 * Supports 200 modern templates across 4 categories and 6 selectable brand logos.
 * Handles Square, Portrait, and Landscape orientations with auto-wrapping,
 * non-overlapping typography, aspect-ratio preserved photos, and configurable logo placement.
 */

export interface RenderCreativeOptions {
  categoryCode: 'MEETING_ANNOUNCEMENT' | 'BUSINESS_PRESENTATION' | 'KYM' | 'BIRTHDAY';
  templateSlug?: string;
  themeStyle?: string;
  layoutVariant?: string;
  logoPosition?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  logoMaxWidth?: number;
  logoMaxHeight?: number;
  logoUrl?: string;
  darkLogoUrl?: string;
  width?: number;
  height?: number;
  stylingConfig?: {
    primaryColor?: string;
    accentColor?: string;
    backgroundColor?: string;
    cardBg?: string;
    textColor?: string;
    borderAccent?: string;
    badgeBg?: string;
    goldGradient?: boolean;
    headerBanner?: boolean;
  };
  baseDesignUrl?: string;
  elements?: Array<any>;
  sharedFixedContent?: any;
  data: {
    referralGroupName?: string;
    memberName?: string;
    companyName?: string;
    businessCategory?: string;
    photoUrl?: string;
    phone?: string;
    email?: string;
    website?: string;
    specificAsk?: string;
    date?: string;
    time?: string;
    venue?: string;
    meetingStimulant?: string;
    dressCode?: string;
    visitorFees?: string;
    birthDay?: string;
    birthMonth?: string;
    birthdayWish?: string;
    fieldFontSizes?: Record<string, number>;
    // Monthly Birthday multi-member support
    monthlyMembers?: Array<{
      name: string;
      company?: string;
      avatar?: string;
      birthDay?: string;
      phone?: string;
    }>;
    [key: string]: any;
  };
}

/**
 * Text wrapper that respects user newlines, auto-wraps long lines, and prevents text overlap
 */
export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number = 4
): string[] {
  if (!text) return [];

  // 1. Split by explicit newline characters first so user line breaks (Enter) are strictly honored
  const rawParagraphs = String(text).split(/\r?\n/);
  const lines: string[] = [];

  // If user entered explicit newlines, allow all their lines (up to a generous limit)
  const effectiveMaxLines = Math.max(maxLines, rawParagraphs.length, 6);

  for (let p = 0; p < rawParagraphs.length; p++) {
    const paragraph = rawParagraphs[p];
    if (!paragraph || paragraph.trim() === '') {
      if (lines.length < effectiveMaxLines) {
        lines.push('');
      }
      continue;
    }

    const words = paragraph.split(/\s+/).filter(Boolean);
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && i > 0) {
        lines.push(currentLine);
        currentLine = words[i];

        // If we are about to exceed max allowed lines on the final paragraph, truncate with ellipsis
        if (lines.length >= effectiveMaxLines - 1 && p === rawParagraphs.length - 1) {
          const remaining = words.slice(i).join(' ');
          let truncated = remaining;
          while (ctx.measureText(`${truncated}...`).width > maxWidth && truncated.length > 3) {
            truncated = truncated.slice(0, -4);
          }
          lines.push(`${truncated}...`);
          return lines;
        } else if (lines.length >= effectiveMaxLines) {
          return lines.slice(0, effectiveMaxLines);
        }
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
      if (lines.length >= effectiveMaxLines && p < rawParagraphs.length - 1) {
        return lines.slice(0, effectiveMaxLines);
      }
    }
  }

  // If the last line still overflows maxWidth, truncate with ellipsis
  if (lines.length > 0) {
    const lastIdx = lines.length - 1;
    let lastLine = lines[lastIdx];
    if (ctx.measureText(lastLine).width > maxWidth && lastLine.length > 3) {
      while (ctx.measureText(`${lastLine}...`).width > maxWidth && lastLine.length > 3) {
        lastLine = lastLine.slice(0, -1).trim();
      }
      lines[lastIdx] = `${lastLine}...`;
    }
  }

  return lines;
}

/**
 * Draw smooth rounded rectangle
 */
export function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill?: string,
  stroke?: string,
  strokeWidth: number = 1
) {
  ctx.save();
  ctx.beginPath();
  const r = Math.min(radius, width / 2, height / 2);
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();

  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke && strokeWidth > 0) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Image loader with CORS handling
 */
export function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!url) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      resolve(null);
    };
    img.src = url;
  });
}

/**
 * Construct SVG-grade geometric path for any supported frame geometry
 */
export function buildFramePath(
  ctx: CanvasRenderingContext2D,
  shape: string,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number = 16
) {
  ctx.beginPath();
  const normalized = (shape || 'circle').toLowerCase().trim();

  switch (normalized) {
    case 'none':
    case 'rectangle':
    case 'rect':
      ctx.rect(x, y, w, h);
      break;

    case 'circle': {
      const size = Math.min(w, h);
      const cx = x + w / 2;
      const cy = y + h / 2;
      ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
      break;
    }

    case 'oval': {
      const cx = x + w / 2;
      const cy = y + h / 2;
      ctx.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2);
      break;
    }

    case 'arch': {
      // Arched dome top with flat bottom base
      const r = w / 2;
      ctx.moveTo(x, y + h);
      ctx.lineTo(x, y + r);
      ctx.arc(x + r, y + r, r, Math.PI, 0, false);
      ctx.lineTo(x + w, y + h);
      ctx.closePath();
      break;
    }

    case 'hexagon': {
      const cx = x + w / 2;
      const cy = y + h / 2;
      const rx = w / 2;
      const ry = h / 2;
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const px = cx + rx * Math.cos(angle);
        const py = cy + ry * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      break;
    }

    case 'octagon': {
      const cutX = w * 0.28;
      const cutY = h * 0.28;
      ctx.moveTo(x + cutX, y);
      ctx.lineTo(x + w - cutX, y);
      ctx.lineTo(x + w, y + cutY);
      ctx.lineTo(x + w, y + h - cutY);
      ctx.lineTo(x + w - cutX, y + h);
      ctx.lineTo(x + cutX, y + h);
      ctx.lineTo(x, y + h - cutY);
      ctx.lineTo(x, y + cutY);
      ctx.closePath();
      break;
    }

    case 'diamond': {
      const cx = x + w / 2;
      const cy = y + h / 2;
      ctx.moveTo(cx, y);
      ctx.lineTo(x + w, cy);
      ctx.lineTo(cx, y + h);
      ctx.lineTo(x, cy);
      ctx.closePath();
      break;
    }

    case 'shield': {
      ctx.moveTo(x, y);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w, y + h * 0.6);
      ctx.quadraticCurveTo(x + w, y + h, x + w / 2, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h * 0.6);
      ctx.closePath();
      break;
    }

    case 'heart': {
      const cx = x + w / 2;
      const topY = y + h * 0.3;
      ctx.moveTo(cx, y + h * 0.85);
      ctx.bezierCurveTo(x - w * 0.05, y + h * 0.55, x - w * 0.05, y, cx, topY);
      ctx.bezierCurveTo(x + w * 1.05, y, x + w * 1.05, y + h * 0.55, cx, y + h * 0.85);
      ctx.closePath();
      break;
    }

    case 'star': {
      const cx = x + w / 2;
      const cy = y + h / 2;
      const spikes = 5;
      const outerR = Math.min(w, h) / 2;
      const innerR = outerR * 0.48;
      let rot = (Math.PI / 2) * 3;
      const step = Math.PI / spikes;
      ctx.moveTo(cx, cy - outerR);
      for (let i = 0; i < spikes; i++) {
        let px = cx + Math.cos(rot) * outerR;
        let py = cy + Math.sin(rot) * outerR;
        ctx.lineTo(px, py);
        rot += step;
        px = cx + Math.cos(rot) * innerR;
        py = cy + Math.sin(rot) * innerR;
        ctx.lineTo(px, py);
        rot += step;
      }
      ctx.lineTo(cx, cy - outerR);
      ctx.closePath();
      break;
    }

    case 'squircle':
    case 'rounded':
    default: {
      const r = Math.min(radius > 0 ? radius : 20, w / 2, h / 2);
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      break;
    }
  }
}

/**
 * Draw photo with any configured frame geometry (Circular, Rounded, Arch, Hexagon, Octagon, Diamond, Shield, Heart, Star)
 * or Frameless (Raw unclipped rectangle with 0 border or custom stroke)
 */
export function drawFramedPhoto(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  fallbackText: string,
  x: number,
  y: number,
  w: number,
  h: number,
  options: {
    shape?: string;
    borderRadius?: number;
    borderStroke?: string;
    borderWidth?: number;
    borderStyle?: string;
    hasFrame?: boolean;
    shadowColor?: string;
    shadowBlur?: number;
    shadowOffsetX?: number;
    shadowOffsetY?: number;
    objectFit?: 'cover' | 'contain' | 'fill';
    blendMode?: string;
  } = {}
) {
  const rawShape = (options.shape || 'none').toLowerCase().trim();
  const isFrameless = rawShape === 'none' || rawShape === 'without-frame' || options.hasFrame === false;
  const shape = isFrameless ? 'none' : rawShape;
  const hasFrame = !isFrameless;
  const radius = hasFrame ? Number(options.borderRadius ?? (shape === 'squircle' ? 24 : 0)) : 0;
  const strokeColor = options.borderStroke || '#D97706';
  const strokeWidth = options.borderWidth !== undefined ? Number(options.borderWidth) : (hasFrame ? 4 : 0);
  const borderStyle = options.borderStyle || 'solid';
  const isNormalBlend = !options.blendMode || options.blendMode === 'normal' || options.blendMode === 'source-over';

  ctx.save();

  // Draw optional drop shadow / glow behind the frame (only if a frame is explicitly chosen and in normal blend mode)
  if (hasFrame && options.shadowBlur && options.shadowBlur > 0 && isNormalBlend) {
    ctx.save();
    ctx.shadowColor = options.shadowColor || 'rgba(0, 0, 0, 0.25)';
    ctx.shadowBlur = options.shadowBlur;
    ctx.shadowOffsetX = options.shadowOffsetX || 0;
    ctx.shadowOffsetY = options.shadowOffsetY || 4;
    ctx.fillStyle = '#FFFFFF';
    buildFramePath(ctx, shape, x, y, w, h, radius);
    ctx.fill();
    ctx.restore();
  }

  // Draw clipped image content
  ctx.save();
  buildFramePath(ctx, shape, x, y, w, h, radius);
  ctx.clip();

  if (img && img.width > 0 && img.height > 0) {
    const fit = options.objectFit || 'cover';
    if (fit === 'contain') {
      const aspect = img.width / img.height;
      let tw = w;
      let th = w / aspect;
      if (th > h) {
        th = h;
        tw = h * aspect;
      }
      const lx = x + (w - tw) / 2;
      const ly = y + (h - th) / 2;
      ctx.drawImage(img, lx, ly, tw, th);
    } else if (fit === 'fill') {
      ctx.drawImage(img, x, y, w, h);
    } else {
      // Cover (default for photos)
      const imgAspect = img.width / img.height;
      const targetAspect = w / h;
      let sw = img.width;
      let sh = img.height;
      let sx = 0;
      let sy = 0;

      if (imgAspect > targetAspect) {
        sw = img.height * targetAspect;
        sx = (img.width - sw) / 2;
      } else {
        sh = img.width / targetAspect;
        sy = (img.height - sh) / 2;
      }
      ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
    }
  } else {
    // High-resolution fallback avatar with gradient and member initials
    const gradient = ctx.createLinearGradient(x, y, x + w, y + h);
    gradient.addColorStop(0, '#1E293B');
    gradient.addColorStop(1, '#0F172A');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = '#F8FAFC';
    ctx.font = `bold ${Math.floor(Math.min(w, h) * 0.28)}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const initials = (fallbackText || 'M')
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
    ctx.fillText(initials, x + w / 2, y + h / 2);
  }
  ctx.restore();

  // Draw border stroke outline on top of the clipped photo
  if (strokeWidth > 0 && strokeColor && strokeColor !== 'transparent') {
    ctx.save();
    buildFramePath(ctx, shape, x, y, w, h, radius);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    if (borderStyle === 'dashed') {
      ctx.setLineDash([Math.max(6, strokeWidth * 2), Math.max(4, strokeWidth * 1.5)]);
    }
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Draw circular cropped professional photo (backward-compatible wrapper)
 */
export function drawPhoto(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  fallbackText: string,
  x: number,
  y: number,
  size: number,
  borderStroke: string = '#D97706',
  borderWidth: number = 6
) {
  drawFramedPhoto(ctx, img, fallbackText, x, y, size, size, {
    shape: 'circle',
    borderStroke,
    borderWidth,
  });
}

/**
 * Draw rounded rectangle photo (backward-compatible wrapper)
 */
export function drawRoundedPhoto(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  fallbackText: string,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number = 16,
  borderStroke: string = '#D97706',
  borderWidth: number = 4
) {
  drawFramedPhoto(ctx, img, fallbackText, x, y, w, h, {
    shape: 'squircle',
    borderRadius: radius,
    borderStroke,
    borderWidth,
  });
}

/**
 * Draw selected logo at configured position preserving original aspect ratio
 */
export function drawBrandLogo(
  ctx: CanvasRenderingContext2D,
  logoImg: HTMLImageElement | null,
  pos: TemplateDefinitionLogoPosition,
  w: number,
  h: number,
  maxW: number = 190,
  maxH: number = 65,
  pad: number = 44
) {
  if (!logoImg || logoImg.width === 0 || logoImg.height === 0) return;

  const aspect = logoImg.width / logoImg.height;
  let targetW = maxW;
  let targetH = targetW / aspect;

  if (targetH > maxH) {
    targetH = maxH;
    targetW = targetH * aspect;
  }

  let x = pad;
  let y = pad;

  switch (pos) {
    case 'top-left':
      x = pad;
      y = pad;
      break;
    case 'top-center':
      x = (w - targetW) / 2;
      y = pad;
      break;
    case 'top-right':
      x = w - pad - targetW;
      y = pad;
      break;
    case 'bottom-left':
      x = pad;
      y = h - pad - targetH;
      break;
    case 'bottom-center':
      x = (w - targetW) / 2;
      y = h - pad - targetH;
      break;
    case 'bottom-right':
      x = w - pad - targetW;
      y = h - pad - targetH;
      break;
  }

  ctx.save();
  ctx.drawImage(logoImg, x, y, targetW, targetH);
  ctx.restore();
}

type TemplateDefinitionLogoPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

/**
 * Main Entry Point
 */
export async function renderCreativeOnCanvas(
  canvas: HTMLCanvasElement,
  options: RenderCreativeOptions
): Promise<void> {
  const {
    categoryCode,
    templateSlug = '',
    themeStyle = 'white-gold',
    layoutVariant = 'variant-1',
    logoPosition = 'top-left',
    logoMaxWidth = 190,
    logoMaxHeight = 65,
    logoUrl,
    darkLogoUrl,
    stylingConfig,
    data,
  } = options;

  const w = options.width || 1080;
  const h = options.height || 1080;

  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Clear
  ctx.clearRect(0, 0, w, h);

  // Preload photo & logo
  const isDark =
    themeStyle.includes('dark') ||
    stylingConfig?.backgroundColor === '#0A0A0A' ||
    stylingConfig?.backgroundColor === '#090D16';

  const chosenLogoUrl = isDark && darkLogoUrl ? darkLogoUrl : logoUrl || '/logos/logo-1-apex-crest.svg';

  const [photoImg, logoImg] = await Promise.all([
    data.photoUrl ? loadImage(data.photoUrl) : Promise.resolve(null),
    chosenLogoUrl ? loadImage(chosenLogoUrl) : Promise.resolve(null),
  ]);

  // Check if this is a custom builder template with baseDesignUrl or configured elements
  if (options.baseDesignUrl || (options.elements && options.elements.length > 0)) {
    await renderCustomBuilderTemplate(ctx, w, h, options, data, photoImg, logoImg);
    return;
  }

  // Dispatch to Category Renderers
  switch (categoryCode) {
    case 'MEETING_ANNOUNCEMENT':
      renderMeeting(ctx, w, h, templateSlug, themeStyle, layoutVariant, stylingConfig, data, logoImg, logoPosition, logoMaxWidth, logoMaxHeight);
      break;
    case 'BUSINESS_PRESENTATION':
      renderPresentation(ctx, w, h, templateSlug, themeStyle, layoutVariant, stylingConfig, data, photoImg, logoImg, logoPosition, logoMaxWidth, logoMaxHeight);
      break;
    case 'KYM':
      renderKYM(ctx, w, h, templateSlug, themeStyle, layoutVariant, stylingConfig, data, photoImg, logoImg, logoPosition, logoMaxWidth, logoMaxHeight);
      break;
    case 'BIRTHDAY':
      renderBirthday(ctx, w, h, templateSlug, themeStyle, layoutVariant, stylingConfig, data, photoImg, logoImg, logoPosition, logoMaxWidth, logoMaxHeight);
      break;
  }
}

/**
 * Render Super Admin Custom Builder Template
 * Combines: Uploaded Base Design + Drag/Drop Elements (Logos, Photos, Fixed & Dynamic fields) + Shared Footer
 */
async function renderCustomBuilderTemplate(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  options: RenderCreativeOptions,
  data: any,
  photoImg: HTMLImageElement | null,
  logoImg: HTMLImageElement | null
): Promise<void> {
  // 1. Draw Base Artwork or Fallback Background
  if (options.baseDesignUrl) {
    const baseImg = await loadImage(options.baseDesignUrl);
    if (baseImg) {
      ctx.drawImage(baseImg, 0, 0, w, h);
    } else {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, w, h);
    }
  } else {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);
  }

  // 2. Sort elements by zIndex
  const elements = (options.elements || []).slice().sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

  for (const el of elements) {
    if (el.isVisible === false) continue;

    const x = Number(el.posX) || 0;
    const y = Number(el.posY) || 0;
    const width = Number(el.width) || 100;
    const height = Number(el.height) || 50;

    let styleObj: any = {};
    if (typeof el.styleConfig === 'string') {
      try { styleObj = JSON.parse(el.styleConfig); } catch {}
    } else if (typeof el.styleConfig === 'object' && el.styleConfig !== null) {
      styleObj = el.styleConfig;
    }

    ctx.save();

    // 1. Element Opacity
    const opacity = el.opacity !== undefined ? Number(el.opacity) : (styleObj.opacity !== undefined ? Number(styleObj.opacity) : 1);
    ctx.globalAlpha = Math.max(0, Math.min(1, isNaN(opacity) ? 1 : opacity));

    // 2. Blend Mode
    const blend = (el.blendMode || styleObj.blendMode || 'normal').toLowerCase().trim();
    const validBlendModes = new Set([
      'multiply', 'screen', 'overlay', 'darken', 'lighten',
      'color-dodge', 'color-burn', 'hard-light', 'soft-light',
      'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity',
      'lighter'
    ]);
    if (blend && validBlendModes.has(blend)) {
      try {
        ctx.globalCompositeOperation = blend as GlobalCompositeOperation;
      } catch {
        ctx.globalCompositeOperation = 'source-over';
      }
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }

    // 3. Shadow
    const hasShadow = el.shadowEnabled || styleObj.shadowEnabled;
    if (hasShadow) {
      ctx.shadowColor = el.shadowColor || styleObj.shadowColor || 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = Number(el.shadowBlur ?? styleObj.shadowBlur ?? 8);
      ctx.shadowOffsetX = Number(el.shadowOffsetX ?? styleObj.shadowOffsetX ?? 0);
      ctx.shadowOffsetY = Number(el.shadowOffsetY ?? styleObj.shadowOffsetY ?? 4);
    }

    // 4. Rotation and Flip around element center
    const rotation = Number(el.rotation || styleObj.rotation || 0);
    const flipX = Boolean(el.flipX || styleObj.flipX);
    const flipY = Boolean(el.flipY || styleObj.flipY);
    const cx = x + width / 2;
    const cy = y + height / 2;

    if (rotation !== 0 || flipX || flipY) {
      ctx.translate(cx, cy);
      if (rotation !== 0) {
        ctx.rotate((rotation * Math.PI) / 180);
      }
      if (flipX || flipY) {
        ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
      }
      ctx.translate(-cx, -cy);
    }

    switch (el.elementType) {
      case 'LOGO': {
        const logoUrlToUse = styleObj.logoUrl || options.logoUrl || '/logos/official/jito-ahmedabad.png';
        const specificLogo = await loadImage(logoUrlToUse);
        const lImg = specificLogo || logoImg;
        if (lImg && lImg.width > 0 && lImg.height > 0) {
          const aspect = lImg.width / lImg.height;
          let tw = width;
          let th = width / aspect;
          if (th > height) {
            th = height;
            tw = height * aspect;
          }
          const lx = x + (width - tw) / 2;
          const ly = y + (height - th) / 2;
          ctx.drawImage(lImg, lx, ly, tw, th);
        }
        break;
      }

      case 'MEMBER_PHOTO': {
        const rawShape = (el.shape || styleObj.shape || (el as any).frameShape || styleObj.frameShape || 'circle').toLowerCase().trim();
        const isFrameless = rawShape === 'none' || rawShape === 'without-frame' || styleObj.hasFrame === false;
        const shape = isFrameless ? 'none' : rawShape;
        const hasExplicitFrame = !isFrameless;
        const strokeColor = el.borderColor || styleObj.borderColor || '#D97706';
        const strokeWidth = hasExplicitFrame
          ? (el.borderWidth !== undefined ? Number(el.borderWidth) : styleObj.borderWidth !== undefined ? Number(styleObj.borderWidth) : 4)
          : (el.borderWidth !== undefined && Number(el.borderWidth) > 0 ? Number(el.borderWidth) : 0);
        const radius = hasExplicitFrame ? Number(el.borderRadius ?? styleObj.borderRadius ?? (shape === 'squircle' ? 24 : 0)) : 0;
        const borderStyle = styleObj.borderStyle || 'solid';
        const shadowBlur = hasExplicitFrame ? (styleObj.shadowBlur ? Number(styleObj.shadowBlur) : undefined) : undefined;
        const shadowColor = styleObj.shadowColor;
        const fit = styleObj.objectFit || 'cover';

        drawFramedPhoto(ctx, photoImg, data.memberName || 'Member', x, y, width, height, {
          shape,
          borderRadius: radius,
          borderStroke: strokeColor,
          borderWidth: strokeWidth,
          borderStyle,
          shadowBlur,
          shadowColor,
          hasFrame: hasExplicitFrame,
          objectFit: fit,
          blendMode: blend,
        });
        break;
      }

      case 'IMAGE':
      case 'COMPANY_LOGO': {
        const imgUrl = styleObj.imageUrl || data.companyLogoUrl;
        if (imgUrl) {
          const loaded = await loadImage(imgUrl);
          if (loaded) {
            const shape = styleObj.shape || (Number(el.borderRadius || styleObj.borderRadius || 0) > 0 ? 'squircle' : 'none');
            const radius = Number(el.borderRadius ?? styleObj.borderRadius ?? 0);
            const strokeColor = el.borderColor || styleObj.borderColor || '#D97706';
            const strokeWidth = Number(el.borderWidth ?? styleObj.borderWidth ?? 0);
            const fit = styleObj.objectFit || 'cover';
            const borderStyle = styleObj.borderStyle || 'solid';
            const shadowBlur = styleObj.shadowBlur ? Number(styleObj.shadowBlur) : undefined;
            const shadowColor = styleObj.shadowColor;

            drawFramedPhoto(ctx, loaded, el.name || 'Image', x, y, width, height, {
              shape,
              borderRadius: radius,
              borderStroke: strokeColor,
              borderWidth: strokeWidth,
              borderStyle,
              shadowBlur,
              shadowColor,
              hasFrame: styleObj.hasFrame !== false && shape !== 'none',
              objectFit: fit,
              blendMode: blend,
            });
          }
        }
        break;
      }

      case 'SHAPE': {
        const shapeType = styleObj.shapeType || 'rectangle'; // rectangle | circle | line
        const fillColor = el.backgroundColor || styleObj.fillColor || '#3B82F6';
        const strokeColor = el.borderColor || styleObj.borderColor || 'transparent';
        const strokeWidth = Number(el.borderWidth ?? styleObj.borderWidth ?? 0);
        const radius = Number(el.borderRadius ?? styleObj.borderRadius ?? 0);

        if (shapeType === 'circle') {
          const radiusC = Math.min(width, height) / 2;
          ctx.beginPath();
          ctx.arc(x + width / 2, y + height / 2, radiusC, 0, Math.PI * 2);
          if (fillColor && fillColor !== 'transparent') {
            ctx.fillStyle = fillColor;
            ctx.fill();
          }
          if (strokeWidth > 0 && strokeColor && strokeColor !== 'transparent') {
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = strokeWidth;
            ctx.stroke();
          }
        } else if (shapeType === 'line') {
          ctx.beginPath();
          ctx.moveTo(x, y + height / 2);
          ctx.lineTo(x + width, y + height / 2);
          ctx.strokeStyle = fillColor || strokeColor || '#000000';
          ctx.lineWidth = Math.max(1, strokeWidth || height);
          ctx.stroke();
        } else {
          drawRoundedRect(ctx, x, y, width, height, radius, fillColor, strokeColor, strokeWidth);
        }
        break;
      }

      case 'FIXED_TEXT': {
        const text = el.defaultValue || el.name || '';
        const customSize = data?.fieldFontSizes?.[el.id] || data?.fieldFontSizes?.[el.fieldKey] || data?.fieldFontSizes?.[el.name];
        const effectiveEl = customSize ? { ...el, fontSize: Number(customSize) } : el;
        drawElementText(ctx, text, effectiveEl, x, y, width, height);
        break;
      }

      case 'DYNAMIC_FIELD': {
        const k = el.fieldKey;
        let resolvedVal: any = undefined;
        if (k) {
          if (data[k] !== undefined && data[k] !== null) {
            resolvedVal = data[k];
          } else if (data.customFields && data.customFields[k] !== undefined && data.customFields[k] !== null) {
            resolvedVal = data.customFields[k];
          } else {
            const camelKey = k.replace(/_([a-z0-9])/g, (_: string, l: string) => l.toUpperCase());
            const snakeKey = k.replace(/[A-Z]/g, (l: string) => `_${l.toLowerCase()}`);
            if (data[camelKey] !== undefined && data[camelKey] !== null) {
              resolvedVal = data[camelKey];
            } else if (data[snakeKey] !== undefined && data[snakeKey] !== null) {
              resolvedVal = data[snakeKey];
            } else if (data.customFields && data.customFields[camelKey] !== undefined && data.customFields[camelKey] !== null) {
              resolvedVal = data.customFields[camelKey];
            } else if (data.customFields && data.customFields[snakeKey] !== undefined && data.customFields[snakeKey] !== null) {
              resolvedVal = data.customFields[snakeKey];
            }
          }
        }
        const val = resolvedVal !== undefined ? String(resolvedVal) : (el.defaultValue || el.name || '');

        // Support custom field font size from member form controls (fieldFontSizes)
        const customSize = data?.fieldFontSizes?.[k] || data?.fontSizes?.[k];
        const effectiveEl = customSize ? { ...el, fontSize: Number(customSize) } : el;
        drawElementText(ctx, val, effectiveEl, x, y, width, height);
        break;
      }

      case 'SOCIAL_ICONS': {
        drawSocialMediaIcons(ctx, el, x, y, width, height);
        break;
      }
    }

    ctx.restore();
  }

  // 3. Optional Shared Footer Render
  if (options.sharedFixedContent?.config) {
    const fConfig = options.sharedFixedContent.config;
    // If template has shared footer enabled in style
    if (options.stylingConfig?.headerBanner !== false && false) {
      // reserved for explicit full footer overlay if requested
    }
  }
}

function drawElementText(
  ctx: CanvasRenderingContext2D,
  text: string,
  el: any,
  x: number,
  y: number,
  width: number,
  height: number
) {
  if (!text) return;

  ctx.save();
  let styleObj: any = {};
  if (typeof el.styleConfig === 'string') {
    try { styleObj = JSON.parse(el.styleConfig); } catch {}
  } else if (typeof el.styleConfig === 'object' && el.styleConfig !== null) {
    styleObj = el.styleConfig;
  }

  // Text Transform
  const textTransform = el.textTransform || styleObj.textTransform || 'none';
  let processedText = text;
  if (textTransform === 'uppercase') {
    processedText = text.toUpperCase();
  } else if (textTransform === 'lowercase') {
    processedText = text.toLowerCase();
  } else if (textTransform === 'capitalize') {
    processedText = text.replace(/\b\w/g, (c: string) => c.toUpperCase());
  }

  const fontSize = Number(el.fontSize) || 24;
  const fontFamily = el.fontFamily || 'Inter';
  const fontWeight = el.fontWeight || 'normal';
  const fontStyle = el.fontStyle || styleObj.fontStyle || 'normal';
  const textColor = el.textColor || '#000000';
  const textAlign = (el.textAlign || 'left') as CanvasTextAlign;
  const lineSpacing = Number(el.lineSpacing) || 1.2;
  const maxLines = Number(el.maxLines) || 2;
  const letterSpacing = el.letterSpacing !== undefined ? Number(el.letterSpacing) : (styleObj.letterSpacing !== undefined ? Number(styleObj.letterSpacing) : 0);

  // Background Box / Highlight if set
  const bgColor = el.backgroundColor || styleObj.backgroundColor;
  if (bgColor && bgColor !== 'transparent') {
    const bgRadius = Number(el.borderRadius ?? styleObj.borderRadius ?? 8);
    drawRoundedRect(ctx, x, y, width, height, bgRadius, bgColor);
  }

  // Set font
  ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}, sans-serif`;
  if ('letterSpacing' in ctx && typeof (ctx as any).letterSpacing === 'string' && letterSpacing !== 0) {
    try { (ctx as any).letterSpacing = `${letterSpacing}px`; } catch {}
  }

  ctx.fillStyle = textColor;
  ctx.textAlign = textAlign;
  ctx.textBaseline = 'top';

  let anchorX = x;
  if (textAlign === 'center') anchorX = x + width / 2;
  else if (textAlign === 'right') anchorX = x + width;

  const lines = wrapText(ctx, processedText, width, maxLines);
  const lineHeight = fontSize * lineSpacing;

  // Text Outline / Stroke
  const outlineWidth = Number(el.borderWidth ?? styleObj.outlineWidth ?? 0);
  const outlineColor = el.borderColor || styleObj.outlineColor;

  lines.forEach((line, idx) => {
    const lineY = y + idx * lineHeight;
    if (outlineWidth > 0 && outlineColor) {
      ctx.strokeStyle = outlineColor;
      ctx.lineWidth = outlineWidth;
      ctx.strokeText(line, anchorX, lineY);
    }
    ctx.fillText(line, anchorX, lineY);
  });

  ctx.restore();
}

/**
 * Draw official social media icon set on canvas (Instagram, Facebook, YouTube, LinkedIn, WhatsApp, X)
 */
function drawSocialMediaIcons(
  ctx: CanvasRenderingContext2D,
  el: any,
  x: number,
  y: number,
  width: number,
  height: number
) {
  let cfg: any = {};
  try {
    cfg = typeof el.styleConfig === 'string' ? JSON.parse(el.styleConfig) : el.styleConfig || {};
  } catch {}

  const icons: string[] = Array.isArray(cfg.icons) && cfg.icons.length > 0
    ? cfg.icons
    : ['instagram', 'facebook', 'linkedin', 'youtube', 'whatsapp', 'x'];

  const iconSize = Number(cfg.iconSize) || 28;
  const spacing = Number(cfg.spacing) || 12;
  const isVertical = cfg.layout === 'vertical';
  const colorMode = cfg.colorMode || 'brand'; // 'brand' | 'custom'
  const customColor = cfg.iconColor || el.textColor || '#1E293B';
  const username = cfg.username || el.defaultValue || '';

  ctx.save();
  let curX = x;
  let curY = y;

  for (const iconName of icons) {
    drawSingleSocialIcon(ctx, iconName.toLowerCase(), curX, curY, iconSize, colorMode, customColor);
    if (isVertical) {
      curY += iconSize + spacing;
    } else {
      curX += iconSize + spacing;
    }
  }

  // If username / handle provided, render next to icons
  if (username) {
    const handleColor = colorMode === 'brand' ? (el.textColor || '#1E293B') : customColor;
    ctx.font = `bold ${Math.max(12, Math.floor(iconSize * 0.62))}px Inter, sans-serif`;
    ctx.fillStyle = handleColor;
    ctx.textBaseline = 'middle';
    if (isVertical) {
      ctx.textAlign = 'center';
      ctx.fillText(username, x + iconSize / 2, curY + 12);
    } else {
      ctx.textAlign = 'left';
      ctx.fillText(username, curX + 6, y + iconSize / 2);
    }
  }

  ctx.restore();
}

function drawSingleSocialIcon(
  ctx: CanvasRenderingContext2D,
  type: string,
  x: number,
  y: number,
  size: number,
  colorMode: 'brand' | 'custom',
  customColor: string
) {
  ctx.save();
  const radius = size * 0.24;

  // Determine background fill color
  let bgFill = customColor;
  let glyphColor = '#FFFFFF';

  if (colorMode === 'brand') {
    switch (type) {
      case 'instagram': bgFill = '#E1306C'; break;
      case 'facebook': bgFill = '#1877F2'; break;
      case 'youtube': bgFill = '#FF0000'; break;
      case 'linkedin': bgFill = '#0A66C2'; break;
      case 'whatsapp': bgFill = '#25D366'; break;
      case 'x': bgFill = '#000000'; break;
      default: bgFill = '#475569';
    }
  } else {
    // If custom color is almost white, ensure a border so it's visible on white cards
    if (customColor.toLowerCase() === '#ffffff' || customColor.toLowerCase() === '#fff') {
      glyphColor = '#1E293B';
    }
  }

  // 1. Draw rounded background tile
  drawRoundedRect(
    ctx,
    x,
    y,
    size,
    size,
    radius,
    bgFill,
    customColor === '#FFFFFF' ? '#CBD5E1' : undefined,
    1
  );

  // 2. Draw official vector glyphs
  const cx = x + size / 2;
  const cy = y + size / 2;

  if (type === 'instagram') {
    // Camera rounded outline
    const camSize = size * 0.55;
    const camRadius = camSize * 0.28;
    ctx.strokeStyle = glyphColor;
    ctx.lineWidth = Math.max(1.8, size * 0.08);
    drawRoundedRect(ctx, cx - camSize / 2, cy - camSize / 2, camSize, camSize, camRadius, undefined, glyphColor, ctx.lineWidth);
    // Center lens circle
    ctx.beginPath();
    ctx.arc(cx, cy, camSize * 0.25, 0, Math.PI * 2);
    ctx.stroke();
    // Flash dot
    ctx.fillStyle = glyphColor;
    ctx.beginPath();
    ctx.arc(cx + camSize * 0.26, cy - camSize * 0.26, Math.max(1.5, size * 0.045), 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'facebook') {
    ctx.fillStyle = glyphColor;
    ctx.font = `bold ${Math.floor(size * 0.72)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('f', cx + size * 0.04, cy + size * 0.04);
  } else if (type === 'youtube') {
    // Solid white triangle play arrow
    ctx.fillStyle = glyphColor;
    ctx.beginPath();
    const r = size * 0.20;
    ctx.moveTo(cx - r * 0.7, cy - r);
    ctx.lineTo(cx + r * 1.1, cy);
    ctx.lineTo(cx - r * 0.7, cy + r);
    ctx.closePath();
    ctx.fill();
  } else if (type === 'linkedin') {
    ctx.fillStyle = glyphColor;
    ctx.font = `bold ${Math.floor(size * 0.52)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('in', cx, cy - 1);
  } else if (type === 'whatsapp') {
    // Official vector phone handset (Canvas Bezier Path - NOT an emoji)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.35);
    ctx.fillStyle = glyphColor;
    ctx.strokeStyle = glyphColor;
    ctx.lineWidth = Math.max(2, size * 0.12);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const hs = size * 0.28;
    ctx.beginPath();
    // Curved handset backbone
    ctx.arc(0, 0, hs, 0.4, Math.PI - 0.4, false);
    ctx.stroke();

    // Earpiece & Mouthpiece pads
    ctx.beginPath();
    ctx.arc(-hs * 0.85, hs * 0.25, Math.max(2, size * 0.08), 0, Math.PI * 2);
    ctx.arc(hs * 0.85, hs * 0.25, Math.max(2, size * 0.08), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (type === 'x') {
    ctx.fillStyle = glyphColor;
    ctx.font = `900 ${Math.floor(size * 0.58)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('𝕏', cx, cy);
  }

  ctx.restore();
}

/* =========================================================================
   1. MEETING ANNOUNCEMENT RENDERER (50 Variations)
   ========================================================================= */
function renderMeeting(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  slug: string,
  style: string,
  variant: string,
  config: RenderCreativeOptions['stylingConfig'],
  data: RenderCreativeOptions['data'],
  logoImg: HTMLImageElement | null,
  logoPos: TemplateDefinitionLogoPosition,
  logoMaxW: number,
  logoMaxH: number
) {
  const bg = config?.backgroundColor || '#FFFFFF';
  const primary = config?.primaryColor || '#0F172A';
  const accent = config?.accentColor || '#D97706';
  const cardBg = config?.cardBg || '#F8FAFC';
  const border = config?.borderAccent || '#E2E8F0';
  const textC = config?.textColor || '#0F172A';
  const badgeBg = config?.badgeBg || '#F1F5F9';
  const isDark = bg === '#0A0A0A' || bg === '#090D16' || style === 'luxury-black-gold' || style === 'elegant-dark';

  // 1. Background
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Subtle geometric background motifs based on style
  if (style === 'luxury-black-gold') {
    ctx.strokeStyle = '#B45309';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(28, 28, w - 56, h - 56);
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 3;
    ctx.strokeRect(36, 36, w - 72, h - 72);
  } else if (style === 'navy-white') {
    ctx.fillStyle = primary;
    ctx.fillRect(0, 0, w, 22);
    ctx.strokeStyle = border;
    ctx.lineWidth = 2;
    ctx.strokeRect(32, 38, w - 64, h - 70);
  } else if (style === 'swiss-grid') {
    ctx.strokeStyle = '#E4E4E7';
    ctx.lineWidth = 1;
    ctx.strokeRect(40, 40, w - 80, h - 80);
    // Grid horizontal line
    ctx.beginPath();
    ctx.moveTo(40, 160);
    ctx.lineTo(w - 40, 160);
    ctx.stroke();
  } else {
    ctx.strokeStyle = border;
    ctx.lineWidth = 2;
    ctx.strokeRect(36, 36, w - 72, h - 72);
  }

  // 2. Draw Brand Logo
  drawBrandLogo(ctx, logoImg, logoPos, w, h, logoMaxW, logoMaxH, 44);

  // 3. Chapter Title & Meeting Header
  const group = data.referralGroupName || 'Apex Referral Chapter';
  const isLogoTopCenter = logoPos === 'top-center';
  const topY = isLogoTopCenter ? 120 : 68;

  // Chapter pill badge
  const pillW = 340;
  drawRoundedRect(ctx, w / 2 - pillW / 2, topY, pillW, 36, 18, badgeBg, border, 1);
  ctx.fillStyle = accent;
  ctx.font = 'bold 14px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('• WEEKLY REFERRAL MEETING •', w / 2, topY + 18);

  // Group Name Headline
  ctx.fillStyle = isDark ? '#FFFFFF' : primary;
  ctx.font = '900 42px Inter, sans-serif';
  ctx.fillText(group.toUpperCase(), w / 2, topY + 68);

  ctx.fillStyle = isDark ? '#94A3B8' : '#64748B';
  ctx.font = '500 18px Inter, sans-serif';
  ctx.fillText('Strategic Business Networking & Word-of-Mouth Referral Forum', w / 2, topY + 104);

  // 4. Layout Architecture Branches
  const cardW = w - 160;
  const cardX = 80;

  if (variant.includes('split')) {
    // Two column split layout
    const splitY = topY + 140;
    const splitH = h - splitY - 100;
    const colW = (cardW - 30) / 2;

    // Left Column: Stimulant & Details
    drawRoundedRect(ctx, cardX, splitY, colW, splitH, 16, cardBg, border, 1.5);
    drawRoundedRect(ctx, cardX + 24, splitY + 24, 180, 32, 16, accent);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MEETING STIMULANT', cardX + 114, splitY + 40);

    ctx.fillStyle = textC;
    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.textAlign = 'left';
    const stimLines = wrapText(ctx, data.meetingStimulant || 'Expanding High-Yield Cross-Chapter Business Channels', colW - 48, 4);
    stimLines.forEach((sl, idx) => ctx.fillText(sl, cardX + 24, splitY + 84 + idx * 30));

    // Right Column: Date, Time, Venue, Fees
    const rx = cardX + colW + 30;
    drawRoundedRect(ctx, rx, splitY, colW, splitH, 16, cardBg, border, 1.5);
    renderMeetingFieldsBlock(ctx, rx + 24, splitY + 30, colW - 48, data, accent, textC, isDark);
  } else {
    // Classic card stack layout
    const stimY = topY + 135;
    drawRoundedRect(ctx, cardX, stimY, cardW, 160, 16, cardBg, border, 1.5);
    drawRoundedRect(ctx, cardX + 24, stimY + 20, 190, 32, 16, accent);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MEETING STIMULANT', cardX + 119, stimY + 36);

    ctx.fillStyle = textC;
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.textAlign = 'left';
    const sLines = wrapText(ctx, data.meetingStimulant || 'Unlocking Cross-Chapter Enterprise Referral Partnerships', cardW - 50, 2);
    sLines.forEach((sl, idx) => ctx.fillText(sl, cardX + 24, stimY + 74 + idx * 32));

    // Middle Row: Date & Time
    const midY = stimY + 185;
    const halfCol = (cardW - 30) / 2;

    const dateFontSize = Number(data?.fieldFontSizes?.date) || 20;
    drawRoundedRect(ctx, cardX, midY, halfCol, 130, 14, cardBg, border, 1);
    ctx.fillStyle = accent;
    ctx.font = 'bold 15px Inter, sans-serif';
    ctx.fillText('🗓️  MEETING DATE', cardX + 24, midY + 30);
    ctx.fillStyle = textC;
    ctx.font = `bold ${dateFontSize}px Inter, sans-serif`;
    const dLines = wrapText(ctx, data.date || 'Wednesday, 16th October 2026', halfCol - 48, 2);
    dLines.forEach((dl, idx) => ctx.fillText(dl, cardX + 24, midY + 68 + idx * (dateFontSize * 1.25)));

    const timeFontSize = Number(data?.fieldFontSizes?.time) || 20;
    drawRoundedRect(ctx, cardX + halfCol + 30, midY, halfCol, 130, 14, cardBg, border, 1);
    ctx.fillStyle = accent;
    ctx.font = 'bold 15px Inter, sans-serif';
    ctx.fillText('⏰  TIME & AGENDA', cardX + halfCol + 54, midY + 30);
    ctx.fillStyle = textC;
    ctx.font = `bold ${timeFontSize}px Inter, sans-serif`;
    const tLines = wrapText(ctx, data.time || '07:00 AM - 09:30 AM', halfCol - 48, 2);
    tLines.forEach((tl, idx) => ctx.fillText(tl, cardX + halfCol + 54, midY + 68 + idx * (timeFontSize * 1.25)));

    // Venue Box
    const venueFontSize = Number(data?.fieldFontSizes?.venue) || 20;
    const venueY = midY + 155;
    drawRoundedRect(ctx, cardX, venueY, cardW, 130, 14, cardBg, border, 1);
    ctx.fillStyle = accent;
    ctx.font = 'bold 15px Inter, sans-serif';
    ctx.fillText('📍  MEETING VENUE', cardX + 24, venueY + 30);
    ctx.fillStyle = textC;
    ctx.font = `bold ${venueFontSize}px Inter, sans-serif`;
    const vLines = wrapText(ctx, data.venue || 'Grand Ballroom, The Oberoi, Marine Drive', cardW - 48, 2);
    vLines.forEach((vl, idx) => ctx.fillText(vl, cardX + 24, venueY + 66 + idx * (venueFontSize * 1.25)));

    // Footer Row: Dress Code & Visitor Fees
    const footY = venueY + 155;
    drawRoundedRect(ctx, cardX, footY, halfCol, 85, 12, isDark ? '#111827' : '#F1F5F9', border, 1);
    ctx.fillStyle = isDark ? '#94A3B8' : '#64748B';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText('DRESS CODE', cardX + 20, footY + 24);
    ctx.fillStyle = textC;
    ctx.font = 'bold 17px Inter, sans-serif';
    ctx.fillText(data.dressCode || 'Business Formals', cardX + 20, footY + 54);

    drawRoundedRect(ctx, cardX + halfCol + 30, footY, halfCol, 85, 12, isDark ? '#111827' : '#F1F5F9', border, 1);
    ctx.fillStyle = isDark ? '#94A3B8' : '#64748B';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText('VISITOR FEES', cardX + halfCol + 50, footY + 24);
    ctx.fillStyle = accent;
    ctx.font = 'bold 17px Inter, sans-serif';
    ctx.fillText(data.visitorFees || '₹1,200 (Buffet Included)', cardX + halfCol + 50, footY + 54);
  }

  // Bottom Tagline
  ctx.fillStyle = isDark ? '#64748B' : '#94A3B8';
  ctx.font = '14px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Accelerate Your Business With Structured Referral Partnerships', w / 2, h - 34);
}

function renderMeetingFieldsBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  maxW: number,
  data: RenderCreativeOptions['data'],
  accent: string,
  textC: string,
  isDark: boolean
) {
  let currY = y;
  // Date
  const dateFontSize = Number(data?.fieldFontSizes?.date) || 18;
  ctx.fillStyle = accent;
  ctx.font = 'bold 14px Inter, sans-serif';
  ctx.fillText('🗓️  DATE', x, currY);
  ctx.fillStyle = textC;
  ctx.font = `bold ${dateFontSize}px Inter, sans-serif`;
  const dLines = wrapText(ctx, data.date || 'Wednesday, 16th October 2026', maxW, 2);
  dLines.forEach((dl, idx) => ctx.fillText(dl, x, currY + 26 + idx * (dateFontSize * 1.25)));
  currY += 66;

  // Time
  const timeFontSize = Number(data?.fieldFontSizes?.time) || 18;
  ctx.fillStyle = accent;
  ctx.font = 'bold 14px Inter, sans-serif';
  ctx.fillText('⏰  TIME', x, currY);
  ctx.fillStyle = textC;
  ctx.font = `bold ${timeFontSize}px Inter, sans-serif`;
  const tLines = wrapText(ctx, data.time || '07:00 AM - 09:30 AM', maxW, 2);
  tLines.forEach((tl, idx) => ctx.fillText(tl, x, currY + 26 + idx * (timeFontSize * 1.25)));
  currY += 66;

  // Venue
  const venueFontSize = Number(data?.fieldFontSizes?.venue) || 17;
  ctx.fillStyle = accent;
  ctx.font = 'bold 14px Inter, sans-serif';
  ctx.fillText('📍  VENUE', x, currY);
  ctx.fillStyle = textC;
  ctx.font = `bold ${venueFontSize}px Inter, sans-serif`;
  const vLines = wrapText(ctx, data.venue || 'Grand Ballroom, The Oberoi', maxW, 2);
  vLines.forEach((vl, idx) => ctx.fillText(vl, x, currY + 26 + idx * (venueFontSize * 1.25)));
  currY += 76;

  // Dress & Fees
  ctx.fillStyle = isDark ? '#94A3B8' : '#64748B';
  ctx.font = '13px Inter, sans-serif';
  ctx.fillText(`👔 Dress Code: ${data.dressCode || 'Business Formals'}`, x, currY);
  ctx.fillStyle = accent;
  ctx.font = 'bold 14px Inter, sans-serif';
  ctx.fillText(`🎟️ Visitor Fees: ${data.visitorFees || '₹1,200'}`, x, currY + 28);
}

/* =========================================================================
   2. BUSINESS PRESENTATION RENDERER (50 Variations)
   ========================================================================= */
function renderPresentation(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  slug: string,
  style: string,
  variant: string,
  config: RenderCreativeOptions['stylingConfig'],
  data: RenderCreativeOptions['data'],
  photoImg: HTMLImageElement | null,
  logoImg: HTMLImageElement | null,
  logoPos: TemplateDefinitionLogoPosition,
  logoMaxW: number,
  logoMaxH: number
) {
  const bg = config?.backgroundColor || '#FFFFFF';
  const primary = config?.primaryColor || '#0F172A';
  const accent = config?.accentColor || '#2563EB';
  const cardBg = config?.cardBg || '#F8FAFC';
  const border = config?.borderAccent || '#E2E8F0';
  const textC = config?.textColor || '#0F172A';
  const badgeBg = config?.badgeBg || '#F1F5F9';
  const isDark = bg === '#0A0A0A' || bg === '#090D16' || style === 'luxury-black-gold' || style === 'elegant-dark';

  // 1. Background
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = border;
  ctx.lineWidth = 3;
  ctx.strokeRect(36, 36, w - 72, h - 72);

  // 2. Draw Brand Logo
  drawBrandLogo(ctx, logoImg, logoPos, w, h, logoMaxW, logoMaxH, 44);

  // 3. Header Banner
  const group = data.referralGroupName || 'Apex Referral Chapter';
  const bannerY = logoPos.startsWith('top') && logoPos.includes('center') ? 115 : 68;

  ctx.fillStyle = accent;
  ctx.font = 'bold 15px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${group.toUpperCase()} • KEYNOTE PRESENTATION`, w / 2, bannerY);

  ctx.fillStyle = isDark ? '#FFFFFF' : primary;
  ctx.font = '900 38px Inter, sans-serif';
  ctx.fillText('FEATURE SPEAKER OF THE WEEK', w / 2, bannerY + 44);

  // 4. Member Profile Section (Photo + Credentials)
  const profileY = bannerY + 76;
  const photoSize = 210;
  const photoX = 85;

  drawPhoto(ctx, photoImg, data.memberName || 'Member', photoX, profileY, photoSize, accent, 6);

  // Credentials Block (Right of Photo)
  const credX = photoX + photoSize + 36;
  ctx.textAlign = 'left';

  // Name
  ctx.fillStyle = isDark ? '#FFFFFF' : primary;
  ctx.font = 'bold 34px Inter, sans-serif';
  ctx.fillText(data.memberName || 'Vikram Patel', credX, profileY + 38);

  // Company Name
  ctx.fillStyle = accent;
  ctx.font = 'bold 22px Inter, sans-serif';
  const compLines = wrapText(ctx, data.companyName || 'Apex Architectural Solutions', w - credX - 80, 2);
  compLines.forEach((cl, idx) => ctx.fillText(cl, credX, profileY + 70 + idx * 26));

  // Business Category Badge
  const catY = profileY + 75 + compLines.length * 26;
  const cat = data.businessCategory || 'Commercial Architecture';
  const badgeMetrics = ctx.measureText(cat);
  const badgeW = Math.min(badgeMetrics.width + 36, w - credX - 80);
  drawRoundedRect(ctx, credX, catY, badgeW, 32, 16, badgeBg, border, 1);
  ctx.fillStyle = isDark ? '#CBD5E1' : '#334155';
  ctx.font = 'bold 14px Inter, sans-serif';
  ctx.fillText(cat, credX + 16, catY + 21);

  // Contact Info under badge
  const contactY = catY + 48;
  ctx.fillStyle = isDark ? '#94A3B8' : '#64748B';
  ctx.font = '14px Inter, sans-serif';
  ctx.fillText(`📞  ${data.phone || '+91 97123 55667'}`, credX, contactY);
  ctx.fillText(`✉️  ${data.email || 'contact@example.com'}`, credX, contactY + 22);

  // 5. Highlighted Specific Ask Box (The Core Focal Element)
  const cardW = w - 160;
  const cardX = 80;
  const askY = profileY + photoSize + 36;

  drawRoundedRect(ctx, cardX, askY, cardW, 205, 16, cardBg, border, 2);

  // Specific Ask Pill
  drawRoundedRect(ctx, cardX + 24, askY + 18, 190, 32, 16, accent);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 14px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🎯  SPECIFIC ASK', cardX + 119, askY + 34);

  // Specific Ask Quote
  const ask = data.specificAsk || 'Looking for warm introductions to Commercial Real Estate Developers and Corporate Office Fit-out Heads in BKC.';
  ctx.fillStyle = textC;
  ctx.font = 'italic bold 21px Inter, sans-serif';
  ctx.textAlign = 'left';
  const askLines = wrapText(ctx, `"${ask}"`, cardW - 50, 3);
  askLines.forEach((al, idx) => ctx.fillText(al, cardX + 24, askY + 80 + idx * 32));

  // 6. Presentation Schedule & Venue Card
  const schedY = askY + 225;
  drawRoundedRect(ctx, cardX, schedY, cardW, 140, 14, isDark ? '#111827' : '#FFFFFF', border, 1.5);

  const half = (cardW - 40) / 2;
  // Left: Date & Time
  ctx.fillStyle = accent;
  ctx.font = 'bold 15px Inter, sans-serif';
  ctx.fillText('🗓️  PRESENTATION SCHEDULE', cardX + 24, schedY + 32);
  ctx.fillStyle = textC;
  ctx.font = 'bold 19px Inter, sans-serif';
  ctx.fillText(data.date || 'Wednesday, 16th October 2026', cardX + 24, schedY + 66);
  ctx.fillStyle = isDark ? '#94A3B8' : '#64748B';
  ctx.font = '15px Inter, sans-serif';
  ctx.fillText(`⏰ ${data.time || '08:15 AM - 08:30 AM'}`, cardX + 24, schedY + 98);

  // Right: Venue
  ctx.fillStyle = accent;
  ctx.font = 'bold 15px Inter, sans-serif';
  ctx.fillText('📍  LOCATION & VENUE', cardX + half + 40, schedY + 32);
  ctx.fillStyle = textC;
  ctx.font = 'bold 18px Inter, sans-serif';
  const vLines = wrapText(ctx, data.venue || 'Grand Ballroom, The Oberoi', half - 20, 2);
  vLines.forEach((vl, idx) => ctx.fillText(vl, cardX + half + 40, schedY + 66 + idx * 28));

  // 7. Footer: Website & CTA
  const footY = schedY + 165;
  if (data.website) {
    ctx.fillStyle = accent;
    ctx.font = 'bold 17px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`🌐  ${data.website}`, w / 2, footY);
  }

  ctx.fillStyle = isDark ? '#64748B' : '#94A3B8';
  ctx.font = '14px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Connect as a Visitor & Explore Direct Business Referrals', w / 2, footY + 30);
}

/* =========================================================================
   3. KYM (KNOW YOUR MEMBER) RENDERER (50 Variations)
   ========================================================================= */
function renderKYM(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  slug: string,
  style: string,
  variant: string,
  config: RenderCreativeOptions['stylingConfig'],
  data: RenderCreativeOptions['data'],
  photoImg: HTMLImageElement | null,
  logoImg: HTMLImageElement | null,
  logoPos: TemplateDefinitionLogoPosition,
  logoMaxW: number,
  logoMaxH: number
) {
  const bg = config?.backgroundColor || '#FFFFFF';
  const primary = config?.primaryColor || '#0F172A';
  const accent = config?.accentColor || '#059669';
  const cardBg = config?.cardBg || '#F8FAFC';
  const border = config?.borderAccent || '#E2E8F0';
  const textC = config?.textColor || '#0F172A';
  const badgeBg = config?.badgeBg || '#F1F5F9';
  const isDark = bg === '#0A0A0A' || bg === '#090D16' || style === 'luxury-black-gold' || style === 'elegant-dark';

  // 1. Background
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 4;
  ctx.strokeRect(36, 36, w - 72, h - 72);

  // 2. Logo
  drawBrandLogo(ctx, logoImg, logoPos, w, h, logoMaxW, logoMaxH, 44);

  // 3. Header
  const group = data.referralGroupName || 'Apex Referral Chapter';
  const topY = logoPos.startsWith('top') && logoPos.includes('center') ? 115 : 68;

  ctx.fillStyle = isDark ? '#94A3B8' : '#64748B';
  ctx.font = 'bold 15px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${group.toUpperCase()} PRESENTS`, w / 2, topY);

  ctx.fillStyle = isDark ? '#FFFFFF' : primary;
  ctx.font = '900 42px Inter, sans-serif';
  ctx.fillText('KNOW YOUR MEMBER', w / 2, topY + 46);

  // Spotlight Pill
  drawRoundedRect(ctx, w / 2 - 130, topY + 76, 260, 32, 16, badgeBg, accent, 1);
  ctx.fillStyle = accent;
  ctx.font = 'bold 14px Inter, sans-serif';
  ctx.fillText('OFFICIAL MEMBER SHOWCASE', w / 2, topY + 92);

  // 4. Centerpiece Photo
  const photoSize = 270;
  const photoX = (w - photoSize) / 2;
  const photoY = topY + 130;
  drawPhoto(ctx, photoImg, data.memberName || 'Member', photoX, photoY, photoSize, accent, 8);

  // 5. Member Identification
  const infoY = photoY + photoSize + 40;
  ctx.fillStyle = isDark ? '#FFFFFF' : primary;
  ctx.font = 'bold 38px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(data.memberName || 'Dr. Sneha Desai', w / 2, infoY);

  ctx.fillStyle = accent;
  ctx.font = 'bold 24px Inter, sans-serif';
  ctx.fillText(data.companyName || 'Desai Multispeciality Dental', w / 2, infoY + 40);

  // Business Category Badge
  const cat = data.businessCategory || 'Cosmetic & Implant Dentistry';
  const catBadgeW = ctx.measureText(cat).width + 48;
  drawRoundedRect(ctx, w / 2 - catBadgeW / 2, infoY + 64, catBadgeW, 36, 18, badgeBg, border, 1);
  ctx.fillStyle = isDark ? '#CBD5E1' : '#334155';
  ctx.font = 'bold 15px Inter, sans-serif';
  ctx.fillText(cat, w / 2, infoY + 84);

  // 6. Bottom Information Card (3 columns: Phone, Date/Time, Venue)
  const cardW = w - 160;
  const cardX = 80;
  const cardY = infoY + 125;
  drawRoundedRect(ctx, cardX, cardY, cardW, 140, 16, cardBg, border, 1.5);

  const third = cardW / 3;

  // 1. Phone
  ctx.fillStyle = accent;
  ctx.font = 'bold 14px Inter, sans-serif';
  ctx.fillText('DIRECT CONTACT', cardX + third * 0.5, cardY + 34);
  ctx.fillStyle = textC;
  ctx.font = 'bold 18px Inter, sans-serif';
  ctx.fillText(data.phone || '+91 98765 44332', cardX + third * 0.5, cardY + 70);

  // Divider 1
  ctx.strokeStyle = border;
  ctx.beginPath();
  ctx.moveTo(cardX + third, cardY + 20);
  ctx.lineTo(cardX + third, cardY + 120);
  ctx.stroke();

  // 2. Schedule
  ctx.fillStyle = accent;
  ctx.font = 'bold 14px Inter, sans-serif';
  ctx.fillText('MEETING SCHEDULE', cardX + third * 1.5, cardY + 34);
  ctx.fillStyle = textC;
  ctx.font = 'bold 17px Inter, sans-serif';
  ctx.fillText(data.date || 'Wed, 16th Oct 2026', cardX + third * 1.5, cardY + 70);
  ctx.fillStyle = isDark ? '#94A3B8' : '#64748B';
  ctx.font = '14px Inter, sans-serif';
  ctx.fillText(data.time || '07:00 AM Onwards', cardX + third * 1.5, cardY + 98);

  // Divider 2
  ctx.beginPath();
  ctx.moveTo(cardX + third * 2, cardY + 20);
  ctx.lineTo(cardX + third * 2, cardY + 120);
  ctx.stroke();

  // 3. Venue
  ctx.fillStyle = accent;
  ctx.font = 'bold 14px Inter, sans-serif';
  ctx.fillText('VENUE', cardX + third * 2.5, cardY + 34);
  ctx.fillStyle = textC;
  ctx.font = 'bold 16px Inter, sans-serif';
  const vLines = wrapText(ctx, data.venue || 'The Oberoi, Marine Drive', third - 24, 2);
  vLines.forEach((vl, idx) => ctx.fillText(vl, cardX + third * 2.5, cardY + 68 + idx * 24));

  // Footer Tagline
  ctx.fillStyle = isDark ? '#64748B' : '#94A3B8';
  ctx.font = '14px Inter, sans-serif';
  ctx.fillText('Know Your Member • Connect & Unlock Strategic Synergies', w / 2, h - 34);
}

/* =========================================================================
   4. BIRTHDAY CREATIVE RENDERER (Single & Monthly Roster)
   ========================================================================= */
function renderBirthday(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  slug: string,
  style: string,
  variant: string,
  config: RenderCreativeOptions['stylingConfig'],
  data: RenderCreativeOptions['data'],
  photoImg: HTMLImageElement | null,
  logoImg: HTMLImageElement | null,
  logoPos: TemplateDefinitionLogoPosition,
  logoMaxW: number,
  logoMaxH: number
) {
  const bg = config?.backgroundColor || '#FFFBEB';
  const primary = config?.primaryColor || '#DC2626';
  const accent = config?.accentColor || '#F59E0B';
  const cardBg = config?.cardBg || '#FFFFFF';
  const border = config?.borderAccent || '#FDE68A';
  const textC = config?.textColor || '#1E293B';
  const badgeBg = config?.badgeBg || '#FEF3C7';
  const isDark = bg === '#0A0A0A' || bg === '#090D16' || style === 'luxury-black-gold' || style === 'elegant-dark';

  // 1. Background
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Festive sparkles / confetti
  drawFestiveSparkles(ctx, w, h, accent, primary);

  ctx.strokeStyle = accent;
  ctx.lineWidth = 4;
  ctx.strokeRect(36, 36, w - 72, h - 72);

  // 2. Draw Brand Logo
  drawBrandLogo(ctx, logoImg, logoPos, w, h, logoMaxW, logoMaxH, 44);

  // Check if this is a Monthly Multi-Member Birthday Directory
  const isMonthlyMode =
    variant.includes('monthly') ||
    slug.includes('monthly') ||
    (data.monthlyMembers && data.monthlyMembers.length > 1);

  if (isMonthlyMode && data.monthlyMembers && data.monthlyMembers.length > 0) {
    renderMonthlyBirthdayDirectory(ctx, w, h, data, accent, primary, textC, isDark, border);
    return;
  }

  // --- SINGLE MEMBER BIRTHDAY CREATIVE ---
  const group = data.referralGroupName || 'Apex Referral Chapter';
  const headerY = logoPos.startsWith('top') && logoPos.includes('center') ? 115 : 68;

  ctx.fillStyle = isDark ? '#CBD5E1' : '#475569';
  ctx.font = 'bold 16px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(group.toUpperCase(), w / 2, headerY);

  ctx.fillStyle = primary;
  ctx.font = '900 50px serif';
  ctx.fillText('★ HAPPY BIRTHDAY! ★', w / 2, headerY + 54);

  // Date Badge
  const bDay = data.birthDay || '15th';
  const bMonth = data.birthMonth || 'October';
  const dateBadgeText = `🎂  ${bDay.toUpperCase()} ${bMonth.toUpperCase()}`;
  const badgeW = ctx.measureText(dateBadgeText).width + 60;
  drawRoundedRect(ctx, w / 2 - badgeW / 2, headerY + 84, badgeW, 40, 20, badgeBg, accent, 2);
  ctx.fillStyle = isDark ? '#F59E0B' : '#92400E';
  ctx.font = 'bold 18px Inter, sans-serif';
  ctx.fillText(dateBadgeText, w / 2, headerY + 107);

  // Centerpiece Photo
  const photoSize = 280;
  const photoX = (w - photoSize) / 2;
  const photoY = headerY + 150;
  drawPhoto(ctx, photoImg, data.memberName || 'Celebrant', photoX, photoY, photoSize, accent, 8);

  // Name
  const nameY = photoY + photoSize + 40;
  ctx.fillStyle = isDark ? '#FFFFFF' : textC;
  ctx.font = 'bold 40px Inter, sans-serif';
  ctx.fillText(data.memberName || 'Amit Sharma', w / 2, nameY);

  if (data.phone) {
    ctx.fillStyle = isDark ? '#94A3B8' : '#64748B';
    ctx.font = 'bold 18px Inter, sans-serif';
    ctx.fillText(`📱  ${data.phone}`, w / 2, nameY + 38);
  }

  // Warm Wishes Card
  const wishCardY = nameY + 68;
  const cardW = w - 160;
  const cardX = 80;
  drawRoundedRect(ctx, cardX, wishCardY, cardW, 140, 16, cardBg, border, 1.5);

  const wish =
    data.birthdayWish ||
    'Wishing you a magnificent year filled with boundless success, good health and prosperity on your special day!';
  ctx.fillStyle = isDark ? '#F8FAFC' : '#1E293B';
  ctx.font = 'italic 20px serif';
  const wishLines = wrapText(ctx, `"${wish}"`, cardW - 60, 3);
  wishLines.forEach((wl, idx) => ctx.fillText(wl, w / 2, wishCardY + 40 + idx * 30));

  // Footer
  ctx.fillStyle = isDark ? '#64748B' : '#94A3B8';
  ctx.font = '14px Inter, sans-serif';
  ctx.fillText('May this upcoming year bring grand new milestones & prosperity!', w / 2, h - 34);
}

/**
 * Monthly Multi-Member Birthday Directory Layout
 */
function renderMonthlyBirthdayDirectory(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  data: RenderCreativeOptions['data'],
  accent: string,
  primary: string,
  textC: string,
  isDark: boolean,
  border: string
) {
  const group = data.referralGroupName || 'Apex Referral Chapter';
  const month = data.birthMonth || 'October';
  const members = data.monthlyMembers || [];

  const topY = 75;
  ctx.fillStyle = isDark ? '#CBD5E1' : '#475569';
  ctx.font = 'bold 16px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(group.toUpperCase(), w / 2, topY);

  ctx.fillStyle = primary;
  ctx.font = '900 44px serif';
  ctx.fillText(`★ ${month.toUpperCase()} BIRTHDAY DIRECTORY ★`, w / 2, topY + 48);

  ctx.fillStyle = isDark ? '#94A3B8' : '#64748B';
  ctx.font = '500 16px Inter, sans-serif';
  ctx.fillText(`Honoring Our Chapter Members Celebrating In ${month}`, w / 2, topY + 84);

  // Grid of Members
  const gridY = topY + 120;
  const maxDisplay = Math.min(members.length, 6);
  const cols = maxDisplay <= 2 ? 2 : 3;
  const rows = Math.ceil(maxDisplay / cols);

  const padX = 80;
  const availableW = w - padX * 2;
  const gap = 20;
  const colW = (availableW - (cols - 1) * gap) / cols;
  const rowH = (h - gridY - 100) / rows;

  for (let i = 0; i < maxDisplay; i++) {
    const m = members[i];
    const colIdx = i % cols;
    const rowIdx = Math.floor(i / cols);
    const cx = padX + colIdx * (colW + gap);
    const cy = gridY + rowIdx * rowH;

    drawRoundedRect(ctx, cx, cy, colW, rowH - 12, 14, isDark ? '#1E293B' : '#FFFFFF', border, 1.5);

    // Member Avatar
    const avatarSize = 80;
    const avX = cx + (colW - avatarSize) / 2;
    const avY = cy + 20;
    drawPhoto(ctx, null, m.name, avX, avY, avatarSize, accent, 4);

    // Name & Birthday Date
    ctx.fillStyle = isDark ? '#FFFFFF' : textC;
    ctx.font = 'bold 18px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(m.name, cx + colW / 2, avY + avatarSize + 30);

    ctx.fillStyle = accent;
    ctx.font = 'bold 15px Inter, sans-serif';
    ctx.fillText(`🎂 ${m.birthDay || 'Day'} ${month}`, cx + colW / 2, avY + avatarSize + 56);

    if (m.company) {
      ctx.fillStyle = isDark ? '#94A3B8' : '#64748B';
      ctx.font = '13px Inter, sans-serif';
      const cLines = wrapText(ctx, m.company, colW - 20, 1);
      if (cLines[0]) ctx.fillText(cLines[0], cx + colW / 2, avY + avatarSize + 80);
    }
  }

  ctx.fillStyle = isDark ? '#64748B' : '#94A3B8';
  ctx.font = '14px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Reach out to congratulate our ${month} celebrants & celebrate their business growth!`, w / 2, h - 34);
}

/**
 * Draw decorative celebration sparkles
 */
function drawFestiveSparkles(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  goldColor: string,
  accentColor: string
) {
  const points = [
    { x: 80, y: 90, s: 8, rot: 15, c: goldColor },
    { x: 140, y: 150, s: 12, rot: -25, c: accentColor },
    { x: w - 80, y: 100, s: 10, rot: 30, c: accentColor },
    { x: w - 140, y: 160, s: 7, rot: -15, c: goldColor },
    { x: 70, y: h - 140, s: 9, rot: 20, c: accentColor },
    { x: w - 70, y: h - 120, s: 10, rot: 40, c: goldColor },
  ];

  points.forEach((pt) => {
    ctx.save();
    ctx.translate(pt.x, pt.y);
    ctx.rotate((pt.rot * Math.PI) / 180);
    ctx.fillStyle = pt.c;
    ctx.fillRect(-pt.s / 2, -pt.s / 2, pt.s, pt.s * 1.6);
    ctx.restore();
  });
}
