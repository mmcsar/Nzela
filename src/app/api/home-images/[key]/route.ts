import { NextResponse } from 'next/server';
import { readFile, access } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

const IMAGE_MAP: Record<string, string> = {
  'value-ops':
    'C:/Users/mmcsa/.cursor/projects/c-Users-mmcsa-nzela/assets/c__Users_mmcsa_AppData_Roaming_Cursor_User_workspaceStorage_5d0171ac746f104dd4f1f0e4661de1a8_images_ChatGPT_Image_May_7__2026__08_15_09_PM-66028227-4b14-4eae-84bd-712314fba648.png',
  'how-publish':
    'C:/Users/mmcsa/.cursor/projects/c-Users-mmcsa-nzela/assets/c__Users_mmcsa_AppData_Roaming_Cursor_User_workspaceStorage_5d0171ac746f104dd4f1f0e4661de1a8_images_nzela2-8026f1ee-28e1-4432-876d-c46a6534be37.png',
  'how-track':
    'C:/Users/mmcsa/.cursor/projects/c-Users-mmcsa-nzela/assets/c__Users_mmcsa_AppData_Roaming_Cursor_User_workspaceStorage_5d0171ac746f104dd4f1f0e4661de1a8_images_nzelaaa1-cd6d0225-fe37-4bac-9777-b8e06386c3f9.png',
};

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
    const localAssetPath = IMAGE_MAP[key];
    const publicFilename = PUBLIC_MAP[key];
    const fallbackUrl = FALLBACK_MAP[key];

    if (!localAssetPath || !publicFilename || !fallbackUrl) {
      return NextResponse.json({ error: 'Image introuvable' }, { status: 404 });
    }

    const publicPath = path.join(process.cwd(), 'public', 'images', 'home', publicFilename);

    let selectedPath = publicPath;
    try {
      await access(publicPath);
    } catch {
      selectedPath = localAssetPath;
    }

    try {
      const data = await readFile(selectedPath);
      return new NextResponse(data, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    } catch {
      // Last resort: remote fallback image, always available in production.
      return NextResponse.redirect(fallbackUrl);
    }
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lecture image' },
      { status: 500 }
    );
  }
}
