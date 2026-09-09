# État du site et checklist avant mise en production

Dernière mise à jour : septembre 2026, après la livraison de l'espace d'administration.

Ce document décrit ce qui fonctionne, ce qui manque, et dans quel ordre s'y prendre. Il est
volontairement franc : tout ce qui est marqué **bloquant** empêche une ouverture au public.

---

## 1. Ce qui fonctionne aujourd'hui

| Domaine        | État                                                                             |
| -------------- | -------------------------------------------------------------------------------- |
| Catalogue      | Produits, variantes, attributs extensibles, personnalisation, images             |
| Recherche      | Facettes, filtres par critère, tri, pagination, suggestions                      |
| Comptes        | Connexion par code e-mail, sessions glissantes 30 j, rôles USER/ADMIN            |
| Panier         | Persisté dans le navigateur, prix et stock recalculés côté serveur               |
| Paiement       | Stripe Checkout hébergé, webhook de confirmation, décrément de stock             |
| Avis           | Dépôt avec photos, modération, note moyenne dénormalisée                         |
| RGPD           | Export, rectification, effacement avec délai, consentements, sessions révocables |
| Administration | Tableau de bord, produits, commandes, comptes, avis, catalogue                   |

Vérifié en conditions réelles sur une base PostgreSQL locale : parcours de connexion complet,
ajout au panier avec personnalisation, création et suppression de produit depuis l'admin,
modération d'avis, changement de rôle, contrôle d'accès (403 pour un compte USER sur `/admin`).

---

## 2. Bloquants

### 2.1 Base de données : aucune migration

`prisma/migrations` est vide, tout est passé par `bun db:push`. En production cela signifie
qu'aucun changement de schéma n'est traçable ni réversible.

À faire : `bunx prisma migrate dev --name initial` sur une base propre, puis `migrate deploy`
au déploiement. Ne plus jamais utiliser `db:push` sur la base de production.

### 2.2 Variables d'environnement de production

À créer et à ne jamais committer : `AUTH_SECRET` et `OTP_PEPPER` (32 octets aléatoires chacun,
`openssl rand -base64 32`), `PRISMA_DATABASE_URL`, `SMTP_*`, `STRIPE_SECRET_KEY`,
`STRIPE_WEBHOOK_SECRET`, `BLOB_READ_WRITE_TOKEN`, `PUBLIC_ORIGIN`.

Attention : sans `AUTH_SECRET`, le code utilise en développement un secret de repli connu. Le
code refuse de démarrer sans lui hors développement, mais il faut le vérifier au déploiement.

### 2.3 Police manquante

`src/routes/layout.css` déclare `Sabrina.woff2`, mais `static/fonts/` n'existe pas : chaque page
déclenche un 404 et la police manuscrite retombe silencieusement sur Caveat (chargée depuis
Google Fonts). Soit ajouter le fichier, soit retirer la déclaration.

### 2.4 Mentions légales incomplètes

`src/lib/client/data/legal.ts` contient `SIRET 000 000 000 00000` dans les CGU **et** dans les
mentions légales. Le numéro réel, l'adresse de l'entreprise, le nom du responsable de publication
et l'hébergeur sont obligatoires (art. 6 LCEN). À compléter avant toute vente.

### 2.5 Aucun test

Seuls les exemples d'échafaudage subsistent (`src/lib/vitest-examples/`). Vitest est configuré
(projets `client` et `server`). Priorité minimale : le calcul du panier (`priceCartLines`), la
vérification OTP (`verifyOtpCode`), et les gardes `requireUser` / `requireAdmin`.

---

## 3. SEO

Rien n'est en place au-delà des `<title>` et de quelques descriptions.

- **Sitemap** : aucun. Ajouter `src/routes/sitemap.xml/+server.ts` listant les produits publiés,
  les catégories et les pages légales.
- **robots.txt** : autorise tout mais ne pointe aucun sitemap. Ajouter la ligne `Sitemap:`.
- **Balises sociales** : aucune balise Open Graph ni Twitter Card. La première image produit ferait
  une `og:image` naturelle.
