import { z } from "zod";

// Validation du numéro de téléphone ivoirien
export const phoneSchema = z.string()
  .min(10, "Le numéro doit contenir au moins 10 chiffres")
  .regex(/^(\+225)?[0-9]{10}$/, "Format invalide. Exemple: 0701020304 ou +2250701020304")
  .transform(val => {
    const digits = val.replace(/\D/g, '');
    if (digits.startsWith('225')) {
      return `+${digits}`;
    }
    return `+225${digits}`;
  });

// Type d'utilisateur
export const userTypeSchema = z.enum(['client', 'prestataire']);
export type UserType = z.infer<typeof userTypeSchema>;

// Schéma d'inscription
export const signUpSchema = z.object({
  fullName: z.string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom est trop long"),
  phone: phoneSchema,
  password: z.string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères")
    .max(72, "Le mot de passe est trop long"),
  userType: userTypeSchema,
});

// Schéma de connexion
export const signInSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, "Le mot de passe est requis"),
});

// Génère un email à partir du numéro de téléphone
export const phoneToEmail = (phone: string): string => {
  const cleanPhone = phone.replace(/\+/g, '');
  return `${cleanPhone}@monrepetiteur.local`;
};

export type SignUpFormData = z.infer<typeof signUpSchema>;
export type SignInFormData = z.infer<typeof signInSchema>;

// Schéma pour la création d'une offre
export const offerSchema = z.object({
  matiere: z.string().min(1, "Sélectionnez une matière"),
  niveau: z.string().min(1, "Sélectionnez un niveau"),
  description: z.string()
    .min(20, "La description doit contenir au moins 20 caractères")
    .max(500, "La description ne peut pas dépasser 500 caractères"),
  adresse: z.string().min(5, "L'adresse doit contenir au moins 5 caractères"),
  frequence: z.string().min(1, "Sélectionnez une fréquence"),
  budget_min: z.number()
    .min(1000, "Le budget minimum est de 1 000 FCFA")
    .max(500000, "Le budget maximum est de 500 000 FCFA"),
  budget_max: z.number()
    .min(1000, "Le budget minimum est de 1 000 FCFA")
    .max(500000, "Le budget maximum est de 500 000 FCFA"),
}).refine(data => data.budget_max >= data.budget_min, {
  message: "Le budget maximum doit être supérieur ou égal au budget minimum",
  path: ["budget_max"],
});

// Schéma pour une candidature
export const applicationSchema = z.object({
  message: z.string()
    .min(20, "Votre message doit contenir au moins 20 caractères")
    .max(1000, "Votre message ne peut pas dépasser 1000 caractères"),
});

export type OfferFormData = z.infer<typeof offerSchema>;
export type ApplicationFormData = z.infer<typeof applicationSchema>;
