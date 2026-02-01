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
