import { useState, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

// Fix pour les icônes de marqueurs Leaflet avec Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Icône personnalisée pour le marqueur du répétiteur
const tutorIcon = L.divIcon({
  className: 'custom-tutor-picker-icon',
  html: `
    <div style="
      position: relative;
      width: 36px;
      height: 44px;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
    ">
      <svg viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 0C8.06 0 0 8.06 0 18C0 29.7 18 44 18 44C18 44 36 29.7 36 18C36 8.06 27.94 0 18 0Z" fill="#E87722"/>
        <circle cx="18" cy="18" r="10" fill="white"/>
        <circle cx="18" cy="15" r="4" fill="#E87722"/>
        <ellipse cx="18" cy="23" rx="6" ry="3.5" fill="#E87722"/>
      </svg>
    </div>
  `,
  iconSize: [36, 44],
  iconAnchor: [18, 44],
});

interface LocationPickerProps {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  onLocationChange: (lat: number, lng: number) => void;
}

// Composant interne pour gérer les clics sur la carte
function MapClickHandler({ onLocationChange }: { onLocationChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Composant interne pour centrer la carte sur une nouvelle position
function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], Math.max(map.getZoom(), 15), { duration: 1 });
  }, [lat, lng, map]);
  return null;
}

export function LocationPicker({ latitude, longitude, onLocationChange }: LocationPickerProps) {
  const { toast } = useToast();
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);

  // Centre par défaut : Abidjan
  const defaultCenter: [number, number] = [5.3364, -4.0267];
  const defaultZoom = latitude && longitude ? 16 : 13;

  const position: [number, number] | null = 
    latitude != null && longitude != null ? [latitude, longitude] : null;

  const handleGPSCapture = useCallback(() => {
    if (!("geolocation" in navigator)) {
      toast({
        title: "Non supporté",
        description: "La géolocalisation n'est pas supportée par votre navigateur.",
        variant: "destructive"
      });
      return;
    }

    setGpsLoading(true);

    const onSuccess = (pos: GeolocationPosition) => {
      const accuracy = pos.coords.accuracy;
      setGpsAccuracy(accuracy);
      onLocationChange(pos.coords.latitude, pos.coords.longitude);
      setGpsLoading(false);

      if (accuracy > 100) {
        toast({
          title: "⚠️ Position approximative",
          description: `Précision : ~${Math.round(accuracy)}m. Vous pouvez ajuster en cliquant sur la carte.`,
        });
      } else {
        toast({
          title: "✅ Position capturée",
          description: `Précision : ~${Math.round(accuracy)}m. Vous pouvez ajuster en cliquant sur la carte.`,
        });
      }
    };

    // Tentative 1 : haute précision (GPS matériel)
    navigator.geolocation.getCurrentPosition(
      onSuccess,
      (highAccError) => {
        console.warn('GPS haute précision échoué, tentative basse précision...', highAccError);
        // Tentative 2 : basse précision (WiFi / IP) en fallback
        navigator.geolocation.getCurrentPosition(
          onSuccess,
          (lowAccError) => {
            setGpsLoading(false);
            console.error('GPS basse précision échoué aussi:', lowAccError);

            let description = "Impossible d'obtenir votre position. Cliquez directement sur la carte pour placer votre emplacement.";
            if (lowAccError.code === 1) {
              description = "Vous avez refusé l'accès à la géolocalisation. Autorisez-la dans les paramètres de votre navigateur, ou cliquez sur la carte.";
            } else if (lowAccError.code === 3) {
              description = "La recherche de position a expiré. Vérifiez votre connexion et réessayez, ou cliquez sur la carte.";
            }

            toast({
              title: "Erreur de localisation",
              description,
              variant: "destructive"
            });
          },
          {
            enableHighAccuracy: false,
            timeout: 15000,
            maximumAge: 60000
          }
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0
      }
    );
  }, [onLocationChange, toast]);

  return (
    <div className="space-y-3">
      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleGPSCapture}
          disabled={gpsLoading}
          className="w-full sm:w-auto"
        >
          {gpsLoading ? (
            <>
              <Navigation className="h-4 w-4 mr-2 animate-spin" />
              Localisation...
            </>
          ) : (
            <>
              <Navigation className="h-4 w-4 mr-2" />
              Utiliser ma position GPS
            </>
          )}
        </Button>

        {position ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-md border border-green-200 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Position définie
            </span>
            {gpsAccuracy != null && gpsAccuracy > 100 && (
              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-200 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                ~{Math.round(gpsAccuracy)}m
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-200 flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            Cliquez sur la carte ou utilisez le GPS
          </span>
        )}
      </div>

      {/* Carte interactive */}
      <div className="relative rounded-lg overflow-hidden border shadow-sm" style={{ height: '300px' }}>
        <MapContainer
          center={position || defaultCenter}
          zoom={defaultZoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapClickHandler onLocationChange={onLocationChange} />

          {position && (
            <>
              <Marker position={position} icon={tutorIcon} />
              <RecenterMap lat={position[0]} lng={position[1]} />
            </>
          )}
        </MapContainer>

        {/* Overlay instruction */}
        {!position && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/5 pointer-events-none z-[400]">
            <div className="bg-white/95 backdrop-blur px-4 py-3 rounded-lg shadow-lg text-center">
              <MapPin className="h-6 w-6 text-primary mx-auto mb-1" />
              <p className="text-sm font-medium">Cliquez sur la carte pour définir votre position</p>
              <p className="text-xs text-muted-foreground">ou utilisez le bouton GPS ci-dessus</p>
            </div>
          </div>
        )}
      </div>

      {/* Coordonnées affichées */}
      {position && (
        <p className="text-xs text-muted-foreground">
          📍 Coordonnées : {position[0].toFixed(6)}, {position[1].toFixed(6)}
          {gpsAccuracy != null && (
            <> — Précision GPS : ~{Math.round(gpsAccuracy)}m</>
          )}
        </p>
      )}
    </div>
  );
}
