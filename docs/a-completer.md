# Ce qu'il reste à compléter avant l'ouverture

Ce fichier ne liste que ce qui **dépend de toi** : des secrets, des informations légales,
des contenus et deux décisions. Tout le reste est fait et vérifié — voir
`docs/mise-en-production.md` pour l'état complet du site.

Chaque point indique **où**, **quoi**, et **comment savoir que c'est fait**.

---

## 1. Secrets de production — bloquant

**Où** : les variables d'environnement de ton hébergeur (Vercel → Settings → Environment Variables).
Le modèle complet est dans `.env.example`, à la racine.

**Quoi** :

| Variable                                     | Comment l'obtenir                                                  |
| -------------------------------------------- | ------------------------------------------------------------------ |
| `AUTH_SECRET`                                | `openssl rand -base64 32`                                          |
| `OTP_PEPPER`                                 | `openssl rand -base64 32`, différent du précédent                  |
| `PRISMA_DATABASE_URL`                        | chaîne de connexion de ta base Neon de production                  |
| `PUBLIC_ORIGIN`                              | `https://bylikki.fr`                                               |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | voir § 4                                                           |
| `SMTP_*`                                     | voir § 5                                                           |
| `BLOB_READ_WRITE_TOKEN`                      | jeton du store Vercel Blob de production                           |
| `CRON_SECRET`                                | `openssl rand -base64 32` — Vercel s'en sert pour appeler la purge |
| `ADMIN_ALERT_EMAIL`                          | ton adresse, pour recevoir les alertes de survente                 |

Ces deux-là ne doivent jamais être committés ni réutilisés d'un environnement à l'autre.
Changer `AUTH_SECRET` déconnecte toutes les sessions en cours : c'est le bon réflexe en cas de
doute sur une fuite.

**C'est fait quand** : le site démarre. Sans une des variables obligatoires, il refuse de
démarrer avec un message qui la nomme (`src/lib/server/utils/env.ts`).

---

## 2. Base de données — bloquant

**Où** : la base de production, une fois `PRISMA_DATABASE_URL` en place.

**Quoi** : `bun db:push`. Le schéma Prisma est appliqué tel quel à la base, en écrasant ce qui
diverge (`--accept-data-loss`). C'est le choix retenu pour l'instant : pas de migrations, le
schéma fait foi.

**Ce que cela implique, tant que ce choix tient** : un changement de schéma qui supprime ou
renomme une colonne emporte les données de cette colonne, sans trace ni retour en arrière. Sur une
base contenant de vraies commandes, faire une sauvegarde juste avant chaque `db:push` est le seul
filet. Le jour où la boutique tourne pour de bon, passer aux migrations se fait en une commande
(`prisma migrate dev --name initial`) — dis-le moi et je m'en occupe.

**C'est fait quand** : `bun db:push` affiche « Your database is now in sync with your Prisma
schema ».

Il faudra ensuite passer ton compte en administrateur, une seule fois, directement en base :

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'ton@adresse.fr';
```

(Connecte-toi d'abord une fois sur le site pour que le compte existe.) Ensuite, tous les autres
changements de rôle se font depuis `/admin/comptes`.

---

## 3. Mentions légales et identité — bloquant

Vendre sans ces informations est une infraction (art. 6 LCEN et art. L441-9 du code de commerce).

**Où** : deux fichiers.

- `src/lib/client/data/seller.ts` — l'identité reprise **sur les factures**. Actuellement
  `addressLines` contient « À compléter » et `siret` contient `000 000 000 00000`.
- `src/lib/client/data/legal.ts` — les CGU (ligne ~26) et les mentions légales (ligne ~179),
  qui contiennent le même SIRET fictif.

**Quoi** : SIRET réel, adresse complète de l'entreprise, nom du responsable de publication,
et les coordonnées de l'hébergeur (Vercel : Vercel Inc., 440 N Barranca Ave #4133, Covina,
CA 91723, États-Unis).

**C'est fait quand** : plus aucune occurrence de `000 000 000 00000` ni de « À compléter » —
`grep -rn "000 000 000\|À compléter" src/` ne renvoie rien.

---

## 4. Stripe — bloquant

**Où** : dashboard Stripe, en mode production.

**Quoi** :

1. La clé secrète de production (`sk_live_…`) → `STRIPE_SECRET_KEY`.
2. Un webhook vers `https://bylikki.fr/api/stripe/webhook`, abonné à ces cinq événements —
   ce sont exactement ceux que le code traite :
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `checkout.session.expired`
   - `charge.refunded`
3. Le secret de signature du webhook (`whsec_…`) → `STRIPE_WEBHOOK_SECRET`.

Les remboursements se déclenchent **depuis le dashboard Stripe** : le webhook `charge.refunded`
répercute alors le statut dans la base, remet le stock en rayon et envoie l'e-mail à la cliente.

**C'est fait quand** : une commande de test passe en `PAID` dans `/admin/commandes`, et un
remboursement depuis Stripe la fait passer en `REFUNDED`.

---

## 5. Envoi des e-mails — bloquant

Sans SMTP, personne ne peut se connecter : le code de connexion ne part pas.

**Où** : un fournisseur transactionnel (Brevo, Postmark, Resend, Scaleway…) puis les variables
`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`.

