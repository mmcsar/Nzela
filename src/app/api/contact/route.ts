import { NextResponse } from 'next/server';
import { createRateLimiter } from '@/lib/api/rate-limit';

const contactLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 8,
  message: 'Trop de messages envoyes. Reessayez dans une minute.',
});

function getClientIdentifier(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0]?.trim() || realIp || 'unknown';
  return `contact:${ip}`;
}

export async function POST(request: Request) {
  try {
    const rateLimit = contactLimiter.check(getClientIdentifier(request));
    if (!rateLimit.allowed) return rateLimit.response!;

    const body = await request.json();
    const name = String(body?.name || '').trim();
    const email = String(body?.email || '').trim().toLowerCase();
    const subject = String(body?.subject || '').trim();
    const message = String(body?.message || '').trim();

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Adresse email invalide.' },
        { status: 400 }
      );
    }

    if (message.length < 10) {
      return NextResponse.json(
        { error: 'Le message doit contenir au moins 10 caracteres.' },
        { status: 400 }
      );
    }

    // Version 1: endpoint public valide + accepte le message.
    // A brancher plus tard sur email provider / table contact_messages.
    return NextResponse.json(
      {
        ok: true,
        message:
          'Message recu. Notre equipe vous repondra rapidement a cette adresse.',
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
