import { Users, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export type UserType = 'client' | 'prestataire';

interface UserTypeSelectorProps {
  value: UserType | undefined;
  onChange: (value: UserType) => void;
}

const userTypes = [
  {
    value: 'client' as const,
    icon: Users,
    title: 'Je suis un Parent',
    description: 'Je recherche un répétiteur pour mon enfant',
  },
  {
    value: 'prestataire' as const,
    icon: GraduationCap,
    title: 'Je suis un Répétiteur',
    description: 'Je propose mes services de cours particuliers',
  },
];

export function UserTypeSelector({ value, onChange }: UserTypeSelectorProps) {
  return (
    <RadioGroup
      value={value}
      onValueChange={(val) => onChange(val as UserType)}
      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
    >
      {userTypes.map((type) => {
        const Icon = type.icon;
        const isSelected = value === type.value;
        
        return (
          <label
            key={type.value}
            className={cn(
              'relative flex flex-col items-center p-6 rounded-xl border-2 cursor-pointer transition-all duration-200',
              'hover:shadow-md hover:border-primary/50',
              isSelected
                ? 'border-primary bg-primary/5 shadow-md'
                : 'border-border bg-card'
            )}
          >
            {/* Radio button en haut à droite */}
            <div className="absolute top-3 right-3">
              <RadioGroupItem value={type.value} className="h-5 w-5" />
            </div>

            {/* Icône */}
            <div
              className={cn(
                'w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors',
                isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              )}
            >
              <Icon className="w-8 h-8" />
            </div>

            {/* Texte */}
            <h3 className="font-semibold text-foreground text-center mb-2">
              {type.title}
            </h3>
            <p className="text-sm text-muted-foreground text-center">
              {type.description}
            </p>
          </label>
        );
      })}
    </RadioGroup>
  );
}
