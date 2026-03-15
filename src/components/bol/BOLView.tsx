'use client';

import { useTranslations, useLocale } from 'next-intl';
import { BOL } from '@/types';
import { Button } from '@/components/ui/Button';
import { FileText, Download, Printer, MapPin, Calendar, Package, DollarSign } from 'lucide-react';
import { downloadBOLPDF } from './BOLPrint';

interface BOLViewProps {
  bol: BOL;
  showActions?: boolean;
}

export function BOLView({ bol, showActions = true }: BOLViewProps) {
  const t = useTranslations('bol');
  const locale = useLocale();
  const origin = typeof bol.origin === 'string' ? JSON.parse(bol.origin) : bol.origin;
  const destination = typeof bol.destination === 'string' ? JSON.parse(bol.destination) : bol.destination;
  const shipper = typeof bol.shipper === 'string' ? JSON.parse(bol.shipper) : bol.shipper;
  const carrier = typeof bol.carrier === 'string' ? JSON.parse(bol.carrier) : bol.carrier;
  const items = typeof bol.items === 'string' ? JSON.parse(bol.items) : bol.items;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6 print:p-8">
        {/* Header */}
        <div className="border-b-2 border-gray-800 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">{t('title')}</h1>
              <p className="text-gray-600 mt-1">BOL #{bol.id.substring(0, 8).toUpperCase()}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">{t('dateCreated')}</p>
              <p className="font-semibold">
                {new Date(bol.createdAt).toLocaleDateString()}
              </p>
              <span className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-medium ${
                bol.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                bol.status === 'signed' ? 'bg-green-100 text-green-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {bol.status === 'draft' ? t('draft') :
                 bol.status === 'signed' ? t('signed') :
                 t('completed')}
              </span>
            </div>
          </div>
        </div>

        {/* Shipper and Carrier */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="border rounded-lg p-4">
            <h3 className="font-bold text-lg mb-2">{t('shipper')}</h3>
            <p className="font-semibold">{shipper.name}</p>
            <p className="text-sm text-gray-600">{shipper.address}</p>
            <p className="text-sm text-gray-600">{shipper.city}, {shipper.province}</p>
            <p className="text-sm text-gray-600">{t('tel')}: {shipper.phone}</p>
            <p className="text-sm text-gray-600">Email: {shipper.email}</p>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-bold text-lg mb-2">{t('carrierLabel')}</h3>
            <p className="font-semibold">{carrier.name}</p>
            <p className="text-sm text-gray-600">{carrier.address}</p>
            <p className="text-sm text-gray-600">{carrier.city}, {carrier.province}</p>
            <p className="text-sm text-gray-600">{t('tel')}: {carrier.phone}</p>
            <p className="text-sm text-gray-600">Email: {carrier.email}</p>
          </div>
        </div>

        {/* Origin and Destination */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-primary-600 mt-1" />
            <div>
              <p className="text-sm font-medium text-gray-500">{t('origin')}</p>
              <p className="text-lg font-semibold">{origin.city}</p>
              <p className="text-sm text-gray-600">{origin.address}</p>
              <p className="text-sm text-gray-600">{origin.province}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-orange-600 mt-1" />
            <div>
              <p className="text-sm font-medium text-gray-500">{t('destination')}</p>
              <p className="text-lg font-semibold">{destination.city}</p>
              <p className="text-sm text-gray-600">{destination.address}</p>
              <p className="text-sm text-gray-600">{destination.province}</p>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-blue-600 mt-1" />
            <div>
              <p className="text-sm font-medium text-gray-500">Date de ramassage</p>
              <p className="text-lg font-semibold">
                {new Date(bol.pickupDate).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-green-600 mt-1" />
            <div>
              <p className="text-sm font-medium text-gray-500">Date de livraison</p>
              <p className="text-lg font-semibold">
                {new Date(bol.deliveryDate).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Articles transportés</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Quantité</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Poids (kg)</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Valeur (CDF)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any, index: number) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-4 py-2">{item.description}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">{item.quantity}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">{item.weight.toLocaleString()}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">{item.value.toLocaleString()}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-bold">
                  <td colSpan={2} className="border border-gray-300 px-4 py-2">TOTAL</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">{bol.totalWeight.toLocaleString()} kg</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">{bol.totalValue.toLocaleString()} CDF</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Signature */}
        {bol.signature && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Signature</h3>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Signé le: {new Date(bol.createdAt).toLocaleDateString('fr-FR')}</p>
              <div className="border-2 border-dashed border-gray-300 p-4 text-center">
                <p className="text-sm text-gray-500">Signature électronique</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {showActions && (
        <div className="flex gap-4 print:hidden">
          <Button onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimer
          </Button>
          <Button variant="outline" onClick={() => downloadBOLPDF(bol, locale)}>
            <Download className="w-4 h-4 mr-2" />
            {t('download')} PDF
          </Button>
          {bol.status === 'draft' && (
            <Button variant="outline">
              Signer
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

