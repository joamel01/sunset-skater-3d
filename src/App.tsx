import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/engine';
import type { CameraMode } from './game/engine';
import type { GameMode } from './game/types';
import { audioEngine } from './game/audio';
import { HUD } from './components/HUD';
import { TouchControls } from './components/TouchControls';
import { TrickBookModal } from './components/TrickBookModal';
import { GameOverModal } from './components/GameOverModal';
import confetti from 'canvas-confetti';

export const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // High Scores from localStorage
  const [highScore, setHighScore] = useState<number>(() => {
    return parseInt(localStorage.getItem('skate_high_score') || '0', 10);
  });
  const [bestCombo, setBestCombo] = useState<number>(() => {
    return parseInt(localStorage.getItem('skate_best_combo') || '0', 10);
  });

  // Current session state
  const [score, setScore] = useState<number>(0);
  const [currentComboPoints, setCurrentComboPoints] = useState<number>(0);
  const [comboMultiplier, setComboMultiplier] = useState<number>(1);
  const [comboTricks, setComboTricks] = useState<string[]>([]);
  const [activeTrick, setActiveTrick] = useState<string>('');

  // Skater state
  const [isGrinding, setIsGrinding] = useState<boolean>(false);
  const [isManualing, setIsManualing] = useState<boolean>(false);
  const [balance, setBalance] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(0);
  const [ollieCharge, setOllieCharge] = useState<number>(0);
  const [isCrouching, setIsCrouching] = useState<boolean>(false);
  const [isBailed, setIsBailed] = useState<boolean>(false);

  // Collectibles: S-K-A-T-E
  const [letters, setLetters] = useState<{ [key: string]: boolean }>({
    S: false,
    K: false,
    A: false,
    T: false,
    E: false,
  });

  // Mode & Timer
  const [gameMode, setGameMode] = useState<GameMode>('scoreAttack');
  const [timeLeft, setTimeLeft] = useState<number>(120);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);

  // Settings & Modals
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState<boolean>(false);
  const [cameraMode, setCameraMode] = useState<CameraMode>('follow');
  const [isTrickBookOpen, setIsTrickBookOpen] = useState<boolean>(false);

  // Initialize GameEngine
  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new GameEngine(containerRef.current);
    engineRef.current = engine;
    engine.start();

    // Callbacks from controller
    engine.controller.onTrickLanded = (trickName) => {
      setActiveTrick(trickName);
    };

    engine.controller.onComboBanked = (comboScore) => {
      setScore((prev) => {
        const next = prev + comboScore;
        if (next > highScore) {
          setHighScore(next);
          localStorage.setItem('skate_high_score', next.toString());
        }
        return next;
      });

      setBestCombo((prev) => {
        if (comboScore > prev) {
          localStorage.setItem('skate_best_combo', comboScore.toString());
          return comboScore;
        }
        return prev;
      });
    };

    engine.controller.onBail = () => {
      setActiveTrick('WIPEOUT!');
    };

    engine.controller.onLetterCollected = (letter, allCollected) => {
      setLetters((prev) => ({ ...prev, [letter]: true }));

      if (allCollected) {
        // Massive 25,000 bonus points!
        setScore((prev) => prev + 25000);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.5 },
        });
      }
    };

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [highScore]);

  // Sync HUD state from engine loop (~30fps)
  useEffect(() => {
    const interval = setInterval(() => {
      const eng = engineRef.current;
      if (!eng) return;

      const c = eng.controller;
      setCurrentComboPoints(c.currentComboBasePoints);
      setComboMultiplier(c.comboMultiplier);
      setComboTricks(c.comboList.map((item) => item.name));
      setIsGrinding(c.isGrinding);
      setIsManualing(c.isManualing);
      setBalance(c.balance);
      setSpeed(c.speed);
      setOllieCharge(c.ollieCharge);
      setIsCrouching(c.isCrouching);
      setIsBailed(c.isBailed);
    }, 33);

    return () => clearInterval(interval);
  }, []);

  const handleGameOver = useCallback(() => {
    setIsGameOver(true);
    if (score > highScore) {
      setIsNewRecord(true);
      setHighScore(score);
      localStorage.setItem('skate_high_score', score.toString());
    }
  }, [score, highScore]);

  // Game timer in scoreAttack mode
  useEffect(() => {
    if (gameMode !== 'scoreAttack' || isGameOver) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleGameOver();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameMode, isGameOver, handleGameOver]);

  const handleRestart = () => {
    setScore(0);
    setTimeLeft(120);
    setIsGameOver(false);
    setIsNewRecord(false);
    setLetters({ S: false, K: false, A: false, T: false, E: false });
    if (engineRef.current) {
      engineRef.current.resetPark();
    }
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    audioEngine.setMute(next);
  };

  const handleToggleMusic = () => {
    const playing = audioEngine.toggleMusic();
    setIsMusicPlaying(playing);
  };

  const handleCycleCamera = () => {
    if (!engineRef.current) return;
    const modes: CameraMode[] = ['follow', 'close', 'overview'];
    const nextIdx = (modes.indexOf(cameraMode) + 1) % modes.length;
    const nextMode = modes[nextIdx];
    setCameraMode(nextMode);
    engineRef.current.cameraMode = nextMode;
  };

  const handleChangeMode = (mode: GameMode) => {
    setGameMode(mode);
    handleRestart();
  };

  const collectedCount = Object.values(letters).filter(Boolean).length;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Arcade HUD Overlay */}
      <HUD
        score={score}
        highScore={highScore}
        currentComboPoints={currentComboPoints}
        comboMultiplier={comboMultiplier}
        comboTricks={comboTricks}
        activeTrick={activeTrick}
        isGrinding={isGrinding}
        isManualing={isManualing}
        balance={balance}
        speed={speed}
        ollieCharge={ollieCharge}
        isCrouching={isCrouching}
        isBailed={isBailed}
        letters={letters}
        gameMode={gameMode}
        timeLeft={timeLeft}
        isMuted={isMuted}
        isMusicPlaying={isMusicPlaying}
        cameraMode={cameraMode}
        onToggleMute={handleToggleMute}
        onToggleMusic={handleToggleMusic}
        onCycleCamera={handleCycleCamera}
        onOpenTrickBook={() => setIsTrickBookOpen(true)}
        onRestart={handleRestart}
        onChangeMode={handleChangeMode}
      />

      {/* Touch Controls for Mobile/Tablet */}
      <TouchControls engine={engineRef.current} />

      {/* Trick Book & Controls Modal */}
      <TrickBookModal
        isOpen={isTrickBookOpen}
        onClose={() => setIsTrickBookOpen(false)}
      />

      {/* Game Over Summary Modal */}
      <GameOverModal
        isOpen={isGameOver}
        score={score}
        highScore={highScore}
        bestCombo={bestCombo}
        lettersCollectedCount={collectedCount}
        isNewRecord={isNewRecord}
        onPlayAgain={handleRestart}
        onSwitchToFreeSkate={() => {
          setGameMode('free');
          handleRestart();
        }}
      />
    </div>
  );
};

export default App;