- **Données structurées** : pas de JSON-LD. `Product` (avec `offers`, `aggregateRating`) sur les
  fiches et `Organization` sur l'accueil sont ceux qui comptent pour une boutique.
- **Canoniques** : à ajouter, en particulier sur `/search` où les combinaisons de filtres créent
  une infinité d'URL. Prévoir aussi `noindex` sur les pages de résultats filtrées.
- **Pages indexables** : `/profile`, `/sign` et `/admin` sont déjà en `noindex`.
- **Rendu** : les pages produit et recherche sont rendues côté serveur avec leur contenu complet,
  ce qui est le point le plus important et il est acquis.

---

## 4. Commandes et e-mails

- **Aucun e-mail transactionnel** hors code de connexion. `sendMail()` existe et n'est appelé que
  par l'OTP. Manquent : confirmation de commande, avis d'expédition avec numéro de suivi,
  confirmation d'annulation et de remboursement.
- **Factures** : aucune génération. Obligatoire pour la conservation légale de 10 ans annoncée
  dans les mentions.
- **Remboursements** : le webhook Stripe traite `checkout.session.completed`,
  `async_payment_succeeded`, `async_payment_failed` et `expired`. Il ne traite pas
  `charge.refunded` : un remboursement fait depuis le tableau de bord Stripe ne se répercute pas
  dans la base. À ajouter, avec réincrémentation du stock.
- **Stock** : décrémenté à la confirmation de paiement, jamais réservé pendant le paiement. Sur une
  pièce unique, deux clientes peuvent payer la même. Prévoir soit une réservation courte, soit une
  vérification à la confirmation avec remboursement automatique en cas de conflit.
- **Frais de port** : forfait unique de 4,90 € offert dès 60 € (`SHIPPING_FLAT_CENTS` dans
  `order.ts`). À confronter aux tarifs réels, et à décliner par pays si la Belgique et la Suisse
  restent ouvertes à la commande.

---

## 5. Statistiques

Le tableau de bord couvre : chiffre d'affaires encaissé, commandes payées, panier moyen, courbe
sur 30 jours, meilleures ventes, stocks bas, comptes, avis en attente.

Manquent, et demanderaient une base légale RGPD avant d'être collectés :

- taux de conversion et abandon de panier — supposent de suivre les visites, donc du consentement,
  ou une mesure d'audience exemptée (configuration stricte, cf. recommandation CNIL) ;
- provenance du trafic ;
- produits vus sans achat.

`@vercel/analytics` et `@vercel/speed-insights` sont dans les dépendances mais **ne sont pas
importés** : rien n'est collecté aujourd'hui, ce qui est le comportement voulu. Ne les activer
qu'après avoir tranché la question du consentement.

---

## 6. Sécurité

Un audit complet a été mené sur l'authentification, les fonctions distantes, l'accès aux données
et les en-têtes. Cinq failles ont été trouvées et corrigées, le reste est listé comme travail
d'exploitation restant.

### Failles corrigées

1. **Signature falsifiable du cookie d'e-mail en attente.** Entre `/sign` et `/sign/otp`,
   l'adresse était accompagnée d'un SHA-256 non clé : n'importe qui pouvait fabriquer le couple
   et faire vérifier un code pour une autre adresse. La signature passe en HMAC-SHA-256 clé par
   `AUTH_SECRET` (`hmacHex('pending-email', email)` dans `src/lib/server/security/hash.ts`).
2. **Contournement de la limitation de débit par `x-forwarded-for`.** L'en-tête, fourni par le
   client, servait à identifier l'IP. Toutes les empreintes passent désormais par
   `event.getClientAddress()`, seule source contrôlée par l'adaptateur.
3. **Fuite de l'identifiant d'auteur dans les avis publics.** La requête publique retournait le
   `userId` de chaque personne ayant laissé un avis : le champ a été retiré du `select`.
