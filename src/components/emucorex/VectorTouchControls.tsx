import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Zap,
  Save,
  FolderOpen,
  Sliders,
  Move,
  Gamepad
} from 'lucide-react';

export type TouchStyle = 'vector' | 'neon' | 'classic' | 'minimal' | 'glass';

export interface ControlsConfig {
  style: TouchStyle;
  opacity: number; // 0.1 to 1.0
  scale: number; // 0.7 to 1.5
  haptics: boolean;
  showAnalogSticks: boolean;
  showShoulderButtons: boolean;
  showTurboButton: boolean;
  deadzone: number;
}

export interface ControlPositions {
  dpad: { x: number; y: number };
  leftStick: { x: number; y: number };
  rightStick: { x: number; y: number };
  faceButtons: { x: number; y: number };
  shouldersLeft: { x: number; y: number };
  shouldersRight: { x: number; y: number };
  centerButtons: { x: number; y: number };
}

const POSITIONS_STORAGE_KEY = 'emustation_control_positions_v2';

function getResponsiveDefaultPositions(width: number, height: number): ControlPositions {
  const isPortrait = width < 640 && height >= width;
  const isCompactLandscape = !isPortrait && height < 520;

  if (isPortrait) {
    // Portrait phone: bottom 312px reserved below the canvas; zero overlaps
    return {
      shouldersLeft: { x: 14, y: 266 },   // bottom-anchored in portrait
      shouldersRight: { x: 14, y: 266 },  // bottom-anchored in portrait
      dpad: { x: 14, y: 134 },            // bottom-left
      faceButtons: { x: 14, y: 134 },     // bottom-right
      leftStick: { x: 42, y: 46 },        // staggered below D-Pad
      rightStick: { x: 42, y: 46 },       // staggered below Face Buttons
      centerButtons: { x: 0, y: 6 }       // single compact bar at bottom center
    };
  }

  if (isCompactLandscape) {
    // Landscape phone (e.g. 844x390): shoulders sit below 56px top bar
    return {
      shouldersLeft: { x: 14, y: 62 },    // top-anchored below top bar
      shouldersRight: { x: 14, y: 62 },   // top-anchored below top bar
      dpad: { x: 16, y: 108 },            // bottom-left
      faceButtons: { x: 16, y: 108 },     // bottom-right
      leftStick: { x: 138, y: 16 },       // diagonal right-down from D-Pad
      rightStick: { x: 138, y: 16 },      // diagonal left-down from Face Buttons
      centerButtons: { x: 0, y: 10 }      // bottom center
    };
  }

  // Tablet & Desktop wide layout
  return {
    shouldersLeft: { x: 24, y: 68 },      // top-anchored cleanly below top bar
    shouldersRight: { x: 24, y: 68 },     // top-anchored cleanly below top bar
    dpad: { x: 24, y: 132 },              // bottom-left
    faceButtons: { x: 24, y: 132 },       // bottom-right
    leftStick: { x: 164, y: 24 },         // staggered inward below D-Pad
    rightStick: { x: 164, y: 24 },        // staggered inward below Face Buttons
    centerButtons: { x: 0, y: 16 }        // bottom center
  };
}

interface VectorTouchControlsProps {
  onButtonPress?: (button: string) => void;
  onButtonRelease?: (button: string) => void;
  onAnalogMove?: (stick: 'left' | 'right', x: number, y: number) => void;
  onTurboToggle?: (enabled: boolean) => void;
  onQuickSave?: () => void;
  onQuickLoad?: () => void;
  onOpenSettings?: () => void;
  config: ControlsConfig;
  onUpdateConfig?: (newConfig: Partial<ControlsConfig>) => void;
}

