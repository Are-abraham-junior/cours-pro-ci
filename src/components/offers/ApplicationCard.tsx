import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { APPLICATION_STATUS_LABELS, ApplicationStatus } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Check, X, Clock, ChevronDown, MapPin, Briefcase, GraduationCap, Banknote } from 'lucide-react';
import { useState } from 'react';

interface RepetiteurProfile {
  id: string;
  full_name: string;
  avatar_url?: string | null;
  phone: string;
  bio?: string | null;
  matieres?: string[] | null;
  niveaux?: string[] | null;
  localisation?: string | null;
  tarif_horaire?: number | null;
  experience_annees?: number | null;
  profil_complet?: boolean;
}

interface ApplicationCardProps {
  application: {
    id: string;
    message: string;
    statut: ApplicationStatus;
    created_at: string;
    repetiteur?: RepetiteurProfile;
    offer?: {
      id: string;
      matiere: string;
      niveau: string;
    };
  };
  variant: 'parent' | 'repetiteur';
  onAccept?: (applicationId: string) => void;
  onReject?: (applicationId: string) => void;
  onViewOffer?: (offerId: string) => void;
  isLoading?: boolean;
}

const statusColors: Record<ApplicationStatus, string> = {
  en_attente: 'bg-secondary text-secondary-foreground',
  acceptee: 'bg-primary/10 text-primary',
  refusee: 'bg-destructive/10 text-destructive',
};

const statusIcons: Record<ApplicationStatus, React.ReactNode> = {
  en_attente: <Clock className="h-3 w-3" />,
  acceptee: <Check className="h-3 w-3" />,
  refusee: <X className="h-3 w-3" />,
};

export function ApplicationCard({
  application,
  variant,
  onAccept,
  onReject,
  onViewOffer,
  isLoading = false,
}: ApplicationCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  const repetiteur = application.repetiteur;
  const hasEnrichedProfile = repetiteur && (
    repetiteur.bio || 
    (repetiteur.matieres && repetiteur.matieres.length > 0) ||
    (repetiteur.niveaux && repetiteur.niveaux.length > 0) ||
    repetiteur.localisation ||
    repetiteur.experience_annees
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          {variant === 'parent' && repetiteur && (
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={repetiteur.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {getInitials(repetiteur.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground">
                    {repetiteur.full_name}
                  </p>
                  {repetiteur.profil_complet && (
                    <Badge variant="outline" className="text-xs">Profil complet</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {repetiteur.phone}
                </p>
                {repetiteur.experience_annees && repetiteur.experience_annees > 0 && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Briefcase className="h-3 w-3" />
                    {repetiteur.experience_annees} an{repetiteur.experience_annees > 1 ? 's' : ''} d'expérience
                  </p>
                )}
              </div>
            </div>
          )}

          {variant === 'repetiteur' && application.offer && (
            <div>
              <p className="font-medium text-foreground">
                {application.offer.matiere} - {application.offer.niveau}
              </p>
            </div>
          )}

          <Badge className={cn('shrink-0 flex items-center gap-1', statusColors[application.statut])}>
            {statusIcons[application.statut]}
            {APPLICATION_STATUS_LABELS[application.statut]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Message de candidature */}
        <div>
          <p className="text-sm font-medium text-foreground mb-1">Message de candidature</p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {application.message}
          </p>
        </div>

        {/* Infos enrichies du répétiteur - Vue parent uniquement */}
        {variant === 'parent' && hasEnrichedProfile && (
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between">
                <span className="text-sm">Voir le profil détaillé</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-3 border-t mt-3">
              {/* Bio */}
              {repetiteur?.bio && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Présentation</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {repetiteur.bio}
                  </p>
                </div>
              )}

              {/* Localisation et tarif */}
              <div className="flex flex-wrap gap-4">
                {repetiteur?.localisation && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{repetiteur.localisation}</span>
                  </div>
                )}
                {repetiteur?.tarif_horaire && repetiteur.tarif_horaire > 0 && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Banknote className="h-4 w-4" />
                    <span>{formatCurrency(repetiteur.tarif_horaire)}/h</span>
                  </div>
                )}
              </div>

              {/* Matières */}
              {repetiteur?.matieres && repetiteur.matieres.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-1">
                    <GraduationCap className="h-4 w-4" />
                    Matières enseignées
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {repetiteur.matieres.map((matiere) => (
                      <Badge key={matiere} variant="secondary" className="text-xs">
                        {matiere}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Niveaux */}
              {repetiteur?.niveaux && repetiteur.niveaux.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Niveaux</p>
                  <div className="flex flex-wrap gap-1">
                    {repetiteur.niveaux.map((niveau) => (
                      <Badge key={niveau} variant="outline" className="text-xs">
                        {niveau}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}

        <p className="text-xs text-muted-foreground">
          Envoyée {formatDistanceToNow(new Date(application.created_at), {
            addSuffix: true,
            locale: fr,
          })}
        </p>
      </CardContent>

      {(variant === 'parent' && application.statut === 'en_attente' && onAccept && onReject) && (
        <CardFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onReject(application.id)}
            disabled={isLoading}
            className="flex-1"
          >
            <X className="h-4 w-4 mr-1" />
            Refuser
          </Button>
          <Button
            size="sm"
            onClick={() => onAccept(application.id)}
            disabled={isLoading}
            className="flex-1"
          >
            <Check className="h-4 w-4 mr-1" />
            Accepter
          </Button>
        </CardFooter>
      )}

      {variant === 'repetiteur' && onViewOffer && application.offer && (
        <CardFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewOffer(application.offer!.id)}
            className="w-full"
          >
            Voir l'offre
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
