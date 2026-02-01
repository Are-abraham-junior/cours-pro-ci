

# Plan : Sélecteur de type d'utilisateur pour l'inscription

## Vue d'ensemble
Ajouter une section de sélection de rôle sur la page d'inscription, inspirée de l'image fournie, permettant à l'utilisateur de choisir entre "Je suis un Parent" ou "Je suis un Répétiteur" avant de remplir le formulaire.

---

## Design proposé

```text
+-----------------------------------------------+
|           Rejoignez Mon Répétiteur            |
|    en tant que Parent ou Répétiteur           |
+-----------------------------------------------+
|                                               |
|  +------------------+  +------------------+   |
|  |       👤         |  |       👨‍🏫         |   |
|  |                  |  |                  |   |
|  |  Je suis un      |  |  Je suis un      |   |
|  |  parent, je      |  |  répétiteur      |   |
|  |  recherche un    |  |  et je propose   |   |
|  |  répétiteur      |  |  mes services    |   |
|  |            ( )   |  |            ( )   |   |
|  +------------------+  +------------------+   |
|                                               |
|  [Formulaire d'inscription si sélection]      |
|                                               |
+-----------------------------------------------+
```

---

## Modifications techniques

### 1. Mise a jour du schema de validation (`src/lib/validations.ts`)

Ajouter un champ optionnel `userType` au schema d'inscription :

```typescript
export const signUpSchema = z.object({
  fullName: z.string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom est trop long"),
  phone: phoneSchema,
  password: z.string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères")
    .max(72, "Le mot de passe est trop long"),
  userType: z.enum(['client', 'prestataire']).optional(),
});
```

### 2. Nouveau composant `UserTypeSelector` (`src/components/auth/UserTypeSelector.tsx`)

Composant reutilisable avec deux cartes cliquables :
- **Card Parent** : Icone utilisateur, description "Je suis un parent, je recherche un repetiteur pour mon enfant"
- **Card Repetiteur** : Icone professeur, description "Je suis un repetiteur et je propose mes services"
- Radio button integre pour la selection
- Animation de selection (bordure coloree, effet d'elevation)

### 3. Modification de la page Auth (`src/pages/Auth.tsx`)

**Nouveau flux d'inscription en deux etapes :**

1. **Etape 1** : Selection du type d'utilisateur (Parent ou Repetiteur)
   - Affichage des deux cartes
   - Bouton "Continuer" desactive tant qu'aucune selection

2. **Etape 2** : Formulaire d'inscription classique
   - Nom complet
   - Numero de telephone
   - Mot de passe
   - Bouton retour pour changer de type

**Logique de transmission du role :**
- Le type selectionne sera transmis via `user_metadata` lors de l'inscription
- Le trigger `handle_new_user()` utilisera cette information au lieu du role par defaut

### 4. Mise a jour du trigger SQL (migration)

Modifier la fonction `handle_new_user()` pour lire le type d'utilisateur depuis les metadonnees :

```sql
-- Dans handle_new_user():
_user_type := COALESCE(
  NEW.raw_user_meta_data->>'user_type', 
  'client'
)::public.app_role;

-- Assigner le role en fonction du type choisi
IF _is_first_user THEN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'super_admin');
ELSE
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _user_type);
END IF;
```

---

## Structure des fichiers

| Fichier | Action |
|---------|--------|
| `src/components/auth/UserTypeSelector.tsx` | Creer |
| `src/pages/Auth.tsx` | Modifier |
| `src/lib/validations.ts` | Modifier |
| Migration SQL | Creer |

---

## Details visuels

**Style des cartes de selection :**
- Fond blanc avec bordure gris clair
- Au survol : ombre legere
- Selection : bordure orange (primary), fond orange tres leger
- Radio button en haut a droite de chaque carte
- Icones Lucide : `Users` pour parent, `GraduationCap` pour repetiteur

**Couleurs utilisees :**
- Bordure selection : `border-primary` (orange)
- Fond selection : `bg-primary/5`
- Texte description : `text-muted-foreground`

---

## Experience utilisateur

1. L'utilisateur arrive sur l'onglet "Inscription"
2. Il voit les deux cartes de selection
3. Il clique sur "Parent" ou "Repetiteur"
4. Le formulaire d'inscription apparait avec un indicateur du type choisi
5. Il remplit le formulaire et soumet
6. Le compte est cree avec le role correspondant

**Note importante :** Le premier utilisateur reste automatiquement Super Admin, independamment de son choix de type.

