# Runbook Operations (Incident, SLA, Rollback)

## 1) SLA Support recommande

- Priorite P1 (paiements, login indisponible, outage): reponse < 30 min
- Priorite P2 (feature degradee): reponse < 4h
- Priorite P3 (bug mineur): reponse < 24h

## 2) Niveaux d'incident

- **P1**: impact global ou financier
- **P2**: impact partiel sur un role/feature critique
- **P3**: impact limite avec workaround

## 3) Procedure incident (P1/P2)

1. Detecter (alerte uptime, Sentry, support)
2. Qualifier (scope: admin/broker/company, API touchee, paiement touche)
3. Stabiliser (feature flag, rollback, desactivation endpoint vulnerable)
4. Communiquer (statut interne + message support)
5. Restaurer service
6. Post-mortem sous 48h (cause racine + actions preventives)

## 4) Rollback drill (mensuel)

Objectif: verifier qu'un rollback fonctionne en moins de 10 minutes.

Steps:

1. Choisir un commit stable precedent
2. Lancer workflow GitHub Actions `Rollback`
3. Cibler `staging`, verifier smoke tests
4. Rejouer en `production` uniquement si necessaire
5. Documenter:
   - heure debut/fin
   - commit restaure
   - impact utilisateur

## 5) Procedure suspension/reactivation

- Suspension:
  - motif obligatoire en backoffice
  - notification email/support
  - blocage dashboard actif
- Reactivation:
  - verification documents/paiement
  - validation admin
  - notification utilisateur

## 6) Check post-incident

- [ ] service retabli
- [ ] paiements verifies
- [ ] donnees non corrompues
- [ ] equipe support informee
- [ ] post-mortem cree
