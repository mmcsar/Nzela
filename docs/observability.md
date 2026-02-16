# Observabilite (Niveau Entreprise)

Objectif: detecter rapidement les incidents, comprendre la cause racine, et mesurer la sante de la plateforme.

## 1) Healthcheck

- Endpoint: `/api/health`
- Usage:
  - Uptime monitoring (UptimeRobot, BetterStack, Pingdom)
  - Smoke check post-deploiement CI/CD

## 2) Error Tracking (Sentry)

Recommande:

- Activer Sentry pour:
  - Frontend (erreurs UI, hydration, crashes)
  - API routes (exceptions serveur)
- Ajouter tags:
  - `role`, `route`, `request_id`, `environment`
- Configurer alertes:
  - Erreurs 5xx critiques
  - Spike de taux d'erreur

## 3) Logs centralises

Recommande:

- Exporter logs Vercel vers une solution centralisee (Datadog / BetterStack / Logtail / Axiom).
- Standardiser le format:
  - `timestamp`, `level`, `message`, `route`, `user_id` (si disponible), `request_id`
- Retention:
  - 30 jours minimum en prod

## 4) Alerting minimum

- Uptime check toutes les 60s sur `/api/health`
- Alerte immediate si:
  - indisponibilite > 2 min
  - erreur webhook paiement
  - erreur auth en hausse anormale

## 5) KPIs techniques

Suivre hebdomadairement:

- taux erreurs 5xx API
- temps moyen reponse API
- p95 latency routes critiques (`/api/loads`, `/api/trucks`, `/api/payments`)
- taux echec webhook paiement
- uptime global
