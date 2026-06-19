#!/usr/bin/env node
/**
 * Lance Next.js en mode dev.
 * Sur Windows, l'antivirus/proxy peut intercepter HTTPS et bloquer Supabase
 * (erreur UNABLE_TO_VERIFY_LEAF_SIGNATURE → connexion rejetée en local).
 * Contournement DEV UNIQUEMENT — jamais utilisé par `npm run build` / `start`.
 */
const { spawn } = require('child_process');
const path = require('path');

const relaxDisabled = process.env.NZELA_DEV_RELAX_TLS === '0';
const relaxEnabled =
  !relaxDisabled &&
  (process.env.NZELA_DEV_RELAX_TLS === '1' || process.platform === 'win32');

if (relaxEnabled) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.warn(
    '[nzela dev] Contournement TLS local actif (Supabase/auth). ' +
      'Désactiver avec NZELA_DEV_RELAX_TLS=0 dans .env.local. ' +
      'Ne jamais utiliser en production.',
  );
}

const nextCli = require.resolve('next/dist/bin/next');
const child = spawn(process.execPath, [nextCli, 'dev', '--webpack'], {
  stdio: 'inherit',
  env: process.env,
  cwd: path.join(__dirname, '..'),
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});

child.on('error', (err) => {
  console.error('[nzela dev] Impossible de lancer Next.js:', err.message);
  process.exit(1);
});
