import React, { useState } from 'react';
import { StyleParameters } from '../types';
import { Settings, Terminal, ChevronRight } from 'lucide-react';

interface Props {
  onGenerateIdentity: (desc: string, style: StyleParameters) => void;
  isGenerating: boolean;
}

export const CharacterForm: React.FC<Props> = ({ onGenerateIdentity, isGenerating }) => {
  const [description, setDescription] = useState('');
  const [style, setStyle] = useState<StyleParameters>({
    outlineStyle: 'single_color_black',
    shadingStyle: 'basic',
    detailLevel: 'medium',
    canvasSize: 64,
    paletteMode: 'auto',
    viewType: 'standard'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    onGenerateIdentity(description, style);
  };

  const renderSelect = (label: string, value: any, options: {val: string, label: string}[], onChange: (val: any) => void) => (
    <div className="flex flex-col gap-1">
       <label className="text-xs uppercase text-[#d8c8b8] tracking-wider font-mono">{label}</label>
       <div className="relative">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-[#021a1a] border border-[#8bd0ba] text-[#8bd0ba] p-2 text-sm appearance-none cursor-pointer hover:bg-[#0d2b2b] transition-colors font-mono"
          >
            {options.map(opt => (
              <option key={opt.val} value={opt.val}>{opt.label.toUpperCase()}</option>
            ))}
          </select>
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-[#8bd0ba]">
             <ChevronRight className="w-3 h-3 rotate-90" />
          </div>
       </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6 border-b border-[#8bd0ba] pb-2 flex items-center justify-between">
        <h2 className="text-xl font-serif text-[#d8c8b8] flex items-center gap-2">
          CONFIGURATION
        </h2>
        <Terminal className="w-4 h-4 text-[#8bd0ba]" />
      </div>
      
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-6">
        <div className="flex-1">
          <label className="block text-xs uppercase text-[#d8c8b8] tracking-wider font-mono mb-2">
            > INPUT_ENTITY_DESCRIPTION_
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="TYPE HERE..."
            className="w-full h-40 bg-transparent border-none border-b-2 border-[#8bd0ba] p-2 text-[#8bd0ba] placeholder-[#8bd0ba]/30 focus:border-[#d8c8b8] focus:bg-[#0d2b2b] resize-none font-mono text-lg leading-relaxed"
            required
            spellCheck={false}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-[#8bd0ba]/30 pt-4">
          {renderSelect("Canvas Size", style.canvasSize, [
            {val: "16", label: "16x16 (Micro)"},
            {val: "32", label: "32x32 (Icon)"},
            {val: "64", label: "64x64 (Std)"}
          ], (v) => setStyle({...style, canvasSize: Number(v) as any}))}

          {renderSelect("View Type", style.viewType, [
             {val: "standard", label: "Standard"},
             {val: "isometric", label: "Isometric"}
          ], (v) => setStyle({...style, viewType: v}))}

          {renderSelect("Palette", style.paletteMode, [
             {val: "auto", label: "Auto Extract"},
             {val: "nes", label: "NES System"},
             {val: "gameboy", label: "GameBoy"},
             {val: "pico8", label: "PICO-8"}
          ], (v) => setStyle({...style, paletteMode: v}))}

          {renderSelect("Outline", style.outlineStyle, [
             {val: "single_color_black", label: "Black"},
             {val: "single_color_outline", label: "Colored"},
             {val: "lineless", label: "None"}
          ], (v) => setStyle({...style, outlineStyle: v}))}
          
           {renderSelect("Detail", style.detailLevel, [
             {val: "low", label: "Low"},
             {val: "medium", label: "Medium"},
             {val: "highly_detailed", label: "High"}
          ], (v) => setStyle({...style, detailLevel: v}))}
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={isGenerating}
          className={`mt-6 w-full py-4 border-2 font-mono uppercase tracking-widest text-lg transition-all relative overflow-hidden group ${
            isGenerating 
              ? 'border-[#8bd0ba]/30 text-[#8bd0ba]/30 cursor-wait' 
              : 'border-[#8bd0ba] text-[#021a1a] bg-[#8bd0ba] hover:bg-[#d8c8b8] hover:border-[#d8c8b8] hover:text-[#021a1a]'
          }`}
        >
           {isGenerating ? (
             <span className="animate-pulse">PROCESSING...</span>
           ) : (
             <span className="flex items-center justify-center gap-2">
               INITIATE_SEQUENCE <span className="text-xl">»</span>
             </span>
           )}
           {/* Scanline on button */}
           <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
        </button>
      </form>
    </div>
  );
};