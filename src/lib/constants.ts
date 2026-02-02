// Matières disponibles
export const MATIERES = [
  'Mathématiques',
  'Français',
  'Anglais',
  'Physique-Chimie',
  'SVT',
  'Histoire-Géographie',
  'Philosophie',
  'Économie',
  'Espagnol',
  'Allemand',
  'Informatique',
  'Dessin',
  'Musique',
  'Éducation physique',
] as const;

// Niveaux scolaires
export const NIVEAUX = [
  'CP',
  'CE1',
  'CE2',
  'CM1',
  'CM2',
  '6ème',
  '5ème',
  '4ème',
  '3ème',
  '2nde',
  '1ère',
  'Terminale',
  'Université',
  'Formation professionnelle',
] as const;

// Fréquences de cours
export const FREQUENCES = [
  '1 fois par semaine',
  '2 fois par semaine',
  '3 fois par semaine',
  'Tous les jours',
  'Week-end uniquement',
  'À la demande',
] as const;

// Statuts des offres
export const OFFER_STATUS_LABELS = {
  ouverte: 'Ouverte',
  en_cours: 'En cours',
  fermee: 'Fermée',
} as const;

// Statuts des candidatures
export const APPLICATION_STATUS_LABELS = {
  en_attente: 'En attente',
  acceptee: 'Acceptée',
  refusee: 'Refusée',
} as const;

export type Matiere = typeof MATIERES[number];
export type Niveau = typeof NIVEAUX[number];
export type Frequence = typeof FREQUENCES[number];
export type OfferStatus = keyof typeof OFFER_STATUS_LABELS;
export type ApplicationStatus = keyof typeof APPLICATION_STATUS_LABELS;
