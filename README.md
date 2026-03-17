# Plateforme de Mise en Relation de Répétiteurs et Parents

## 🚀 Description du Projet

Cette application web facilite la mise en relation entre des répétiteurs et des parents, offrant une plateforme complète pour trouver et proposer des services de soutien scolaire.

## 🛠 Technologies Utilisées

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn-ui
- React Router
- React Query
- Zod (validation)

### Backend & Infrastructure
- Supabase (Base de données, authentification, stockage)
- Supabase Edge Functions
- Leaflet (Cartographie)

### Outils de Développement
- ESLint
- Vitest
- TypeScript
- PostCSS

## 📦 Fonctionnalités Principales

- Authentification des utilisateurs (Parents, Répétiteurs, Administrateurs)
- Recherche de répétiteurs par géolocalisation
- Système de chat intégré
- Gestion des offres et candidatures
- Téléchargement et validation de documents
- Tableau de bord personnalisé

## 🔧 Prérequis

- Node.js (version 18+)
- npm
- Compte Supabase

## 📥 Installation

```bash
# Cloner le dépôt
git clone <URL_DU_DEPOT>

# Accéder au répertoire du projet
cd repetiteurs-platform

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Remplir les variables Supabase dans .env

# Lancer le serveur de développement
npm run dev
```

## 🚀 Déploiement

Le projet est configuré pour un déploiement simple.

```bash
# Construction de l'application
npm run build

# Prévisualisation du build
npm run preview
```

## 🧪 Tests

```bash
# Exécuter les tests
npm test

# Mode watch pour le développement
npm run test:watch
```

## 🤝 Contribution

1. Forker le projet
2. Créer une branche de fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. Commiter vos modifications (`git commit -m 'Add some AmazingFeature'`)
4. Pousser la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Distribué sous la licence MIT.

## 📞 Contact

Votre Nom - [votre-email@exemple.com]

Lien du Projet: [https://github.com/votre-username/repetiteurs-platform]
