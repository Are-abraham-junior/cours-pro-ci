import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  MessageSquare, 
  Map as MapIcon, 
  Star, 
  User, 
  Loader2 
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

// Fix pour les icônes de marqueurs Leaflet avec Vite (les chemins relatifs sont parfois mal résolus)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Interface pour le profil du répétiteur géolocalisé
interface RepetiteurMarker {
  id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  matieres: string[];
  niveaux: string[];
  tarif_horaire: number | null;
  experience_annees: number;
  latitude: number;
  longitude: number;
}

export default function RechercheCarte() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [repetiteurs, setRepetiteurs] = useState<RepetiteurMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedRep, setSelectedRep] = useState<RepetiteurMarker | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreatingConv, setIsCreatingConv] = useState(false);

  // Centre par défaut : Abidjan
  const defaultCenter: [number, number] = [5.3364, -4.0267];

  useEffect(() => {
    fetchRepetiteurs();

    // Demander la position du parent pour centrer la carte
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        () => {
          // Si refusé ou erreur, on garde le centre par défaut (Abidjan)
        }
      );
    }
  }, []);

  const fetchRepetiteurs = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id, 
          full_name, 
          avatar_url, 
          bio, 
          matieres, 
          niveaux, 
          tarif_horaire, 
          experience_annees, 
          latitude, 
          longitude
        `)
        .eq('profil_complet', true)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (error) throw error;
      setRepetiteurs(data as RepetiteurMarker[]);
    } catch (error) {
      console.error('Erreur lors du chargement des répétiteurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBudget = (amount: number | null) => {
    if (!amount) return 'Prix à débattre';
    return `${new Intl.NumberFormat('fr-FR').format(amount)} FCFA/h`;
  };

  const handleStartDiscussion = async () => {
    if (!user || !selectedRep) return;
    
    setIsCreatingConv(true);
    try {
      // 1. Créer ou récupérer la conversation directe
      // Note: On utilise select + insert au lieu de upsert pour mieux gérer l'id retourné
      const { data: existingConv, error: fetchError } = await supabase
        .from('direct_conversations' as any)
        .select('id')
        .eq('parent_id', user.id)
        .eq('repetiteur_id', selectedRep.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      let conversationId = existingConv?.id;

      if (!conversationId) {
        const { data: newConv, error: createError } = await supabase
          .from('direct_conversations' as any)
          .insert({
            parent_id: user.id,
            repetiteur_id: selectedRep.id
          })
          .select()
          .single();

        if (createError) throw createError;
        conversationId = newConv.id;

        // 2. Envoyer le message système initial
        await supabase.from('messages' as any).insert({
          conversation_id: conversationId,
          sender_id: user.id, // Le parent initie, mais c'est un message système
          content: "Un parent souhaite vous contacter pour des cours particuliers. Votre premier message de réponse déduira 1 token de votre solde.",
          is_system: true
        });
      }

      // 3. Rediriger vers la messagerie
      navigate(`/mes-messages/direct/${conversationId}`);
      
    } catch (error) {
      console.error('Erreur lors de la création de la discussion:', error);
      toast({
        title: "Erreur",
        description: "Impossible de démarrer la discussion. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsCreatingConv(false);
      setIsDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Recherche à proximité">
        <div className="flex items-center justify-center h-[70vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Recherche de Répétiteurs"
      description="Trouvez les professeurs particuliers les plus proches de chez vous"
    >
      <Card className="border-0 shadow-lg overflow-hidden h-[calc(100vh-12rem)] min-h-[500px] flex flex-col relative">
        <div className="absolute top-4 left-4 z-[400] bg-background/95 backdrop-blur shadow-md rounded-lg p-3 border">
          <h3 className="font-semibold flex items-center gap-2">
            <MapIcon className="h-4 w-4 text-primary" />
            Répétiteurs à proximité
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {repetiteurs.length} professeur{repetiteurs.length > 1 ? 's' : ''} trouvé{repetiteurs.length > 1 ? 's' : ''}
          </p>
        </div>

        <MapContainer
          center={userLocation || defaultCenter}
          zoom={12}
          style={{ height: '100%', width: '100%', zIndex: 0 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Marqueur du parent (si localisation activée) */}
          {userLocation && (
            <Marker position={userLocation} icon={
              L.divIcon({
                className: 'custom-div-icon',
                html: `<div style="background-color: #3b82f6; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
              })
            }>
              <Popup>Votre position actuelle</Popup>
            </Marker>
          )}

          {/* Marqueurs des répétiteurs */}
          {repetiteurs.map((rep) => (
            <Marker
              key={rep.id}
              position={[rep.latitude, rep.longitude]}
              icon={L.divIcon({
                className: 'custom-checkpoint-icon',
                html: `
                  <div class="checkpoint-container">
                    <div class="checkpoint-pin">
                      <svg viewBox="0 0 38 46" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 0C8.5 0 0 8.5 0 19C0 31.2 19 46 19 46C19 46 38 31.2 38 19C38 8.5 29.5 0 19 0Z" fill="#E87722"/>
                        <circle cx="19" cy="19" r="15" fill="white"/>
                      </svg>
                    </div>
                    <div class="checkpoint-avatar">
                      ${rep.avatar_url
                    ? `<img src="${rep.avatar_url}" alt="${rep.full_name}" />`
                    : `<div class="avatar-placeholder">${rep.full_name.charAt(0)}</div>`
                  }
                    </div>
                  </div>
                `,
                iconSize: [40, 48],
                iconAnchor: [20, 46],
                popupAnchor: [0, -40]
              })}
            >
              <Popup className="repetiteur-popup">
                <div className="w-64">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center border shrink-0">
                      {rep.avatar_url ? (
                        <img src={rep.avatar_url} alt={rep.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-base leading-tight">{rep.full_name}</h4>
                      <p className="text-sm text-primary font-medium flex items-center gap-1 mt-0.5">
                        <Star className="h-3 w-3 fill-current" />
                        {rep.experience_annees} an{rep.experience_annees > 1 ? 's' : ''} exp.
                      </p>
                    </div>
                  </div>

                  <div className="mb-3 space-y-1.5">
                    <p className="text-sm font-medium">Matières principales :</p>
                    <div className="flex flex-wrap gap-1">
                      {rep.matieres.slice(0, 3).map(m => (
                        <Badge key={m} variant="secondary" className="text-[10px] px-1.5 py-0">{m}</Badge>
                      ))}
                      {rep.matieres.length > 3 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">+{rep.matieres.length - 3}</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-3 pt-2 border-t">
                    <span className="text-xs text-muted-foreground">Tarif indicatif</span>
                    <span className="text-sm font-semibold">{formatBudget(rep.tarif_horaire)}</span>
                  </div>

                  <Button
                    className="w-full text-xs h-8 gap-2"
                    onClick={() => {
                      setSelectedRep(rep);
                      setIsDialogOpen(true);
                    }}
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Discuter
                  </Button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Démarrer une discussion ?</AlertDialogTitle>
              <AlertDialogDescription>
                Vous allez être mis en relation avec {selectedRep?.full_name}. 
                Souhaitez-vous continuer ?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isCreatingConv}>Annuler</AlertDialogCancel>
              <AlertDialogAction 
                onClick={(e) => {
                  e.preventDefault();
                  handleStartDiscussion();
                }}
                disabled={isCreatingConv}
              >
                {isCreatingConv ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  "Oui, discuter"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>

      {/* Styles globaux pour fix le rendu Tailwind dans Leaflet Popup et Checkpoints */}
      <style>{`
        .custom-checkpoint-icon {
          background: transparent;
          border: none;
        }
        .checkpoint-container {
          position: relative;
          width: 40px;
          height: 48px;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
          transition: transform 0.2s ease;
        }
        .checkpoint-container:hover {
          transform: scale(1.1);
          z-index: 1000;
        }
        .checkpoint-pin {
          width: 100%;
          height: 100%;
        }
        .checkpoint-avatar {
          position: absolute;
          top: 4px;
          left: 4px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          overflow: hidden;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(0,0,0,0.05);
        }
        .checkpoint-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .checkpoint-avatar .avatar-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #E87722;
          color: white;
          font-weight: bold;
          font-size: 14px;
        }
        .repetiteur-popup .leaflet-popup-content-wrapper {
          padding: 0;
          overflow: hidden;
          border-radius: 0.5rem;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        }
        .repetiteur-popup .leaflet-popup-content {
          margin: 0;
          padding: 1rem;
        }
        .leaflet-container a.leaflet-popup-close-button {
          padding: 6px 6px 0 0;
          color: #94a3b8;
        }
      `}</style>
    </DashboardLayout>
  );
}
