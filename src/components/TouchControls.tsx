import React from 'react';
import type { GameEngine } from '../game/engine';
import type { InputState } from '../game/skaterController';

interface TouchControlsProps {
  engine: GameEngine | null;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ engine }) => {
  const setInput = (key: keyof InputState, value: boolean) => {
    if (!engine) return;
    engine.input[key] = value;
  };

  return (
    <div className="md:hidden absolute inset-x-0 bottom-6 px-4 pointer-events-none flex justify-between items-end select-none z-20">
      {/* Left Pad: D-Pad Directional Controls */}
      <div className="pointer-events-auto grid grid-cols-3 gap-1.5 w-36 h-36 bg-black/40 backdrop-blur-md p-2 rounded-3xl border border-white/20 shadow-xl">
        <div />
        <button
          onTouchStart={() => setInput('forward', true)}
          onTouchEnd={() => setInput('forward', false)}
          onMouseDown={() => setInput('forward', true)}
          onMouseUp={() => setInput('forward', false)}
          className="bg-white/20 active:bg-amber-400 active:text-black text-white rounded-xl flex items-center justify-center font-black text-lg transition"
        >
          ▲
        </button>
        <div />

        <button
          onTouchStart={() => setInput('left', true)}
          onTouchEnd={() => setInput('left', false)}
          onMouseDown={() => setInput('left', true)}
          onMouseUp={() => setInput('left', false)}
          className="bg-white/20 active:bg-amber-400 active:text-black text-white rounded-xl flex items-center justify-center font-black text-lg transition"
        >
          ◀
        </button>
        <div className="flex items-center justify-center text-white/30 text-[10px] font-bold">
          STEER
        </div>
        <button
          onTouchStart={() => setInput('right', true)}
          onTouchEnd={() => setInput('right', false)}
          onMouseDown={() => setInput('right', true)}
          onMouseUp={() => setInput('right', false)}
          className="bg-white/20 active:bg-amber-400 active:text-black text-white rounded-xl flex items-center justify-center font-black text-lg transition"
        >
          ▶
        </button>

        <div />
        <button
          onTouchStart={() => setInput('backward', true)}
          onTouchEnd={() => setInput('backward', false)}
          onMouseDown={() => setInput('backward', true)}
          onMouseUp={() => setInput('backward', false)}
          className="bg-white/20 active:bg-amber-400 active:text-black text-white rounded-xl flex items-center justify-center font-black text-lg transition"
        >
          ▼
        </button>
        <div />
      </div>

      {/* Right Pad: Action & Trick Buttons */}
      <div className="pointer-events-auto flex flex-col items-end gap-2.5">
        {/* Quick Trick Row */}
        <div className="flex gap-2">
          <button
            onTouchStart={() => setInput('kickflip', true)}
            onTouchEnd={() => setInput('kickflip', false)}
            onMouseDown={() => setInput('kickflip', true)}
            onMouseUp={() => setInput('kickflip', false)}
            className="w-12 h-12 rounded-2xl bg-purple-600/80 active:bg-purple-400 text-white font-black text-xs border border-purple-300/40 shadow-lg flex items-center justify-center uppercase"
          >
            FLIP
          </button>

          <button
            onTouchStart={() => setInput('shuvit', true)}
            onTouchEnd={() => setInput('shuvit', false)}
            onMouseDown={() => setInput('shuvit', true)}
            onMouseUp={() => setInput('shuvit', false)}
            className="w-12 h-12 rounded-2xl bg-indigo-600/80 active:bg-indigo-400 text-white font-black text-xs border border-indigo-300/40 shadow-lg flex items-center justify-center uppercase"
          >
            SHUV
          </button>

          <button
            onTouchStart={() => setInput('grind', true)}
            onTouchEnd={() => setInput('grind', false)}
            onMouseDown={() => setInput('grind', true)}
            onMouseUp={() => setInput('grind', false)}
            className="w-12 h-12 rounded-2xl bg-amber-500/90 active:bg-amber-300 text-black font-black text-xs border border-amber-300 shadow-lg flex items-center justify-center uppercase"
          >
            GRIND
          </button>

          <button
            onTouchStart={() => setInput('manual', true)}
            onTouchEnd={() => setInput('manual', false)}
            onMouseDown={() => setInput('manual', true)}
            onMouseUp={() => setInput('manual', false)}
            className="w-12 h-12 rounded-2xl bg-cyan-600/80 active:bg-cyan-400 text-white font-black text-xs border border-cyan-300/40 shadow-lg flex items-center justify-center uppercase"
          >
            MAN
          </button>
        </div>

        {/* Big Ollie Pop Button */}
        <button
          onTouchStart={() => setInput('ollie', true)}
          onTouchEnd={() => setInput('ollie', false)}
          onMouseDown={() => setInput('ollie', true)}
          onMouseUp={() => setInput('ollie', false)}
          className="w-24 h-16 rounded-3xl bg-gradient-to-r from-red-500 to-amber-500 active:from-red-600 active:to-amber-600 text-white font-black italic tracking-widest text-lg border-2 border-white/40 shadow-2xl shadow-red-500/50 flex items-center justify-center uppercase cursor-pointer"
        >
          OLLIE
        </button>
      </div>
    </div>
  );
};
