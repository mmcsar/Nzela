import { NextResponse } from 'next/server';
import { readFile, access } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

const FALLBACK_MAP: Record<string, string> = {
  'value-ops': 'https://images.unsplash.com/photo-1587578769987-776c5bcd4c6e?w=900&q=80',
  'how-publish': 'https://images.unsplash.com/photo-1771923082503-0a3381c46cef?w=800&q=85',
  'how-track': 'https://images.unsplash.com/photo-1687422811062-a966b55cb217?w=800&q=80',
  'editorial-corridor':
    'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=1600&q=80',
  'editorial-warehouse':
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1600&q=80',
  'editorial-docs':
    'https://images.unsplash.com/photo-1771923082503-0a3381c46cef?w=1600&q=85',
};

const PUBLIC_MAP: Record<string, string> = {
  'value-ops': 'value-ops.png',
  'how-publish': 'how-publish.png',
  'how-track': 'how-track.png',
  'editorial-corridor': 'editorial-corridor.png',
  'editorial-warehouse': 'editorial-warehouse.png',
  'editorial-docs': 'editorial-docs.png',
};

async function proxyImage(url: string): Promise<NextResponse> {
  try {
    const upstream = await fetch(url, { next: { revalidate: 86_400 } });
    if (!upstream.ok) {
      return NextResponse.json({ error: 'Source image indisponible' }, { status: 502 });
    }
    const buffer = await upstream.arrayBuffer();
    const contentType = upstream.headers.get('content-type') ?? 'image/jpeg';
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur proxy image' },
      { status: 502 },
    );
  }
}

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
      return proxyImage(fallbackUrl);
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
      return proxyImage(fallbackUrl);
    }
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lecture image' },
      { status: 500 }
    );
  }
}
