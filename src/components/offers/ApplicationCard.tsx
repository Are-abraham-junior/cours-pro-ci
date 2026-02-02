import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { APPLICATION_STATUS_LABELS, ApplicationStatus } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Check, X, Clock } from 'lucide-react';

interface ApplicationCardProps {
  application: {
    id: string;
    message: string;
    statut: ApplicationStatus;
    created_at: string;
    repetiteur?: {
      id: string;
      full_name: string;
      avatar_url?: string | null;
      phone: string;
    };
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
  en_attente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  acceptee: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  refusee: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
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
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          {variant === 'parent' && application.repetiteur && (
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={application.repetiteur.avatar_url || undefined} />
                <AvatarFallback>
                  {getInitials(application.repetiteur.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">
                  {application.repetiteur.full_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {application.repetiteur.phone}
                </p>
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

      <CardContent>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          {application.message}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
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
