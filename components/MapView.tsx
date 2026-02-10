import React, { useState } from 'react';
import { MapPin, Navigation, ExternalLink, AlertTriangle } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { GlassButton } from './ui/GlassButton';
import { findMedicalCenter } from '../services/geminiService';
import { MapResult } from '../types';
import ReactMarkdown from 'react-markdown';

export const MapView: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MapResult | null>(null);

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

          {!result && (
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

      {result && (
        <div className="space-y-6 animate-[slideUp_0.5s_ease-out]">
           {/* Results Display */}
           <GlassCard className="p-6">
             <div className="flex items-center gap-3 mb-4 text-cyan-300">
               <Navigation className="w-6 h-6" />
               <h3 className="text-xl font-bold">Route Guidance</h3>
             </div>
             
             <div className="prose prose-invert prose-lg max-w-none text-slate-200 leading-relaxed">
                <ReactMarkdown>{result.text}</ReactMarkdown>
             </div>
           </GlassCard>

           {/* Interactive Map Links (Grounding) */}
           {result.chunks && result.chunks.length > 0 && (
             <div className="grid grid-cols-1 gap-4">
               {result.chunks.map((chunk, idx) => {
                 const mapData = chunk.maps;
                 if (!mapData) return null;
                 
                 return (
                   <a 
                     key={idx} 
                     href={mapData.uri} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="block group"
                   >
                     <GlassCard className="p-4 flex items-center justify-between group-hover:bg-white/10 transition-colors">
                       <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center border border-white/10">
                            <MapPin className="w-6 h-6 text-red-400" />
                         </div>
                         <div>
                           <h4 className="font-semibold text-white group-hover:text-cyan-300 transition-colors">
                             {mapData.title}
                           </h4>
                           <p className="text-sm text-slate-400">View on Google Maps</p>
                         </div>
                       </div>
                       <ExternalLink className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
                     </GlassCard>
                   </a>
                 );
               })}
             </div>
           )}

           <div className="text-center">
             <button 
               onClick={handleFindLocation}
               className="text-slate-400 hover:text-white transition-colors text-sm underline decoration-slate-600 hover:decoration-white underline-offset-4"
             >
               Refresh Location
             </button>
           </div>
        </div>
      )}
    </div>
  );
};