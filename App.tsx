import React, { useState } from 'react';
import { Activity, Map, Sparkles } from 'lucide-react';
import { AnalysisView } from './components/AnalysisView';
import { MapView } from './components/MapView';
import { AppTab } from './types';

function App() {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.Analysis);

  return (
    <div className="min-h-screen relative selection:bg-cyan-500/30">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/20 rounded-full blur-[120px] animate-pulse [animation-delay:2s]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 flex flex-col min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.5)]">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              MediGlass AI
            </h1>
          </div>
          
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-medium text-slate-300">Powered by Gemini 3.0 Pro</span>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-10">
          <div className="p-1.5 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl inline-flex gap-1 shadow-2xl">
            <button
              onClick={() => setActiveTab(AppTab.Analysis)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                activeTab === AppTab.Analysis 
                  ? 'bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-cyan-50 border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)]' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Activity className="w-4 h-4" />
              Scan & Analyze
            </button>
            <button
              onClick={() => setActiveTab(AppTab.Map)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                activeTab === AppTab.Map 
                  ? 'bg-gradient-to-br from-pink-500/20 to-purple-600/20 text-pink-50 border border-pink-500/30 shadow-[0_0_20px_rgba(236,72,153,0.15)]' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Map className="w-4 h-4" />
              Nearest Center
            </button>
          </div>
        </div>

        {/* Content Area */}
        <main className="flex-1 transition-all duration-500">
          {activeTab === AppTab.Analysis ? <AnalysisView /> : <MapView />}
        </main>

        {/* Footer */}
        <footer className="mt-12 text-center text-slate-500 text-sm py-6">
          <p>© 2025 MediGlass AI. Not a replacement for professional medical advice.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;