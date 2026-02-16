# Go-Live Checklist (Nzela)

Checklist operationnelle pour le passage en production.

## Priorite 0 (Bloquants)

- [ ] Domaine configure sur Vercel + HTTPS actif
- [ ] Variables Vercel configurees (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, Flutterwave, VAPID). Optionnel : `SUBSCRIPTION_GATE_ENABLED=true` pour activer la monétisation plus tard.
- [ ] Migrations SQL appliquees sur Supabase prod
- [ ] Verification RLS/policies sur tables critiques
- [ ] Backups automatiques actifs + restore teste
- [ ] `npm run lint` passe
- [ ] `npm run build` passe
- [ ] Smoke tests manuels termines (`admin`, `broker`, `company`)
- [ ] Flutterwave live active + webhook valide
- [ ] Audit secrets termine (aucune cle sensible dans le repo)

## Priorite 1 (Fiabilite)

- [ ] Sentry active (frontend + API)
- [ ] Uptime monitoring configure
- [ ] Dashboard de logs applicatifs
- [ ] Verification requetes SQL lentes
- [ ] Pagination stricte sur toutes les listes
- [ ] Cache sur pages/listes a fort trafic
- [ ] Playbook incident documente

References:
- `docs/observability.md`
- `docs/ops-runbook.md`

## Priorite 2 (Maturite)

- [ ] CGU publiees
- [ ] Politique de confidentialite publiee
- [ ] Mentions legales publiees
- [ ] Procedure gestion litiges
- [ ] Reconciliation comptable paiements
- [ ] SLA support defini

References:
- `docs/legal-compliance.md`
- `docs/field-validation-plan.md`

## Rollback rapide

- [ ] Workflow `Rollback` teste une fois en `staging`
- [ ] Procedure rollback ecrite (qui declenche, quand, sur quel ref)
