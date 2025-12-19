import React, { useEffect, useRef } from 'react';
import { CharacterIdentity, Direction, PixelData } from '../types';
import { Download, RefreshCcw, Layers, Play, Crosshair } from 'lucide-react';

interface Props {
  identity: CharacterIdentity | null;
  sprites: Record<string, PixelData>;
  isGenerating: boolean;
  onGenerateSprite: (dir: Direction) => void;
  onDownload: (dir: Direction) => void;
}

const SpriteCanvas: React.FC<{ data: PixelData }> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = data.width;
    canvas.height = data.height;

    ctx.clearRect(0, 0, data.width, data.height);

    data.pixels.forEach((color, i) => {
      if (color === 'transparent' || !color) return;
      const x = i % data.width;
      const y = Math.floor(i / data.width);
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    });

  }, [data]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full object-contain"
      style={{ imageRendering: 'pixelated' }}
    />
  );
};

export const SpriteDisplay: React.FC<Props> = ({ identity, sprites, isGenerating, onGenerateSprite, onDownload }) => {
  const renderCell = (dir: Direction) => {
    const pixelData = sprites[dir];
    const hasSprite = !!pixelData;
    const isMain = dir === 'S';
    
    return (
      <div className={`relative bg-[#021a1a] border border-[#8bd0ba]/30 flex flex-col items-center justify-center group overflow-hidden ${isMain ? 'border-2 border-[#f04e4e]' : ''}`}>
        {/* Grid Background Effect */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#8bd0ba 1px, transparent 1px)', backgroundSize: '8px 8px' }}>
        </div>

        {hasSprite ? (
          <>
            <div className="w-full h-full p-4 relative z-0">
               <SpriteCanvas data={pixelData} />
            </div>
            
            {/* 3D Indicator Badge */}
            {dir !== 'S' && (
              <div className="absolute top-1 right-1 bg-[#8bd0ba] text-[#021a1a] text-[8px] px-1 font-bold">
                3D_LINK
              </div>
            )}
            
            {/* Hover Controls */}
            <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-none flex flex-col items-center justify-center gap-2 z-10">
               <button 
                  onClick={() => onDownload(dir)}
                  className="px-3 py-1 bg-[#8bd0ba] text-[#021a1a] hover:bg-white text-xs font-bold uppercase tracking-wider flex items-center gap-2"
               >
                 <Download className="w-3 h-3" /> Save
               </button>
               {!isGenerating && (
                 <button 
                    onClick={() => onGenerateSprite(dir)}
                    className="px-3 py-1 border border-[#8bd0ba] text-[#8bd0ba] hover:bg-[#8bd0ba] hover:text-[#021a1a] text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                 >
                   <RefreshCcw className="w-3 h-3" /> Retry
                 </button>
               )}
            </div>
          </>
        ) : (
          <button 
             onClick={() => onGenerateSprite(dir)}
             disabled={!identity || isGenerating || (dir !== 'S' && !sprites['S'])}
             className={`w-full h-full flex flex-col items-center justify-center gap-2 transition-colors ${
               !identity || (dir !== 'S' && !sprites['S']) 
                 ? 'opacity-20 cursor-not-allowed' 
                 : 'hover:bg-[#0d2b2b] cursor-pointer text-[#8bd0ba]'
             }`}
          >
             {dir === 'S' && !sprites['S'] ? (
               <div className="text-center animate-pulse">
                  <Play className="w-8 h-8 mb-2 mx-auto text-[#f04e4e]" />
                  <span className="text-xs font-bold text-[#f04e4e] uppercase tracking-widest">Generate Base</span>
               </div>
             ) : (
               <>
                  <Crosshair className="w-6 h-6 opacity-50" />
                  <span className="text-[10px] uppercase tracking-widest">{dir}</span>
               </>
             )}
          </button>
        )}
        
        {/* Direction Label */}
        <div className={`absolute top-0 left-0 px-2 py-0.5 text-[10px] font-bold font-mono pointer-events-none ${isMain ? 'bg-[#f04e4e] text-white' : 'bg-[#8bd0ba]/20 text-[#8bd0ba]'}`}>
           {dir}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-[#021a1a] relative">
       {/* Toolbar */}
       <div className="h-10 border-b border-[#8bd0ba] flex justify-between items-center px-4 bg-[#0d2b2b]">
          <h2 className="text-lg font-serif text-[#d8c8b8] uppercase tracking-widest">Sprite_Sheet_View</h2>
          <div className="flex gap-4 text-xs font-mono text-[#8bd0ba]">
             <span>RES: {identity?.style_parameters?.canvasSize || 64}PX</span>
             <span>MODE: {identity?.style_parameters?.paletteMode?.toUpperCase() || 'AUTO'}</span>
          </div>
       </div>

       {/* Grid */}
       <div className="flex-1 p-4 flex items-center justify-center overflow-hidden">
          {!identity ? (
            <div className="border border-dashed border-[#8bd0ba]/30 p-12 text-center text-[#8bd0ba]/50">
               <div className="w-16 h-16 border-2 border-[#8bd0ba]/30 mx-auto mb-4 flex items-center justify-center">?</div>
               <p className="font-mono uppercase tracking-widest">Awaiting Configuration</p>
            </div>
          ) : (
             <div className="grid grid-cols-3 gap-1 w-full max-w-[600px] aspect-square border border-[#8bd0ba]">
                {/* Row 1 */}
                {renderCell('NW')}
                {renderCell('N')}
                {renderCell('NE')}
                
                {/* Row 2 */}
                {renderCell('W')}
                {renderCell('S')}
                {renderCell('E')}
                
                {/* Row 3 */}
                {renderCell('SW')}
                <div className="bg-[#021a1a] flex flex-col items-center justify-center border border-[#8bd0ba]/30 opacity-50">
                   <span className="text-[10px] text-[#8bd0ba] tracking-widest">PM_v2</span>
                </div>
                {renderCell('SE')}
             </div>
          )}
       </div>
    </div>
  );
};