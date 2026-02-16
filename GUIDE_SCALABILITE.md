# Guide Scalabilité - Nzela (milliers d'utilisateurs)

## État actuel

### Déjà en place
- **Pagination** : loads, trucks, vehicles, matching (limite 100)
- **Rate limiting** : loads API (60 req/min), en mémoire
- **Indexes DB** : broker_id, company_id, status, pickup_date, cargo_type
- **Limites requêtes** : la plupart des queries ont .limit(50 à 100)
- **Vercel** : scaling automatique serverless
- **PWA** : cache côté client (Serwist)
- **WebSocket (Realtime)** : mises à jour instantanées sur loads, trucks, bols (Supabase Realtime)

---

## À configurer pour des milliers de clients

### 1. Emails (priorité haute)

**Problème** : Supabase limite à ~4 emails/heure par destinataire en gratuit.

**Solution** : SMTP externe dans Supabase Dashboard

1. **Authentication** > **SMTP Settings**
2. Activer "Custom SMTP"
3. Configurer un fournisseur :
   - **Resend** (gratuit 3000/mois) : https://resend.com
   - **SendGrid** (gratuit 100/jour) : https://sendgrid.com
   - **Mailgun** : https://mailgun.com

```
Host: smtp.resend.com (exemple Resend)
Port: 465 (SSL)
User: resend
Password: re_xxx (API key)
Sender email: noreply@votredomaine.com
```

---

### 2. Supabase

| Plan | Utilisateurs | Recommandation |
|------|--------------|----------------|
| Free | ~500 actifs | Développement / MVP |
| Pro ($25/mois) | 10 000+ | Production milliers de users |

**Supabase Pro** offre :
- Plus de connexions simultanées
- Pause projet désactivée
- Meilleur SLA
- Support prioritaire

---

### 3. Rate limiting (production)

**Actuel** : en mémoire (perdu entre instances serverless).

**Pour des milliers de users** : migrer vers **Upstash Redis** (gratuit 10k req/jour)

```bash
npm install @upstash/ratelimit @upstash/redis
```

Voir : https://upstash.com/docs/redis/sdks/ratelimit-ts/nextjs

---

### 4. Optimisations optionnelles

- **Connection pooling** : Supabase le gère côté serveur
- **CDN images** : Supabase Storage + Vercel Edge
- **Caching API** : Vercel Edge Config ou Redis pour données peu changeantes
- **Monitoring** : Vercel Analytics + Supabase Dashboard metrics

---

## Checklist avant lancement

- [ ] SMTP externe configuré dans Supabase
- [ ] Redirect URLs Supabase (auth/callback)
- [ ] Variables d'environnement Vercel (prod)
- [ ] Supabase Pro si prévision > 500 users actifs
- [ ] Test charge : Load Board avec 100+ loads simulés
- [ ] Backup automatique Supabase activé

---

## Ordre de priorité

1. **SMTP** (obligatoire pour inscriptions)
2. **Supabase Pro** (quand tu dépasses les limites free)
3. **Rate limit Redis** (quand plusieurs instances Vercel)
4. **Monitoring** (analytics, erreurs)
