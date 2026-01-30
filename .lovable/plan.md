
# Plan d'implémentation - Mon Répétiteur

## Vue d'ensemble
Ce plan couvre la création du système d'authentification, du dashboard administrateur et de la gestion complète des utilisateurs avec 4 types de rôles : Super Admin, Admin, Prestataire (Répétiteur), et Client (Parent).

---

## 1. Configuration de la base de données Supabase

### 1.1 Création de l'enum pour les rôles
```sql
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'prestataire', 'client');
```

### 1.2 Table `profiles` (informations utilisateur)
| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID (PK) | Référence à auth.users |
| full_name | TEXT | Nom complet |
| phone | TEXT | Numéro de téléphone (+225) |
| avatar_url | TEXT | Photo de profil (optionnel) |
| is_active | BOOLEAN | Compte actif/désactivé |
| created_at | TIMESTAMP | Date de création |
| updated_at | TIMESTAMP | Dernière mise à jour |

### 1.3 Table `user_roles` (rôles séparés - sécurité)
| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID (PK) | Identifiant unique |
| user_id | UUID (FK) | Référence à auth.users |
| role | app_role | Rôle de l'utilisateur |

### 1.4 Fonction de sécurité `has_role`
Fonction avec `SECURITY DEFINER` pour vérifier les rôles sans récursion RLS.

### 1.5 Trigger pour créer le profil automatiquement
- Crée automatiquement un profil lors de l'inscription
- Le premier utilisateur reçoit le rôle `super_admin`

### 1.6 Politiques RLS
- Les utilisateurs peuvent voir/modifier leur propre profil
- Les admins peuvent voir tous les profils
- Seuls les super_admins peuvent modifier les rôles

---

## 2. Thème visuel - Couleurs Mon Répétiteur

Mise à jour de `src/index.css` avec les couleurs du logo :
- **Couleur principale (Orange)** : #E87722 → HSL(24, 81%, 52%)
- **Couleur secondaire (Bleu)** : #1B4F8A → HSL(213, 67%, 32%)

---

## 3. Page de connexion/inscription

### Fichier : `src/pages/Auth.tsx`

**Fonctionnalités :**
- Onglets Connexion / Inscription
- Formulaire d'inscription :
  - Nom complet (validation requise)
  - Numéro de téléphone (+225, format ivoirien)
  - Mot de passe (min. 6 caractères)
- Formulaire de connexion :
  - Email (généré à partir du téléphone : `+225XXXXXXXXXX@monrepetiteur.ci`)
  - Mot de passe
- Logo Mon Répétiteur en haut
- Validation avec Zod
- Messages d'erreur en français
- Design responsive (mobile-first)

---

## 4. Dashboard Administrateur

### 4.1 Layout avec sidebar : `src/components/layout/DashboardLayout.tsx`

**Structure :**
```text
+------------------+----------------------------------+
|     SIDEBAR      |           CONTENU                |
|                  |                                  |
|  Logo            |   Header avec titre              |
|  ─────────       |   ────────────────────           |
|  Dashboard       |                                  |
|  Utilisateurs    |   [Contenu de la page]           |
|  Prestataires    |                                  |
|  Clients         |                                  |
|                  |                                  |
|  ─────────       |                                  |
|  Mon Profil      |                                  |
|  Déconnexion     |                                  |
+------------------+----------------------------------+
```

### 4.2 Page Dashboard : `src/pages/admin/Dashboard.tsx`

**Cartes statistiques :**
- Total Utilisateurs
- Prestataires actifs
- Clients inscrits
- Cours ce mois

**Sections :**
- Dernières inscriptions
- Activité récente

### 4.3 Page Utilisateurs : `src/pages/admin/Users.tsx`

**Fonctionnalités :**
- Tableau avec tous les utilisateurs
- Filtres par rôle (Super Admin, Admin, Prestataire, Client)
- Recherche par nom/téléphone
- Actions : Voir profil, Modifier, Activer/Désactiver
- Badge coloré selon le rôle

### 4.4 Composant Profil utilisateur : `src/components/users/UserProfile.tsx`

**Affichage :**
- Photo de profil (avatar)
- Informations personnelles
- Rôle avec badge
- Date d'inscription
- Statut (actif/inactif)
- Boutons d'action selon permissions

---

## 5. Hooks et contextes

### 5.1 Contexte d'authentification : `src/contexts/AuthContext.tsx`
- État de connexion
- Informations utilisateur et profil
- Rôle(s) de l'utilisateur
- Fonctions : login, logout, isAdmin, isSuperAdmin

### 5.2 Hook de vérification des rôles : `src/hooks/useUserRole.ts`
- Récupère les rôles de l'utilisateur connecté
- Fonctions utilitaires : hasRole, isAdmin, isSuperAdmin

---

## 6. Routes et protection

### Mise à jour de `src/App.tsx`

**Routes publiques :**
- `/auth` - Page de connexion/inscription

**Routes protégées (authentifié) :**
- `/` - Redirection selon rôle
- `/dashboard` - Dashboard admin
- `/users` - Gestion des utilisateurs
- `/profile` - Mon profil

### Composant de protection : `src/components/ProtectedRoute.tsx`
- Vérifie l'authentification
- Vérifie les rôles requis
- Redirige si non autorisé

---

## 7. Structure des fichiers à créer

```text
src/
├── contexts/
│   └── AuthContext.tsx
├── hooks/
│   └── useUserRole.ts
├── components/
│   ├── layout/
│   │   ├── DashboardLayout.tsx
│   │   └── Sidebar.tsx
│   ├── users/
│   │   ├── UserProfile.tsx
│   │   ├── UserCard.tsx
│   │   └── RoleBadge.tsx
│   └── ProtectedRoute.tsx
├── pages/
│   ├── Auth.tsx
│   └── admin/
│       ├── Dashboard.tsx
│       ├── Users.tsx
│       └── Profile.tsx
└── lib/
    └── validations.ts (schémas Zod)
```

---

## Détails techniques

### Validation du numéro de téléphone ivoirien
```typescript
const phoneSchema = z.string()
  .regex(/^(\+225)?[0-9]{10}$/, "Numéro de téléphone invalide")
  .transform(val => val.startsWith('+225') ? val : `+225${val}`);
```

### Génération d'email à partir du téléphone
Puisque Supabase Auth nécessite un email, nous générons un email unique :
```typescript
const email = `${phone.replace('+', '')}@monrepetiteur.local`;
```

### Sécurité des rôles
- Les rôles sont stockés dans une table séparée (`user_roles`)
- Vérification côté serveur uniquement via la fonction `has_role`
- Jamais de vérification via localStorage ou cookies

---

## Ordre d'exécution

1. Migration SQL (tables, enum, fonctions, triggers, RLS)
2. Mise à jour du thème CSS
3. Création du contexte d'authentification
4. Page d'authentification
5. Composants de layout (sidebar, dashboard)
6. Pages admin (Dashboard, Users, Profile)
7. Routes protégées
8. Tests de bout en bout
