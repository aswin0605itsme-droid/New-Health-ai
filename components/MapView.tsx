import React, { useState } from 'react';
import { MapPin, Navigation, ExternalLink, AlertTriangle, Loader2 } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { GlassButton } from './ui/GlassButton';
import { findMedicalCenter } from '../services/geminiService';
import { MapResult } from '../types';
import ReactMarkdown from 'react-markdown';

export const MapView: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MapResult | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  // Retrieve API Key correctly for Vite
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  const handleFindLocation = () => {
    setLoading(true);
    setError(null);
    setResult(null);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          
          // Call API
          const data = await findMedicalCenter(latitude, longitude);
          setResult(data);
        } catch (err) {
          setError("Failed to fetch location data from Gemini.");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError("Unable to retrieve your location. Please allow location access.");
        setLoading(false);
      }
    );
  };

  const getFallbackMapUrl = () => {
    if (userLocation) {
      return `https://maps.googleapis.com/maps/api/staticmap?center=${userLocation.lat},${userLocation.lng}&zoom=14&size=600x300&maptype=roadmap&markers=color:blue%7Clabel:Me%7C${userLocation.lat},${userLocation.lng}&key=${apiKey}`;
    }
    // Default fallback (e.g., general view)
    return `https://maps.googleapis.com/maps/api/staticmap?center=Hospital&zoom=10&size=600x300&maptype=roadmap&key=${apiKey}`;
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <GlassCard className="p-8 text-center">
        <div className="flex flex-col items-center space-y-6">
          <div className="p-4 rounded-full bg-pink-500/10 border border-pink-500/20 shadow-[0_0_30px_rgba(236,72,153,0.2)]">
            <MapPin className="w-10 h-10 text-pink-400 animate-pulse" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">Nearest Medical Center</h2>
            <p className="text-slate-400 max-w-sm mx-auto">
              Use Gemini with Google Maps to find the closest facility and generate an instant route.
            </p>
          </div>

          {!loading && !result && (
             <GlassButton 
               onClick={handleFindLocation} 
               isLoading={loading}
               variant="accent"
               className="w-full max-w-xs"
             >
               <Navigation className="w-5 h-5" />
               <span>Find Nearest Center</span>
             </GlassButton>
          )}
        </div>
      </GlassCard>

      {error && (
        <GlassCard className="p-4 border-red-500/30 bg-red-500/10 flex items-center gap-3 text-red-200">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </GlassCard>
      )}

      {/* Show Content if we have a result OR if we are loading but have user location (instant feedback) */}
      {(result || (loading && userLocation)) && (
        <div className="space-y-6 animate-[slideUp_0.5s_ease-out]">
           
           {/* Text Result (Only when loaded) */}
           {result && (
             <GlassCard className="p-6">
               <div className="flex items-center gap-3 mb-4 text-cyan-300">
                 <Navigation className="w-6 h-6" />
                 <h3 className="text-xl font-bold">Route Guidance</h3>
               </div>
               
               <div className="prose prose-invert prose-lg max-w-none text-slate-200 leading-relaxed">
                  <ReactMarkdown>{result.text}</ReactMarkdown>
               </div>
             </GlassCard>
           )}

           {/* Loading Indicator */}
           {loading && (
             <GlassCard className="p-6 flex items-center justify-center gap-3 text-pink-300">
               <Loader2 className="w-5 h-5 animate-spin" />
               <span>Calculating best route...</span>
             </GlassCard>
           )}

           {/* Map Display Logic */}
           <div className="grid grid-cols-1 gap-6">
             {result?.chunks && result.chunks.length > 0 ? (
               // Case 1: Grounding chunks exist (Show specific locations found by AI)
               result.chunks.map((chunk, idx) => {
                 const mapData = chunk.maps;
                 if (!mapData) return null;
                 
                 const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(mapData.title)}&zoom=15&size=600x300&maptype=roadmap&markers=color:red%7C${encodeURIComponent(mapData.title)}&key=${apiKey}`;

                 return (
                   <a 
                     key={idx} 
                     href={mapData.uri} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="block group relative overflow-hidden rounded-3xl transition-all duration-500 hover:scale-[1.01]"
                   >
                     <GlassCard className="p-0 overflow-hidden group-hover:bg-white/10 transition-colors border-white/20">
                       <div className="relative h-48 w-full bg-slate-800">
                          <img 
                            src={staticMapUrl}
                            alt={`Map preview of ${mapData.title}`}
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
                          <div className="absolute bottom-0 left-0 p-6 w-full flex items-end justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-pink-600/20 backdrop-blur-md flex items-center justify-center border border-pink-500/30 shadow-[0_0_15px_rgba(236,72,153,0.3)]">
                                  <MapPin className="w-6 h-6 text-pink-400" />
                              </div>
                              <div>
                                <h4 className="font-bold text-xl text-white group-hover:text-cyan-300 transition-colors">
                                  {mapData.title}
                                </h4>
                                <p className="text-sm text-slate-300 group-hover:text-white transition-colors flex items-center gap-1">
                                  Tap to view on Google Maps <ExternalLink className="w-3 h-3" />
                                </p>
                              </div>
                            </div>
                          </div>
                       </div>
                     </GlassCard>
                   </a>
                 );
               })
             ) : (
               // Case 2: No chunks OR Loading (Show fallback map with user location)
               // This ensures a map is ALWAYS displayed if we have the user's location
               <GlassCard className="p-0 overflow-hidden border-white/20">
                 <div className="relative h-48 w-full bg-slate-800">
                   <img 
                     src={getFallbackMapUrl()}
                     alt="Map Location"
                     className="w-full h-full object-cover opacity-80"
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                   <div className="absolute bottom-4 left-6">
                      <h4 className="font-bold text-xl text-white">
                        {loading ? "Searching Area..." : "Current Location"}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {userLocation ? "Map centered on your position" : "General map view"}
                      </p>
                   </div>
                 </div>
               </GlassCard>
             )}
           </div>

           {!loading && (
             <div className="text-center pt-4">
               <button 
                 onClick={handleFindLocation}
                 className="text-slate-400 hover:text-white transition-colors text-sm underline decoration-slate-600 hover:decoration-white underline-offset-4"
               >
                 Refresh Location
               </button>
             </div>
           )}
        </div>
      )}
    </div>
  );
};