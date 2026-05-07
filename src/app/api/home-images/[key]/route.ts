import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';

export const dynamic = 'force-dynamic';

const IMAGE_MAP: Record<string, string> = {
  'value-ops':
    'C:/Users/mmcsa/.cursor/projects/c-Users-mmcsa-nzela/assets/c__Users_mmcsa_AppData_Roaming_Cursor_User_workspaceStorage_5d0171ac746f104dd4f1f0e4661de1a8_images_ChatGPT_Image_May_7__2026__08_15_09_PM-bb17dfc9-507d-45e4-9416-b51dd619d132.png',
  'how-publish':
    'C:/Users/mmcsa/.cursor/projects/c-Users-mmcsa-nzela/assets/c__Users_mmcsa_AppData_Roaming_Cursor_User_workspaceStorage_5d0171ac746f104dd4f1f0e4661de1a8_images_nzela2-05d0346d-9c40-4f1f-aa14-fd4a6c782cf4.png',
  'how-track':
    'C:/Users/mmcsa/.cursor/projects/c-Users-mmcsa-nzela/assets/c__Users_mmcsa_AppData_Roaming_Cursor_User_workspaceStorage_5d0171ac746f104dd4f1f0e4661de1a8_images_nzelaaa1-1f9d894f-bf1e-455c-95c8-51216488dc7f.png',
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    const filePath = IMAGE_MAP[key];

    if (!filePath) {
      return NextResponse.json({ error: 'Image introuvable' }, { status: 404 });
    }

    const data = await readFile(filePath);
    return new NextResponse(data, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lecture image' },
      { status: 500 }
    );
  }
}
