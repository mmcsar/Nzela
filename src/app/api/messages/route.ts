import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
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
async function ensureMessagingTables(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { error } = await supabase
    .from('conversation_participants')
    .select('id')
    .limit(1);
  if (error) throw error;
}

// ══════════════════════════════════════════
// GET - Liste des conversations OU messages d'une conversation
// ══════════════════════════════════════════
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const auth = await requireAuth(supabase, ['broker', 'company', 'admin']);
    if (!auth.allowed) return auth.response!;

    const rateLimit = messageLimiter.check(auth.userId);
    if (!rateLimit.allowed) return rateLimit.response!;

    // Vérifier tout de suite si le module messagerie est installé
    try {
      await ensureMessagingTables(supabase);
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
      // Verifier que l'utilisateur est participant (RLS le fait aussi mais double securite)
      const { data: participant } = await supabase
        .from('conversation_participants')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('user_id', auth.userId)
        .single();

      if (!participant) {
        return NextResponse.json({ error: 'Acces refuse a cette conversation' }, { status: 403 });
      }

      // Recuperer les messages
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      // Enrichir avec le nom de l'expediteur (service role pour contourner RLS sur users)
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

      // Mettre a jour le last_read_at du participant
      await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', auth.userId);

      return NextResponse.json({ messages: enrichedMessages, conversationId });
    }

    // ── Liste des conversations de l'utilisateur ──
    const { data: participations, error: partError } = await supabase
      .from('conversation_participants')
      .select('conversation_id, last_read_at, role')
      .eq('user_id', auth.userId)
      .order('joined_at', { ascending: false });

    if (partError) throw partError;

    const convIds = (participations || []).map((p: any) => p.conversation_id);

    if (convIds.length === 0) {
      return NextResponse.json({ conversations: [] });
    }

    // Recuperer les conversations
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .in('id', convIds)
      .eq('status', 'active')
      .order('last_message_at', { ascending: false });

    if (convError) throw convError;

    // Pour chaque conversation, recuperer le dernier message + compter les non-lus
    const enrichedConversations = await Promise.all(
      (conversations || []).map(async (conv: any) => {
        // Dernier message
        const { data: lastMsgs } = await supabase
          .from('messages')
          .select('content, sender_id, created_at, type')
          .eq('conversation_id', conv.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(1);

        const lastMsg = lastMsgs?.[0] || null;

        // Compter non-lus
        const participation = participations?.find((p: any) => p.conversation_id === conv.id);
        const lastRead = participation?.last_read_at || '1970-01-01';

        const { count: unreadCount } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .gt('created_at', lastRead)
          .neq('sender_id', auth.userId)
          .is('deleted_at', null);

        // Recuperer les autres participants
        const { data: otherParticipants } = await supabase
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

        // Dernier expediteur
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

    const body = await request.json();
    const { action } = body;

    // ── Creer une nouvelle conversation ──
    if (action === 'create_conversation') {
      const { recipientId, loadId, title, type: convType } = body;

      if (!recipientId) {
        return NextResponse.json({ error: 'recipientId requis' }, { status: 400 });
      }

      // Verifier que le destinataire existe
      const { data: recipient } = await supabase
        .from('users')
        .select('id, email')
        .eq('id', recipientId)
        .single();

      if (!recipient) {
        return NextResponse.json({ error: 'Destinataire introuvable' }, { status: 404 });
      }

      // Verifier si une conversation existe deja entre ces 2 utilisateurs pour ce load
      if (loadId) {
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
            // Conversation existante trouvee
            return NextResponse.json({ conversation: { id: conv.id }, existing: true });
          }
        }
      }

      // Generer le titre
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

      // Creer la conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          load_id: loadId || null,
          title: convTitle,
          type: convType || (loadId ? 'load' : 'direct'),
          status: 'active',
          metadata: loadId ? { loadId } : {},
        })
        .select()
        .single();

      if (convError) throw convError;

      // Ajouter les 2 participants
      const { error: partError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: conversation.id, user_id: auth.userId, role: 'member' },
          { conversation_id: conversation.id, user_id: recipientId, role: 'member' },
        ]);

      if (partError) throw partError;

      // Message systeme de bienvenue
      await supabase.from('messages').insert({
        conversation_id: conversation.id,
        sender_id: auth.userId,
        content: 'Conversation demarree',
        type: 'system',
        is_system: true,
      });

      return NextResponse.json({ conversation: { id: conversation.id, title: convTitle }, existing: false }, { status: 201 });
    }

    // ── Envoyer un message ──
    const { conversationId, content, type: msgType, attachmentUrl } = body;

    if (!conversationId || !content) {
      return NextResponse.json({ error: 'conversationId et content requis' }, { status: 400 });
    }

    // Verifier participation (RLS le fait aussi mais double securite)
    const { data: participant } = await supabase
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', auth.userId)
      .single();

    if (!participant) {
      return NextResponse.json({ error: 'Vous n\'etes pas participant de cette conversation' }, { status: 403 });
    }

    // Inserer le message
    const { data: message, error: msgError } = await supabase
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
