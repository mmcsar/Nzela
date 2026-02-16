import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/checkRole';

// GET - Liste des documents d'un chargement
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const auth = await requireAuth(supabase, ['broker', 'company', 'admin']);
    if (!auth.allowed) return auth.response!;

    const { searchParams } = new URL(request.url);
    const loadId = searchParams.get('loadId');
    const type = searchParams.get('type'); // bol, pod, invoice, photo

    if (!loadId) {
      return NextResponse.json({ error: 'loadId requis' }, { status: 400 });
    }

    // Récupérer les BOLs liés au chargement
    const { data: bols } = await supabase
      .from('bols')
      .select('*')
      .eq('load_id', loadId)
      .order('created_at', { ascending: false });

    // Construire la liste de documents
    const documents = [];

    if (bols) {
      for (const bol of bols) {
        documents.push({
          id: `bol-${bol.id}`,
          loadId: bol.load_id,
          type: 'bol',
          name: `BOL #${bol.id.substring(0, 8).toUpperCase()}`,
          mimeType: 'application/pdf',
          size: 0,
          uploadedBy: '',
          uploadedAt: bol.created_at,
          status: bol.status,
          metadata: {
            totalWeight: bol.total_weight,
            totalValue: bol.total_value,
          },
        });
      }
    }

    const filtered = type
      ? documents.filter((d) => d.type === type)
      : documents;

    return NextResponse.json({ documents: filtered });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Upload de document (POD, photo, etc.)
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const auth = await requireAuth(supabase, ['broker', 'company', 'admin']);
    if (!auth.allowed) return auth.response!;

    const body = await request.json();
    const { loadId, type, name, data: fileData, mimeType } = body;

    if (!loadId || !type) {
      return NextResponse.json({ error: 'loadId et type requis' }, { status: 400 });
    }

    // Si c'est un POD avec signature
    if (type === 'pod') {
      const { receiverName, signature, photos, notes, condition } = body;

      const pod = {
        id: `pod-${Date.now()}`,
        loadId,
        receiverName: receiverName || '',
        signature: signature || '',
        photos: photos || [],
        notes: notes || '',
        condition: condition || 'good',
        deliveredAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      return NextResponse.json({ document: pod, type: 'pod' }, { status: 201 });
    }

    // Document générique
    const doc = {
      id: `doc-${Date.now()}`,
      loadId,
      type,
      name: name || `Document_${Date.now()}`,
      url: '', // URL Supabase Storage après upload
      mimeType: mimeType || 'application/octet-stream',
      size: fileData ? fileData.length : 0,
      uploadedBy: auth.userId,
      uploadedAt: new Date().toISOString(),
    };

    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
