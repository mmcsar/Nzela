import { createClient, createServiceRoleClient, createClientWithAccessToken } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/checkRole';
import { handleApiError } from '@/lib/api/error';
import { messageLimiter } from '@/lib/api/rate-limit';

/** Lit id + email des users (bypass RLS pour afficher les noms dans la messagerie) */
async function getUsersEmails(userIds: string[]): Promise<Map<string, { email?: string }>> {
  if (userIds.length === 0) return new Map();
  try {
    const service = createServiceRoleClient();
    const { data } = await service.from('users').select('id, email').in('id', userIds);
    return new Map((data || []).map((u: any) => [u.id, { email: u.email }]));
  } catch {
    return new Map();
  }
}

/** Extrait le message d'erreur Supabase/Postgres */
function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const e = error as Record<string, unknown>;
    if (typeof e.message === 'string') return e.message;
    if (typeof e.details === 'string') return e.details;
  }
  return '';
}

/** Réponse 503 module messagerie non installé (tables/fonctions manquantes) */
function messagingNotInstalledResponse(detail: string) {
  return NextResponse.json(
    {
      error: {
        code: 'MESSAGING_NOT_INSTALLED',
        message: 'Module messagerie non installé. Exécutez le script SQL dans Supabase (voir instructions ci-dessous).',
        detail,
      },
    },
    { status: 503 }
  );
}

/** Vérifie que les tables messagerie existent ; sinon throw avec message Postgres */
async function ensureMessagingTables(
  client: Awaited<ReturnType<typeof createClient>> | ReturnType<typeof createServiceRoleClient>
) {
  const { error } = await client.from('conversation_participants').select('id').limit(1);
  if (error) throw error;
}

// ══════════════════════════════════════════
// GET - Liste des conversations OU messages d'une conversation
// Utilise le service role pour toutes les lectures (session cookie pas fiable en Route Handler).
// Autorisation : uniquement les conversations où auth.userId est participant.
// ══════════════════════════════════════════
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const auth = await requireAuth(supabase, ['broker', 'company', 'admin']);
    if (!auth.allowed) return auth.response!;

    const rateLimit = messageLimiter.check(auth.userId);
    if (!rateLimit.allowed) return rateLimit.response!;

    let service: ReturnType<typeof createServiceRoleClient>;
    try {
      service = createServiceRoleClient();
    } catch {
      return NextResponse.json(
        { error: 'Configuration messagerie indisponible (SUPABASE_SERVICE_ROLE_KEY).' },
        { status: 503 }
      );
    }

    try {
      await ensureMessagingTables(service);
    } catch (checkError) {
      const msg = getErrorMessage(checkError);
      if (msg && (msg.includes('does not exist') || msg.includes('relation "'))) {
        return messagingNotInstalledResponse(msg);
      }
      throw checkError;
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    // ── Recuperer les messages d'une conversation ──
    if (conversationId) {
      const { data: participant } = await service
        .from('conversation_participants')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('user_id', auth.userId)
        .single();

      if (!participant) {
        return NextResponse.json({ error: 'Acces refuse a cette conversation' }, { status: 403 });
      }

      const { data: messages, error } = await service
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      const senderIds = [...new Set((messages || []).map((m: any) => m.sender_id))];
      const userMap = await getUsersEmails(senderIds);

      const enrichedMessages = (messages || []).map((msg: any) => {
        const sender = userMap.get(msg.sender_id);
        return {
          id: msg.id,
          conversationId: msg.conversation_id,
          senderId: msg.sender_id,
          senderName: sender?.email?.split('@')[0] || 'Utilisateur',
          content: msg.content,
          type: msg.type,
          attachmentUrl: msg.attachment_url,
          metadata: msg.metadata,
          isSystem: msg.is_system,
          createdAt: msg.created_at,
        };
      });

      await service
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', auth.userId);

      return NextResponse.json({ messages: enrichedMessages, conversationId });
    }

    // ── Liste des conversations de l'utilisateur ──
    const { data: participations, error: partError } = await service
      .from('conversation_participants')
      .select('conversation_id, last_read_at, role')
      .eq('user_id', auth.userId)
      .order('joined_at', { ascending: false });

    if (partError) throw partError;

    const convIds = (participations || []).map((p: any) => p.conversation_id);

    if (convIds.length === 0) {
      return NextResponse.json({ conversations: [] });
    }

    const { data: conversations, error: convError } = await service
      .from('conversations')
      .select('*')
      .in('id', convIds)
      .eq('status', 'active')
      .order('last_message_at', { ascending: false });

    if (convError) throw convError;

    const enrichedConversations = await Promise.all(
      (conversations || []).map(async (conv: any) => {
        const { data: lastMsgs } = await service
          .from('messages')
          .select('content, sender_id, created_at, type')
          .eq('conversation_id', conv.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(1);

        const lastMsg = lastMsgs?.[0] || null;

        const participation = participations?.find((p: any) => p.conversation_id === conv.id);
        const lastRead = participation?.last_read_at || '1970-01-01';

        const { count: unreadCount } = await service
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .gt('created_at', lastRead)
          .neq('sender_id', auth.userId)
          .is('deleted_at', null);

        const { data: otherParticipants } = await service
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', conv.id)
          .neq('user_id', auth.userId);

        const otherUserIds = (otherParticipants || []).map((p: any) => p.user_id);
        let otherNames: string[] = [];
        if (otherUserIds.length > 0) {
          const otherUserMap = await getUsersEmails(otherUserIds);
          otherNames = otherUserIds.map((id) => otherUserMap.get(id)?.email?.split('@')[0] || '?');
        }

        let lastSenderName = '';
        if (lastMsg) {
          if (lastMsg.sender_id === auth.userId) {
            lastSenderName = 'Vous';
          } else {
            const senderData = (await getUsersEmails([lastMsg.sender_id])).get(lastMsg.sender_id);
            lastSenderName = senderData?.email?.split('@')[0] || '';
          }
        }

        return {
          id: conv.id,
          loadId: conv.load_id,
          title: conv.title || otherNames.join(', ') || 'Conversation',
          type: conv.type,
          status: conv.status,
          metadata: conv.metadata,
          participants: otherNames,
          lastMessage: lastMsg ? {
            content: lastMsg.content,
            senderName: lastSenderName,
            senderId: lastMsg.sender_id,
            type: lastMsg.type,
            createdAt: lastMsg.created_at,
          } : null,
          unreadCount: unreadCount || 0,
          lastMessageAt: conv.last_message_at,
          createdAt: conv.created_at,
        };
      })
    );

    return NextResponse.json({ conversations: enrichedConversations });
  } catch (error: unknown) {
    const msg = getErrorMessage(error);
    if (msg && (msg.includes('does not exist') || msg.includes('relation "'))) {
      return messagingNotInstalledResponse(msg);
    }
    return handleApiError(error);
  }
}

