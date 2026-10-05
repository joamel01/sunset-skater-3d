import React from 'react';
import { X, Sparkles, Trophy, Gamepad2, Award } from 'lucide-react';

interface TrickBookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TrickBookModal: React.FC<TrickBookModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl text-left overflow-y-auto max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
            <Trophy size={28} />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black italic tracking-wide text-white uppercase m-0">
              Skate Manual & Tricks
            </h2>
            <p className="text-sm text-white/60 m-0">
              Lär dig alla tricks, grinds och kombinationer i Sunset Skater 3D!
            </p>
          </div>
        </div>

        {/* Controls Grid */}
        <div className="mb-6">
          <h3 className="text-sm font-extrabold uppercase tracking-widest text-amber-400 mb-3 flex items-center gap-2">
            <Gamepad2 size={16} /> Kontroller
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex justify-between items-center">
              <span className="text-white/80 font-medium">Accelerera / Tryck fart</span>
              <kbd className="bg-white/15 px-2.5 py-1 rounded-lg text-white font-mono font-bold">W / ↑</kbd>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex justify-between items-center">
              <span className="text-white/80 font-medium">Styr åt vänster / höger</span>
              <kbd className="bg-white/15 px-2.5 py-1 rounded-lg text-white font-mono font-bold">A / D / ← →</kbd>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex justify-between items-center">
              <span className="text-white/80 font-medium">Bromsa / Backa</span>
              <kbd className="bg-white/15 px-2.5 py-1 rounded-lg text-white font-mono font-bold">S / ↓</kbd>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex justify-between items-center">
              <span className="text-white/80 font-medium">Ollie Jump (Håll för högre!)</span>
              <kbd className="bg-white/15 px-2.5 py-1 rounded-lg text-amber-300 font-mono font-bold">SPACE</kbd>
            </div>
          </div>
        </div>

        {/* Trick Encyclopedia */}
        <div className="mb-6">
          <h3 className="text-sm font-extrabold uppercase tracking-widest text-amber-400 mb-3 flex items-center gap-2">
            <Sparkles size={16} /> Trick-Lexikon
          </h3>
          <div className="space-y-2.5 text-sm">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex items-center justify-between">
              <div>
                <div className="font-bold text-white text-base">Kickflip</div>
                <div className="text-xs text-white/60">Brädan roterar 360° längs axeln i luften</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-emerald-400 font-black">+500 PTS</span>
                <kbd className="bg-purple-600/40 border border-purple-400/50 px-2.5 py-1 rounded-lg text-white font-mono font-bold">J</kbd>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex items-center justify-between">
              <div>
                <div className="font-bold text-white text-base">Heelflip</div>
                <div className="text-xs text-white/60">Omvänd 360° rotation</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-emerald-400 font-black">+550 PTS</span>
                <kbd className="bg-purple-600/40 border border-purple-400/50 px-2.5 py-1 rounded-lg text-white font-mono font-bold">K</kbd>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex items-center justify-between">
              <div>
                <div className="font-bold text-white text-base">360 Pop Shuvit</div>
                <div className="text-xs text-white/60">Brädan snurrar ett helt horisontellt varv</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-emerald-400 font-black">+700 PTS</span>
                <kbd className="bg-indigo-600/40 border border-indigo-400/50 px-2.5 py-1 rounded-lg text-white font-mono font-bold">L</kbd>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex items-center justify-between">
              <div>
                <div className="font-bold text-white text-base">50-50 & Boardslide Grind</div>
                <div className="text-xs text-white/60">Lås fast på räcken och ledges. Balansera med A / D!</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-emerald-400 font-black">+400 + 180/s</span>
                <kbd className="bg-amber-500/40 border border-amber-400/50 px-2.5 py-1 rounded-lg text-white font-mono font-bold">SHIFT / G</kbd>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex items-center justify-between">
              <div>
                <div className="font-bold text-white text-base">Manual (Wheelie)</div>
                <div className="text-xs text-white/60">Rulla på bakhjulen på marken för att kedja ihop combos!</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-emerald-400 font-black">+250 + 140/s</span>
                <kbd className="bg-cyan-500/40 border border-cyan-400/50 px-2.5 py-1 rounded-lg text-white font-mono font-bold">M</kbd>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex items-center justify-between">
              <div>
                <div className="font-bold text-white text-base">Big Vert Air (Ramp Launch)</div>
                <div className="text-xs text-white/60">Åk rakt in i Quarterpipes för att flyga högt i luften</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-emerald-400 font-black">+400 PTS</span>
                <span className="text-white/60 font-semibold text-xs">Full Fart</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pro Tips */}
        <div className="bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-cyan-500/10 border border-white/15 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-amber-300 font-bold mb-2">
            <Award size={18} /> PRO TIPS: Hur man får 50 000+ poäng
          </div>
          <ul className="text-xs text-white/80 space-y-1.5 list-disc pl-4 m-0">
            <li><strong>Länka dina combos:</strong> Gör en Kickflip, landa i en Grind på räcket, hoppa av med en Heelflip och landa direkt i en Manual (knapp <code>M</code>) för att multiplicera poängen!</li>
            <li><strong>Samla alla S-K-A-T-E bokstäver:</strong> Ger en massiv bonus på hela +25 000 poäng!</li>
            <li><strong>Gamepad-stöd:</strong> Koppla in en Xbox eller PlayStation-kontroll för äkta arkadkänsla!</li>
          </ul>
        </div>

        {/* Start button */}
        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-400 hover:to-red-400 text-black font-black uppercase tracking-wider text-base transition shadow-xl shadow-amber-500/30 cursor-pointer"
          >
            Fortsätt Skata!
          </button>
        </div>
      </div>
    </div>
  );
};
