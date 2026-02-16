'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { RatingStars } from './RatingStars';
import { MessageSquare, Check } from 'lucide-react';

interface ReviewFormProps {
  loadId: string;
  revieweeId: string;
  revieweeType: 'company' | 'broker';
  revieweeName: string;
  onSubmit?: (rating: any) => void;
  onCancel?: () => void;
}

export function ReviewForm({ loadId, revieweeId, revieweeType, revieweeName, onSubmit, onCancel }: ReviewFormProps) {
  const [overall, setOverall] = useState(0);
  const [communication, setCommunication] = useState(0);
  const [punctuality, setPunctuality] = useState(0);
  const [reliability, setReliability] = useState(0);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (overall === 0) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loadId,
          revieweeId,
          revieweeType,
          overall,
          communication: communication || overall,
          punctuality: punctuality || overall,
          reliability: reliability || overall,
          comment,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess(true);
        onSubmit?.(data.rating);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-6 space-y-3">
        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
          <Check className="w-6 h-6 text-emerald-600" />
        </div>
        <h4 className="font-semibold text-gray-900">Merci pour votre avis !</h4>
        <p className="text-sm text-gray-500">Votre avis aide la communauté Nzela.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary-600" />
          Évaluer {revieweeName}
        </h4>
        <p className="text-sm text-gray-500 mt-0.5">
          Partagez votre expérience avec ce {revieweeType === 'company' ? 'transporteur' : 'courtier'}
        </p>
      </div>

      {/* Note globale */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Note globale *</label>
        <RatingStars value={overall} onChange={setOverall} size="lg" />
      </div>

      {/* Notes détaillées */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Communication</label>
          <RatingStars value={communication} onChange={setCommunication} size="sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Ponctualité</label>
          <RatingStars value={punctuality} onChange={setPunctuality} size="sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Fiabilité</label>
          <RatingStars value={reliability} onChange={setReliability} size="sm" />
        </div>
      </div>

      {/* Commentaire */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Commentaire (optionnel)</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-sm"
          rows={3}
          placeholder="Comment s'est passée la livraison ?"
        />
      </div>

      <div className="flex gap-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Annuler
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={overall === 0}
          isLoading={isLoading}
          className="flex-1"
        >
          Soumettre l&apos;avis
        </Button>
      </div>
    </div>
  );
}
