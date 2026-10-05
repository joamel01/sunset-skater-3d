import React, { useEffect } from 'react';
import { RotateCcw, Play, Star } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GameOverModalProps {
  isOpen: boolean;
  score: number;
  highScore: number;
  bestCombo: number;
  lettersCollectedCount: number;
  isNewRecord: boolean;
  onPlayAgain: () => void;
  onSwitchToFreeSkate: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  score,
  highScore,
  bestCombo,
  lettersCollectedCount,
  isNewRecord,
  onPlayAgain,
  onSwitchToFreeSkate,
}) => {
  useEffect(() => {
    if (isOpen) {
      // Trigger festive confetti burst!
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
      if (isNewRecord) {
        setTimeout(() => {
          confetti({
            particleCount: 120,
            angle: 60,
            spread: 60,
            origin: { x: 0 },
          });
          confetti({
            particleCount: 120,
            angle: 120,
            spread: 60,
            origin: { x: 1 },
          });
        }, 400);
      }
    }
  }, [isOpen, isNewRecord]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-fade-in">
      <div className="relative w-full max-w-lg bg-neutral-900 border-2 border-amber-400/80 rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
        {/* Record Badge */}
        {isNewRecord && (
          <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-300 text-black font-black text-xs uppercase tracking-widest mb-3 shadow-lg shadow-amber-500/40 animate-pulse">
            <Star size={14} className="fill-black" />
            Nytt Personbästa!
          </div>
        )}

        {/* Title */}
        <h2 className="text-3xl sm:text-5xl font-black italic tracking-wide text-white uppercase drop-shadow mb-1">
          Time's Up!
        </h2>
        <p className="text-sm text-white/60 mb-6">Fantastisk session i skateparken!</p>

        {/* Score Card */}
        <div className="bg-black/50 border border-white/10 rounded-2xl p-5 mb-6">
          <span className="text-xs uppercase font-extrabold tracking-widest text-amber-400 block mb-1">
            Slutgiltig Poäng
          </span>
          <div className="text-4xl sm:text-5xl font-black italic tracking-wider text-white">
            {score.toLocaleString()}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 block">High Score</span>
            <div className="text-lg sm:text-xl font-black text-amber-300">{highScore.toLocaleString()}</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 block">Bästa Combo</span>
            <div className="text-lg sm:text-xl font-black text-cyan-400">{bestCombo.toLocaleString()}</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 block">S-K-A-T-E</span>
            <div className="text-lg sm:text-xl font-black text-emerald-400">{lettersCollectedCount} / 5</div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onPlayAgain}
            className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-400 hover:to-red-400 text-black font-black uppercase tracking-wider text-sm sm:text-base flex items-center justify-center gap-2 transition shadow-xl shadow-amber-500/25 cursor-pointer"
          >
            <RotateCcw size={18} /> Spela Igen (2 Min)
          </button>
          <button
            onClick={onSwitchToFreeSkate}
            className="flex-1 py-3.5 px-6 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold uppercase tracking-wider text-sm sm:text-base flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Play size={18} /> Free Skate
          </button>
        </div>
      </div>
    </div>
  );
};