// ══════════════════════════════════════════
// POST - Envoyer un message OU creer une conversation
// Toutes les écritures passent par le service role (auth déjà vérifié par requireAuth).
// ══════════════════════════════════════════
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const auth = await requireAuth(supabase, ['broker', 'company', 'admin']);
    if (!auth.allowed) return auth.response!;

    const rateLimit = messageLimiter.check(auth.userId);
    if (!rateLimit.allowed) return rateLimit.response!;

    try {
      await ensureMessagingTables(supabase);
    } catch (checkError) {
      const msg = getErrorMessage(checkError);
      if (msg && (msg.includes('does not exist') || msg.includes('relation "'))) {
        return messagingNotInstalledResponse(msg);
      }
      throw checkError;
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Body JSON invalide ou manquant' }, { status: 400 });
    }
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Body invalide' }, { status: 400 });
    }
    const { action } = body;

    // ── Creer une nouvelle conversation ──
    if (action === 'create_conversation') {
      const { recipientId, loadId, title, type: convType } = body;

      if (!recipientId) {
        return NextResponse.json({ error: 'recipientId requis' }, { status: 400 });
      }

      // Vérifier que le destinataire existe (service role ou fallback)
      let recipient: { id: string; email?: string } | null = null;
      try {
        const service = createServiceRoleClient();
        const { data } = await service.from('users').select('id, email').eq('id', recipientId).single();
        recipient = data;
      } catch {
        const { data } = await supabase.from('users').select('id, email').eq('id', recipientId).single();
        recipient = data;
      }
      if (!recipient) {
        return NextResponse.json({ error: 'Destinataire introuvable' }, { status: 404 });
      }

      // Vérifier conversation existante (service role si dispo, sinon supabase)
      let existingConvId: string | null = null;
      if (loadId) {
        try {
          const service = createServiceRoleClient();
          const { data: existingConvs } = await service
            .from('conversations')
            .select('id')
            .eq('load_id', loadId)
            .eq('status', 'active');
          for (const conv of existingConvs || []) {
            const { data: parts } = await service
              .from('conversation_participants')
              .select('user_id')
              .eq('conversation_id', conv.id);
            const userIds = (parts || []).map((p: any) => p.user_id);
            if (userIds.includes(auth.userId) && userIds.includes(recipientId)) {
              existingConvId = conv.id;
              break;
            }
          }
        } catch {
          const { data: existingConvs } = await supabase
            .from('conversations')
            .select('id')
            .eq('load_id', loadId)
            .eq('status', 'active');
          for (const conv of existingConvs || []) {
            const { data: parts } = await supabase
              .from('conversation_participants')
              .select('user_id')
              .eq('conversation_id', conv.id);
            const userIds = (parts || []).map((p: any) => p.user_id);
            if (userIds.includes(auth.userId) && userIds.includes(recipientId)) {
              existingConvId = conv.id;
              break;
            }
          }
        }
      }
      if (existingConvId) {
        return NextResponse.json({ conversation: { id: existingConvId }, existing: true });
      }

      let convTitle = title;
      if (!convTitle && loadId) {
        const { data: load } = await supabase.from('loads').select('origin, destination, cargo_type').eq('id', loadId).single();
        if (load) {
          const o = typeof load.origin === 'string' ? JSON.parse(load.origin) : load.origin;
          const d = typeof load.destination === 'string' ? JSON.parse(load.destination) : load.destination;
          convTitle = `${load.cargo_type || 'Chargement'}: ${o?.city || '?'} → ${d?.city || '?'}`;
        }
      }
      if (!convTitle) {
        convTitle = `Conversation avec ${recipient.email?.split('@')[0] || 'Utilisateur'}`;
      }

      // 1) RPC create_conversation_secure avec JWT (header Authorization prioritaire, sinon session cookies)
      const authHeader = request.headers.get('Authorization');
      const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
      const token = bearerToken || (await supabase.auth.getSession()).data.session?.access_token || null;

      if (token) {
        try {
          const clientWithToken = createClientWithAccessToken(token);
          const { data: rpcId, error: rpcError } = await clientWithToken.rpc('create_conversation_secure', {
            p_creator_id: auth.userId,
            p_recipient_id: recipientId,
            p_load_id: loadId || null,
            p_title: convTitle,
            p_type: convType || (loadId ? 'load' : 'direct'),
          });
          if (!rpcError && rpcId) {
            return NextResponse.json({ conversation: { id: rpcId, title: convTitle }, existing: false }, { status: 201 });
          }
        } catch {
          // RPC échoué, on passe au fallback
        }
      }

      // 2) Fallback : RPC backend avec service role (contourne RLS, pas d'INSERT direct)
      try {
        const serviceClient = createServiceRoleClient();
        const { data: rpcBackendId, error: rpcBackendError } = await serviceClient.rpc(
          'create_conversation_backend',
          {
            p_creator_id: auth.userId,
            p_recipient_id: recipientId,
            p_load_id: loadId || null,
            p_title: convTitle,
            p_type: convType || (loadId ? 'load' : 'direct'),
          }
        );

        if (!rpcBackendError && rpcBackendId) {
          return NextResponse.json(
            { conversation: { id: rpcBackendId, title: convTitle }, existing: false },
            { status: 201 }
          );
        }
        throw rpcBackendError || new Error('create_conversation_backend a échoué');
      } catch (e) {
        const msg = getErrorMessage(e);
        if (msg && (msg.includes('row-level security') || msg.includes('policy'))) {
          return NextResponse.json(
            {
              error:
                'Création bloquée. Exécutez dans Supabase (SQL Editor) le script supabase/messaging_create_conversation_function.sql (il contient create_conversation_backend).',
            },
            { status: 503 }
          );
        }
        if (msg && msg.includes('function') && msg.includes('does not exist')) {
          return NextResponse.json(
            {
              error:
                'Fonction create_conversation_backend absente. Exécutez dans Supabase (SQL Editor) le script supabase/messaging_create_conversation_function.sql.',
            },
            { status: 503 }
          );
        }
        if (msg && (msg.includes('permission denied') || msg.includes('SUPABASE_SERVICE_ROLE_KEY'))) {
          return NextResponse.json(
            {
              error:
                'Clé API incorrecte. Dans .env.local, définissez SUPABASE_SERVICE_ROLE_KEY avec la clé "service_role" (Supabase > Settings > API), pas la clé anon.',
            },
            { status: 503 }
          );
        }
        throw e;
      }
    }

    // ── Envoyer un message ──
    const { conversationId, content, type: msgType, attachmentUrl } = body;

    if (!conversationId || !content) {
      return NextResponse.json({ error: 'conversationId et content requis' }, { status: 400 });
    }

    let serviceForMessage: ReturnType<typeof createServiceRoleClient>;
    try {
      serviceForMessage = createServiceRoleClient();
    } catch {
      return NextResponse.json(
        { error: 'Configuration messagerie indisponible (SUPABASE_SERVICE_ROLE_KEY).' },
        { status: 503 }
      );
    }

    const { data: participant } = await serviceForMessage
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', auth.userId)
      .single();

    if (!participant) {
      return NextResponse.json({ error: 'Vous n\'etes pas participant de cette conversation' }, { status: 403 });
    }

    const { data: message, error: msgError } = await serviceForMessage
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: auth.userId,
        content: content.trim(),
        type: msgType || 'text',
        attachment_url: attachmentUrl || null,
        is_system: false,
      })
      .select()
      .single();

    if (msgError) throw msgError;

    // Recuperer le nom de l'expediteur (service role pour coherence)
    const senderData = (await getUsersEmails([auth.userId])).get(auth.userId);

    const enrichedMessage = {
      id: message.id,
      conversationId: message.conversation_id,
      senderId: message.sender_id,
      senderName: senderData?.email?.split('@')[0] || 'Utilisateur',
      content: message.content,
      type: message.type,
      attachmentUrl: message.attachment_url,
      isSystem: false,
      createdAt: message.created_at,
    };

    return NextResponse.json({ message: enrichedMessage }, { status: 201 });
  } catch (error: unknown) {
    const msg = getErrorMessage(error);
    if (msg && (msg.includes('does not exist') || msg.includes('relation "'))) {
      return messagingNotInstalledResponse(msg);
    }
    return handleApiError(error);
  }
}
