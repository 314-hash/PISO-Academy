import React, { useEffect } from 'react';
import { QuizQuestion } from '../data/courses';
import {
  Sparkles,
  CheckCircle2,
  X,
  ArrowRight,
  Flame,
  Award,
  Zap,
  ShieldCheck
} from 'lucide-react';

interface QuizCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: QuizQuestion | null;
  onContinue?: () => void;
}

export const QuizCelebrationModal: React.FC<QuizCelebrationModalProps> = ({
  isOpen,
  onClose,
  question,
  onContinue,
}) => {
  // Keyboard shortcut: close on Enter or Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Enter' || e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !question) return null;

  const handleContinue = () => {
    onClose();
    if (onContinue) onContinue();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity duration-300">
      {/* Floating Confetti Particles Simulation */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-float-confetti"
            style={{
              width: `${Math.random() * 8 + 4}px`,
              height: `${Math.random() * 8 + 4}px`,
              backgroundColor: ['#F59E0B', '#FBBF24', '#3B82F6', '#10B981', '#EC4899'][i % 5],
              left: `${Math.random() * 90 + 5}%`,
              top: `${Math.random() * 80 + 10}%`,
              animationDelay: `${Math.random() * 1.5}s`,
              animationDuration: `${Math.random() * 2 + 1.5}s`,
            }}
          />
        ))}
      </div>

      {/* Main Celebration Card */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-lg rounded-3xl bg-[#161F30] border-2 border-amber-500/80 shadow-[0_0_60px_rgba(245,158,11,0.35)] p-6 sm:p-8 animate-pop-bounce text-center overflow-hidden"
      >
        {/* Subtle Filipino Sun Aura Background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Celebratory Icon & Rotating Ring */}
        <div className="relative mx-auto w-24 h-24 mb-5 flex items-center justify-center">
          {/* Animated Glow Rings */}
          <div className="absolute inset-0 rounded-full border border-dashed border-amber-400/40 animate-ring-spin" />
          <div className="absolute inset-1 rounded-full border border-blue-500/30 animate-ping opacity-20" />

          {/* Center Badge */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-blue-600 p-1 shadow-glow transform hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#0B0F17] rounded-[12px] flex items-center justify-center">
              <span className="text-3xl font-black text-amber-400 font-mono select-none">
                ₱
              </span>
            </div>
          </div>

          {/* Sparkle Badge */}
          <div className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 p-1.5 rounded-full shadow-lg">
            <Sparkles className="w-4 h-4 fill-slate-950" />
          </div>
        </div>

        {/* XP Gained Pill */}
        <div className="inline-flex items-center space-x-1.5 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold mb-3 animate-subtle-pulse">
          <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>+{question.xpReward} XP Earned!</span>
        </div>

        {/* Unique Success Title */}
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          {question.successTitle}
        </h2>

        {/* Unique Success Greeting & Congratulatory Message */}
        <div className="my-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-left">
          <div className="flex items-start space-x-3">
            <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 mt-0.5 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs sm:text-sm text-slate-100 font-medium leading-relaxed">
                {question.successGreeting}
              </p>
              <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono">
                <span className="text-amber-400 font-bold">Paliwanag: </span>
                {question.explanation}
              </div>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="pt-2 flex items-center justify-center">
          <button
            onClick={handleContinue}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-glow flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>Ipagpatuloy ang Pag-aaral</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
