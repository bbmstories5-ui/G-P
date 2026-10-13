import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export const runtime = 'nodejs';

function verifyImageSignature(buffer: Buffer): { isValid: boolean; mime: string; ext: string } {
  if (buffer.length < 12) {
    return { isValid: false, mime: '', ext: '' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { isValid: true, mime: 'image/png', ext: '.png' };
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { isValid: true, mime: 'image/jpeg', ext: '.jpg' };
  }

  // GIF: 47 49 46 38 (GIF87a / GIF88a)
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return { isValid: true, mime: 'image/gif', ext: '.gif' };
  }

  // WebP: RIFF .... WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { isValid: true, mime: 'image/webp', ext: '.webp' };
  }

  return { isValid: false, mime: '', ext: '' };
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(`${user.id}_${ip}`, {
      keyPrefix: 'upload',
      limit: 25,
      windowMs: 60 * 1000,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Upload rate limit exceeded. Please wait a moment before uploading again.' },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const rawType = (formData.get('type') as string) || 'avatar';
    const safeType = rawType === 'attachment' ? 'attachment' : 'avatar';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds maximum limit of 5MB' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Strict server-side file signature (magic byte) verification
    const sig = verifyImageSignature(buffer);
    if (!sig.isValid) {
      return NextResponse.json(
        { error: 'Invalid file format or corrupted image. Allowed formats: PNG, JPEG, WebP, GIF.' },
        { status: 400 }
      );
    }

    // Target upload folder in public
    const subDir = safeType === 'avatar' ? 'avatars' : 'attachments';
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', subDir);

    let publicUrl = '';

    try {
      await fs.mkdir(uploadDir, { recursive: true });

      // Generate cryptographically secure random filename with validated extension
      const safeFilename = `${safeType}_${user.id}_${crypto.randomUUID()}${sig.ext}`;
      const filePath = path.join(uploadDir, safeFilename);

      await fs.writeFile(filePath, buffer);
      publicUrl = `/uploads/${subDir}/${safeFilename}`;
    } catch (fsErr: any) {
      console.warn('Filesystem write failed or restricted (EACCES/EROFS), falling back to Data URI:', fsErr?.message);
      // Fallback for container read-only or ephemeral environments
      publicUrl = `data:${sig.mime};base64,${buffer.toString('base64')}`;
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process file upload' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const fileUrl = searchParams.get('url');

    if (!fileUrl) {
      return NextResponse.json({ error: 'File URL is required' }, { status: 400 });
    }

    // Only allow deleting within /uploads/
    if (fileUrl.startsWith('/uploads/')) {
      const sanitized = fileUrl.replace(/\.\./g, '');
      const filePath = path.join(process.cwd(), 'public', sanitized);
      await fs.unlink(filePath).catch(() => {});
    }

    return NextResponse.json({ success: true, message: 'File deleted successfully' });
  } catch (error: any) {
    console.error('File delete error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete file' }, { status: 500 });
  }
}

