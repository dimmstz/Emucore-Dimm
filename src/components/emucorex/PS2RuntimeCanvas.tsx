import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PS2Game } from '../../data/emucorexGames';
import { Cpu } from 'lucide-react';

export interface LiveInputState {
  buttons: Record<string, boolean>;
  leftStick: { x: number; y: number };
  rightStick: { x: number; y: number };
}

interface PS2RuntimeCanvasProps {
  game: PS2Game;
  isPaused: boolean;
  isTurbo: boolean;
  upscaleMultiplier: number;
  widescreen16x9?: boolean;
  showFpsHud?: boolean;
  masterVolume?: number;
  audioMuted?: boolean;
  onToggleMute?: () => void;
  liveInputRef?: React.MutableRefObject<LiveInputState>;
  activeHardwareLabel?: string;
  onNotify?: (msg: string) => void;
}

export const PS2RuntimeCanvas: React.FC<PS2RuntimeCanvasProps> = ({
  game,
  isPaused,
  isTurbo,
  upscaleMultiplier,
  widescreen16x9 = false,
  showFpsHud = true,
  masterVolume = 85,
  audioMuted: externalMuted = false,
  liveInputRef,
  activeHardwareLabel = 'Vulkan Multi-GPU (ARM64)'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [currentFps, setCurrentFps] = useState<number>(60.0);
  const [vulkanFrameTime, setVulkanFrameTime] = useState<number>(16.6);

  const isMuted = externalMuted;

  const gameStateRef = useRef({
    carX: 0,
    speed: 65,
    maxSpeed: 185,
    distance: 0,
    turnAngle: 0,
    isBoosting: false,
    comboCount: 0,
    combatTimer: 0,
    prevActionPressed: false,
    monoliths: Array.from({ length: 7 }, (_, i) => ({
      x: -180 + i * 60,
      z: 300 + i * 40,
      height: 90 + (i % 3) * 35
    })),
    orbs: Array.from({ length: 14 }, (_, i) => ({
      x: ((i * 53) % 400) - 200,
      y: ((i * 37) % 200) - 100,
      z: 100 + ((i * 67) % 350),
      radius: 3 + (i % 4),
      hue: (i * 28) % 360,
      speed: 0.6 + (i % 3) * 0.4
    })),
    introProgress: 0
  });

  const isBios = game.id === 'bios-ps2' || game.serial.startsWith('SCPH-');
  const isRacing = game.genre.toLowerCase().includes('corrida');

  // Synthesize PS2 Startup Chime respecting masterVolume & mute
  const playPs2StartupChime = useCallback(() => {
    if (isMuted || masterVolume <= 0) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const volScale = Math.max(0.05, Math.min(1, masterVolume / 100));
      const now = ctx.currentTime;
      const baseFreqs = [65.4, 98.0, 130.8, 196.0];
      baseFreqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.05, now + 3.5);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime((0.12 * volScale) / (idx + 1), now + 1.2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 5.0);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 5.2);
      });

      setTimeout(() => {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') return;
        const chimeNow = audioCtxRef.current.currentTime;
        [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, idx) => {
          const osc = audioCtxRef.current!.createOscillator();
          const gain = audioCtxRef.current!.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, chimeNow + idx * 0.08);

          gain.gain.setValueAtTime(0.001, chimeNow + idx * 0.08);
          gain.gain.linearRampToValueAtTime(0.08 * volScale, chimeNow + idx * 0.08 + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.0001, chimeNow + idx * 0.08 + 2.8);

          osc.connect(gain);
          gain.connect(audioCtxRef.current!.destination);
          osc.start(chimeNow + idx * 0.08);
          osc.stop(chimeNow + idx * 0.08 + 3.0);
        });
      }, 2200);
    } catch {
      // Ignore AudioContext restriction if triggered without gesture
    }
  }, [isMuted, masterVolume]);

  useEffect(() => {
    if (isBios) {
      playPs2StartupChime();
    }
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [isBios, playPs2StartupChime]);

  // Main Render Loop reading live touch, keyboard, and gamepad input
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let frameCount = 0;
    let lastFpsUpdate = performance.now();

    const render = (time: number) => {
      frameCount++;
      if (time - lastFpsUpdate >= 450) {
        const computedFps = (frameCount * 1000) / (time - lastFpsUpdate);
        setCurrentFps(isPaused ? 0 : Number(computedFps.toFixed(1)));
        setVulkanFrameTime(Number((1000 / Math.max(computedFps, 1)).toFixed(2)));
        frameCount = 0;
        lastFpsUpdate = time;
      }

      const w = canvas.width;
      const h = canvas.height;
      const state = gameStateRef.current;
      const input = liveInputRef?.current;

      if (!isPaused) {
        // Apply unified Touch / Keyboard / Gamepad controls
        if (input) {
          const steer =
            (input.buttons.right ? 1 : 0) -
            (input.buttons.left ? 1 : 0) +
            (Math.abs(input.leftStick.x) > 0.15 ? input.leftStick.x : 0);

          if (Math.abs(steer) > 0.05) {
            state.carX = Math.max(-180, Math.min(180, state.carX + steer * 4.5));
            state.turnAngle = Math.max(-0.35, Math.min(0.35, steer * 0.25));
          } else {
            state.turnAngle *= 0.85;
          }

          const accel =
            input.buttons.up ||
            input.buttons.cross ||
            input.buttons.r2 ||
            input.leftStick.y < -0.25;
          const brake =
            input.buttons.down ||
            input.buttons.square ||
            input.buttons.l2 ||
            input.leftStick.y > 0.25;

          if (accel) {
            state.speed = Math.min(state.speed + 2.8, isTurbo ? state.maxSpeed * 1.45 : state.maxSpeed);
            state.isBoosting = Boolean(input.buttons.r2 || input.buttons.circle || isTurbo);
          } else if (brake) {
            state.speed = Math.max(state.speed - 4.2, 0);
            state.isBoosting = false;
          } else {
            state.isBoosting = false;
            if (state.speed > 55) state.speed *= 0.992;
            else if (state.speed < 55) state.speed = Math.min(55, state.speed + 0.8);
          }

          // Combat action edge detection (tap ✕, ○, □, or △)
          const actionPressed = Boolean(
            input.buttons.cross ||
              input.buttons.circle ||
              input.buttons.square ||
              input.buttons.triangle
          );
          if (actionPressed && !state.prevActionPressed) {
            state.combatTimer = 18;
            state.comboCount += 1;
          }
          state.prevActionPressed = actionPressed;
        }

        state.introProgress += isTurbo ? 0.02 : 0.01;
        state.distance += (state.speed / 60) * (isTurbo ? 2 : 1);
      }

      // =========================================================================
      // SCENE 1: SONY PLAYSTATION 2 SYSTEM BIOS
      // =========================================================================
      if (isBios) {
        const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, Math.max(w, h));
        bgGrad.addColorStop(0, '#041433');
        bgGrad.addColorStop(0.6, '#020b1c');
        bgGrad.addColorStop(1, '#000208');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        const cx = w / 2;
        const cy = h / 2;

        state.monoliths.forEach((m) => {
          const depth = m.z - ((state.introProgress * 40) % 250);
          const scale = 220 / Math.max(depth, 50);
          const px = cx + m.x * scale;
          const py = cy + 40 * scale;
          const pw = 28 * scale;
          const ph = m.height * scale;

          ctx.fillStyle = 'rgba(28, 64, 128, 0.45)';
          ctx.strokeStyle = 'rgba(120, 200, 255, 0.8)';
          ctx.lineWidth = 1.5;
          ctx.fillRect(px - pw / 2, py - ph, pw, ph);
          ctx.strokeRect(px - pw / 2, py - ph, pw, ph);

          ctx.fillStyle = 'rgba(160, 220, 255, 0.7)';
          ctx.beginPath();
          ctx.moveTo(px - pw / 2, py - ph);
          ctx.lineTo(px, py - ph - 8 * scale);
          ctx.lineTo(px + pw / 2, py - ph);
          ctx.closePath();
          ctx.fill();
        });

        state.orbs.forEach((orb) => {
          if (!isPaused) {
            orb.y += Math.sin(time * 0.002 * orb.speed) * 0.5;
            orb.z -= orb.speed * (isTurbo ? 2.5 : 1.2);
            if (orb.z < 20) orb.z = 450;
          }
          const scale = 220 / Math.max(orb.z, 20);
          const ox = cx + orb.x * scale;
          const oy = cy + orb.y * scale;
          const or = orb.radius * scale;

          const orbGrad = ctx.createRadialGradient(ox, oy, 1, ox, oy, or * 2);
          orbGrad.addColorStop(0, `hsla(${orb.hue}, 90%, 75%, 0.95)`);
          orbGrad.addColorStop(1, `hsla(${orb.hue}, 90%, 50%, 0)`);
          ctx.fillStyle = orbGrad;
          ctx.beginPath();
          ctx.arc(ox, oy, or * 2, 0, Math.PI * 2);
          ctx.fill();
        });

        if (state.introProgress < 2.2) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.font = 'bold 18px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('Sony Computer Entertainment Inc.', cx, h - 45);
        } else {
          ctx.fillStyle = '#ffffff';
          ctx.font = '900 32px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('PlayStation 2', cx, cy - 20);

          ctx.font = '600 13px monospace';
          ctx.fillStyle = '#60a5fa';
          ctx.fillText(`Browser · System Configuration (${game.serial})`, cx, cy + 20);

          const cardX = cx - 95;
          const cardY = cy + 54;
          ctx.fillStyle = 'rgba(20, 35, 60, 0.85)';
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(cardX, cardY, 85, 50, 6);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#93c5fd';
          ctx.font = '11px monospace';
          ctx.fillText('Slot 1 (8MB)', cardX + 42, cardY + 30);

          const card2X = cx + 10;
          ctx.fillStyle = 'rgba(20, 35, 60, 0.85)';
          ctx.strokeStyle = '#64748b';
          ctx.beginPath();
          ctx.roundRect(card2X, cardY, 85, 50, 6);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#94a3b8';
          ctx.fillText('Slot 2 (32MB)', card2X + 42, cardY + 30);
        }
      }
      // =========================================================================
      // SCENE 2: PS2 3D RACING SIMULATION
      // =========================================================================
      else if (isRacing) {
        const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.55);
        skyGrad.addColorStop(0, '#090d16');
        skyGrad.addColorStop(0.7, '#1b2238');
        skyGrad.addColorStop(1, '#ff6b35');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, w, h * 0.55);

        ctx.fillStyle = '#0f1422';
        for (let bx = 0; bx < w; bx += 36) {
          const bHeight = 35 + Math.sin(bx * 0.05) * 25;
          ctx.fillRect(bx, h * 0.55 - bHeight, 32, bHeight);
        }

        const horizonY = h * 0.55;
        const groundGrad = ctx.createLinearGradient(0, horizonY, 0, h);
        groundGrad.addColorStop(0, '#111827');
        groundGrad.addColorStop(1, '#05070a');
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, horizonY, w, h - horizonY);

        const roadWBottom = w * 0.82;
        const roadWTop = 34;
        const cx = w / 2 + state.turnAngle * 45;

        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.moveTo(cx - roadWTop / 2, horizonY);
        ctx.lineTo(cx + roadWTop / 2, horizonY);
        ctx.lineTo(w / 2 + roadWBottom / 2 - state.carX * 0.4, h);
        ctx.lineTo(w / 2 - roadWBottom / 2 - state.carX * 0.4, h);
        ctx.closePath();
        ctx.fill();

        const stripeOffset = (state.distance * 12) % 40;
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 4;
        ctx.setLineDash([20, 20]);
        ctx.lineDashOffset = -stripeOffset;
        ctx.beginPath();
        ctx.moveTo(cx, horizonY);
        ctx.lineTo(w / 2 - state.carX * 0.4, h);
        ctx.stroke();
        ctx.setLineDash([]);

        const carY = h * 0.78;
        const carCenterX = w / 2 + state.carX * 0.55;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.beginPath();
        ctx.ellipse(carCenterX, carY + 28, 54, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        const carGrad = ctx.createLinearGradient(carCenterX - 45, carY, carCenterX + 45, carY);
        carGrad.addColorStop(0, '#1e3a8a');
        carGrad.addColorStop(0.5, '#3b82f6');
        carGrad.addColorStop(1, '#1e3a8a');
        ctx.fillStyle = carGrad;
        ctx.beginPath();
        ctx.roundRect(carCenterX - 46, carY - 8, 92, 34, [6, 6, 2, 2]);
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.moveTo(carCenterX - 34, carY - 8);
        ctx.lineTo(carCenterX - 24, carY - 26);
        ctx.lineTo(carCenterX + 24, carY - 26);
        ctx.lineTo(carCenterX + 34, carY - 8);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#020617';
        ctx.fillRect(carCenterX - 48, carY - 28, 96, 6);
        ctx.fillRect(carCenterX - 28, carY - 22, 5, 14);
        ctx.fillRect(carCenterX + 23, carY - 22, 5, 14);

        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#dc2626';
        ctx.shadowBlur = 12;
        ctx.fillRect(carCenterX - 42, carY + 2, 22, 6);
        ctx.fillRect(carCenterX + 20, carY + 2, 22, 6);
        ctx.shadowBlur = 0;

        if (state.isBoosting || isTurbo) {
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.ellipse(carCenterX - 30, carY + 26, 6, 12 + Math.random() * 8, 0, 0, Math.PI * 2);
          ctx.ellipse(carCenterX + 30, carY + 26, 6, 12 + Math.random() * 8, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
        ctx.beginPath();
        ctx.roundRect(14, h - 70, 160, 56, 8);
        ctx.fill();

        ctx.textAlign = 'left';
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 22px monospace';
        ctx.fillText(`${Math.round(state.speed)} MPH`, 24, h - 34);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px monospace';
        ctx.fillText(`GEAR 5 · RPM ${Math.min(7800, 3000 + Math.round(state.speed * 28))}`, 24, h - 18);
      }
      // =========================================================================
      // SCENE 3: PS2 ACTION / COMBAT
      // =========================================================================
      else {
        const arenaGrad = ctx.createRadialGradient(w / 2, h / 2, 30, w / 2, h / 2, w);
        arenaGrad.addColorStop(0, '#1c1917');
        arenaGrad.addColorStop(1, '#0c0a09');
        ctx.fillStyle = arenaGrad;
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = '#44403c';
        ctx.lineWidth = 1;
        const cy = h * 0.65;
        for (let i = -6; i <= 6; i++) {
          ctx.beginPath();
          ctx.moveTo(w / 2 + i * 18, cy);
          ctx.lineTo(w / 2 + i * 75, h);
          ctx.stroke();
        }
        for (let j = 0; j < 5; j++) {
          const py = cy + (h - cy) * (j / 5);
          ctx.beginPath();
          ctx.moveTo(20, py);
          ctx.lineTo(w - 20, py);
          ctx.stroke();
        }

        const fx = w / 2 + state.carX * 0.65 + Math.sin(time * 0.003) * 14;
        const fy = h * 0.68;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.beginPath();
        ctx.ellipse(fx, fy + 48, 38, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f97316';
        ctx.fillRect(fx - 14, fy - 20, 28, 42);
        ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        ctx.arc(fx, fy - 34, 12, 0, Math.PI * 2);
        ctx.fill();

        if (state.combatTimer > 0) {
          state.combatTimer--;
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(fx + 14, fy - 18, 28, 10);

          ctx.fillStyle = '#fef08a';
          for (let p = 0; p < 8; p++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 14 + Math.random() * 20;
            ctx.fillRect(fx + 42 + Math.cos(angle) * dist, fy - 14 + Math.sin(angle) * dist, 4, 4);
          }
        } else {
          ctx.fillStyle = '#ea580c';
          ctx.fillRect(fx - 22, fy - 14, 10, 24);
          ctx.fillRect(fx + 12, fy - 14, 10, 24);
        }

        ctx.fillStyle = 'rgba(0,0,0,0.72)';
        ctx.beginPath();
        ctx.roundRect(14, 14, 195, 48, 8);
        ctx.fill();
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(22, 22, 178, 12);
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(`PLAYER 1 · ${state.comboCount} HITS`, 22, 48);
      }

      if (isPaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#facc15';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('EMULAÇÃO PAUSADA', w / 2, h / 2 - 10);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px monospace';
        ctx.fillText('Toque no botão Play acima para continuar', w / 2, h / 2 + 16);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [game.serial, isBios, isPaused, isRacing, isTurbo, liveInputRef]);

  const baseWidth = widescreen16x9 ? 768 : 640;
  const baseHeight = 448;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-black overflow-hidden select-none">
      <div
        className={`relative max-w-full max-h-full ${
          widescreen16x9 ? 'aspect-[16/9]' : 'aspect-[4/3]'
        } flex items-center justify-center shadow-2xl border border-slate-800 rounded-lg overflow-hidden bg-slate-950`}
      >
        <canvas
          ref={canvasRef}
          width={baseWidth * Math.min(upscaleMultiplier, 1.5)}
          height={baseHeight * Math.min(upscaleMultiplier, 1.5)}
          className="w-full h-full object-contain pointer-events-none"
        />

        {showFpsHud && (
          <div className="absolute top-2 left-2 flex flex-wrap items-center gap-2 pointer-events-none z-20">
            <div className="px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md border border-white/20 text-[11px] font-mono tabular-nums flex items-center gap-2">
              <span className={`font-bold ${isTurbo ? 'text-amber-400' : 'text-emerald-400'}`}>
                {currentFps.toFixed(1)} FPS
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-cyan-300">{vulkanFrameTime} ms</span>
              <span className="text-slate-400">|</span>
              <span className="text-purple-300 font-semibold">
                {upscaleMultiplier}x · {widescreen16x9 ? '16:9' : '4:3'}
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/75 border border-white/10 text-[10px] font-mono text-slate-300">
              <Cpu className="w-3 h-3 text-blue-400" />
              <span>{activeHardwareLabel}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
