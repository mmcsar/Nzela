import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/** Base URL publique : préférer NEXT_PUBLIC_APP_URL sur Vercel ; sinon origine de la requête (évite localhost en prod). */
function publicOrigin(request: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL('/login', publicOrigin(request)));
}




