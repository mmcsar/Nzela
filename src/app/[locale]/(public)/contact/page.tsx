'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toErrorMessage } from '@/lib/api/error';

const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_PHONE || '+243 990 243 584';
const contactInfo = [
  { icon: MapPin, label: 'Adresse', value: '04, Avenue Monga, Quartier Craa, Lubumbashi, RDC — RCCM LSHI 17-B-6981' },
  { icon: Phone, label: 'Téléphone', value: supportPhone },
  { icon: Mail, label: 'Email', value: 'info@nzelaa.com' },
  { icon: Clock, label: 'Heures', value: 'Lun - Ven : 8h00 - 17h00' },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSending(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(toErrorMessage(data?.error, 'Impossible d\'envoyer le message.'));
        return;
      }
      setSent(true);
    } catch {
      setError('Erreur reseau. Verifiez votre connexion puis reessayez.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-3">Contactez-nous</h1>
          <p className="text-primary-100 text-lg">Nous sommes la pour vous aider. Envoyez-nous un message.</p>
        </div>
      </section>

      <section className="py-16 bg-gray-50 flex-1">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-5 gap-10">
            {/* Contact Info */}
            <div className="md:col-span-2 space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Informations</h2>
              {contactInfo.map((item) => (
                <div key={item.label} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.label}</p>
                    <p className="text-sm text-gray-500">{item.value}</p>
                  </div>
                </div>
              ))}

              <div className="mt-8 p-6 bg-primary-50 rounded-xl">
                <h3 className="font-semibold text-primary-800 mb-2">Support Premium</h3>
                <p className="text-sm text-primary-700">
                  Les abonnes Pro et Select beneficient d&apos;un support prioritaire avec un temps de reponse garanti sous 2h.
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="md:col-span-3">
              <div className="bg-white rounded-xl shadow-sm p-8">
                {sent ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Send className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Message envoye !</h3>
                    <p className="text-gray-500">Nous vous repondrons dans les plus brefs delais.</p>
                    <Button variant="outline" className="mt-6" onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }); }}>
                      Envoyer un autre message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Envoyez un message</h2>
                    {error && (
                      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                      </div>
                    )}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                        <input
                          type="text"
                          required
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          required
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sujet</label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                      <textarea
                        rows={5}
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm resize-none"
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                      />
                    </div>
                    <Button type="submit" className="w-full" isLoading={isSending} disabled={isSending}>
                      <Send className="w-4 h-4 mr-2" /> Envoyer le message
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