4. **Absence de CSP et de HSTS.** La CSP est générée par SvelteKit avec nonces (`kit.csp` dans
   `vite.config.ts`, `default-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`, images
   limitées au domaine et au Blob Vercel). `Strict-Transport-Security` est posé hors développement,
   aux côtés de `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` et
   `Cross-Origin-Opener-Policy`.
5. **Limitation de débit absente hors envoi d'OTP.** Un limiteur générique adossé à la base
   (modèle `RateLimit`, fenêtre fixe, `consumeRateLimit()`) couvre maintenant la vérification du
   code (30/h par IP hachée), le dépôt d'avis (10/h par compte) et le checkout (20/h par compte).
   Les compteurs survivent au redémarrage et au passage d'une instance à l'autre, ce qu'un
   compteur en mémoire ne ferait pas en serverless. `runRetentionPurge()` purge les fenêtres
   passées.

### Renforcements ajoutés

- **Validation du serveur de messagerie.** `normalizeEmail()` (trim, minuscules, NFKC) puis
  `hasValidMx()` (enregistrements MX, repli A/AAAA, délai borné, permissif si le résolveur
  échoue) dans `src/lib/server/utils/email.ts`. Un domaine inexistant est refusé avant tout envoi :
  plus de bruit chez le fournisseur SMTP ni d'énumération par temps de réponse.
- **Contraintes navigateur dérivées des schémas.** `constrains()` traduit un schéma Valibot en
  attributs HTML (`required`, `minlength`, `maxlength`, `pattern`, `min`, `max`). Le navigateur
  rend le même verdict que le serveur, immédiatement et sans réseau. Appliqué à la connexion, au
  carnet d'adresses, au profil et au formulaire d'avis. La validation serveur reste la seule qui
  fasse autorité.

### Vérifié sans défaut

- Aucune requête SQL brute, aucun `{@html}` : pas de surface d'injection SQL ni XSS stockée.
- Chaque fonction distante mutante commence par `requireUser()` ou `requireAdmin()` ; les lectures
  de données personnelles filtrent systématiquement sur l'identifiant de session.
- SvelteKit refuse les `POST` de fonctions distantes venant d'une autre origine : le CSRF est
  couvert par le framework, en plus des cookies `SameSite=Lax`, `HttpOnly` et `Secure`.
- Les jetons de session ne sont jamais stockés en clair : seule l'empreinte HMAC est en base.
- Aucun secret n'est exposé au client (`$env/static/private` uniquement côté serveur).

### Reste à faire côté exploitation

- **Appliquer le schéma** : le modèle `RateLimit` est nouveau, `bun db:push` est nécessaire avant
  le déploiement.
- **Planifier `runRetentionPurge()`** : la fonction existe mais aucun cron ne l'appelle. Sans elle,
  les comptes dont la suppression a été demandée ne sont jamais effacés — ce qui contredit la
  promesse faite dans l'interface.
- **Sauvegardes et supervision** : sauvegarde de la base, alerte sur erreurs, rotation d'`AUTH_SECRET`.

---

## 7. Contenu et accessibilité

- Les visuels sont des `PhotoPlaceholder` hachurés : il faut de vraies photos, désormais
  téléversables depuis `/admin/produits/[id]` (converties en WebP, EXIF supprimés).
- Le logo est un placeholder en pointillés (`Logo.svelte`).
- Textes alternatifs : saisissables à l'ajout d'image, à remplir systématiquement.
- Parcours clavier et contrastes à vérifier sur la boutique, notamment les pastilles roses sur
  fond crème.
- Le tableau de bord fournit un équivalent textuel de ses graphiques pour les lecteurs d'écran.

---

## 8. Ordre conseillé

1. Migrations Prisma, secrets de production, police manquante, mentions légales.
2. Sécurité : `db:push` du modèle `RateLimit`, cron de purge, sauvegardes et supervision.
3. E-mails transactionnels et factures.
4. SEO : sitemap, Open Graph, JSON-LD, canoniques.
5. Contenu réel (photos, logo) et tests sur les chemins critiques.
6. Statistiques avancées, une fois la question du consentement tranchée.
