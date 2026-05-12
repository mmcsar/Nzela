import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

type Role = 'broker' | 'company';

type RegisterBody = {
  role: Role;
  email: string;
  password: string;
  fullName: string;
  entityName: string;
  registrationNumber: string;
  address: string;
  city: string;
  province: string;
  phone: string;
  professionalEmail?: string;
};

function entityInsertErrorMessage(err: { message?: string; code?: string } | null): string {
  const msg = err?.message ?? '';
  const code = err?.code ?? '';
  if (code === '23505' || /duplicate key|unique constraint/i.test(msg)) {
    if (/registration_number/i.test(msg)) {
      return 'Ce numero RCCM est deja enregistre. Si c\'est votre structure, connectez-vous ou contactez le support.';
    }
    return 'Cette information est deja utilisee (doublon). Verifiez le RCCM ou contactez le support.';
  }
  return msg || 'Erreur lors de la creation du profil.';
}

/**
 * Inscription entreprise / courtier côté serveur (service role) pour éviter les échecs RLS
 * quand la session n'existe pas après signUp (confirmation e-mail activée sur Supabase).
 */
export async function POST(request: Request) {
  let createdAuthUserId: string | null = null;

  try {
    let admin;
    try {
      admin = createServiceRoleClient();
    } catch {
      return NextResponse.json(
        { error: 'Inscription temporairement indisponible (configuration serveur).' },
        { status: 503 }
      );
    }

    const body = (await request.json()) as RegisterBody;
    const {
      role,
      email,
      password,
      fullName,
      entityName,
      registrationNumber,
      address,
      city,
      province,
      phone,
      professionalEmail,
    } = body;

    if (!role || !['broker', 'company'].includes(role)) {
      return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 });
    }
    if (!email?.trim() || !password || password.length < 6) {
      return NextResponse.json(
        { error: 'Email valide et mot de passe (min. 6 caractères) requis' },
        { status: 400 }
      );
    }
    if (
      !fullName?.trim() ||
      !entityName?.trim() ||
      !registrationNumber?.trim() ||
      !address?.trim() ||
      !city?.trim() ||
      !province?.trim() ||
      !phone?.trim()
    ) {
      return NextResponse.json({ error: 'Tous les champs obligatoires doivent être remplis' }, { status: 400 });
    }

    const contactEmail = (professionalEmail?.trim() || email.trim()).toLowerCase();

    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: false,
      user_metadata: {
        full_name: fullName.trim(),
        role,
      },
    });

    if (authError || !authData.user) {
      const msg = authError?.message ?? '';
      if (/already|registered|exists/i.test(msg)) {
        return NextResponse.json(
          { error: 'Un compte existe déjà avec cette adresse e-mail.' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: authError?.message ?? 'Création du compte impossible' },
        { status: 400 }
      );
    }

    createdAuthUserId = authData.user.id;

    const { error: usersInsertError } = await admin.from('users').insert({
      id: authData.user.id,
      email: email.trim().toLowerCase(),
      full_name: fullName.trim(),
      role,
    });

    if (usersInsertError) {
      await admin.auth.admin.deleteUser(createdAuthUserId);
      createdAuthUserId = null;
      return NextResponse.json(
        { error: usersInsertError.message || 'Erreur profil utilisateur' },
        { status: 500 }
      );
    }

    if (role === 'broker') {
      const { data: broker, error: brokerError } = await admin
        .from('brokers')
        .insert({
          name: entityName.trim(),
          registration_number: registrationNumber.trim(),
          address: address.trim(),
          city: city.trim(),
          province: province.trim(),
          phone: phone.trim(),
          email: contactEmail,
          owner_id: authData.user.id,
          status: 'pending',
        })
        .select()
        .single();

      if (brokerError || !broker) {
        await admin.auth.admin.deleteUser(authData.user.id);
        createdAuthUserId = null;
        return NextResponse.json(
          { error: entityInsertErrorMessage(brokerError) },
          { status: brokerError?.code === '23505' ? 409 : 500 }
        );
      }

      await admin.from('users').update({ broker_id: broker.id }).eq('id', authData.user.id);

      await notifyAdmins(admin, 'broker', broker.id, entityName.trim());
    } else {
      const { data: company, error: companyError } = await admin
        .from('companies')
        .insert({
          name: entityName.trim(),
          registration_number: registrationNumber.trim(),
          address: address.trim(),
          city: city.trim(),
          province: province.trim(),
          phone: phone.trim(),
          email: contactEmail,
          owner_id: authData.user.id,
          status: 'pending',
        })
        .select()
        .single();

      if (companyError || !company) {
        await admin.auth.admin.deleteUser(authData.user.id);
        createdAuthUserId = null;
        return NextResponse.json(
          { error: entityInsertErrorMessage(companyError) },
          { status: companyError?.code === '23505' ? 409 : 500 }
        );
      }

      await admin.from('users').update({ company_id: company.id }).eq('id', authData.user.id);

      await notifyAdmins(admin, 'company', company.id, entityName.trim());
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    if (createdAuthUserId) {
      try {
        const admin = createServiceRoleClient();
        await admin.auth.admin.deleteUser(createdAuthUserId);
      } catch {
        /* best effort */
      }
    }
    console.error('POST /api/auth/register:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}

async function notifyAdmins(
  admin: ReturnType<typeof createServiceRoleClient>,
  type: 'company' | 'broker',
  entityId: string,
  entityName: string
) {
  try {
    const { data: admins } = await admin.from('users').select('id').eq('role', 'admin');
    if (!admins?.length) return;

    const label = type === 'company' ? 'entreprise' : 'courtier';
    const link = type === 'company' ? '/dashboard/admin/companies' : '/dashboard/admin/brokers';
    const notifications = admins.map((a: { id: string }) => ({
      user_id: a.id,
      type: 'system' as const,
      title: `Nouvelle inscription ${label}`,
      body: `${entityName} demande une validation. Un administrateur doit approuver le compte.`,
      link,
      icon: type === 'company' ? 'Building2' : 'Users',
      metadata: { entityType: type, entityId },
    }));

    await admin.from('notifications').insert(notifications);
  } catch (err) {
    console.warn('register notify admins:', err);
  }
}
