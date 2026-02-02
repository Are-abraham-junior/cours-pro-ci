import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { offerSchema, OfferFormData } from '@/lib/validations';
import { MATIERES, NIVEAUX, FREQUENCES } from '@/lib/constants';
import { Loader2 } from 'lucide-react';

interface OfferFormProps {
  onSubmit: (data: OfferFormData) => Promise<void>;
  isLoading?: boolean;
  defaultValues?: Partial<OfferFormData>;
  submitLabel?: string;
}

export function OfferForm({
  onSubmit,
  isLoading = false,
  defaultValues,
  submitLabel = 'Publier l\'offre',
}: OfferFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OfferFormData>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      matiere: '',
      niveau: '',
      description: '',
      adresse: '',
      frequence: '',
      budget_min: 5000,
      budget_max: 25000,
      ...defaultValues,
    },
  });

  const matiere = watch('matiere');
  const niveau = watch('niveau');
  const frequence = watch('frequence');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Matière */}
        <div className="space-y-2">
          <Label htmlFor="matiere">Matière *</Label>
          <Select
            value={matiere}
            onValueChange={(value) => setValue('matiere', value)}
          >
            <SelectTrigger id="matiere">
              <SelectValue placeholder="Sélectionnez une matière" />
            </SelectTrigger>
            <SelectContent>
              {MATIERES.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.matiere && (
            <p className="text-sm text-destructive">{errors.matiere.message}</p>
          )}
        </div>

        {/* Niveau */}
        <div className="space-y-2">
          <Label htmlFor="niveau">Niveau scolaire *</Label>
          <Select
            value={niveau}
            onValueChange={(value) => setValue('niveau', value)}
          >
            <SelectTrigger id="niveau">
              <SelectValue placeholder="Sélectionnez un niveau" />
            </SelectTrigger>
            <SelectContent>
              {NIVEAUX.map((n) => (
                <SelectItem key={n} value={n}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.niveau && (
            <p className="text-sm text-destructive">{errors.niveau.message}</p>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description des besoins *</Label>
        <Textarea
          id="description"
          placeholder="Décrivez vos besoins : objectifs, difficultés rencontrées, attentes particulières..."
          rows={4}
          {...register('description')}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Adresse */}
      <div className="space-y-2">
        <Label htmlFor="adresse">Adresse des cours *</Label>
        <Input
          id="adresse"
          placeholder="Ex: Quartier Cocody, Abidjan"
          {...register('adresse')}
        />
        {errors.adresse && (
          <p className="text-sm text-destructive">{errors.adresse.message}</p>
        )}
      </div>

      {/* Fréquence */}
      <div className="space-y-2">
        <Label htmlFor="frequence">Fréquence souhaitée *</Label>
        <Select
          value={frequence}
          onValueChange={(value) => setValue('frequence', value)}
        >
          <SelectTrigger id="frequence">
            <SelectValue placeholder="Sélectionnez une fréquence" />
          </SelectTrigger>
          <SelectContent>
            {FREQUENCES.map((f) => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.frequence && (
          <p className="text-sm text-destructive">{errors.frequence.message}</p>
        )}
      </div>

      {/* Budget */}
      <div className="space-y-2">
        <Label>Budget mensuel (FCFA) *</Label>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Input
              type="number"
              placeholder="Minimum"
              {...register('budget_min', { valueAsNumber: true })}
            />
            {errors.budget_min && (
              <p className="text-sm text-destructive mt-1">{errors.budget_min.message}</p>
            )}
          </div>
          <div>
            <Input
              type="number"
              placeholder="Maximum"
              {...register('budget_max', { valueAsNumber: true })}
            />
            {errors.budget_max && (
              <p className="text-sm text-destructive mt-1">{errors.budget_max.message}</p>
            )}
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Publication en cours...
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  );
}
