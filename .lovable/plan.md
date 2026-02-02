
# Plan d'Implémentation Progressive : Système d'Offres de Cours

## Vue d'ensemble

Ce plan implémente le **cycle de vie complet des offres de cours** selon le cahier des charges : création d'offres par les Parents, consultation et candidatures par les Répétiteurs.

---

## État actuel du projet

| Fonctionnalité | Statut |
|----------------|--------|
| Authentification (téléphone + mot de passe) | ✅ Fait |
| Sélection du rôle (Parent/Répétiteur) | ✅ Fait |
| Profils utilisateurs (nom, téléphone, avatar) | ✅ Fait |
| Dashboard Admin avec statistiques | ✅ Fait |
| Gestion des utilisateurs (liste, activation) | ✅ Fait |
| **Système d'offres de cours** | 🔴 À faire |

---

## Phase 1 : Base de données (Migration SQL)

### Nouvelles tables à créer

```text
+------------------+          +------------------+
|      offers      |          |   applications   |
+------------------+          +------------------+
| id               |<-------->| id               |
| parent_id (FK)   |          | offer_id (FK)    |
| matiere          |          | repetiteur_id    |
| niveau           |          | statut           |
| description      |          | message          |
| adresse          |          | created_at       |
| frequence        |          +------------------+
| budget           |
| statut           |
| created_at       |
+------------------+
```

### Table `offers` (Offres de cours)

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | Identifiant unique |
| parent_id | UUID (FK profiles) | Parent créateur |
| matiere | TEXT | Matière (Maths, Français, etc.) |
| niveau | TEXT | Niveau scolaire (CP, CE1, 6ème, etc.) |
| description | TEXT | Détails du cours souhaité |
| adresse | TEXT | Lieu des cours |
| frequence | TEXT | Fréquence (1x/semaine, 2x/semaine, etc.) |
| budget_min | INTEGER | Budget minimum en FCFA |
| budget_max | INTEGER | Budget maximum en FCFA |
| statut | ENUM | ouverte, en_cours, fermee |
| created_at | TIMESTAMP | Date de création |

### Table `applications` (Candidatures)

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | Identifiant unique |
| offer_id | UUID (FK offers) | Offre concernée |
| repetiteur_id | UUID (FK profiles) | Répétiteur candidat |
| message | TEXT | Message de présentation |
| statut | ENUM | en_attente, acceptee, refusee |
| created_at | TIMESTAMP | Date de candidature |

### Politiques RLS

- **Parents** : peuvent créer/modifier leurs propres offres
- **Répétiteurs** : peuvent voir les offres ouvertes et leurs candidatures
- **Admins** : accès complet à toutes les données

---

## Phase 2 : Interface Parent - Création d'Offres

### Page `/mes-offres` pour les Parents

**Fonctionnalités :**
- Liste des offres créées par le Parent
- Bouton "Nouvelle offre" ouvrant un formulaire
- Statut de chaque offre (ouverte, en cours, fermée)
- Nombre de candidatures reçues par offre

### Formulaire de création d'offre

```text
+-----------------------------------------------+
|          Créer une offre de cours             |
+-----------------------------------------------+
|                                               |
|  Matière :        [Sélection v]               |
|  (Mathématiques, Français, Anglais,           |
|   Physique-Chimie, SVT, Histoire-Géo...)      |
|                                               |
|  Niveau scolaire : [Sélection v]              |
|  (CP, CE1, CE2... Terminale)                  |
|                                               |
|  Description :                                |
|  [                                          ] |
|  [  Décrivez vos besoins...                 ] |
|                                               |
|  Adresse des cours :                          |
|  [                                          ] |
|                                               |
|  Fréquence :       [Sélection v]              |
|  (1x/sem, 2x/sem, 3x/sem, Tous les jours)     |
|                                               |
|  Budget (FCFA) :                              |
|  Min [      ]  à  Max [      ]                |
|                                               |
|         [Publier l'offre]                     |
+-----------------------------------------------+
```

### Gestion des candidatures

- Liste des répétiteurs ayant postulé
- Affichage du profil et message de chaque candidat
- Boutons "Accepter" / "Refuser" pour chaque candidature

---

## Phase 3 : Interface Répétiteur - Consultation et Candidature

### Page `/offres` pour les Répétiteurs

**Fonctionnalités :**
- Liste des offres ouvertes
- Filtres par matière et niveau
- Recherche par mot-clé
- Détails de chaque offre avec bouton "Postuler"

### Vue liste des offres

```text
+-----------------------------------------------+
|  Offres de cours disponibles                  |
+-----------------------------------------------+
|  [Filtrer par matière v] [Filtrer par niveau v]  
|                                               |
|  +------------------------------------------+ |
|  | Mathématiques - 3ème                     | |
|  | Quartier Cocody, Abidjan                 | |
|  | 2x par semaine • 15 000 - 25 000 FCFA    | |
|  | Publié il y a 2 jours                    | |
|  |                           [Voir détails] | |
|  +------------------------------------------+ |
|                                               |
|  +------------------------------------------+ |
|  | Français - CM2                           | |
|  | Quartier Marcory, Abidjan                | |
|  | 1x par semaine • 10 000 - 15 000 FCFA    | |
|  | Publié il y a 5 jours                    | |
|  |                           [Voir détails] | |
|  +------------------------------------------+ |
+-----------------------------------------------+
```

### Modal de candidature

