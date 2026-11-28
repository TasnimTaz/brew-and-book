import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { requireAdmin } from '@/lib/admin-auth';

const MAX_BYTES = 5 * 1024 * 1024;
// Extension comes from the detected file content, never from the user-supplied file name. SVG is not allowed (script risk).
function detect(buf: Buffer): { ext: string } | null {
  if (buf.length > 12 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { ext: 'jpg' };
  if (buf.length > 12 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { ext: 'png' };
  if (buf.length > 12 && buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP') return { ext: 'webp' };
  if (buf.length > 12 && buf.subarray(0, 4).toString() === 'GIF8') return { ext: 'gif' };
  return null;
}

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return NextResponse.json({ error: 'File is required' }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: 'Image must be 5 MB or smaller' }, { status: 413 });

    const bytes = Buffer.from(await file.arrayBuffer());
    const kind = detect(bytes);
    if (!kind) return NextResponse.json({ error: 'Only JPG, PNG, WebP or GIF images are allowed' }, { status: 400 });

    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${kind.ext}`;
    const dir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, name), bytes);
    return NextResponse.json({ url: `/uploads/${name}` }, { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/upload failed', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
