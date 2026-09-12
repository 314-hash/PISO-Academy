import React from 'react';
import { useAcademy } from './context/AcademyContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Hero } from './components/Hero';
import { CourseCatalog } from './components/CourseCatalog';
import { Web3Lab } from './components/Web3Lab';
import { DeploymentManager } from './components/DeploymentManager';
import { CertificateVerifier } from './components/CertificateVerifier';
import { BuilderProfile } from './components/BuilderProfile';
import { ProjectDirectory } from './components/ProjectDirectory';
import { PisoWorldMap3D } from './components/PisoWorldMap3D';
import { CyberGameEngine } from './components/game/CyberGameEngine';
import { PisoP2PChatRoom } from './components/game/PisoP2PChatRoom';
import { ConnectWalletModal } from './components/ConnectWalletModal';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const AppContent: React.FC = () => {
  const { activeView, gameMode, toggleGameMode, notification, setNotification } = useAcademy();

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 selection:bg-amber-500/30 selection:text-amber-300">
      {/* Global Connect Wallet Modal */}
      <ConnectWalletModal />
      {/* Global Notification Banner */}
      {notification && (
        <div className="fixed bottom-20 sm:bottom-24 right-6 z-50 max-w-md animate-bounce-short">
          <div
            className={`p-4 rounded-2xl shadow-2xl border flex items-start space-x-3 ${
              notification.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-200'
                : notification.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/60 text-rose-200'
                : 'bg-blue-950/90 border-blue-500/60 text-blue-200'
            }`}
          >
            {notification.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
            {notification.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
            {notification.type === 'info' && <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />}

            <div className="flex-1 text-xs font-semibold leading-relaxed">
              {notification.message}
            </div>

            <button
              onClick={() => setNotification(null)}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Mode Switch: 3D Metaverse Game Engine vs 2D Focused Developer Workbench */}
      {gameMode ? (
        <CyberGameEngine gameMode={gameMode} onToggleGameMode={toggleGameMode} />
      ) : (
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            {activeView === 'home' && <Hero />}
            {activeView === 'courses' && <CourseCatalog />}
            {activeView === 'lab' && <Web3Lab />}
            {activeView === 'deploy' && <DeploymentManager />}
            {activeView === 'verify' && <CertificateVerifier />}
            {activeView === 'profile' && <BuilderProfile />}
            {activeView === 'projects' && <ProjectDirectory />}
            {activeView === 'worldmap' && <PisoWorldMap3D />}
            {activeView === 'chat' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <PisoP2PChatRoom />
              </div>
            )}
          </main>
          <Footer />
        </div>
      )}
    </div>
  );
};
