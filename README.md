# BID — Live Auction System

Système d'enchères en temps réel. Participez sans créer de compte.

Built with **Next.js 16**, **Appwrite**, **Cloudinary**, **Tailwind CSS v4**.

---

## Stack

| Technologie | Rôle |
|-------------|------|
| [Next.js 16](https://nextjs.org) | Framework React (App Router) |
| [Appwrite](https://appwrite.io) | Base de données, Auth, Realtime (WebSockets) |
| [Cloudinary](https://cloudinary.com) | Stockage et optimisation des images |
| [Tailwind CSS v4](https://tailwindcss.com) | Styles utilitaires |
| [Render](https://render.com) | Hébergement |

## Fonctionnalités

- ⏱️ **Timer réactif** — Countdown en temps réel par enchère
- 🔌 **WebSockets** — Mise à jour instantanée des prix
- 👤 **Sans compte** — Participation avec juste un nom
- 🖼️ **Multi-images** — Carousel par article
- 🔐 **Admin protégé** — Dashboard CRUD avec upload Cloudinary
- 🎨 **Swiss Design** — Minimalisme, typographie Inter, espaces généreux

## Démarrage rapide

```bash
# 1. Cloner
git clone <repo-url> bid && cd bid

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
cp .env.example .env.local
# → Remplir les valeurs dans .env.local

# 4. Lancer le serveur de développement
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Configuration requise

### Appwrite

1. Créer un projet sur [cloud.appwrite.io](https://cloud.appwrite.io)
2. Ajouter la plateforme Web : `localhost:3000`
3. Créer la database `bid_db`
4. Créer les collections `items` et `bids` (voir architecture Phase 1)
5. Configurer les permissions (voir `.env.example`)
6. Créer un compte admin dans Auth → Users

### Cloudinary

1. Créer un compte sur [cloudinary.com](https://cloudinary.com)
2. Settings → Upload → Add upload preset :
   - Name: `bid_unsigned`
   - Mode: Unsigned
   - Folder: `bid/items`

## Déploiement (Render)

```bash
# Utiliser le Blueprint
# 1. Push le repo sur GitHub
# 2. Render Dashboard → New → Blueprint → Connecter le repo
# 3. render.yaml est détecté automatiquement
# 4. Renseigner les variables d'environnement
```

## Structure du projet

```
src/
├── app/
│   ├── globals.css          # Tokens Swiss Design + Tailwind v4
│   ├── layout.js            # Root Layout (Header, Footer, Fonts)
│   ├── page.js              # Homepage (Hero + Grid d'enchères)
│   └── admin/
│       └── page.js          # Dashboard admin protégé
├── components/
│   └── AuctionCard.js       # Carte d'enchère (Timer + Realtime + Bid)
└── lib/
    ├── appwrite.js           # Client Appwrite (DB, Auth, Realtime)
    └── cloudinary.js         # Helper upload Cloudinary
```

## Licence

MIT
