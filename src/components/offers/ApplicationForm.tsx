import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { applicationSchema, ApplicationFormData } from '@/lib/validations';
import { Loader2 } from 'lucide-react';

interface ApplicationFormProps {
  onSubmit: (data: ApplicationFormData) => Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
}

export function ApplicationForm({
  onSubmit,
  isLoading = false,
  onCancel,
}: ApplicationFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      message: '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="message">Votre message de présentation *</Label>
        <Textarea
          id="message"
          placeholder="Présentez-vous et expliquez pourquoi vous êtes le répétiteur idéal pour cette offre..."
          rows={6}
          {...register('message')}
        />
        {errors.message && (
          <p className="text-sm text-destructive">{errors.message.message}</p>
        )}
      </div>

      <div className="flex gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Annuler
          </Button>
        )}
        <Button type="submit" className="flex-1" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Envoi en cours...
            </>
          ) : (
            'Envoyer ma candidature'
          )}
        </Button>
      </div>
    </form>
  );
}
