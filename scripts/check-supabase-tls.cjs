#!/usr/bin/env node
/**
 * Diagnostic rapide : Node.js peut-il joindre Supabase (TLS) ?
 * Usage: node scripts/check-supabase-tls.cjs
 */
const fs = require('fs');
const path = require('path');

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

async function probe(label, extraEnv) {
  const prev = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  if (extraEnv.NODE_TLS_REJECT_UNAUTHORIZED !== undefined) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = extraEnv.NODE_TLS_REJECT_UNAUTHORIZED;
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.log(`[${label}] SKIP — NEXT_PUBLIC_SUPABASE_URL / ANON_KEY manquants dans .env.local`);
    if (prev !== undefined) process.env.NODE_TLS_REJECT_UNAUTHORIZED = prev;
    else delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    return false;
  }
  try {
    const res = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: key },
    });
    console.log(`[${label}] OK — Supabase auth health HTTP ${res.status}`);
    if (prev !== undefined) process.env.NODE_TLS_REJECT_UNAUTHORIZED = prev;
    else delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    return true;
  } catch (err) {
    const code = err.cause?.code || err.code || err.message;
    console.log(`[${label}] ÉCHEC — ${code}`);
    if (prev !== undefined) process.env.NODE_TLS_REJECT_UNAUTHORIZED = prev;
    else delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    return false;
  }
}

async function main() {
  loadEnvLocal();
  console.log('Diagnostic TLS Supabase (local)\n');
  const strict = await probe('TLS strict', {});
  if (strict) {
    console.log('\nConnexion Supabase OK sans contournement.');
    return;
  }
  const relaxed = await probe('TLS relaxé (dev)', { NODE_TLS_REJECT_UNAUTHORIZED: '0' });
  if (relaxed) {
    console.log(
      '\nCause probable : antivirus/proxy Windows qui intercepte HTTPS.',
    );
    console.log('Solution : utilisez `npm run dev` (contournement TLS auto sur Windows).');
    console.log('Ou ajoutez NZELA_DEV_RELAX_TLS=1 dans .env.local');
    return;
  }
  console.log('\nSupabase injoignable même en TLS relaxé — vérifiez URL/clé dans .env.local');
  process.exit(1);
}

main();