export const VectorTouchControls: React.FC<VectorTouchControlsProps> = ({
  onButtonPress,
  onButtonRelease,
  onAnalogMove,
  onTurboToggle,
  onQuickSave,
  onQuickLoad,
  onOpenSettings,
  config
}) => {
  const [pressedButtons, setPressedButtons] = useState<Record<string, boolean>>({});
  const [analogModeActive, setAnalogModeActive] = useState<boolean>(true);
  const [turboActive, setTurboActive] = useState<boolean>(false);
  const [connectedGamepadName, setConnectedGamepadName] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  const [viewport, setViewport] = useState<{ width: number; height: number }>(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  }));

  const [customPositions, setCustomPositions] = useState<ControlPositions | null>(() => {
    try {
      const saved = localStorage.getItem(POSITIONS_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as ControlPositions) : null;
    } catch {
      return null;
    }
  });

  const isPortrait = viewport.width < 640 && viewport.height >= viewport.width;

  const responsiveDefaults = useMemo(
    () => getResponsiveDefaultPositions(viewport.width, viewport.height),
    [viewport.width, viewport.height]
  );

  const positions = customPositions ?? responsiveDefaults;

  // Responsive effective scale so compact phones don't overflow
  const effectiveScale = useMemo(() => {
    if (isPortrait) return Math.min(config.scale, 0.92);
    if (viewport.height < 460) return Math.min(config.scale, 0.85);
    return config.scale;
  }, [config.scale, isPortrait, viewport.height]);

  const [activeDragging, setActiveDragging] = useState<keyof ControlPositions | null>(null);
  const dragMetaRef = useRef<{
    key: keyof ControlPositions;
    startX: number;
    startY: number;
    initX: number;
    initY: number;
  } | null>(null);

  // Left & Right Analog Stick States
  const [leftStickPos, setLeftStickPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [rightStickPos, setRightStickPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [leftStickActive, setLeftStickActive] = useState<boolean>(false);
  const [rightStickActive, setRightStickActive] = useState<boolean>(false);

  const leftStickRef = useRef<HTMLDivElement | null>(null);
  const rightStickRef = useRef<HTMLDivElement | null>(null);

  // Sync viewport size and listen for external layout reset
  useEffect(() => {
    const handleResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    const handleExternalReset = () => {
      setCustomPositions(null);
      setIsEditMode(false);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('emustation-reset-controls', handleExternalReset);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('emustation-reset-controls', handleExternalReset);
    };
  }, []);

  const triggerHaptic = useCallback(() => {
    if (config.haptics && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(12);
      } catch {
        // Ignore unsupported vibration in browser
      }
    }
  }, [config.haptics]);

  const handlePress = useCallback(
    (btn: string) => {
      setPressedButtons((prev) => ({ ...prev, [btn]: true }));
      triggerHaptic();
      onButtonPress?.(btn);
    },
    [triggerHaptic, onButtonPress]
  );

  const handleRelease = useCallback(
    (btn: string) => {
      setPressedButtons((prev) => ({ ...prev, [btn]: false }));
      onButtonRelease?.(btn);
    },
    [onButtonRelease]
  );

  const toggleTurbo = useCallback(() => {
    setTurboActive((prev) => {
      const next = !prev;
      triggerHaptic();
      onTurboToggle?.(next);
      return next;
    });
  }, [triggerHaptic, onTurboToggle]);

  const savePositions = () => {
    try {
      localStorage.setItem(POSITIONS_STORAGE_KEY, JSON.stringify(positions));
    } catch {
      // Ignore storage errors
    }
    setIsEditMode(false);
  };

  const resetPositions = () => {
    setCustomPositions(null);
    try {
      localStorage.removeItem(POSITIONS_STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  // Global Pointer Dragging for Edit Mode (works seamlessly on both Mouse & Touch)
  const startDragging = (
    key: keyof ControlPositions,
    e: React.PointerEvent
  ) => {
    if (!isEditMode) return;
    e.stopPropagation();
    const base = customPositions ?? responsiveDefaults;
    setCustomPositions(base);
    setActiveDragging(key);
    dragMetaRef.current = {
      key,
      startX: e.clientX,
      startY: e.clientY,
      initX: base[key].x,
      initY: base[key].y
    };
  };

  useEffect(() => {
    if (!isEditMode || !activeDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      const meta = dragMetaRef.current;
      if (!meta) return;
      const dx = e.clientX - meta.startX;
      const dy = e.clientY - meta.startY;
      const isRightAnchored =
        meta.key === 'faceButtons' ||
        meta.key === 'rightStick' ||
        meta.key === 'shouldersRight';
      const isTopAnchored =
        !isPortrait &&
        (meta.key === 'shouldersLeft' || meta.key === 'shouldersRight');

      const nextX = isRightAnchored ? meta.initX - dx : meta.initX + dx;
      const nextY = isTopAnchored ? meta.initY + dy : meta.initY - dy;

      setCustomPositions((prev) => {
        const current = prev ?? responsiveDefaults;
        return {
          ...current,
          [meta.key]: {
            x:
              meta.key === 'centerButtons'
                ? Math.max(-160, Math.min(160, nextX))
                : Math.max(4, Math.min(viewport.width - 120, nextX)),
            y: isTopAnchored
              ? Math.max(58, Math.min(viewport.height - 140, nextY))
              : Math.max(4, Math.min(viewport.height - 150, nextY))
          }
        };
      });
    };

    const handlePointerUp = () => {
      setActiveDragging(null);
      dragMetaRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [isEditMode, activeDragging, isPortrait, responsiveDefaults, viewport.height, viewport.width]);

  // Analog Stick Pointer Move Logic
  const handleStickMove = (
    stick: 'left' | 'right',
    container: HTMLDivElement | null,
    clientX: number,
    clientY: number
  ) => {
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maxRadius = Math.max(18, rect.width / 2 - 14);

    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    const distance = Math.hypot(deltaX, deltaY);
    const angle = Math.atan2(deltaY, deltaX);

    const clampedRadius = Math.min(distance, maxRadius);
    const normX = Math.cos(angle) * (clampedRadius / maxRadius);
    const normY = Math.sin(angle) * (clampedRadius / maxRadius);

    if (stick === 'left') {
      setLeftStickPos({ x: normX * maxRadius, y: normY * maxRadius });
      onAnalogMove?.('left', normX, normY);
    } else {
      setRightStickPos({ x: normX * maxRadius, y: normY * maxRadius });
      onAnalogMove?.('right', normX, normY);
    }
  };

  const resetStick = (stick: 'left' | 'right') => {
    if (stick === 'left') {
      setLeftStickPos({ x: 0, y: 0 });
      setLeftStickActive(false);
      onAnalogMove?.('left', 0, 0);
    } else {
      setRightStickPos({ x: 0, y: 0 });
      setRightStickActive(false);
      onAnalogMove?.('right', 0, 0);
    }
  };

  // Keyboard Event Listeners
  useEffect(() => {
    const keyMap: Record<string, string> = {
      KeyW: 'up',
      ArrowUp: 'up',
      KeyS: 'down',
      ArrowDown: 'down',
      KeyA: 'left',
      ArrowLeft: 'left',
      KeyD: 'right',
      ArrowRight: 'right',
      KeyJ: 'cross',
      KeyK: 'circle',
      KeyU: 'square',
      KeyI: 'triangle',
      KeyQ: 'l1',
      KeyE: 'r1',
      KeyZ: 'l2',
      KeyC: 'r2',
      Space: 'select',
      Enter: 'start',
      Tab: 'turbo'
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const btn = keyMap[e.code];
      if (btn) {
        if (btn === 'turbo') {
          toggleTurbo();
        } else {
          handlePress(btn);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const btn = keyMap[e.code];
      if (btn && btn !== 'turbo') {
        handleRelease(btn);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handlePress, handleRelease, toggleTurbo]);

  // Physical Gamepad API polling
  useEffect(() => {
    let animId: number;
    const pollGamepad = () => {
      if (typeof navigator !== 'undefined' && 'getGamepads' in navigator) {
        const gamepads = navigator.getGamepads();
        const gp = gamepads[0] || gamepads[1];
        if (gp) {
          setConnectedGamepadName(gp.id || 'Controle USB/Bluetooth');

          const mapping = [
            'cross',
            'circle',
            'square',
            'triangle',
            'l1',
            'r1',
            'l2',
            'r2',
            'select',
            'start',
            'l3',
            'r3',
            'up',
            'down',
            'left',
            'right'
          ];

          setPressedButtons((prev) => {
            const next = { ...prev };
            mapping.forEach((btn, idx) => {
              if (gp.buttons[idx]) {
                const pressed = gp.buttons[idx].pressed;
                if (pressed && !prev[btn]) onButtonPress?.(btn);
                else if (!pressed && prev[btn]) onButtonRelease?.(btn);
                next[btn] = pressed;
              }
            });
            return next;
          });

          if (gp.axes.length >= 2) {
            const lx = gp.axes[0];
            const ly = gp.axes[1];
            if (Math.abs(lx) > config.deadzone || Math.abs(ly) > config.deadzone) {
              setLeftStickPos({ x: lx * 26, y: ly * 26 });
              onAnalogMove?.('left', lx, ly);
            }
          }

          if (gp.axes.length >= 4) {
            const rx = gp.axes[2];
            const ry = gp.axes[3];
            if (Math.abs(rx) > config.deadzone || Math.abs(ry) > config.deadzone) {
              setRightStickPos({ x: rx * 26, y: ry * 26 });
              onAnalogMove?.('right', rx, ry);
            }
          }
        } else {
          setConnectedGamepadName(null);
        }
      }
      animId = requestAnimationFrame(pollGamepad);
    };

    animId = requestAnimationFrame(pollGamepad);
    return () => cancelAnimationFrame(animId);
  }, [config.deadzone, onAnalogMove, onButtonPress, onButtonRelease]);

  const getStyleClasses = () => {
    switch (config.style) {
      case 'neon':
        return {
          dpadBg: 'bg-black/60 border-2 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]',
          buttonBase: 'border-2 border-purple-400 bg-black/60 shadow-[0_0_12px_rgba(192,132,252,0.4)]',
          cross: 'text-cyan-400 border-cyan-400',
          circle: 'text-rose-400 border-rose-400',
          square: 'text-pink-400 border-pink-400',
          triangle: 'text-emerald-400 border-emerald-400',
          stickBg: 'bg-slate-950/75 border-2 border-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.3)]',
          stickHead: 'bg-gradient-to-tr from-cyan-600 to-indigo-600 border border-cyan-300 shadow-md',
          shoulder: 'bg-black/70 border border-cyan-400/80 text-cyan-200'
        };
      case 'classic':
        return {
          dpadBg: 'bg-slate-900/90 border border-slate-700 shadow-xl',
          buttonBase: 'bg-slate-800/95 border border-slate-600 shadow-lg',
          cross: 'text-blue-400 border-blue-500',
          circle: 'text-red-500 border-red-500',
          square: 'text-pink-400 border-pink-500',
          triangle: 'text-emerald-400 border-emerald-500',
          stickBg: 'bg-slate-900/90 border border-slate-700',
          stickHead: 'bg-slate-700 border-2 border-slate-500 text-slate-300',
          shoulder: 'bg-slate-900/90 border border-slate-700 text-slate-200'
        };
      case 'minimal':
        return {
          dpadBg: 'border border-white/25 bg-black/15',
          buttonBase: 'border border-white/30 bg-black/15',
          cross: 'text-white border-white/40',
          circle: 'text-white border-white/40',
          square: 'text-white border-white/40',
          triangle: 'text-white border-white/40',
          stickBg: 'border border-white/25 bg-black/15',
          stickHead: 'bg-white/20 border border-white/40',
          shoulder: 'border border-white/25 bg-black/20 text-white'
        };
      case 'glass':
        return {
          dpadBg: 'bg-white/10 backdrop-blur-md border border-white/30 shadow-xl',
          buttonBase: 'bg-white/15 backdrop-blur-md border border-white/30 shadow-lg',
          cross: 'text-blue-300 border-white/40',
          circle: 'text-red-300 border-white/40',
          square: 'text-pink-300 border-white/40',
          triangle: 'text-emerald-300 border-white/40',
          stickBg: 'bg-white/10 backdrop-blur-md border border-white/25',
          stickHead: 'bg-white/30 backdrop-blur-md border border-white/50 text-white',
          shoulder: 'bg-white/15 backdrop-blur-md border border-white/30 text-white'
        };
      case 'vector':
      default:
        return {
          dpadBg: 'bg-black/40 backdrop-blur-xs border-2 border-white/40 shadow-xl',
          buttonBase: 'bg-black/45 backdrop-blur-xs border-2 border-white/40 shadow-md',
          cross: 'text-blue-400 border-blue-400/80',
          circle: 'text-red-400 border-red-400/80',
          square: 'text-pink-400 border-pink-400/80',
          triangle: 'text-emerald-400 border-emerald-400/80',
          stickBg: 'bg-black/40 backdrop-blur-xs border-2 border-white/40',
          stickHead: 'bg-white/35 backdrop-blur-xs border border-white/70 text-white',
          shoulder: 'bg-black/45 backdrop-blur-xs border border-white/40 text-white'
        };
    }
  };

  const styleClasses = getStyleClasses();

  return (
    <div
      className="absolute inset-0 pointer-events-none select-none z-30 touch-none"
      style={{ opacity: isEditMode ? 1 : config.opacity }}
    >
      {/* Portrait Controller Deck Background Separator */}
      {isPortrait && (
        <div className="absolute inset-x-0 bottom-0 h-[312px] bg-gradient-to-t from-slate-950 via-slate-950/95 to-black/80 border-t border-white/10 pointer-events-none" />
      )}

      {/* Edit Mode Banner */}
      {isEditMode && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full shadow-2xl border border-blue-400 flex flex-wrap items-center justify-center gap-2 text-xs font-bold pointer-events-auto z-50 max-w-[92vw]">
          <Move className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Arraste os grupos de botões</span>
          <button
            onClick={savePositions}
            className="px-3 py-1 bg-white text-blue-700 rounded-full hover:bg-blue-50 transition-colors cursor-pointer"
          >
            Salvar
          </button>
          <button
            onClick={resetPositions}
            className="px-2.5 py-1 bg-blue-800 text-white rounded-full hover:bg-blue-900 transition-colors cursor-pointer"
          >
            Padrão
          </button>
        </div>
      )}

      {/* Connected Gamepad Pill */}
      {connectedGamepadName && !isEditMode && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-emerald-950/90 border border-emerald-600/70 text-emerald-300 px-3 py-1 rounded-full text-[11px] font-mono flex items-center gap-2 shadow-lg z-30 pointer-events-none">
          <Gamepad className="w-3.5 h-3.5 text-emerald-400" />
          <span className="truncate max-w-[180px]">{connectedGamepadName}</span>
        </div>
      )}

      {/* =========================================================================
          SHOULDER BUTTONS (L2/L1 Left & R1/R2 Right — Horizontal for Clean Clearance)
         ========================================================================= */}
      {config.showShoulderButtons && (
        <div className="pointer-events-auto">
          {/* Left Shoulders: L2 & L1 */}
          <div
            className={`absolute flex flex-row gap-2 touch-none ${
              isEditMode ? 'ring-2 ring-blue-400 rounded-2xl p-1 bg-blue-950/40 cursor-move' : ''
            }`}
            style={
              isPortrait
                ? {
                    left: `${positions.shouldersLeft.x}px`,
                    bottom: `${positions.shouldersLeft.y}px`,
                    transform: `scale(${effectiveScale})`,
                    transformOrigin: 'bottom left'
                  }
                : {
                    left: `${positions.shouldersLeft.x}px`,
                    top: `${positions.shouldersLeft.y}px`,
                    transform: `scale(${effectiveScale})`,
                    transformOrigin: 'top left'
                  }
            }
            onPointerDown={(e) => startDragging('shouldersLeft', e)}
          >
            <button
              onPointerDown={() => !isEditMode && handlePress('l2')}
              onPointerUp={() => !isEditMode && handleRelease('l2')}
              onPointerCancel={() => !isEditMode && handleRelease('l2')}
              onPointerLeave={() => !isEditMode && handleRelease('l2')}
              className={`w-14 h-9 rounded-xl ${styleClasses.shoulder} flex items-center justify-center font-black text-xs font-mono tracking-wider transition-transform cursor-pointer ${
                pressedButtons['l2'] ? 'scale-90 bg-white/40 border-white' : ''
              }`}
            >
              L2
            </button>
            <button
              onPointerDown={() => !isEditMode && handlePress('l1')}
              onPointerUp={() => !isEditMode && handleRelease('l1')}
              onPointerCancel={() => !isEditMode && handleRelease('l1')}
              onPointerLeave={() => !isEditMode && handleRelease('l1')}
              className={`w-14 h-9 rounded-xl ${styleClasses.shoulder} flex items-center justify-center font-black text-xs font-mono tracking-wider transition-transform cursor-pointer ${
                pressedButtons['l1'] ? 'scale-90 bg-white/40 border-white' : ''
              }`}
            >
              L1
            </button>
          </div>

          {/* Right Shoulders: R1 & R2 */}
          <div
            className={`absolute flex flex-row gap-2 touch-none ${
              isEditMode ? 'ring-2 ring-blue-400 rounded-2xl p-1 bg-blue-950/40 cursor-move' : ''
            }`}
            style={
              isPortrait
                ? {
                    right: `${positions.shouldersRight.x}px`,
                    bottom: `${positions.shouldersRight.y}px`,
                    transform: `scale(${effectiveScale})`,
                    transformOrigin: 'bottom right'
                  }
                : {
                    right: `${positions.shouldersRight.x}px`,
                    top: `${positions.shouldersRight.y}px`,
                    transform: `scale(${effectiveScale})`,
                    transformOrigin: 'top right'
                  }
            }
            onPointerDown={(e) => startDragging('shouldersRight', e)}
          >
            <button
              onPointerDown={() => !isEditMode && handlePress('r1')}
              onPointerUp={() => !isEditMode && handleRelease('r1')}
              onPointerCancel={() => !isEditMode && handleRelease('r1')}
              onPointerLeave={() => !isEditMode && handleRelease('r1')}
              className={`w-14 h-9 rounded-xl ${styleClasses.shoulder} flex items-center justify-center font-black text-xs font-mono tracking-wider transition-transform cursor-pointer ${
                pressedButtons['r1'] ? 'scale-90 bg-white/40 border-white' : ''
              }`}
            >
              R1
            </button>
            <button
              onPointerDown={() => !isEditMode && handlePress('r2')}
              onPointerUp={() => !isEditMode && handleRelease('r2')}
              onPointerCancel={() => !isEditMode && handleRelease('r2')}
              onPointerLeave={() => !isEditMode && handleRelease('r2')}
              className={`w-14 h-9 rounded-xl ${styleClasses.shoulder} flex items-center justify-center font-black text-xs font-mono tracking-wider transition-transform cursor-pointer ${
                pressedButtons['r2'] ? 'scale-90 bg-white/40 border-white' : ''
              }`}
            >
              R2
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          MAIN DUALSHOCK 2 PAD GROUPS (Zero-Overlap Anchor Zones)
         ========================================================================= */}
      <div className="pointer-events-auto">
        {/* D-PAD */}
        <div
          className={`absolute touch-none ${
            isEditMode ? 'ring-2 ring-blue-400 rounded-full cursor-move' : ''
          }`}
          style={{
            left: `${positions.dpad.x}px`,
            bottom: `${positions.dpad.y}px`,
            transform: `scale(${effectiveScale})`,
            transformOrigin: 'bottom left'
          }}
          onPointerDown={(e) => startDragging('dpad', e)}
        >
          <div className={`w-30 h-30 sm:w-32 sm:h-32 rounded-full relative flex items-center justify-center ${styleClasses.dpadBg}`}>
            <div className="w-8 h-8 rounded-full bg-black/40 border border-white/20 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-white/30" />
            </div>

            <button
              onPointerDown={() => !isEditMode && handlePress('up')}
              onPointerUp={() => !isEditMode && handleRelease('up')}
              onPointerCancel={() => !isEditMode && handleRelease('up')}
              onPointerLeave={() => !isEditMode && handleRelease('up')}
              className={`absolute top-1 w-10 h-10 rounded-t-xl flex items-center justify-center text-white text-sm font-bold transition-all cursor-pointer ${
                pressedButtons['up'] ? 'bg-white/40 scale-95' : 'hover:bg-white/10'
              }`}
            >
              ▲
            </button>

            <button
              onPointerDown={() => !isEditMode && handlePress('down')}
              onPointerUp={() => !isEditMode && handleRelease('down')}
              onPointerCancel={() => !isEditMode && handleRelease('down')}
              onPointerLeave={() => !isEditMode && handleRelease('down')}
              className={`absolute bottom-1 w-10 h-10 rounded-b-xl flex items-center justify-center text-white text-sm font-bold transition-all cursor-pointer ${
                pressedButtons['down'] ? 'bg-white/40 scale-95' : 'hover:bg-white/10'
              }`}
            >
              ▼
            </button>

            <button
              onPointerDown={() => !isEditMode && handlePress('left')}
              onPointerUp={() => !isEditMode && handleRelease('left')}
              onPointerCancel={() => !isEditMode && handleRelease('left')}
              onPointerLeave={() => !isEditMode && handleRelease('left')}
              className={`absolute left-1 w-10 h-10 rounded-l-xl flex items-center justify-center text-white text-sm font-bold transition-all cursor-pointer ${
                pressedButtons['left'] ? 'bg-white/40 scale-95' : 'hover:bg-white/10'
              }`}
            >
              ◀
            </button>

            <button
              onPointerDown={() => !isEditMode && handlePress('right')}
              onPointerUp={() => !isEditMode && handleRelease('right')}
              onPointerCancel={() => !isEditMode && handleRelease('right')}
              onPointerLeave={() => !isEditMode && handleRelease('right')}
              className={`absolute right-1 w-10 h-10 rounded-r-xl flex items-center justify-center text-white text-sm font-bold transition-all cursor-pointer ${
                pressedButtons['right'] ? 'bg-white/40 scale-95' : 'hover:bg-white/10'
              }`}
            >
              ▶
            </button>
          </div>
        </div>

        {/* LEFT ANALOG STICK (L3) */}
        {config.showAnalogSticks && (
          <div
            className={`absolute touch-none ${
              isEditMode ? 'ring-2 ring-blue-400 rounded-full cursor-move' : ''
            }`}
            style={{
              left: `${positions.leftStick.x}px`,
              bottom: `${positions.leftStick.y}px`,
              transform: `scale(${effectiveScale})`,
              transformOrigin: 'bottom left'
            }}
            onPointerDown={(e) => startDragging('leftStick', e)}
          >
            <div
              ref={leftStickRef}
              onPointerDown={(e) => {
                if (isEditMode) return;
                e.currentTarget.setPointerCapture(e.pointerId);
                setLeftStickActive(true);
                triggerHaptic();
                handleStickMove('left', leftStickRef.current, e.clientX, e.clientY);
              }}
              onPointerMove={(e) => {
                if (!isEditMode && leftStickActive) {
                  handleStickMove('left', leftStickRef.current, e.clientX, e.clientY);
                }
              }}
              onPointerUp={() => resetStick('left')}
              onPointerCancel={() => resetStick('left')}
              className={`w-20 h-20 sm:w-22 sm:h-22 rounded-full relative flex items-center justify-center cursor-pointer touch-none ${styleClasses.stickBg}`}
            >
              <div className="w-10 h-10 rounded-full border border-white/10 pointer-events-none" />
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center absolute shadow-xl pointer-events-none ${styleClasses.stickHead}`}
                style={{
                  transform: `translate(${leftStickPos.x}px, ${leftStickPos.y}px)`
                }}
              >
                <span className="text-[10px] font-mono font-bold text-white/85">L3</span>
              </div>
            </div>
          </div>
        )}

        {/* CENTER STRIP: SELECT · MODE · START + COMPACT TOOLS */}
        <div
          className={`absolute left-1/2 flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 rounded-full bg-black/55 backdrop-blur-xs border border-white/15 touch-none ${
            isEditMode ? 'ring-2 ring-blue-400 cursor-move' : ''
          }`}
          style={{
            bottom: `${positions.centerButtons.y}px`,
            transform: `translateX(calc(-50% + ${positions.centerButtons.x}px))`,
            transformOrigin: 'bottom center'
          }}
          onPointerDown={(e) => startDragging('centerButtons', e)}
        >
          {config.showTurboButton && (
            <button
              onClick={() => !isEditMode && toggleTurbo()}
              className={`p-1.5 rounded-full border text-xs flex items-center justify-center transition-all cursor-pointer ${
                turboActive
                  ? 'bg-amber-500 border-amber-300 text-slate-950 font-black shadow-[0_0_12px_rgba(245,158,11,0.6)]'
                  : 'bg-black/40 border-white/25 text-white/80 hover:bg-white/20'
              }`}
              title="Turbo (200%)"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
            </button>
          )}

          <button
            onClick={() => {
              if (isEditMode) return;
              triggerHaptic();
              onQuickSave?.();
            }}
            className="hidden sm:flex p-1.5 rounded-full bg-black/40 border border-white/25 text-white/80 hover:bg-white/20 transition-all cursor-pointer"
            title="Salvar Rápido"
          >
            <Save className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              if (isEditMode) return;
              triggerHaptic();
              onQuickLoad?.();
            }}
            className="hidden sm:flex p-1.5 rounded-full bg-black/40 border border-white/25 text-white/80 hover:bg-white/20 transition-all cursor-pointer"
            title="Carregar Rápido"
          >
            <FolderOpen className="w-3.5 h-3.5" />
          </button>

          <button
            onPointerDown={() => !isEditMode && handlePress('select')}
            onPointerUp={() => !isEditMode && handleRelease('select')}
            onPointerCancel={() => !isEditMode && handleRelease('select')}
            onPointerLeave={() => !isEditMode && handleRelease('select')}
            className={`px-2.5 py-1 rounded-full ${styleClasses.shoulder} text-[9px] sm:text-[10px] font-mono tracking-wider uppercase transition-transform cursor-pointer ${
              pressedButtons['select'] ? 'bg-white/40 scale-95 border-white' : ''
            }`}
          >
            SELECT
          </button>

          <button
            onClick={() => {
              if (isEditMode) return;
              setAnalogModeActive((prev) => !prev);
              triggerHaptic();
            }}
            className="px-2 py-1 rounded-full bg-black/45 border border-white/25 flex items-center gap-1 text-[9px] font-mono text-white/90 hover:bg-white/20 transition-all cursor-pointer"
            title="Alternar Modo Analógico"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                analogModeActive ? 'bg-red-500 shadow-[0_0_6px_red]' : 'bg-slate-600'
              }`}
            />
            <span>MODE</span>
          </button>

          <button
            onPointerDown={() => !isEditMode && handlePress('start')}
            onPointerUp={() => !isEditMode && handleRelease('start')}
            onPointerCancel={() => !isEditMode && handleRelease('start')}
            onPointerLeave={() => !isEditMode && handleRelease('start')}
            className={`px-2.5 py-1 rounded-full ${styleClasses.shoulder} text-[9px] sm:text-[10px] font-mono tracking-wider uppercase transition-transform cursor-pointer ${
              pressedButtons['start'] ? 'bg-white/40 scale-95 border-white' : ''
            }`}
          >
            START
          </button>

          <button
            onClick={() => setIsEditMode((prev) => !prev)}
            className={`p-1.5 rounded-full border text-xs transition-all cursor-pointer ${
              isEditMode
                ? 'bg-blue-600 border-white text-white'
                : 'bg-black/40 border-white/25 text-white/80 hover:bg-white/20'
            }`}
            title="Mover Controles"
          >
            <Move className="w-3.5 h-3.5" />
          </button>

          {onOpenSettings && (
            <button
              onClick={() => !isEditMode && onOpenSettings()}
              className="hidden sm:flex p-1.5 rounded-full bg-black/40 border border-white/25 text-white/80 hover:bg-white/20 transition-all cursor-pointer"
              title="Personalizar Controles"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* RIGHT ANALOG STICK (R3) */}
        {config.showAnalogSticks && (
          <div
            className={`absolute touch-none ${
              isEditMode ? 'ring-2 ring-blue-400 rounded-full cursor-move' : ''
            }`}
            style={{
              right: `${positions.rightStick.x}px`,
              bottom: `${positions.rightStick.y}px`,
              transform: `scale(${effectiveScale})`,
              transformOrigin: 'bottom right'
            }}
            onPointerDown={(e) => startDragging('rightStick', e)}
          >
            <div
              ref={rightStickRef}
              onPointerDown={(e) => {
                if (isEditMode) return;
                e.currentTarget.setPointerCapture(e.pointerId);
                setRightStickActive(true);
                triggerHaptic();
                handleStickMove('right', rightStickRef.current, e.clientX, e.clientY);
              }}
              onPointerMove={(e) => {
                if (!isEditMode && rightStickActive) {
                  handleStickMove('right', rightStickRef.current, e.clientX, e.clientY);
                }
              }}
              onPointerUp={() => resetStick('right')}
              onPointerCancel={() => resetStick('right')}
              className={`w-20 h-20 sm:w-22 sm:h-22 rounded-full relative flex items-center justify-center cursor-pointer touch-none ${styleClasses.stickBg}`}
            >
              <div className="w-10 h-10 rounded-full border border-white/10 pointer-events-none" />
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center absolute shadow-xl pointer-events-none ${styleClasses.stickHead}`}
                style={{
                  transform: `translate(${rightStickPos.x}px, ${rightStickPos.y}px)`
                }}
              >
                <span className="text-[10px] font-mono font-bold text-white/85">R3</span>
              </div>
            </div>
          </div>
        )}

        {/* PLAYSTATION FACE BUTTONS (△, ○, ✕, □) */}
        <div
          className={`absolute touch-none ${
            isEditMode ? 'ring-2 ring-blue-400 rounded-full cursor-move' : ''
          }`}
          style={{
            right: `${positions.faceButtons.x}px`,
            bottom: `${positions.faceButtons.y}px`,
            transform: `scale(${effectiveScale})`,
            transformOrigin: 'bottom right'
          }}
          onPointerDown={(e) => startDragging('faceButtons', e)}
        >
          <div className={`w-30 h-30 sm:w-32 sm:h-32 rounded-full relative flex items-center justify-center ${styleClasses.buttonBase}`}>
            <div className="w-7 h-7 rounded-full border border-white/10 flex items-center justify-center text-white/30 text-[10px] font-mono font-bold">
              PS
            </div>

            {/* TRIANGLE (△) */}
            <button
              onPointerDown={() => !isEditMode && handlePress('triangle')}
              onPointerUp={() => !isEditMode && handleRelease('triangle')}
              onPointerCancel={() => !isEditMode && handleRelease('triangle')}
              onPointerLeave={() => !isEditMode && handleRelease('triangle')}
              className={`absolute top-1 w-10 h-10 rounded-full flex items-center justify-center text-base font-black transition-all cursor-pointer ${
                styleClasses.triangle
              } ${pressedButtons['triangle'] ? 'bg-emerald-500/60 scale-90 shadow-[0_0_15px_rgba(52,211,153,0.8)]' : 'border'}`}
            >
              △
            </button>

            {/* CIRCLE (○) */}
            <button
              onPointerDown={() => !isEditMode && handlePress('circle')}
              onPointerUp={() => !isEditMode && handleRelease('circle')}
              onPointerCancel={() => !isEditMode && handleRelease('circle')}
              onPointerLeave={() => !isEditMode && handleRelease('circle')}
              className={`absolute right-1 w-10 h-10 rounded-full flex items-center justify-center text-base font-black transition-all cursor-pointer ${
                styleClasses.circle
              } ${pressedButtons['circle'] ? 'bg-rose-500/60 scale-90 shadow-[0_0_15px_rgba(244,63,94,0.8)]' : 'border'}`}
            >
              ○
            </button>

            {/* CROSS (✕) */}
            <button
              onPointerDown={() => !isEditMode && handlePress('cross')}
              onPointerUp={() => !isEditMode && handleRelease('cross')}
              onPointerCancel={() => !isEditMode && handleRelease('cross')}
              onPointerLeave={() => !isEditMode && handleRelease('cross')}
              className={`absolute bottom-1 w-10 h-10 rounded-full flex items-center justify-center text-base font-black transition-all cursor-pointer ${
                styleClasses.cross
              } ${pressedButtons['cross'] ? 'bg-blue-500/60 scale-90 shadow-[0_0_15px_rgba(59,130,246,0.8)]' : 'border'}`}
            >
              ✕
            </button>

            {/* SQUARE (□) */}
            <button
              onPointerDown={() => !isEditMode && handlePress('square')}
              onPointerUp={() => !isEditMode && handleRelease('square')}
              onPointerCancel={() => !isEditMode && handleRelease('square')}
              onPointerLeave={() => !isEditMode && handleRelease('square')}
              className={`absolute left-1 w-10 h-10 rounded-full flex items-center justify-center text-base font-black transition-all cursor-pointer ${
                styleClasses.square
              } ${pressedButtons['square'] ? 'bg-pink-500/60 scale-90 shadow-[0_0_15px_rgba(236,72,153,0.8)]' : 'border'}`}
            >
              □
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