```text
+-----------------------------------------------+
|     Postuler à cette offre                    |
+-----------------------------------------------+
|                                               |
|  Mathématiques - 3ème                         |
|  Quartier Cocody, Abidjan                     |
|                                               |
|  Votre message de présentation :              |
|  [                                          ] |
|  [  Présentez-vous et expliquez pourquoi    ] |
|  [  vous êtes le répétiteur idéal...        ] |
|                                               |
|         [Envoyer ma candidature]              |
+-----------------------------------------------+
```

### Page "Mes candidatures"

- Historique de toutes les candidatures envoyées
- Statut de chaque candidature (en attente, acceptée, refusée)
- Accès aux détails de l'offre

---

## Phase 4 : Dashboards adaptés par rôle

### Dashboard Parent

- Nombre d'offres actives
- Nombre de candidatures en attente
- Dernières candidatures reçues
- Accès rapide à "Créer une offre"

### Dashboard Répétiteur

- Offres récentes correspondant à son profil
- Statut des candidatures en cours
- Accès rapide à "Voir les offres"

### Dashboard Admin (mise à jour)

- Statistiques globales des offres
- Nombre total d'offres actives
- Nombre de candidatures ce mois
- Modération des offres si nécessaire

---

## Structure des fichiers à créer

```text
src/
├── pages/
│   ├── parent/
│   │   ├── MesOffres.tsx        # Liste des offres du parent
│   │   ├── NouvelleOffre.tsx    # Formulaire création
│   │   └── OffreDetails.tsx     # Détail + candidatures
│   └── repetiteur/
│       ├── OffresDisponibles.tsx  # Liste offres ouvertes
│       ├── MesCandidatures.tsx    # Mes candidatures
│       └── OffreDetails.tsx       # Détail + postuler
├── components/
│   ├── offers/
│   │   ├── OfferCard.tsx        # Carte d'offre réutilisable
│   │   ├── OfferForm.tsx        # Formulaire création/édition
│   │   ├── ApplicationCard.tsx  # Carte de candidature
│   │   └── ApplicationForm.tsx  # Formulaire candidature
│   └── layout/
│       └── Sidebar.tsx          # (mise à jour navigation)
└── lib/
    └── validations.ts           # (ajout schémas Zod)
```

---

## Mises à jour de la navigation

### Sidebar mise à jour

**Pour les Parents :**
- Tableau de bord
- Mes offres
- Mon profil

**Pour les Répétiteurs :**
- Tableau de bord
- Offres disponibles
- Mes candidatures
- Mon profil

**Pour les Admins :**
- Tableau de bord
- Utilisateurs
- Répétiteurs
- Parents
- Offres (modération)
- Mon profil

---

## Ordre d'exécution recommandé

| Étape | Description | Priorité |
|-------|-------------|----------|
| 1 | Migration SQL (tables offers, applications + RLS) | Haute |
| 2 | Schémas de validation Zod pour les formulaires | Haute |
| 3 | Page Parent : Liste "Mes offres" | Haute |
| 4 | Page Parent : Formulaire "Nouvelle offre" | Haute |
| 5 | Page Répétiteur : Liste "Offres disponibles" | Haute |
| 6 | Page Répétiteur : Formulaire de candidature | Haute |
| 7 | Page Parent : Gestion des candidatures | Moyenne |
| 8 | Page Répétiteur : "Mes candidatures" | Moyenne |
| 9 | Mise à jour des dashboards par rôle | Moyenne |
| 10 | Mise à jour de la sidebar dynamique | Moyenne |

---

## Détails techniques

### Enums SQL pour les statuts

```sql
CREATE TYPE offer_status AS ENUM ('ouverte', 'en_cours', 'fermee');
CREATE TYPE application_status AS ENUM ('en_attente', 'acceptee', 'refusee');
```

### Validation Zod pour le formulaire d'offre

```typescript
const offerSchema = z.object({
  matiere: z.string().min(1, "Sélectionnez une matière"),
  niveau: z.string().min(1, "Sélectionnez un niveau"),
  description: z.string()
    .min(20, "Minimum 20 caractères")
    .max(500, "Maximum 500 caractères"),
  adresse: z.string().min(5, "Adresse requise"),
  frequence: z.string().min(1, "Sélectionnez une fréquence"),
  budget_min: z.number().min(1000, "Budget minimum 1000 FCFA"),
  budget_max: z.number().min(1000, "Budget minimum 1000 FCFA"),
}).refine(data => data.budget_max >= data.budget_min, {
  message: "Le budget max doit être supérieur au budget min",
  path: ["budget_max"],
});
```

### Sécurité RLS

Les politiques RLS garantiront que :
- Un Parent ne peut modifier que ses propres offres
- Un Répétiteur ne peut voir que les offres ouvertes
- Un Répétiteur ne peut pas postuler à sa propre offre
- Seuls les Admins peuvent supprimer des offres

---

## Prochaines étapes après cette phase

Une fois le système d'offres fonctionnel, les prochaines fonctionnalités à implémenter seront :
1. **Profil Répétiteur enrichi** (matières, niveaux, disponibilités, biographie)
2. **Système de contrats numériques** (après acceptation d'une candidature)
3. **Messagerie interne** (chat entre Parent et Répétiteur)
4. **Système de notation** (évaluation après fin de contrat)
5. **Abonnements Répétiteurs** (limites de candidatures)
