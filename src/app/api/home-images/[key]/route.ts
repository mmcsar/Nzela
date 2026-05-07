import { NextResponse } from 'next/server';
import { readFile, access } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

const FALLBACK_MAP: Record<string, string> = {
  'value-ops': 'https://images.unsplash.com/photo-1587578769987-776c5bcd4c6e?w=900&q=80',
  'how-publish': 'https://images.unsplash.com/photo-1771923082503-0a3381c46cef?w=800&q=85',
  'how-track': 'https://images.unsplash.com/photo-1687422811062-a966b55cb217?w=800&q=80',
};

const PUBLIC_MAP: Record<string, string> = {
  'value-ops': 'value-ops.png',
  'how-publish': 'how-publish.png',
  'how-track': 'how-track.png',
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    const publicFilename = PUBLIC_MAP[key];
    const fallbackUrl = FALLBACK_MAP[key];

    if (!publicFilename || !fallbackUrl) {
      return NextResponse.json({ error: 'Image introuvable' }, { status: 404 });
    }

    const publicPath = path.join(process.cwd(), 'public', 'images', 'home', publicFilename);

    try {
      await access(publicPath);
    } catch {
      return NextResponse.redirect(fallbackUrl);
    }

    try {
      const data = await readFile(publicPath);
      return new NextResponse(data, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    } catch {
      return NextResponse.redirect(fallbackUrl);
    }
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lecture image' },
      { status: 500 }
    );
  }
}
