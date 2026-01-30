
# Plan de développement - Mon Répétiteur

## Phase 1 : Fondations (Première étape)
### Connexion à Supabase
- Configuration de la base de données Supabase
- Mise en place des tables principales : `profiles`, `user_roles`

### Système d'authentification
- Page de connexion/inscription moderne avec le branding (orange/bleu)
- Formulaire d'inscription : Nom complet, Numéro de téléphone, Mot de passe
- Le premier utilisateur créé sera automatiquement Super Admin
- Validation des numéros de téléphone ivoiriens (format +225)

### Thème visuel
- Application des couleurs du logo (orange principal, bleu secondaire)
- Interface moderne et professionnelle adaptée au mobile

---

## Phase 2 : Espace Super Admin
### Dashboard administrateur
- Vue d'ensemble des statistiques (répétiteurs, parents, cours)
- Gestion des répétiteurs (ajout, modification, activation/désactivation)
- Gestion des parents inscrits
- Historique des cours réservés

---

## Phase 3 : Gestion des Répétiteurs
### Profil répétiteur
- Informations personnelles (nom, téléphone, photo)
- Matières enseignées (Mathématiques, Français, Sciences, etc.)
- Niveaux pris en charge (Primaire, Collège, Lycée)
- Zones d'intervention (quartiers/communes d'Abidjan)
- Disponibilités hebdomadaires

### Espace répétiteur
- Calendrier des cours assignés
- Historique des séances effectuées

---

## Phase 4 : Espace Parents & Réservation
### Inscription parent
- Formulaire : Nom, Téléphone, Adresse/Quartier
- Ajout d'enfants (nom, niveau scolaire)

### Système de réservation
- Recherche de répétiteurs par matière, niveau, zone
- Consultation des disponibilités
- Réservation de créneaux
- Confirmation par le Super Admin

---

## Phase 5 : Suivi des Séances
### Pour les répétiteurs
- Marquage de présence
- Rapport de séance (ce qui a été vu, notes)

### Pour les parents
- Historique des cours
- Consultation des rapports de progression

### Pour l'admin
- Vue globale de toutes les séances
- Statistiques et rapports

---

## Configuration PWA
- Installation sur l'écran d'accueil (mobile et desktop)
- Fonctionnement hors-ligne basique
- Icône et splash screen aux couleurs de Mon Répétiteur
