import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/checkRole';

// ── Document types requis par type d'entite ──
const REQUIRED_DOCS: Record<string, string[]> = {
  company: ['business_registration', 'tax_certificate', 'transport_license', 'insurance_certificate'],
  broker: ['business_registration', 'tax_certificate', 'national_id'],
  user: ['national_id'],
};

// ── GET - Etat de verification ──
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const auth = await requireAuth(supabase, ['broker', 'company', 'admin']);
    if (!auth.allowed) return auth.response!;

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');

    // Admin: voir toutes les demandes (on utilise le service role pour contourner tout RLS)
    if (auth.role === 'admin') {
      const status = searchParams.get('status') || 'pending';
      const entityTypeParam = searchParams.get('entityType') || '';

      const adminClient = createServiceRoleClient();
      let query = adminClient
        .from('verification_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (status && status !== 'all') {
        // "En attente" = toutes les demandes non finalisées (à traiter par l'admin)
        if (status === 'pending') {
          query = query.in('status', ['pending', 'more_info_needed', 'in_review']);
        } else {
          query = query.eq('status', status);
        }
      }
      if (entityTypeParam && (entityTypeParam === 'broker' || entityTypeParam === 'company')) {
        query = query.eq('entity_type', entityTypeParam);
      }

      const { data: requests } = await query;

      // Enrichir avec les documents et infos utilisateur (toujours en service role)
      const enriched = await Promise.all((requests || []).map(async (req: any) => {
        const { data: docs } = await adminClient
          .from('verification_documents')
          .select('*')
          .eq('entity_type', req.entity_type)
          .eq('entity_id', req.entity_id)
          .order('created_at', { ascending: false });

        const { data: user } = await adminClient
          .from('users')
          .select('email, full_name')
          .eq('id', req.user_id)
          .maybeSingle();

        let entityName = '';
        if (req.entity_type === 'company') {
          const { data } = await adminClient.from('companies').select('name').eq('id', req.entity_id).single();
          entityName = data?.name || '';
        } else if (req.entity_type === 'broker') {
          const { data } = await adminClient.from('brokers').select('name').eq('id', req.entity_id).single();
          entityName = data?.name || '';
        }

        return {
          ...req,
          submitted_at: req.submitted_at ?? req.created_at,
          documents: docs || [],
          user,
          entityName,
        };
      }));

      return NextResponse.json({ requests: enriched });
    }

    // Non-admin: ses propres documents et demandes
    if (!entityType || !entityId) {
      return NextResponse.json({ error: 'entityType et entityId requis' }, { status: 400 });
    }

    const { data: documents } = await supabase
      .from('verification_documents')
      .select('*')
      .eq('user_id', auth.userId)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });

    const { data: latestRequest } = await supabase
      .from('verification_requests')
      .select('*')
      .eq('user_id', auth.userId)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const requiredDocs = REQUIRED_DOCS[entityType] || [];
    const submittedTypes = (documents || []).map((d: any) => d.document_type);
    const missingDocs = requiredDocs.filter(d => !submittedTypes.includes(d));
    const progress = requiredDocs.length > 0
      ? Math.round(((requiredDocs.length - missingDocs.length) / requiredDocs.length) * 100)
      : 0;

    return NextResponse.json({
      documents: documents || [],
      request: latestRequest || null,
      requiredDocs,
      missingDocs,
      progress,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── POST - Soumettre un document ou une demande de verification ──
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const auth = await requireAuth(supabase, ['broker', 'company', 'admin']);
    if (!auth.allowed) return auth.response!;

    const body = await request.json();
    const { action } = body;

    // ── Action: upload document ──
    if (action === 'upload_document') {
      const { entityType, entityId, documentType, documentNumber, fileUrl, fileName, fileSize, mimeType, expiryDate } = body;

      if (!entityType || !entityId || !documentType) {
        return NextResponse.json({ error: 'entityType, entityId, documentType requis' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('verification_documents')
        .insert({
          user_id: auth.userId,
          entity_type: entityType,
          entity_id: entityId,
          document_type: documentType,
          document_number: documentNumber || null,
          file_url: fileUrl || null,
          file_name: fileName || null,
          file_size: fileSize || null,
          mime_type: mimeType || null,
          expiry_date: expiryDate || null,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ document: data }, { status: 201 });
    }

    // ── Action: submit verification request ──
    if (action === 'submit_request') {
      const { entityType, entityId } = body;

      if (!entityType || !entityId) {
        return NextResponse.json({ error: 'entityType, entityId requis' }, { status: 400 });
      }

      // Verifier qu'il y a au moins un document
      const { data: docs } = await supabase
        .from('verification_documents')
        .select('id')
        .eq('user_id', auth.userId)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId);

      if (!docs || docs.length === 0) {
        return NextResponse.json({ error: 'Aucun document soumis. Uploadez vos documents d\'abord.' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('verification_requests')
        .insert({
          user_id: auth.userId,
          entity_type: entityType,
          entity_id: entityId,
          status: 'pending',
          documents: docs.map((d: any) => d.id),
        })
        .select()
        .single();

      if (error) throw error;

      // Mettre a jour le statut de l'entite
      const table = entityType === 'company' ? 'companies' : entityType === 'broker' ? 'brokers' : null;
      if (table) {
        await supabase.from(table).update({ verification_status: 'pending' }).eq('id', entityId);
      }
      if (entityType === 'user') {
        await supabase.from('users').update({ kyc_status: 'pending' }).eq('id', entityId);
      }

      // Notifier les admins (service role pour contourner RLS : le soumetteur ne peut pas lire la liste des admins)
      const adminClient = createServiceRoleClient();
      const { data: admins } = await adminClient.from('users').select('id').eq('role', 'admin');
      if (admins && admins.length > 0) {
        const notifications = admins.map((a: { id: string }) => ({
          user_id: a.id,
          type: 'kyc_submitted' as const,
          title: 'Nouvelle demande KYC',
          body: `Une demande de verification ${entityType} a ete soumise.`,
          link: '/dashboard/admin/kyc',
          icon: 'ShieldCheck',
        }));
        await adminClient.from('notifications').insert(notifications);
      }

      return NextResponse.json({ request: data }, { status: 201 });
    }

    // ── Action: review (admin only) ──
    if (action === 'review') {
      if (auth.role !== 'admin') {
        return NextResponse.json({ error: 'Admin requis' }, { status: 403 });
      }

      const { requestId, decision, reviewNotes } = body;
      if (!requestId || !decision || !['approved', 'rejected', 'more_info_needed'].includes(decision)) {
        return NextResponse.json({ error: 'requestId et decision (approved/rejected/more_info_needed) requis' }, { status: 400 });
      }

      // Mettre a jour la demande
      const { data: req, error } = await supabase
        .from('verification_requests')
        .update({
          status: decision,
          reviewed_by: auth.userId,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes || null,
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;

      // Mettre a jour les documents
      if (decision === 'approved') {
        await supabase
          .from('verification_documents')
          .update({ status: 'approved', reviewed_by: auth.userId, reviewed_at: new Date().toISOString() })
          .eq('entity_type', req.entity_type)
          .eq('entity_id', req.entity_id);
      }

      // Mettre a jour l'entite
      const verificationStatus = decision === 'approved' ? 'verified' : decision === 'rejected' ? 'rejected' : 'pending';
      const table = req.entity_type === 'company' ? 'companies' : req.entity_type === 'broker' ? 'brokers' : null;
      
      if (table) {
        const updateData: any = { verification_status: verificationStatus };
        if (decision === 'approved') {
          updateData.verified_at = new Date().toISOString();
          updateData.verified_by = auth.userId;
          updateData.status = 'active';
        }
        if (decision === 'rejected') {
          updateData.rejection_reason = reviewNotes || 'Documents non conformes';
        }
        await supabase.from(table).update(updateData).eq('id', req.entity_id);
        // Lier users.company_id ou users.broker_id si approuve (demande d'association)
        if (decision === 'approved') {
          const userUpdate = req.entity_type === 'company'
            ? { company_id: req.entity_id }
            : { broker_id: req.entity_id };
          await supabase.from('users').update(userUpdate).eq('id', req.user_id);
        }
      }
      if (req.entity_type === 'user') {
        await supabase.from('users').update({ kyc_status: verificationStatus }).eq('id', req.entity_id);
      }

      // Notifier l'utilisateur
      await supabase.from('notifications').insert({
        user_id: req.user_id,
        type: decision === 'approved' ? 'kyc_approved' : 'kyc_rejected',
        title: decision === 'approved' ? 'Verification approuvee !' : decision === 'rejected' ? 'Verification rejetee' : 'Informations supplementaires requises',
        body: decision === 'approved'
          ? 'Votre verification a ete approuvee. Vous pouvez maintenant utiliser toutes les fonctionnalites.'
          : decision === 'rejected'
            ? `Votre verification a ete rejetee. Raison: ${reviewNotes || 'Documents non conformes'}`
            : `Informations supplementaires requises: ${reviewNotes || ''}`,
        link: '/dashboard/verification',
        icon: decision === 'approved' ? 'ShieldCheck' : 'ShieldX',
      });

      return NextResponse.json({ request: req });
    }

    return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
