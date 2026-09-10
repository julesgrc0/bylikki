# État du site et checklist avant mise en production

Dernière mise à jour : septembre 2026, après le chantier de mise en production (paiement,
e-mails, factures, SEO, tests) puis celui des fonctionnalités (paramètres
d'administration, atelier de création, avis enrichis, promotions, fidélité, mesure).

**Ce qui reste strictement à ta charge est réuni dans `docs/a-completer.md`.** Ce document-ci
décrit l'état technique du site.

Il est volontairement franc : tout ce qui est marqué **bloquant** empêche une ouverture au public.

---

## 1. Ce qui fonctionne aujourd'hui

| Domaine        | État                                                                             |
| -------------- | -------------------------------------------------------------------------------- |
| Catalogue      | Produits, variantes, attributs extensibles, personnalisation, images             |
| Recherche      | Facettes, filtres par critère, tri, pagination, suggestions                      |
| Comptes        | Connexion par code e-mail, sessions glissantes 30 j, rôles USER/ADMIN            |
| Panier         | Persisté dans le navigateur, prix et stock recalculés côté serveur               |
| Paiement       | Stripe Checkout, webhook, décrément gardé, remboursements, factures numérotées   |
| E-mails        | Connexion, confirmation, expédition, annulation, remboursement, alerte interne   |
| SEO            | Sitemap, canoniques, Open Graph, JSON-LD Product / Organization                  |
| Avis           | Dépôt avec photos, modération, note moyenne dénormalisée                         |
| RGPD           | Export, rectification, effacement avec délai, consentements, sessions révocables |
| Administration | Tableau de bord, produits, commandes, comptes, avis, catalogue, paramètres       |
| Atelier        | Création d'un bijou au glisser-déposer et au clavier, prix serveur, partage      |
| Fidélisation   | Liste d'envies, alertes de réassort, newsletter, codes de réduction, paliers     |
| Après-vente    | Suivi sans compte, demandes de retour avec les règles des CGV appliquées         |
| Mesure         | Entonnoir d'achat et recherches sans résultat, agrégés, sans cookie              |

Vérifié en conditions réelles sur une base PostgreSQL locale : parcours de connexion complet,
ajout au panier avec personnalisation, création et suppression de produit depuis l'admin,
modération d'avis, changement de rôle, contrôle d'accès (403 pour un compte USER sur `/admin`).
Depuis, également vérifiés : l'encaissement avec stock
insuffisant et son remboursement, la facture réservée à sa propriétaire, le sitemap, le JSON-LD
sous CSP, et la tâche de purge (401 sans jeton, compte-rendu avec).

---

## 2. Bloquants restants

Tous les bloquants techniques sont levés. Ceux qui subsistent demandent une information ou une
décision de ta part, et sont détaillés dans `docs/a-completer.md` :

1. **Secrets de production** — le site refuse désormais de démarrer si l'un d'eux manque
   (`src/lib/server/utils/env.ts`, appelé depuis `hooks.server.ts`).
2. **`bun db:push` sur la base de production**, puis passage du premier compte en `ADMIN`.
3. **SIRET, adresse et hébergeur** dans `src/lib/client/data/seller.ts` et `legal.ts`.
4. **Clés et webhook Stripe** en production.
5. **SMTP et enregistrements SPF/DKIM/DMARC** — sans quoi personne ne peut se connecter.

### Ce qui a été traité

- **Base de données** : le schéma est appliqué par `bun db:push`, sans migrations. Choix assumé
  pour l'instant — le schéma Prisma fait foi et écrase ce qui diverge. La contrepartie est qu'un
  changement destructif ne laisse ni trace ni retour arrière : sauvegarder avant chaque poussée
  sur une base contenant de vraies commandes. Le passage aux migrations reste possible à tout
  moment, sans rien changer au schéma.
- **Police manquante** : le `@font-face` de `Sabrina.woff2` a été retiré, ainsi que la famille en
  tête de `--font-hand`. Plus aucun 404 sur les pages. Caveat assure le rendu manuscrit, comme
  c'était déjà le cas en pratique.
- **Tests** : 81 tests sur 9 fichiers, intégrés à `bun all` (`prepare → format → lint → check →
test`). Ils couvrent le calcul du panier et ses cas limites (stock, personnalisation, prix
  serveur), les gardes `requireUser` / `requireAdmin`, les empreintes HMAC et la comparaison à
  temps constant, la facturation, les frais de port, la référence de commande, la normalisation
  d'e-mail, la traduction Valibot → attributs HTML, et les schémas partagés. Les exemples
  d'échafaudage ont été supprimés.
- **Vérification des variables d'environnement** au démarrage, avec un message qui nomme les
  variables absentes plutôt qu'une panne à la première commande.

---

## 3. SEO

En place :

- **Sitemap** : `src/routes/sitemap.xml/+server.ts` — accueil, boutique, catégories utilisées,
  produits publiés avec leur `lastmod`, pages légales. Une heure de cache.
- **robots.txt** : pointe le sitemap et exclut `/admin`, `/profile`, `/sign` et `/api`.
- **Balises sociales** : composant `SeoHead.svelte` — titre, description, canonique, Open Graph
  et Twitter Card. La première image produit sert d'aperçu.
- **Données structurées** : JSON-LD `Product` (prix, devise, disponibilité, note moyenne) sur les
  fiches, `Organization` et `WebSite` (avec `SearchAction`) sur l'accueil. Vérifié au navigateur :
  le JSON est valide et **la CSP à nonces ne le bloque pas**.
- **Canoniques** : sur toutes les pages publiques. `/search` pointe vers l'URL nue ou vers la
  seule recherche par mot-clé, et passe en `noindex, follow` dès qu'un filtre, un tri ou une page
  est actif — les combinaisons de facettes ne créent donc pas d'URL indexables en cascade.
- **Rendu serveur** : les pages produit et recherche partent complètes dans le HTML.

Reste : de vraies photos, sans quoi les aperçus sociaux resteront vides (`docs/a-completer.md` § 6).

---

## 4. Commandes, e-mails et factures

- **E-mails transactionnels** : six gabarits écrits en Svelte avec `svelte-email-tailwind`, dans
  `src/lib/server/emails/`, reprenant la charte de la boutique (crème, rose, contours à 2 px).
  Chacun part en HTML avec une version texte dérivée du même rendu.

  | Message                                 | Déclencheur                              |
  | --------------------------------------- | ---------------------------------------- |
  | Code de connexion                       | demande de code                          |
  | Confirmation de commande + lien facture | webhook, après encaissement              |
  | Avis d'expédition avec numéro de suivi  | passage en `SHIPPED` depuis l'admin      |
  | Confirmation d'annulation               | annulation par la cliente ou par l'admin |
  | Confirmation de remboursement           | webhook `charge.refunded`                |
  | Alerte de survente (interne)            | stock insuffisant à la confirmation      |

  Aucun de ces envois ne peut faire échouer un paiement : `sendMailQuietly()` journalise l'échec
  au lieu de le propager. Le code de connexion, lui, garde le comportement strict.

- **Factures** : numérotation continue et sans trou, attribuée dans la transaction de paiement
  (modèle `Counter`), au format `BY-2026-000042`. Document imprimable sur
  `/profile/commande/[reference]/facture`, réservé à la propriétaire de la commande — vérifié :
  200 pour elle, 404 pour une autre cliente. Aucune dépendance PDF : impression navigateur.
  La mention « TVA non applicable, art. 293 B du CGI » y figure.

- **Remboursements** : `charge.refunded` est traité — statut, date, remise en rayon du stock et
  e-mail à la cliente. Idempotent comme le reste du webhook.

- **Survente** : le décrément est désormais **conditionnel** (`stock >= quantité`) à l'intérieur
  de la transaction. En cas de conflit, la commande reste payée mais porte un drapeau
  `needsAttention` avec le détail du manque, remonte en tête de `/admin/commandes`, et une
  alerte part vers `ADMIN_ALERT_EMAIL`. Le champ `stockTaken` sur chaque ligne enregistre ce qui
  a réellement été prélevé, de sorte qu'un remboursement ne remet en rayon que cette quantité —
  et non la quantité commandée. Vérifié : stock 1, commande de 2 → 1 prélevé, manque signalé,
  remboursement → stock 1.

- **Frais de port** : toujours un forfait unique, à confronter au réel (`docs/a-completer.md` § 7).

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

### Depuis l'audit

- **Le schéma s'applique d'un bloc** : `bun db:push` couvre `RateLimit` comme le reste.
- **La purge est planifiée** : `vercel.json` déclare une tâche quotidienne vers
  `/api/cron/retention`, protégée par `CRON_SECRET` comparé à temps constant. Vérifié : 401 sans
  jeton, 401 avec un mauvais jeton, compte-rendu chiffré avec le bon.
- **Les variables critiques sont contrôlées au démarrage** : le site refuse de démarrer plutôt
  que de hacher avec le secret de repli de développement.
- **La CSP a été vérifiée sur les nouvelles pages** : le JSON-LD passe sans violation, la facture
  et le sitemap non plus.

### Reste à faire côté exploitation

- **Sauvegardes** : les activer côté Neon et tester une restauration.
- **Supervision** : alerte sur les erreurs serveur.
- **Rotation d'`AUTH_SECRET`** en cas de doute — elle déconnecte toutes les sessions, ce qui est
  le comportement voulu.

---

## 7. Contenu et accessibilité

Traité :

- **Textes alternatifs** : tous les `<img>` en portent un. Les vignettes décoratives ont un `alt`
  vide, ce qui est le comportement correct — les lecteurs d'écran les ignorent au lieu de lire
  une URL. Les vignettes cliquables de la galerie produit ont un `aria-label` et un
  `aria-pressed` qui indique celle qui est affichée.
- **Clavier** : `Échap` ferme le menu, le panier et la recherche.
- **Impression** : la navigation, les tiroirs et le pied de page sont masqués — seule la facture
  sort de l'imprimante.
- Le tableau de bord fournit un équivalent textuel de ses graphiques.

Reste :

- Les visuels sont des `PhotoPlaceholder` hachurés et le logo un cadre en pointillés
  (`docs/a-completer.md` § 6).
- Contrastes à repasser une fois les vraies photos en place, notamment les pastilles roses sur
  fond crème.

---

## 8. Ordre conseillé

Il ne reste que des étapes qui te reviennent, dans cet ordre :

1. Secrets de production, `bun db:push`, premier compte administrateur.
2. Mentions légales : SIRET, adresse, hébergeur.
3. Stripe (clés + webhook) et SMTP (compte + SPF/DKIM/DMARC), puis une commande de test de bout
   en bout : paiement, e-mail de confirmation, facture, expédition, remboursement.
4. Photos, logo, textes alternatifs.
5. Tarifs de livraison confrontés au réel.
6. Sauvegardes, supervision, et vérification que la tâche de purge tourne.
7. Plus tard : mesure d'audience une fois la question du consentement tranchée, et réservation de
   stock si les pièces uniques posent problème.

Le détail de chaque point est dans `docs/a-completer.md`.