**Quoi, en plus du compte** : configurer **SPF, DKIM et DMARC** sur le domaine bylikki.fr,
en suivant la documentation du fournisseur. Sans ces trois enregistrements DNS, les codes de
connexion partent en indésirables et les clientes ne peuvent pas se connecter.

**C'est fait quand** : un test depuis `mail-tester.com` donne 9/10 ou plus, et un code de
connexion arrive en boîte de réception (pas en spam) sur Gmail et sur Outlook.

Les six gabarits (code de connexion, confirmation, expédition, annulation, remboursement,
alerte interne) sont dans `src/lib/server/emails/` — ils reprennent la charte de la boutique et
partent en HTML avec une version texte automatique.

---

## 6. Contenu

**Où** : `/admin/produits/[id]`, onglet Images, et `src/lib/client/ui/Logo.svelte`.

**Quoi** :

- **Photos produit** : les visuels sont aujourd'hui des placeholders hachurés. L'upload est en
  place (conversion WebP, EXIF supprimés). Compte au moins trois photos par pièce : la première
  sert de vignette dans la boutique **et** d'aperçu sur les réseaux sociaux (`og:image`).
- **Textes alternatifs** : le champ est proposé à chaque ajout d'image. Le remplir décrit la
  pièce aux personnes qui n'y voient pas, et compte pour le référencement.
- **Logo** : `Logo.svelte` affiche un cadre en pointillés. À remplacer par le vrai logo.
- **Police manuscrite** : la déclaration de `Sabrina.woff2` a été retirée (le fichier n'existait
  pas, chaque page déclenchait un 404). L'écriture manuscrite est rendue par Caveat. Si tu
  acquiers la licence Sabrina, dépose le fichier dans `static/fonts/` et remets le `@font-face`
  ainsi que `'Sabrina'` en tête de `--font-hand` dans `src/routes/layout.css`.

**C'est fait quand** : plus aucun `PhotoPlaceholder` sur les fiches publiées.

---

## 7. Tarifs de livraison

**Où** : `src/lib/server/database/order.ts`, en haut du fichier.

```ts
export const SHIPPING_FLAT_CENTS = 490; // 4,90 €
export const FREE_SHIPPING_THRESHOLD_CENTS = 6000; // offerte dès 60 €
```

**Quoi** : confronter ces deux valeurs à tes tarifs réels (Colissimo, Mondial Relay…). Le
formulaire d'adresse propose la France, la Belgique et la Suisse : si tu expédies hors de France,
il faut soit un tarif par pays, soit fermer ces destinations. **La Suisse est hors Union
européenne** — des formalités douanières s'appliquent.

**C'est fait quand** : le montant affiché au panier correspond à ce que tu paies réellement.

---

## 8. Deux décisions qui n'ont pas de bonne réponse par défaut

### Mesure d'audience

`@vercel/analytics` et `@vercel/speed-insights` sont installés mais **volontairement pas
activés** : rien n'est collecté aujourd'hui. Les activer suppose soit une bannière de
consentement conforme, soit une configuration de mesure d'audience exemptée au sens de la
recommandation CNIL. Tant que ce n'est pas tranché, le taux de conversion et l'abandon de panier
resteront hors du tableau de bord — c'est un choix de conformité, pas un oubli.

### Réservation de stock

Aujourd'hui : le stock est décrémenté **à la confirmation du paiement**, de façon conditionnelle.
Si deux clientes paient la dernière pièce, la seconde commande est encaissée, marquée « à
traiter » dans `/admin/commandes`, et tu reçois un e-mail d'alerte — le remboursement reste
manuel depuis Stripe. Si les pièces uniques deviennent fréquentes, il faudra une vraie
réservation courte pendant le paiement. Dis-le moi et je l'implémente.

---

## 9. Exploitation courante

- **Purge RGPD** : `vercel.json` déclare une tâche quotidienne à 3 h vers
  `/api/cron/retention`. Elle efface les codes expirés, les sessions éteintes et les comptes dont
  la suppression a été demandée il y a plus de 30 jours. Vérifie après le premier déploiement que
  la tâche apparaît dans Vercel → Settings → Cron Jobs, et qu'elle passe au vert. Sans elle, la
  promesse de suppression faite aux clientes n'est pas tenue.
- **Sauvegardes** : activer les sauvegardes automatiques côté Neon et tester une restauration
  une fois. Une sauvegarde jamais restaurée n'est pas une sauvegarde.
- **Supervision** : brancher une alerte sur les erreurs serveur (Sentry ou les logs Vercel) pour
  ne pas découvrir une panne de paiement par une cliente mécontente.

---

## Récapitulatif

| #   | Point                                | Bloquant                               |
| --- | ------------------------------------ | -------------------------------------- |
| 1   | Secrets de production                | oui                                    |
| 2   | `bun db:push` + premier compte admin | oui                                    |
| 3   | SIRET, adresse, hébergeur            | oui                                    |
| 4   | Clés et webhook Stripe               | oui                                    |
| 5   | SMTP + SPF/DKIM/DMARC                | oui                                    |
| 6   | Photos, logo, textes alternatifs     | non, mais visible                      |
| 7   | Tarifs de livraison                  | non, mais tu perds de l'argent         |
| 8   | Audience, réservation de stock       | non                                    |
| 9   | Cron, sauvegardes, supervision       | non le jour J, oui la semaine suivante |
