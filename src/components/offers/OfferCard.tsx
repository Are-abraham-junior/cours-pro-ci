import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Coins, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { OFFER_STATUS_LABELS, OfferStatus } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface OfferCardProps {
  offer: {
    id: string;
    matiere: string;
    niveau: string;
    description: string;
    adresse: string;
    frequence: string;
    budget_min: number;
    budget_max: number;
    statut: OfferStatus;
    created_at: string;
    applications_count?: number;
  };
  showStatus?: boolean;
  showApplicationsCount?: boolean;
  actionLabel?: string;
  onAction?: (offerId: string) => void;
  variant?: 'parent' | 'repetiteur';
}

const statusColors: Record<OfferStatus, string> = {
  ouverte: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  en_cours: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  fermee: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
};

export function OfferCard({
  offer,
  showStatus = false,
  showApplicationsCount = false,
  actionLabel,
  onAction,
  variant = 'repetiteur',
}: OfferCardProps) {
  const formatBudget = (min: number, max: number) => {
    const formatter = new Intl.NumberFormat('fr-FR');
    if (min === max) {
      return `${formatter.format(min)} FCFA`;
    }
    return `${formatter.format(min)} - ${formatter.format(max)} FCFA`;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-lg text-foreground">
              {offer.matiere}
            </h3>
            <p className="text-sm text-muted-foreground">{offer.niveau}</p>
          </div>
          {showStatus && (
            <Badge className={cn('shrink-0', statusColors[offer.statut])}>
              {OFFER_STATUS_LABELS[offer.statut]}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm text-foreground line-clamp-2">{offer.description}</p>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{offer.adresse}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 shrink-0" />
            <span className="truncate">{offer.frequence}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Coins className="h-4 w-4 shrink-0" />
            <span className="truncate">{formatBudget(offer.budget_min, offer.budget_max)}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {formatDistanceToNow(new Date(offer.created_at), {
                addSuffix: true,
                locale: fr,
              })}
            </span>
          </div>
        </div>

        {showApplicationsCount && offer.applications_count !== undefined && (
          <p className="text-sm text-muted-foreground">
            {offer.applications_count} candidature{offer.applications_count > 1 ? 's' : ''}
          </p>
        )}
      </CardContent>

      {actionLabel && onAction && (
        <CardFooter className="pt-2">
          <Button
            onClick={() => onAction(offer.id)}
            className="w-full"
            variant={variant === 'parent' ? 'outline' : 'default'}
          >
            {actionLabel}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
