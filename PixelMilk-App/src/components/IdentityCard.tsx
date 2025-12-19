import React from 'react';
import { CharacterIdentity } from '../types';
import { FileJson, Palette, User, Activity } from 'lucide-react';

interface Props {
  identity: CharacterIdentity | null;
}

export const IdentityCard: React.FC<Props> = ({ identity }) => {
  if (!identity) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-[#8bd0ba]/30 p-8 border-dashed border border-[#8bd0ba]/30">
        <User className="w-16 h-16 mb-4 opacity-50" />
        <p className="font-mono text-center uppercase tracking-widest">No Entity Data</p>
        <p className="text-xs text-center mt-2 font-mono">Input parameters to begin synthesis.</p>
      </div>
    );
  }

  const colour_palette = identity.colour_palette || {};
  const physicalDesc = identity.physical_description || {};
  const features = identity.distinctive_features || [];

  return (
    <div className="h-full flex flex-col font-mono text-sm relative">
       {/* Decorative Header Bar */}
       <div className="bg-[#8bd0ba] p-2 flex justify-between items-center text-[#021a1a]">
          <h2 className="font-bold uppercase tracking-widest truncate max-w-[70%]">
             {identity.name || "UNKNOWN_ENTITY"}
          </h2>
          <div className="flex gap-1">
             <div className="w-2 h-2 bg-[#f04e4e]"></div>
             <div className="w-2 h-2 bg-[#f04e4e]"></div>
             <div className="w-2 h-2 bg-[#f04e4e] opacity-50"></div>
          </div>
       </div>

       <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          
          {/* Stats / Info Block */}
          <div className="border border-[#8bd0ba] p-2 relative mt-2">
             <span className="absolute -top-3 left-2 bg-[#021a1a] px-2 text-xs text-[#d8c8b8] uppercase">Physical Data</span>
             <table className="w-full text-xs mt-1">
                <tbody>
                   <tr className="border-b border-[#8bd0ba]/30">
                      <td className="py-1 text-[#8bd0ba]/70 uppercase">Body Type</td>
                      <td className="py-1 text-right text-[#d8c8b8]">{physicalDesc.body_type || 'N/A'}</td>
                   </tr>
                   <tr className="border-b border-[#8bd0ba]/30">
                      <td className="py-1 text-[#8bd0ba]/70 uppercase">Height</td>
                      <td className="py-1 text-right text-[#d8c8b8]">{physicalDesc.height_style || 'N/A'}</td>
                   </tr>
                   <tr>
                      <td className="py-1 text-[#8bd0ba]/70 uppercase">Form</td>
                      <td className="py-1 text-right text-[#d8c8b8]">{physicalDesc.silhouette || 'N/A'}</td>
                   </tr>
                </tbody>
             </table>
          </div>

          {/* Palette Block */}
          <div>
             <h3 className="text-xs text-[#d8c8b8] uppercase tracking-widest mb-2 flex items-center gap-2">
                <Palette className="w-3 h-3" /> Chromatic Analysis
             </h3>
             <div className="grid grid-cols-2 gap-2">
                {Object.entries(colour_palette).map(([key, color]) => (
                   <div key={key} className="flex items-center gap-2 border border-[#8bd0ba]/30 p-1 bg-[#0d2b2b]">
                      <div 
                         className="w-4 h-4 border border-white/20"
                         style={{ backgroundColor: color }}
                      ></div>
                      <div className="overflow-hidden">
                         <p className="text-[10px] text-[#8bd0ba] uppercase truncate">{key}</p>
                         <p className="text-[10px] text-[#d8c8b8]">{color}</p>
                      </div>
                   </div>
                ))}
             </div>
          </div>

          {/* Features Block */}
          <div>
             <h3 className="text-xs text-[#d8c8b8] uppercase tracking-widest mb-2 flex items-center gap-2">
                <Activity className="w-3 h-3" /> Distinctive Traits
             </h3>
             <ul className="border-l-2 border-[#f04e4e] pl-3 space-y-2">
                {features.map((feature, idx) => (
                   <li key={idx} className="text-xs text-[#8bd0ba]">
                      <span className="text-[#f04e4e] mr-2">»</span>
                      {feature}
                   </li>
                ))}
             </ul>
          </div>
       </div>

       {/* Footer / Raw Data */}
       <div className="border-t border-[#8bd0ba] p-2 bg-[#0d2b2b] text-[10px]">
          <details>
             <summary className="cursor-pointer text-[#d8c8b8] hover:text-white uppercase tracking-wider flex items-center justify-between">
                <span>Raw_JSON_Log</span>
                <span>[+]</span>
             </summary>
             <pre className="mt-2 text-[#8bd0ba] overflow-x-auto p-2 bg-black border border-[#8bd0ba]/30">
                {JSON.stringify(identity, null, 2)}
             </pre>
          </details>
       </div>
    </div>
  );
};