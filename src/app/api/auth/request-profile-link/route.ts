import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Envoie une notification aux admins quand un user (company/broker) demande
 * l'association de son profil. Utilise le service role pour contourner RLS
 * (une entreprise ne peut pas lire les lignes des admins).
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    let { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, company_id, broker_id, full_name, email')
      .eq('id', user.id)
      .maybeSingle();

    if (userError) {
      console.error('request-profile-link users select:', userError);
      return NextResponse.json(
        { error: 'Erreur lors de la vérification du profil. Réessayez.' },
        { status: 500 }
      );
    }

    // Si pas de profil, tenter de le créer (inscription incomplète ou RLS)
    if (!userData) {
      const role = (user.app_metadata as { role?: string })?.role;
      const safeRole = role && ['admin', 'company', 'broker'].includes(role) ? role : 'company';
      const fullName = (user.user_metadata?.full_name as string) || user.email?.split('@')[0] || '';
      const { error: upsertErr } = await supabase.from('users').upsert(
        { id: user.id, email: user.email || '', full_name: fullName, role: safeRole },
        { onConflict: 'id' }
      );
      if (upsertErr) {
        console.error('request-profile-link upsert:', upsertErr);
        return NextResponse.json(
          { error: 'Profil introuvable. Réessayez de vous déconnecter puis reconnecter.' },
          { status: 404 }
        );
      }
      const { data: created } = await supabase
        .from('users')
        .select('role, company_id, broker_id, full_name, email')
        .eq('id', user.id)
        .maybeSingle();
      userData = created;
    }

    if (!userData) {
      return NextResponse.json(
        { error: 'Profil introuvable. Réessayez de vous déconnecter puis reconnecter.' },
        { status: 404 }
      );
    }

    const role = userData.role;
    if (role !== 'company' && role !== 'broker') {
      return NextResponse.json(
        { error: 'Reservé aux comptes entreprise ou courtier' },
        { status: 400 }
      );
    }

    const needsCompany = role === 'company' && !userData.company_id;
    const needsBroker = role === 'broker' && !userData.broker_id;

    if (!needsCompany && !needsBroker) {
      return NextResponse.json(
        { error: 'Votre profil est déjà associé' },
        { status: 400 }
      );
    }

    // Service role pour contourner RLS : l'entreprise ne peut pas lire les admins
    const adminClient = createServiceRoleClient();
    const { data: admins } = await adminClient
      .from('users')
      .select('id')
      .eq('role', 'admin');

    if (!admins || admins.length === 0) {
      return NextResponse.json({ success: true, notified: 0 });
    }

    const label = role === 'company' ? 'entreprise' : 'courtier';
    const entityName = userData.full_name || userData.email || 'Utilisateur';

    // Trouver la company ou broker (owner_id = user)
    const entityType = role === 'company' ? 'company' : 'broker';
    const { data: entity } = await adminClient
      .from(entityType === 'company' ? 'companies' : 'brokers')
      .select('id, name')
      .eq('owner_id', user.id)
      .maybeSingle();

    let verificationRequestId: string | null = null;
    if (entity) {
      const { data: existingReq } = await adminClient
        .from('verification_requests')
        .select('id')
        .eq('user_id', user.id)
        .eq('entity_type', entityType)
        .eq('entity_id', entity.id)
        .eq('status', 'pending')
        .maybeSingle();

      if (!existingReq) {
        const { data: newReq, error: vreqErr } = await adminClient
          .from('verification_requests')
          .insert({
            user_id: user.id,
            entity_type: entityType,
            entity_id: entity.id,
            status: 'pending',
            documents: [],
          })
          .select('id')
          .single();
        if (!vreqErr) verificationRequestId = newReq?.id ?? null;
      }
    }

    const notifications = admins.map((a: { id: string }) => ({
      user_id: a.id,
      type: 'system' as const,
      title: `Demande d'association ${label}`,
      body: verificationRequestId
        ? `${entityName} demande l'association de son profil ${label}. Approuvez dans Vérification KYC.`
        : `${entityName} demande l'association de son profil ${label}. Allez dans Gestion des utilisateurs.`,
      link: verificationRequestId ? '/dashboard/admin/kyc' : '/dashboard/admin/users',
      icon: role === 'company' ? 'Building2' : 'Users',
      metadata: { userId: user.id, role, requestedAt: new Date().toISOString() },
    }));

    const { error } = await adminClient.from('notifications').insert(notifications);
    if (error) {
      console.error('request-profile-link:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, notified: admins.length });
  } catch (error: unknown) {
    console.error('request-profile-link:', error);
    const msg = error instanceof Error ? error.message : 'Erreur serveur';
    if (msg.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      return NextResponse.json(
        { error: 'Configuration serveur incomplète. Contactez l\'administrateur.' },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
