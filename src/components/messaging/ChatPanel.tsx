'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Send, Paperclip, ArrowLeft, Truck, Package, Search, Plus,
  MessageSquare, Clock, CheckCheck, Check, MoreVertical,
  Archive, Trash2, Bell, BellOff, Users, MapPin, Loader2,
  ChevronDown, X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toErrorMessage } from '@/lib/api/error';

// ══════════════════════════════════════════
// INTERFACES
// ══════════════════════════════════════════
interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  content: string;
  type: string;
  attachmentUrl?: string;
  isSystem?: boolean;
  createdAt: string;
}

interface ConversationItem {
  id: string;
  loadId?: string;
  title: string;
  type: string;
  status: string;
  participants: string[];
  lastMessage?: {
    content: string;
    senderName: string;
    senderId: string;
    type: string;
    createdAt: string;
  };
  unreadCount: number;
  lastMessageAt: string;
  createdAt: string;
}

interface ChatPanelProps {
  loadId?: string;
  recipientId?: string;
  embedded?: boolean;
  className?: string;
}

// ══════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════
function formatMessageTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = diffMs / 3600000;
  const diffD = diffMs / 86400000;

  if (diffH < 1) {
    const mins = Math.floor(diffMs / 60000);
    return mins < 1 ? 'A l\'instant' : `${mins}min`;
  }
  if (diffH < 24) {
    return d.toLocaleTimeString('fr-CD', { hour: '2-digit', minute: '2-digit' });
  }
  if (diffD < 7) {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return days[d.getDay()];
  }
  return d.toLocaleDateString('fr-CD', { day: '2-digit', month: 'short' });
}

function formatFullTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('fr-CD', { hour: '2-digit', minute: '2-digit' });
}

