import React, { useState } from 'react';
import { useAcademy } from '../context/AcademyContext';
import {
  CheckCircle2,
  Circle,
  Clock,
  Award,
  BookOpen,
  ArrowRight,
  Terminal,
  Sparkles,
  Shield,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { Track, Lesson, Module, QuizQuestion } from '../data/courses';
import { QuizCelebrationModal } from './QuizCelebrationModal';

export const CourseCatalog: React.FC = () => {
  const {
    tracks,
    selectedTrack,
    setSelectedTrack,
    selectedLesson,
    setSelectedLesson,
    completedLessons,
    completeCurrentLesson,
    claimCertificateForTrack,
    setActiveView,
    setActiveChallenge,
    challenges
  } = useAcademy();

  // Quiz celebration modal states
  const [celebrationQuestion, setCelebrationQuestion] = useState<QuizQuestion | null>(null);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<Record<string, number>>({});
  const [wrongAnswers, setWrongAnswers] = useState<Record<string, boolean>>({});

  const isLessonCompleted = (id: string) => completedLessons.includes(id);

  // Calculate track progress
  const allTrackLessonIds = selectedTrack.modules.flatMap((m: Module) => m.lessons.map((l: Lesson) => l.id));
  const completedTrackLessonCount = allTrackLessonIds.filter((id: string) => completedLessons.includes(id)).length;
  const progressPercent = Math.round((completedTrackLessonCount / (allTrackLessonIds.length || 1)) * 100);

  const handleClaimCert = async () => {
    await claimCertificateForTrack(selectedTrack);
  };

  const handleAnswerClick = (q: QuizQuestion, optIdx: number) => {
    setSelectedQuizAnswers((prev) => ({ ...prev, [q.id]: optIdx }));
    if (optIdx === q.correctIndex) {
      setWrongAnswers((prev) => ({ ...prev, [q.id]: false }));
      setCelebrationQuestion(q);
      setShowCelebrationModal(true);
      if (selectedLesson) {
        completeCurrentLesson(selectedLesson.id);
      }
    } else {
      setWrongAnswers((prev) => ({ ...prev, [q.id]: true }));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Mga Kurso at Learning Paths</h1>
        <p className="text-sm text-slate-400 mt-1">
          Binuo mula sa simulang teorya hanggang sa aktuwal na smart contract deployment sa PISO Chain.
        </p>
      </div>

      {/* Track Selection Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {tracks.map((track) => {
          const isSelected = selectedTrack.id === track.id;
          return (
            <button
              key={track.id}
              onClick={() => {
                setSelectedTrack(track);
                setSelectedLesson(track.modules[0]?.lessons[0] || null);
              }}
              className={`p-4 rounded-xl text-left transition-all border ${
                isSelected
                  ? 'bg-[#161F30] border-amber-500/80 shadow-glow'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {track.level}
                </span>
                <span className="text-xs font-mono font-bold text-amber-400">+{track.xpReward} XP</span>
              </div>
              <h3 className="font-bold text-sm text-white line-clamp-1">{track.title}</h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-1">{track.tagline}</p>
            </button>
          );
        })}
      </div>

      {/* Main Track Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Syllabus & Modules */}
        <div className="lg:col-span-1 space-y-6">
          {/* Progress Card */}
          <div className="p-5 rounded-2xl bg-[#161F30] border border-slate-700/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300">Progreso sa Kurso</span>
              <span className="text-xs font-mono font-bold text-amber-400">{progressPercent}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-amber-400 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3">
              <span>{completedTrackLessonCount} ng {allTrackLessonIds.length} aralin</span>
              <span>Sertipiko: {selectedTrack.certificateTier}</span>
            </div>

            {/* Claim Certificate Button */}
            {progressPercent >= 50 && (
              <button
                onClick={handleClaimCert}
                className="w-full mt-4 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center space-x-2 shadow-glow transition-all"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Kumuha ng Katunayan Soulbound Badge</span>
              </button>
            )}
          </div>

          {/* Module List Accordion */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Talaan ng Aralin (Syllabus)</h3>
            {selectedTrack.modules.map((mod: Module) => (
              <div key={mod.id} className="rounded-xl bg-slate-900/80 border border-slate-800 overflow-hidden">
                <div className="p-3.5 bg-slate-800/50 border-b border-slate-800">
                  <h4 className="text-xs font-bold text-white">{mod.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{mod.description}</p>
                </div>
                <div className="divide-y divide-slate-800/60">
                  {mod.lessons.map((lesson: Lesson) => {
                    const isSelected = selectedLesson?.id === lesson.id;
                    const completed = isLessonCompleted(lesson.id);
                    return (
                      <div
                        key={lesson.id}
                        onClick={() => setSelectedLesson(lesson)}
                        className={`p-3 flex items-center justify-between cursor-pointer transition-colors text-xs ${
                          isSelected
                            ? 'bg-slate-800 text-amber-300 font-semibold'
                            : 'text-slate-300 hover:bg-slate-800/40 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          {completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-600 shrink-0" />
                          )}
                          <span className="line-clamp-1">{lesson.title}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-slate-500 text-[10px]">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{lesson.durationMinutes}m</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Active Lesson View & Quiz */}
        <div className="lg:col-span-2">
          {selectedLesson ? (
            <div className="p-6 sm:p-8 rounded-2xl bg-[#161F30] border border-slate-700/60 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 uppercase">
                    Aralin
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                    {selectedLesson.title}
                  </h2>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 text-xs text-slate-400 font-mono">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>{selectedLesson.durationMinutes} minuto</span>
                  </div>
                  {isLessonCompleted(selectedLesson.id) && (
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Tapos Na</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Lesson Body */}
              <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                {selectedLesson.contentMarkdown}
              </div>

              {/* Optional Coding Challenge Link */}
              {selectedLesson.hasCodingChallenge && (
                <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-amber-400">Kasunod na Pagsasanay</span>
                    <h4 className="text-sm font-bold text-white">May kasamang Coding Challenge ang araling ito!</h4>
                    <p className="text-xs text-slate-400 mt-0.5">I-code at i-deploy ang kontrata sa Interactive Web3 Lab.</p>
                  </div>
                  <button
                    onClick={() => {
                      if (selectedLesson.challengeId) {
                        const target = challenges.find((c) => c.id === selectedLesson.challengeId);
                        if (target) setActiveChallenge(target);
                      }
                      setActiveView('lab');
                    }}
                    className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-all"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Buksan sa Lab</span>
                  </button>
                </div>
              )}

              {/* Embedded Quiz if available */}
              {selectedLesson.quiz && selectedLesson.quiz.length > 0 && (
                <div className="pt-6 border-t border-slate-800 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Pagsusulit sa Pag-unawa (Knowledge Check)</span>
                    </h3>
                    <span className="text-[11px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      May Animated Pop-up sa Tamang Sagot!
                    </span>
                  </div>

                  {selectedLesson.quiz.map((q: QuizQuestion) => {
                    const selectedIdx = selectedQuizAnswers[q.id];
                    const hasAnswered = selectedIdx !== undefined;
                    const isCorrect = selectedIdx === q.correctIndex;
                    const isWrong = wrongAnswers[q.id];

                    return (
                      <div key={q.id} className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
                        <div className="flex items-start space-x-2.5">
                          <HelpCircle className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                          <p className="text-xs sm:text-sm font-semibold text-slate-200">{q.question}</p>
                        </div>

                        <div className="space-y-2">
                          {q.options.map((opt: string, optIdx: number) => {
                            const isThisSelected = selectedIdx === optIdx;
                            const isThisCorrect = optIdx === q.correctIndex;

                            let btnStyle = 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border-slate-700/60';
                            if (hasAnswered && isThisSelected) {
                              if (isCorrect) {
                                btnStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold shadow-sm';
                              } else {
                                btnStyle = 'bg-rose-950/80 border-rose-500 text-rose-200 font-bold';
                              }
                            } else if (hasAnswered && isThisCorrect && isCorrect) {
                              btnStyle = 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300';
                            }

                            return (
                              <button
                                key={optIdx}
                                onClick={() => handleAnswerClick(q, optIdx)}
                                className={`w-full text-left p-3 rounded-xl text-xs transition-all border flex items-center justify-between ${btnStyle}`}
                              >
                                <span>{opt}</span>
                                {hasAnswered && isThisSelected && (
                                  <span>
                                    {isCorrect ? (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    ) : (
                                      <AlertCircle className="w-4 h-4 text-rose-400" />
                                    )}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Wrong Answer Hint Alert */}
                        {isWrong && (
                          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs flex items-center space-x-2 animate-bounce-short">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>Maling sagot. Subukan muli! Basahin ulit ang aralin sa itaas para mahanap ang tamang sagot.</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 rounded-2xl bg-[#161F30] border border-slate-800">
              Pumili ng aralin mula sa talaan sa kaliwa.
            </div>
          )}
        </div>
      </div>

      {/* Animated Pop-Up Celebration Modal for Correct Answers */}
      <QuizCelebrationModal
        isOpen={showCelebrationModal}
        onClose={() => setShowCelebrationModal(false)}
        question={celebrationQuestion}
      />
    </div>
  );
};
