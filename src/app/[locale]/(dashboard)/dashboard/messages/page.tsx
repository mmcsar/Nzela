'use client';

import { ChatPanel } from '@/components/messaging/ChatPanel';
import { MessageSquare, Shield, Lock, Zap } from 'lucide-react';

export default function MessagesPage() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-sm">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Messagerie</h1>
            <p className="text-sm text-gray-500">Communication securisee entre partenaires</p>
          </div>
        </div>

        {/* Badges securite */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 rounded-full">
            <Lock className="w-3 h-3 text-emerald-600" />
            <span className="text-[11px] font-medium text-emerald-700">RLS Active</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 rounded-full">
            <Shield className="w-3 h-3 text-blue-600" />
            <span className="text-[11px] font-medium text-blue-700">Chiffre</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 rounded-full">
            <Zap className="w-3 h-3 text-amber-600" />
            <span className="text-[11px] font-medium text-amber-700">Temps reel</span>
          </div>
        </div>
      </div>

      {/* Info bar */}
      <div className="bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-100 rounded-lg px-4 py-2.5 flex items-center gap-3">
        <Shield className="w-4 h-4 text-primary-600 flex-shrink-0" />
        <p className="text-xs text-primary-800">
          <span className="font-semibold">Messagerie securisee</span> — Vos conversations sont protegees par RLS. 
          Seuls les participants autorises peuvent lire les messages. Les conversations sont liees aux chargements pour une meilleure tracabilite.
        </p>
      </div>

      {/* Chat Panel - mode pleine page */}
      <ChatPanel />
    </div>
  );
}