function isSameDay(d1: string, d2: string) {
  const a = new Date(d1);
  const b = new Date(d2);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatDateSeparator(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 86400000;

  if (diff < 1 && d.getDate() === now.getDate()) return 'Aujourd\'hui';
  if (diff < 2 && d.getDate() === now.getDate() - 1) return 'Hier';
  return d.toLocaleDateString('fr-CD', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getConvIcon(type: string, status?: string) {
  if (type === 'support') return '🛟';
  if (status === 'in-transit') return null; // will use Truck icon
  return null; // will use Package icon
}

// ══════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ══════════════════════════════════════════
export function ChatPanel({ loadId, recipientId, embedded = false, className = '' }: ChatPanelProps) {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedConv, setSelectedConv] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showNewConv, setShowNewConv] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [messagingNotInstalled, setMessagingNotInstalled] = useState<{ detail: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const supabase = useMemo(() => createClient(), []);

  // ── Fetch conversations ──
  const fetchConversations = useCallback(async (silent = false) => {
    try {
      setFetchError(null);
      if (!silent) setIsLoading(true);
      const response = await fetch('/api/messages');
      const data = await response.json();
      if (response.ok) {
        setMessagingNotInstalled(null);
        setConversations(data.conversations || []);
      } else if (response.status === 503 && data?.error?.code === 'MESSAGING_NOT_INSTALLED') {
        setMessagingNotInstalled({ detail: data.error.detail || data.error.message || '' });
        setFetchError(null);
        setConversations([]);
      } else {
        setMessagingNotInstalled(null);
        setFetchError(toErrorMessage(data?.error, response.status === 401 ? 'Connectez-vous pour accéder aux messages.' : 'Impossible de charger les conversations.'));
        setConversations([]);
      }
    } catch (error) {
      console.error('Erreur chargement conversations:', error);
      setFetchError('Erreur réseau. Réessayez.');
      if (!silent) setConversations([]);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  // ── Ouvrir une conversation et charger ses messages ──
  const openConversation = useCallback(async (conv: ConversationItem) => {
    setSelectedConv(conv);
    setIsLoadingMessages(true);
    setFetchError(null);
    try {
      const response = await fetch(`/api/messages?conversationId=${conv.id}`);
      const data = await response.json();
      if (response.ok) {
        setMessages(data.messages || []);
      } else {
        setFetchError(toErrorMessage(data?.error, 'Impossible de charger les messages.'));
        setMessages([]);
      }
    } catch (error) {
      console.error('Erreur chargement messages:', error);
      setFetchError('Erreur réseau.');
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  // ── Init conversation pour un load specifique ──
  const initConversationForLoad = useCallback(async () => {
    if (!loadId || !recipientId) return;
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_conversation',
          recipientId,
          loadId,
        }),
      });
      const data = await response.json();
      if (response.ok && data.conversation) {
        await fetchConversations();
        const created = data.conversation;
        openConversation({
          id: created.id,
          title: created.title || 'Conversation',
          type: 'load',
          status: 'active',
          participants: [],
          unreadCount: 0,
          lastMessageAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Erreur creation conversation:', error);
    }
  }, [loadId, recipientId, fetchConversations, openConversation]);

  // ── Refresh messages silencieux ──
  const refreshMessages = useCallback(async (convId: string) => {
    try {
      const response = await fetch(`/api/messages?conversationId=${convId}`);
      const data = await response.json();
      if (response.ok && data.messages) {
        setMessages(prev => {
          if (data.messages.length !== prev.length) return data.messages;
          return prev;
        });
      }
    } catch { /* silent */ }
  }, []);

  // ── Init: recuperer le user ID ──
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    getUser();
  }, [supabase]);

  // ── Charger les conversations ──
  useEffect(() => {
    fetchConversations();

    // Auto-refresh toutes les 10s
    refreshIntervalRef.current = setInterval(() => {
      fetchConversations(true);
    }, 10000);

    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, [fetchConversations]);

  // ── Quand il n'y a aucune conversation, ouvrir le formulaire "Nouvelle conversation" pour afficher la liste des utilisateurs (broker, entreprise) ──
  useEffect(() => {
    if (!isLoading && conversations.length === 0 && !fetchError && !messagingNotInstalled) {
      setShowNewConv(true);
    }
  }, [isLoading, conversations.length, fetchError, messagingNotInstalled]);

  // ── Si loadId/recipientId fournis, ouvrir ou creer la conversation ──
  useEffect(() => {
    if (loadId && recipientId && currentUserId) {
      initConversationForLoad();
    }
  }, [loadId, recipientId, currentUserId, initConversationForLoad]);

  // ── Scroll auto au dernier message (seulement quand nouveaux messages, pas au scroll utilisateur) ──
  useEffect(() => {
    if (!showScrollDown) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    // showScrollDown exclu volontairement : on scroll uniquement à l'arrivée de nouveaux messages
    // eslint-disable-next-line react-hooks/exhaustive-deps -- messages only
  }, [messages]);

  // ── Auto-refresh messages quand conversation ouverte ──
  useEffect(() => {
    if (!selectedConv) return;

    const interval = setInterval(() => {
      refreshMessages(selectedConv.id);
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedConv, refreshMessages]);

  // ── Scroll listener pour le bouton "scroll down" ──
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    setShowScrollDown(!isNearBottom);
  }, []);

  // ── Envoyer un message ──
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConv || isSending) return;

    const content = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    // Optimistic update
    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      conversationId: selectedConv.id,
      senderId: currentUserId,
      senderName: 'Moi',
      content,
      type: 'text',
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConv.id,
          content,
          type: 'text',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev =>
          prev.map(m => m.id === tempMsg.id ? data.message : m)
        );
        // Refresh conversations pour mettre a jour le dernier message
        fetchConversations(true);
      } else {
        const data = await response.json().catch(() => ({}));
        setFetchError(toErrorMessage(data?.error, 'Envoi impossible.'));
        setMessages(prev =>
          prev.map(m => m.id === tempMsg.id ? { ...m, type: 'error' } : m)
        );
      }
    } catch (error) {
      console.error('Erreur envoi:', error);
      setMessages(prev =>
        prev.map(m => m.id === tempMsg.id ? { ...m, type: 'error' } : m)
      );
    } finally {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Auto-resize textarea ──
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  // ── Filtrer conversations par recherche ──
  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      conv.title.toLowerCase().includes(q) ||
      conv.participants.some(p => p.toLowerCase().includes(q)) ||
      conv.lastMessage?.content.toLowerCase().includes(q)
    );
  });

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  const height = embedded ? 'h-[600px]' : 'h-[calc(100vh-8rem)]';

  // ══════════════════════════════════════════
  // MODULE MESSAGERIE NON INSTALLÉ
  // ══════════════════════════════════════════
  if (messagingNotInstalled) {
    return (
      <div className={`flex flex-col ${height} bg-white rounded-xl border shadow-sm overflow-hidden ${className}`}>
        <div className="flex flex-1 flex-col items-center justify-center p-6">
          <div className="w-full max-w-md rounded-xl border border-amber-200 bg-amber-50 p-6 text-left shadow-sm">
            <h3 className="text-lg font-semibold text-amber-900">Module messagerie non installé</h3>
            <p className="mt-2 text-sm text-amber-800">
              Les tables et politiques de messagerie sont absentes de votre base Supabase. Effectuez les étapes suivantes :
            </p>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-amber-900">
              <li>Ouvrez le <strong>tableau de bord Supabase</strong> du projet utilisé par cette application.</li>
              <li>Allez dans <strong>SQL Editor</strong> et créez une nouvelle requête.</li>
              <li>Copiez le contenu du fichier <code className="rounded bg-amber-100 px-1">supabase/messaging_install.sql</code> du dépôt, collez-le dans l’éditeur puis exécutez-le.</li>
              <li>Vérifiez que les variables d’environnement Vercel incluent <code className="rounded bg-amber-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code> (voir <code className="rounded bg-amber-100 px-1">docs/VERCEL-ENV.md</code>).</li>
            </ol>
            {messagingNotInstalled.detail && (
              <p className="mt-4 rounded bg-amber-100/80 p-2 font-mono text-xs text-amber-900 break-all">
                {messagingNotInstalled.detail}
              </p>
            )}
            <button
              type="button"
              onClick={() => { setMessagingNotInstalled(null); fetchConversations(); }}
              className="mt-5 w-full rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
            >
              Réessayer après installation
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════
  // VUE MESSAGES (conversation ouverte)
  // ══════════════════════════════════════════
  if (selectedConv) {
    return (
      <div className={`flex flex-col ${height} bg-white rounded-xl border shadow-sm overflow-hidden ${className}`}>
        {/* Header */}
        <div className="px-4 py-3 bg-white border-b flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => { setSelectedConv(null); setFetchError(null); fetchConversations(true); }}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>

          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-primary-500 to-primary-600">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{selectedConv.title}</h3>
            <div className="flex items-center gap-1.5">
              {selectedConv.participants.length > 0 && (
                <span className="text-xs text-gray-500 truncate">
                  {selectedConv.participants.join(', ')}
                </span>
              )}
              {selectedConv.type === 'load' && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700">
                  Chargement
                </span>
              )}
            </div>
          </div>

          <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {fetchError && (
          <div className="mx-4 mt-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between gap-2">
            <p className="text-sm text-red-800 flex-1">{fetchError}</p>
            <button
              type="button"
              onClick={() => selectedConv && openConversation(selectedConv)}
              className="text-xs font-medium text-red-700 hover:text-red-800 underline"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Messages */}
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 py-3 space-y-1 bg-gradient-to-b from-gray-50 to-white"
        >
          {isLoadingMessages ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <MessageSquare className="w-12 h-12 mb-3 text-gray-200" />
              <p className="text-sm font-medium">Aucun message</p>
              <p className="text-xs mt-1">Envoyez le premier message</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.senderId === currentUserId;
              const isSystem = msg.isSystem || msg.type === 'system';
              const isError = msg.type === 'error';
              const isTemp = msg.id.startsWith('temp-');
              const showDate = idx === 0 || !isSameDay(messages[idx - 1].createdAt, msg.createdAt);
              const showSender = !isMe && !isSystem && (idx === 0 || messages[idx - 1].senderId !== msg.senderId);

              return (
                <div key={msg.id}>
                  {/* Separateur de date */}
                  {showDate && (
                    <div className="flex items-center justify-center my-3">
                      <div className="px-3 py-1 bg-gray-100 rounded-full text-[11px] text-gray-500 font-medium">
                        {formatDateSeparator(msg.createdAt)}
                      </div>
                    </div>
                  )}

                  {/* Message systeme */}
                  {isSystem ? (
                    <div className="flex justify-center my-2">
                      <div className="px-3 py-1 bg-gray-100 rounded-full text-[11px] text-gray-400 italic">
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    /* Message normal */
                    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1 ${showSender ? 'mt-3' : ''}`}>
                      <div className={`max-w-[78%] ${isMe ? '' : ''}`}>
                        {/* Nom de l'expediteur */}
                        {showSender && (
                          <div className="text-[11px] text-gray-500 font-medium mb-0.5 ml-2">
                            {msg.senderName}
                          </div>
                        )}

                        {/* Bulle */}
                        <div className={`relative group px-3.5 py-2 rounded-2xl text-[13.5px] leading-relaxed transition-all ${
                          isMe
                            ? isError
                              ? 'bg-red-100 text-red-800 rounded-br-md'
                              : 'bg-primary-600 text-white rounded-br-md shadow-sm'
                            : 'bg-white text-gray-800 border border-gray-100 rounded-bl-md shadow-sm'
                        } ${isTemp ? 'opacity-70' : ''}`}>
                          {msg.content}

                          {/* Heure + status */}
                          <div className={`flex items-center gap-1 mt-0.5 ${
                            isMe ? 'justify-end' : 'justify-start'
                          }`}>
                            <span className={`text-[10px] ${
                              isMe ? (isError ? 'text-red-500' : 'text-primary-200') : 'text-gray-400'
                            }`}>
                              {formatFullTime(msg.createdAt)}
                            </span>
                            {isMe && !isError && !isSystem && (
                              isTemp ? (
                                <Clock className="w-3 h-3 text-primary-200" />
                              ) : (
                                <CheckCheck className="w-3 h-3 text-primary-200" />
                              )
                            )}
                            {isError && (
                              <span className="text-[10px] text-red-500 font-medium ml-1">Echec</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Bouton scroll vers le bas */}
        {showScrollDown && (
          <div className="absolute bottom-20 right-6">
            <button
              onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="w-8 h-8 bg-white border shadow-lg rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Zone de saisie */}
        <div className="px-3 py-2.5 border-t bg-white flex-shrink-0">
          <div className="flex items-end gap-2">
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0 mb-0.5">
              <Paperclip className="w-5 h-5" />
            </button>

            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={newMessage}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyPress}
                placeholder="Ecrire un message..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 resize-none text-sm text-gray-900 bg-gray-50 placeholder:text-gray-400 transition-all"
                rows={1}
                style={{ maxHeight: '120px' }}
              />
            </div>

            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || isSending}
              className={`p-2.5 rounded-full transition-all flex-shrink-0 mb-0.5 ${
                newMessage.trim()
                  ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm hover:shadow-md scale-100'
                  : 'bg-gray-100 text-gray-400 scale-95'
              }`}
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════
  // VUE LISTE DES CONVERSATIONS
  // ══════════════════════════════════════════
  return (
    <div className={`flex flex-col ${height} bg-white rounded-xl border shadow-sm overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 bg-white border-b flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              Messages
              {totalUnread > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold bg-primary-600 text-white rounded-full">
                  {totalUnread}
                </span>
              )}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''} active{conversations.length !== 1 ? 's' : ''}
            </p>
          </div>

          <button
            onClick={() => setShowNewConv(!showNewConv)}
            className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
            title="Nouvelle conversation"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une conversation..."
            className="w-full pl-9 pr-4 py-2 text-sm text-gray-900 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all placeholder:text-gray-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Erreur chargement conversations */}
        {fetchError && (
          <div className="mt-3 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between gap-2">
            <p className="text-sm text-red-800 flex-1">{fetchError}</p>
            <button
              type="button"
              onClick={() => fetchConversations()}
              className="text-xs font-medium text-red-700 hover:text-red-800 underline"
            >
              Réessayer
            </button>
          </div>
        )}
      </div>

      {/* Formulaire nouvelle conversation (modal simple) */}
      {showNewConv && <NewConversationForm onClose={() => setShowNewConv(false)} onCreated={(convId) => {
        setShowNewConv(false);
        fetchConversations();
      }} />}

      {/* Liste des conversations */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 px-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-600">
              {searchQuery ? 'Aucun resultat' : 'Aucune conversation'}
            </p>
            <p className="text-xs text-gray-400 mt-1.5 text-center">
              {searchQuery
                ? 'Essayez un autre terme de recherche'
                : 'Les conversations apparaissent quand vous discutez au sujet d\'un chargement'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => openConversation(conv)}
                className={`w-full text-left px-4 py-3.5 hover:bg-gray-50 transition-all flex items-center gap-3 ${
                  conv.unreadCount > 0 ? 'bg-primary-50/30' : ''
                }`}
              >
                {/* Avatar */}
                <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${
                  conv.type === 'support'
                    ? 'bg-amber-100'
                    : conv.type === 'load'
                      ? 'bg-gradient-to-br from-blue-100 to-blue-200'
                      : 'bg-gradient-to-br from-gray-100 to-gray-200'
                }`}>
                  {conv.type === 'support' ? (
                    <span className="text-lg">🛟</span>
                  ) : conv.type === 'load' ? (
                    <Truck className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Users className="w-5 h-5 text-gray-600" />
                  )}
                </div>

                {/* Contenu */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm truncate ${
                      conv.unreadCount > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-800'
                    }`}>
                      {conv.title}
                    </span>
                    {conv.lastMessage && (
                      <span className={`text-[10px] flex-shrink-0 ml-2 ${
                        conv.unreadCount > 0 ? 'text-primary-600 font-semibold' : 'text-gray-400'
                      }`}>
                        {formatMessageTime(conv.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>

                  {conv.lastMessage && (
                    <div className="flex items-center justify-between mt-0.5">
                      <p className={`text-xs truncate flex-1 ${
                        conv.unreadCount > 0 ? 'text-gray-700 font-medium' : 'text-gray-500'
                      }`}>
                        {conv.lastMessage.senderName === 'Vous' && (
                          <span className="text-gray-400">Vous: </span>
                        )}
                        {conv.lastMessage.content}
                      </p>

                      {conv.unreadCount > 0 && (
                        <span className="ml-2 w-5 h-5 bg-primary-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
                          {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Tags */}
                  {conv.participants.length > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <Users className="w-3 h-3 text-gray-300" />
                      <span className="text-[10px] text-gray-400 truncate">
                        {conv.participants.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// FORMULAIRE NOUVELLE CONVERSATION
// ══════════════════════════════════════════
function NewConversationForm({ onClose, onCreated }: { onClose: () => void; onCreated: (convId: string) => void }) {
  const [users, setUsers] = useState<{ id: string; name: string; email: string; role: string }[]>([]);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loads, setLoads] = useState<{ id: string; label: string }[]>([]);
  const [selectedLoadId, setSelectedLoadId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  const loadData = useCallback(async () => {
    try {
      setUsersError(null);
      // Utilisateurs avec qui on peut discuter (via API pour contourner RLS)
      const usersRes = await fetch('/api/messages/users');
      const usersJson = await usersRes.json().catch(() => ({}));
      if (usersRes.ok) {
        setUsers(usersJson.users ?? []);
        if (!usersJson.users || usersJson.users.length === 0) {
          setUsersError(toErrorMessage(usersJson.message, 'Aucun destinataire disponible (courtier, entreprise ou admin).'));
        } else {
          setUsersError(null);
        }
      } else {
        setUsersError(toErrorMessage(usersJson?.error ?? usersJson?.message, `Erreur ${usersRes.status}`));
        setUsers([]);
      }

      // Charger les loads actifs
      const { data: loadsData } = await supabase
        .from('loads')
        .select('id, origin, destination, cargo_type')
        .in('status', ['available', 'booked', 'in-transit'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (loadsData) {
        setLoads(loadsData.map((l: any) => {
          let origin = '?', dest = '?';
          try {
            const o = typeof l.origin === 'string' ? JSON.parse(l.origin) : l.origin;
            const d = typeof l.destination === 'string' ? JSON.parse(l.destination) : l.destination;
            origin = o?.city || '?';
            dest = d?.city || '?';
          } catch { /* */ }
          return { id: l.id, label: `${l.cargo_type || 'Chargement'}: ${origin} → ${dest}` };
        }));
      }
    } catch (error) {
      console.error('Erreur chargement donnees:', error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async () => {
    if (!selectedUserId) return;
    setIsCreating(true);

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_conversation',
          recipientId: selectedUserId,
          loadId: selectedLoadId || undefined,
        }),
      });

      const data = await response.json();
      if (response.ok && data.conversation) {
        onCreated(data.conversation.id);
      }
    } catch (error) {
      console.error('Erreur creation conversation:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-50 text-red-700',
      broker: 'bg-blue-50 text-blue-700',
      company: 'bg-emerald-50 text-emerald-700',
    };
    const labels: Record<string, string> = {
      admin: 'Admin',
      broker: 'Courtier',
      company: 'Entreprise',
    };
    return (
      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${colors[role] || 'bg-gray-50 text-gray-600'}`}>
        {labels[role] || role}
      </span>
    );
  };

  return (
    <div className="border-b bg-blue-50/50 px-4 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Nouvelle conversation</h3>
        <button onClick={onClose} className="p-1 rounded hover:bg-gray-200 transition-colors">
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Destinataire */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Destinataire *</label>
            {usersError && (
              <div className="mb-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800 flex items-center justify-between gap-2">
                <span>{usersError}</span>
                <button
                  type="button"
                  onClick={() => { setUsersError(null); loadData(); }}
                  className="text-amber-700 font-medium underline shrink-0"
                >
                  Réessayer
                </button>
              </div>
            )}
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            >
              <option value="">-- Choisir un utilisateur --</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} {u.email ? `(${u.email})` : ''} — {u.role === 'broker' ? 'Courtier' : u.role === 'company' ? 'Entreprise' : u.role}
                </option>
              ))}
            </select>
            {!usersError && users.length === 0 && !isLoading && (
              <p className="mt-1 text-xs text-gray-500">Aucun autre utilisateur (broker, entreprise ou admin) pour l’instant.</p>
            )}
          </div>

          {/* Chargement lie (optionnel) */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Lier a un chargement (optionnel)</label>
            <select
              value={selectedLoadId}
              onChange={(e) => setSelectedLoadId(e.target.value)}
              className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            >
              <option value="">-- Aucun --</option>
              {loads.map(l => (
                <option key={l.id} value={l.id}>{l.label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleCreate}
            disabled={!selectedUserId || isCreating}
            className="w-full py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isCreating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MessageSquare className="w-4 h-4" />
            )}
            Demarrer la conversation
          </button>
        </>
      )}
    </div>
  );
}
