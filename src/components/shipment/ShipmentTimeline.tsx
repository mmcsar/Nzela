'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import {
  Package, Truck, MapPin, CheckCircle, Clock, Camera,
  FileSignature, AlertTriangle, RefreshCw, ChevronRight
} from 'lucide-react';
import { toErrorMessage } from '@/lib/api/error';

interface TimelineStep {
  status: string;
  label: string;
  completed: boolean;
  current: boolean;
  timestamp: string | null;
}

interface ShipmentTimelineProps {
  loadId: string;
  onStatusChange?: (newStatus: string) => void;
}

const STATUS_ICONS: Record<string, any> = {
  available: Package,
  bid_accepted: CheckCircle,
  dispatched: Truck,
  en_route_pickup: Truck,
  at_pickup: MapPin,
  loaded: Package,
  in_transit: Truck,
  at_delivery: MapPin,
  delivered: CheckCircle,
  pod_uploaded: FileSignature,
  completed: CheckCircle,
};

export function ShipmentTimeline({ loadId, onStatusChange }: ShipmentTimelineProps) {
  const [timeline, setTimeline] = useState<TimelineStep[]>([]);
  const [nextSteps, setNextSteps] = useState<string[]>([]);
  const [currentStatus, setCurrentStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');

  const fetchWorkflow = useCallback(async () => {
    try {
      const response = await fetch(`/api/shipment/workflow?loadId=${loadId}`);
      const data = await response.json();
      if (response.ok) {
        setTimeline(data.timeline || []);
        setNextSteps(data.nextSteps || []);
        setCurrentStatus(data.currentStatus);
      }
    } catch (error) {
      console.error('Error fetching workflow:', error);
    } finally {
      setIsLoading(false);
    }
  }, [loadId]);

  useEffect(() => {
    fetchWorkflow();
  }, [fetchWorkflow]);

  const advanceStatus = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/shipment/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loadId,
          newStatus,
          notes: notes || undefined,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setNotes('');
        setShowNotes(false);
        onStatusChange?.(newStatus);
        await fetchWorkflow();
      } else {
        alert(toErrorMessage(data.error, 'Erreur'));
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStepLabel = (status: string): string => {
    const labels: Record<string, string> = {
      bid_accepted: 'Accepter l\'offre',
      dispatched: 'Dispatcher',
      en_route_pickup: 'En route vers pickup',
      at_pickup: 'Arrivé au pickup',
      loaded: 'Chargement effectué',
      in_transit: 'Démarrer le transit',
      at_delivery: 'Arrivé à destination',
      delivered: 'Confirmer livraison',
      pod_uploaded: 'Soumettre POD',
      completed: 'Terminer',
      cancelled: 'Annuler',
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Timeline visuelle */}
      <div className="relative">
        {timeline.map((step, i) => {
          const Icon = STATUS_ICONS[step.status] || Clock;
          const isLast = i === timeline.length - 1;

          return (
            <div key={step.status} className="flex gap-4 pb-6 last:pb-0">
              {/* Ligne verticale + icône */}
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                  step.completed
                    ? step.current
                      ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-200'
                      : 'bg-emerald-500 border-emerald-500 text-white'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                {!isLast && (
                  <div className={`w-0.5 flex-1 mt-1 ${
                    step.completed ? 'bg-emerald-300' : 'bg-gray-200'
                  }`} />
                )}
              </div>

              {/* Contenu */}
              <div className={`flex-1 pb-2 ${step.current ? '' : ''}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${
                    step.completed
                      ? step.current ? 'text-primary-700' : 'text-gray-900'
                      : 'text-gray-400'
                  }`}>
                    {step.label}
                  </span>
                  {step.timestamp && (
                    <span className="text-xs text-gray-400">
                      {new Date(step.timestamp).toLocaleString('fr-CD', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>
                {step.current && (
                  <div className="mt-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full font-medium">
                      <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse" />
                      Étape actuelle
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions suivantes */}
      {nextSteps.length > 0 && (
        <div className="bg-white rounded-xl border p-4 space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">Prochaine étape</h4>

          {showNotes && (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ajouter une note (optionnel)..."
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              rows={2}
            />
          )}

          <div className="flex flex-wrap gap-2">
            {nextSteps.filter(s => s !== 'cancelled').map((step) => (
              <Button
                key={step}
                size="sm"
                onClick={() => advanceStatus(step)}
                disabled={isUpdating}
                isLoading={isUpdating}
              >
                <ChevronRight className="w-3.5 h-3.5 mr-1" />
                {getStepLabel(step)}
              </Button>
            ))}
            {nextSteps.includes('cancelled') && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => advanceStatus('cancelled')}
                disabled={isUpdating}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                Annuler
              </Button>
            )}
          </div>

          <button
            onClick={() => setShowNotes(!showNotes)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            {showNotes ? 'Masquer les notes' : '+ Ajouter une note'}
          </button>
        </div>
      )}
    </div>
  );
}
