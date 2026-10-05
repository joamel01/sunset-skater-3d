import React from 'react';
import { Volume2, VolumeX, Music, Video, HelpCircle, RotateCcw, Flame } from 'lucide-react';
import type { GameMode } from '../game/types';
import type { CameraMode } from '../game/engine';

interface HUDProps {
  score: number;
  highScore: number;
  currentComboPoints: number;
  comboMultiplier: number;
  comboTricks: string[];
  activeTrick: string;
  isGrinding: boolean;
  isManualing: boolean;
  balance: number;
  speed: number;
  ollieCharge: number;
  isCrouching: boolean;
  isBailed: boolean;
  letters: { [key: string]: boolean };
  gameMode: GameMode;
  timeLeft: number;
  isMuted: boolean;
  isMusicPlaying: boolean;
  cameraMode: CameraMode;
  onToggleMute: () => void;
  onToggleMusic: () => void;
  onCycleCamera: () => void;
  onOpenTrickBook: () => void;
  onRestart: () => void;
  onChangeMode: (mode: GameMode) => void;
}

export const HUD: React.FC<HUDProps> = ({
  score,
  highScore,
  currentComboPoints,
  comboMultiplier,
  comboTricks,
  activeTrick,
  isGrinding,
  isManualing,
  balance,
  speed,
  ollieCharge,
  isCrouching,
  isBailed,
  letters,
  gameMode,
  timeLeft,
  isMuted,
  isMusicPlaying,
  cameraMode,
  onToggleMute,
  onToggleMusic,
  onCycleCamera,
  onOpenTrickBook,
  onRestart,
  onChangeMode,
}) => {
  // Format timer MM:SS
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const speedKmh = Math.max(0, Math.round(speed * 2.2));
  const hasActiveCombo = comboTricks.length > 0;
  const showBalanceMeter = isGrinding || isManualing;

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-4 sm:p-6 overflow-hidden">
      {/* ================= TOP BAR ================= */}
      <div className="flex justify-between items-start gap-4">
        {/* Score & Best */}
        <div className="flex flex-col gap-1">
          <div className="bg-black/60 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-2.5 shadow-xl text-left">
            <span className="text-xs uppercase tracking-widest text-amber-400 font-extrabold block">
              Score
            </span>
            <div className="text-3xl sm:text-4xl font-black italic tracking-wider text-white drop-shadow">
              {score.toLocaleString()}
            </div>
            <div className="text-xs text-white/60 font-semibold tracking-wide">
              BEST: <span className="text-amber-300">{highScore.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Center: Mode / Timer / SKATE Letters */}
        <div className="flex flex-col items-center gap-2">
          {/* Mode Badge & Timer */}
          <div className="pointer-events-auto flex items-center gap-2 bg-black/65 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 shadow-lg">
            {gameMode === 'scoreAttack' ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-red-400">Time</span>
                <span className={`text-xl font-black font-mono tracking-wider ${timeLeft <= 20 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                  {timeFormatted}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400">
                  Free Skate
                </span>
              </div>
            )}

            <button
              onClick={() => onChangeMode(gameMode === 'scoreAttack' ? 'free' : 'scoreAttack')}
              className="text-[11px] font-bold uppercase tracking-wider bg-white/10 hover:bg-white/20 text-white/90 px-2.5 py-1 rounded-full transition cursor-pointer"
            >
              {gameMode === 'scoreAttack' ? 'Free Skate' : '2-Min Run'}
            </button>
          </div>

          {/* S-K-A-T-E Letter Badges */}
          <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-sm border border-white/10 rounded-2xl px-3 py-1.5 shadow">
            {['S', 'K', 'A', 'T', 'E'].map((letter) => {
              const collected = letters[letter];
              return (
                <div
                  key={letter}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl font-black text-sm sm:text-base flex items-center justify-center transition-all duration-300 ${
                    collected
                      ? 'bg-gradient-to-tr from-amber-500 to-yellow-300 text-black shadow-lg shadow-amber-500/50 scale-110'
                      : 'bg-white/10 text-white/30 border border-white/10'
                  }`}
                >
                  {letter}
                </div>
              );
            })}
          </div>
        </div>

        {/* Top-Right: Quick Actions */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={onToggleMusic}
            title={isMusicPlaying ? 'Mute Music' : 'Play Music'}
            className={`p-2.5 rounded-xl border backdrop-blur-md transition cursor-pointer shadow-lg ${
              isMusicPlaying
                ? 'bg-purple-600/80 border-purple-400/50 text-white hover:bg-purple-500'
                : 'bg-black/50 border-white/20 text-white/50 hover:bg-black/70'
            }`}
          >
            <Music size={18} />
          </button>

          <button
            onClick={onToggleMute}
            title={isMuted ? 'Unmute SFX' : 'Mute SFX'}
            className="p-2.5 rounded-xl bg-black/50 border border-white/20 text-white hover:bg-black/70 backdrop-blur-md transition cursor-pointer shadow-lg"
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>

          <button
            onClick={onCycleCamera}
            title={`Camera: ${cameraMode}`}
            className="p-2.5 rounded-xl bg-black/50 border border-white/20 text-white hover:bg-black/70 backdrop-blur-md transition cursor-pointer shadow-lg flex items-center gap-1 text-xs font-bold"
          >
            <Video size={18} />
            <span className="hidden sm:inline uppercase text-[10px]">{cameraMode}</span>
          </button>

          <button
            onClick={onOpenTrickBook}
            title="How to Play / Trick Book"
            className="p-2.5 rounded-xl bg-black/50 border border-white/20 text-amber-400 hover:bg-black/70 backdrop-blur-md transition cursor-pointer shadow-lg"
          >
            <HelpCircle size={18} />
          </button>

          <button
            onClick={onRestart}
            title="Restart Park"
            className="p-2.5 rounded-xl bg-black/50 border border-white/20 text-white hover:bg-black/70 backdrop-blur-md transition cursor-pointer shadow-lg"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </div>

      {/* ================= CENTER: ACTIVE TRICK & WIPEOUT ================= */}
      <div className="flex flex-col items-center justify-center my-auto gap-3">
        {isBailed ? (
          <div className="animate-bounce bg-red-600/90 text-white border-2 border-red-400 rounded-3xl px-8 py-3 shadow-2xl shadow-red-600/60 font-black italic tracking-widest text-3xl sm:text-5xl uppercase drop-shadow">
            WIPEOUT!
          </div>
        ) : activeTrick ? (
          <div className="bg-amber-400/90 text-black border border-amber-300 rounded-2xl px-5 py-1.5 font-black italic text-lg sm:text-xl uppercase shadow-lg shadow-amber-400/30 animate-pulse">
            {activeTrick}
          </div>
        ) : null}

        {/* Live Balance Meter (during Grinds or Manuals) */}
        {showBalanceMeter && (
          <div className="w-64 sm:w-80 bg-black/80 backdrop-blur-md border border-white/30 rounded-2xl p-2.5 shadow-2xl flex flex-col items-center gap-1 animate-fade-in">
            <div className="flex justify-between w-full text-[11px] font-extrabold uppercase tracking-wider text-white/80 px-1">
              <span className="text-red-400">Tilt L</span>
              <span className="text-amber-300 font-black">
                {isGrinding ? 'GRIND BALANCE' : 'MANUAL BALANCE'}
              </span>
              <span className="text-red-400">Tilt R</span>
            </div>

            {/* Slider Track */}
            <div className="relative w-full h-5 bg-gradient-to-r from-red-600 via-emerald-500 to-red-600 rounded-full overflow-hidden border border-white/20 p-0.5">
              {/* Sweet spot notch */}
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-8 bg-emerald-300/40" />

              {/* Balance Needle */}
              <div
                className="absolute top-0 bottom-0 w-3 bg-white rounded-full shadow-lg border border-black transition-all duration-75 -translate-x-1/2"
                style={{
                  left: `${THREE_LERP_PERCENT(balance)}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ================= BOTTOM BAR ================= */}
      <div className="flex justify-between items-end gap-4">
        {/* Speedometer & Jump Charge */}
        <div className="flex flex-col gap-2">
          {isCrouching && (
            <div className="w-36 sm:w-44 bg-black/70 backdrop-blur-md border border-white/20 rounded-xl p-2 shadow-lg">
              <div className="flex justify-between text-[10px] font-extrabold uppercase text-amber-300 mb-1">
                <span>Ollie Charge</span>
                <span>{Math.round(ollieCharge * 100)}%</span>
              </div>
              <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-red-500 rounded-full transition-all duration-75"
                  style={{ width: `${Math.min(ollieCharge * 100, 100)}%` }}
                />
              </div>
            </div>
          )}

          <div className="bg-black/60 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-2 text-left shadow-lg">
            <span className="text-[10px] uppercase font-bold tracking-widest text-white/50 block">Speed</span>
            <div className="flex items-baseline gap-1 text-2xl font-black italic text-cyan-400">
              {speedKmh} <span className="text-xs font-semibold text-white/70 not-italic">KM/H</span>
            </div>
          </div>
        </div>

        {/* Center Bottom: Active Combo Chain */}
        {hasActiveCombo && (
          <div className="flex flex-col items-center gap-1.5 max-w-lg bg-black/80 backdrop-blur-lg border-2 border-amber-400/80 rounded-3xl px-6 py-3.5 shadow-2xl shadow-amber-500/20 animate-pulse">
            <div className="flex items-center gap-1.5 text-amber-400 text-xs font-extrabold uppercase tracking-widest">
              <Flame size={15} className="animate-spin" />
              <span>Combo Chain</span>
            </div>

            {/* List of tricks */}
            <div className="text-white font-black italic text-sm sm:text-base tracking-wide text-center uppercase drop-shadow flex flex-wrap justify-center gap-1">
              {comboTricks.map((trick, idx) => (
                <span key={idx}>
                  {trick}
                  {idx < comboTricks.length - 1 && <span className="text-amber-400 mx-1">+</span>}
                </span>
              ))}
            </div>

            {/* Combo Total Points Calculation */}
            <div className="flex items-baseline gap-2 font-black text-xl sm:text-2xl italic tracking-wider text-yellow-300">
              <span>{currentComboPoints.toLocaleString()}</span>
              <span className="text-amber-400 text-base">×</span>
              <span className="text-cyan-400">{comboMultiplier}</span>
              <span className="text-white/60 text-sm">=</span>
              <span className="text-emerald-400 text-2xl sm:text-3xl">
                {(currentComboPoints * comboMultiplier).toLocaleString()} PTS
              </span>
            </div>
          </div>
        )}

        {/* Controls helper hint */}
        <div className="hidden lg:block text-right text-xs text-white/60 bg-black/50 backdrop-blur-sm border border-white/10 rounded-2xl p-3 shadow-lg">
          <div className="font-bold text-white/90 mb-1">SNABBKNAPPAR</div>
          <div><kbd className="bg-white/20 px-1.5 py-0.5 rounded text-white font-mono">W / ↑</kbd> Fart &nbsp; <kbd className="bg-white/20 px-1.5 py-0.5 rounded text-white font-mono">SPACE</kbd> Ollie</div>
          <div className="mt-1"><kbd className="bg-white/20 px-1.5 py-0.5 rounded text-white font-mono">J</kbd> Kickflip &nbsp; <kbd className="bg-white/20 px-1.5 py-0.5 rounded text-white font-mono">K</kbd> Heelflip &nbsp; <kbd className="bg-white/20 px-1.5 py-0.5 rounded text-white font-mono">L</kbd> Shuvit</div>
          <div className="mt-1"><kbd className="bg-white/20 px-1.5 py-0.5 rounded text-white font-mono">SHIFT / G</kbd> Grind &nbsp; <kbd className="bg-white/20 px-1.5 py-0.5 rounded text-white font-mono">M</kbd> Manual</div>
        </div>
      </div>
    </div>
  );
};

function THREE_LERP_PERCENT(balance: number): number {
  // Convert -1.0..1.0 to 0..100%
  const clamped = Math.max(-1.0, Math.min(1.0, balance));
  return (clamped + 1.0) * 50;
}
