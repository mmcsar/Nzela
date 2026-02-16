'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toErrorMessage } from '@/lib/api/error';

// ==========================================
// LOADS
// ==========================================

interface LoadsParams {
  page?: number;
  limit?: number;
  status?: string;
}

async function fetchLoads(params: LoadsParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.status) searchParams.set('status', params.status);

  const res = await fetch(`/api/loads?${searchParams}`);
  if (!res.ok) throw new Error('Erreur chargement des loads');
  return res.json();
}

export function useLoads(params: LoadsParams = {}) {
  return useQuery({
    queryKey: ['loads', params],
    queryFn: () => fetchLoads(params),
  });
}

async function fetchPublicLoads(params: LoadsParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.status) searchParams.set('status', params.status);

  const res = await fetch(`/api/loads/search?${searchParams}`);
  if (!res.ok) throw new Error('Erreur recherche des loads');
  return res.json();
}

export function usePublicLoads(params: LoadsParams = {}) {
  return useQuery({
    queryKey: ['loads', 'public', params],
    queryFn: () => fetchPublicLoads(params),
    staleTime: 30 * 1000, // 30s pour les données publiques (plus frais)
  });
}

export function useLoadDetail(id: string) {
  return useQuery({
    queryKey: ['loads', id],
    queryFn: async () => {
      const res = await fetch(`/api/loads/${id}`);
      if (!res.ok) throw new Error('Load introuvable');
      return res.json();
    },
    enabled: !!id,
  });
}

// ==========================================
// TRUCKS
// ==========================================

interface TrucksParams {
  page?: number;
  limit?: number;
  status?: string;
}

async function fetchTrucks(params: TrucksParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.status) searchParams.set('status', params.status);

  const res = await fetch(`/api/trucks?${searchParams}`);
  if (!res.ok) throw new Error('Erreur chargement des trucks');
  return res.json();
}

export function useTrucks(params: TrucksParams = {}) {
  return useQuery({
    queryKey: ['trucks', params],
    queryFn: () => fetchTrucks(params),
  });
}

export function useTruckDetail(id: string) {
  return useQuery({
    queryKey: ['trucks', id],
    queryFn: async () => {
      const res = await fetch(`/api/trucks/${id}`);
      if (!res.ok) throw new Error('Truck introuvable');
      return res.json();
    },
    enabled: !!id,
  });
}

// ==========================================
// MATCHING
// ==========================================

interface MatchingParams {
  limit?: number;
  minScore?: number;
}

export function useMatching(params: MatchingParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.minScore) searchParams.set('minScore', String(params.minScore));

  return useQuery({
    queryKey: ['matching', params],
    queryFn: async () => {
      const res = await fetch(`/api/matching?${searchParams}`);
      if (!res.ok) throw new Error('Erreur matching');
      return res.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes (matching = coûteux)
    gcTime: 10 * 60 * 1000,   // 10 minutes cache
  });
}

// ==========================================
// MESSAGES
// ==========================================

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await fetch('/api/messages');
      if (!res.ok) throw new Error('Erreur conversations');
      const data = await res.json();
      return data.conversations || [];
    },
    staleTime: 10 * 1000, // 10s - messagerie = frais
    refetchInterval: 15 * 1000, // auto-refresh toutes les 15s
  });
}

export function useMessages(conversationId: string) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const res = await fetch(`/api/messages?conversationId=${conversationId}`);
      if (!res.ok) throw new Error('Erreur messages');
      const data = await res.json();
      return data.messages || [];
    },
    enabled: !!conversationId,
    staleTime: 5 * 1000, // 5s
    refetchInterval: 5 * 1000, // refresh rapide pour les messages
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { conversationId: string; content: string; type?: string }) => {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Erreur envoi message');
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { recipientId: string; loadId?: string; title?: string }) => {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_conversation', ...data }),
      });
      if (!res.ok) throw new Error('Erreur creation conversation');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

// ==========================================
// TRACKING
// ==========================================

export function useTracking(loadId: string) {
  return useQuery({
    queryKey: ['tracking', loadId],
    queryFn: async () => {
      const res = await fetch(`/api/tracking?loadId=${loadId}`);
      if (!res.ok) throw new Error('Erreur tracking');
      return res.json();
    },
    enabled: !!loadId,
    staleTime: 10 * 1000, // 10s pour le tracking
    refetchInterval: 15_000, // Refetch toutes les 15s (mieux que setInterval)
  });
}

// ==========================================
// MUTATIONS - Create/Update
// ==========================================

export function useCreateLoad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/loads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(toErrorMessage(err.error, 'Erreur creation load'));
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loads'] });
    },
  });
}

export function useCreateTruck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/trucks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(toErrorMessage(err.error, 'Erreur creation truck'));
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trucks'] });
    },
  });
}
