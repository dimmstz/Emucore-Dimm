import React from 'react';
import {
  Gamepad,
  X,
  Sliders,
  Vibrate,
  Eye,
  Maximize,
  Keyboard,
  RotateCcw,
  Sparkles,
  Zap
} from 'lucide-react';
import { ControlsConfig, TouchStyle } from './VectorTouchControls';

interface ControlsSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ControlsConfig;
  onUpdateConfig: (newConfig: Partial<ControlsConfig>) => void;
  onResetLayout: () => void;
}

export const ControlsSettingsModal: React.FC<ControlsSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  onResetLayout
}) => {
  if (!isOpen) return null;

  const styles: { id: TouchStyle; label: string; desc: string }[] = [
    { id: 'vector', label: 'Vector (EmuStation)', desc: 'Bordas vetoriais brancas com translucidez suave' },
    { id: 'neon', label: 'Cyberpunk Neon', desc: 'Bordas ciano e magenta com brilho fosforescente' },
    { id: 'classic', label: 'Clássico PlayStation 2', desc: 'Símbolos com cores oficiais Sony e base sólida' },
    { id: 'minimal', label: 'Minimalista', desc: 'Contornos finos quase invisíveis para imersão' },
    { id: 'glass', label: 'Glassmorphism', desc: 'Vidro fosco embaçado com sombras suaves' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Gamepad className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">Configurações de Controles</h2>
              <p className="text-xs text-slate-500">Ajuste os controles touch e gamepads físicos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Estilo Visual dos Botões */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Tema Visual dos Controles na Tela
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {styles.map((st) => (
              <button
                key={st.id}
                onClick={() => onUpdateConfig({ style: st.id })}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  config.style === st.id
                    ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <div className="font-semibold text-xs">{st.label}</div>
                <div className="text-[11px] text-slate-500 leading-tight mt-0.5">{st.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Section 2: Opacidade e Escala */}
        <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
          {/* Opacity */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-blue-600" />
                Opacidade dos Controles
              </span>
              <span className="font-mono text-blue-600 font-bold">{Math.round(config.opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.15"
              max="1.0"
              step="0.05"
              value={config.opacity}
              onChange={(e) => onUpdateConfig({ opacity: parseFloat(e.target.value) })}
              className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>

          {/* Scale */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Maximize className="w-3.5 h-3.5 text-blue-600" />
                Tamanho / Escala dos Botões
              </span>
              <span className="font-mono text-blue-600 font-bold">{(config.scale * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.75"
              max="1.35"
              step="0.05"
              value={config.scale}
              onChange={(e) => onUpdateConfig({ scale: parseFloat(e.target.value) })}
              className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Section 3: Switches de Recursos */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-blue-600" />
            Recursos do Touchscreen
          </label>

          {/* Haptics */}
          <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 hover:bg-slate-50/80 cursor-pointer transition-colors">
            <div className="flex items-center gap-2.5">
              <Vibrate className="w-4 h-4 text-slate-600" />
              <div>
                <div className="text-xs font-semibold text-slate-900">Vibração Háptica ao Tocar</div>
                <div className="text-[11px] text-slate-500">Feedback de vibração no motor háptico do smartphone Android</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={config.haptics}
              onChange={(e) => onUpdateConfig({ haptics: e.target.checked })}
              className="w-4 h-4 accent-blue-600 rounded"
            />
          </label>

          {/* Analog Sticks */}
          <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 hover:bg-slate-50/80 cursor-pointer transition-colors">
            <div className="flex items-center gap-2.5">
              <Gamepad className="w-4 h-4 text-slate-600" />
              <div>
                <div className="text-xs font-semibold text-slate-900">Analógicos L3 / R3 na Tela</div>
                <div className="text-[11px] text-slate-500">Exibir os dois joysticks analógicos arrastáveis</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={config.showAnalogSticks}
              onChange={(e) => onUpdateConfig({ showAnalogSticks: e.target.checked })}
              className="w-4 h-4 accent-blue-600 rounded"
            />
          </label>

          {/* Shoulder Buttons */}
          <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 hover:bg-slate-50/80 cursor-pointer transition-colors">
            <div className="flex items-center gap-2.5">
              <Sliders className="w-4 h-4 text-slate-600" />
              <div>
                <div className="text-xs font-semibold text-slate-900">Botões de Ombro (L1, L2, R1, R2)</div>
                <div className="text-[11px] text-slate-500">Gatilhos superiores de ação rápida</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={config.showShoulderButtons}
              onChange={(e) => onUpdateConfig({ showShoulderButtons: e.target.checked })}
              className="w-4 h-4 accent-blue-600 rounded"
            />
          </label>

          {/* Turbo Button */}
          <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 hover:bg-slate-50/80 cursor-pointer transition-colors">
            <div className="flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-amber-500" />
              <div>
                <div className="text-xs font-semibold text-slate-900">Botão Turbo / Avanço Rápido</div>
                <div className="text-[11px] text-slate-500">Alterna para 200% de velocidade de emulação</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={config.showTurboButton}
              onChange={(e) => onUpdateConfig({ showTurboButton: e.target.checked })}
              className="w-4 h-4 accent-blue-600 rounded"
            />
          </label>
        </div>

        {/* Section 4: Atalhos de Teclado Físico */}
        <div className="space-y-2 border-t border-slate-100 pt-3">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Keyboard className="w-3.5 h-3.5 text-blue-600" />
            Mapeamento de Teclado &amp; Controles Físicos
          </label>
          <div className="bg-slate-900 text-slate-200 p-3 rounded-2xl text-[11px] font-mono grid grid-cols-2 gap-2">
            <div><span className="text-cyan-400 font-bold">W A S D</span> / <span className="text-cyan-400 font-bold">Setas</span> : D-Pad / Stick</div>
            <div><span className="text-blue-400 font-bold">J</span> : ✕ (Cruz)</div>
            <div><span className="text-red-400 font-bold">K</span> : ○ (Círculo)</div>
            <div><span className="text-pink-400 font-bold">U</span> : □ (Quadrado)</div>
            <div><span className="text-emerald-400 font-bold">I</span> : △ (Triângulo)</div>
            <div><span className="text-amber-400 font-bold">Q / E</span> : L1 / R1</div>
            <div><span className="text-amber-400 font-bold">Z / C</span> : L2 / R2</div>
            <div><span className="text-purple-400 font-bold">Space / Enter</span> : Select / Start</div>
            <div><span className="text-yellow-400 font-bold">Tab</span> : Turbo (Avanço Rápido)</div>
            <div><span className="text-emerald-400 font-bold">F1 / F3</span> : Salvar / Carregar State</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <button
            onClick={onResetLayout}
            className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-medium px-3 py-2 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Posição Padrão</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
