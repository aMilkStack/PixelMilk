import React, { useEffect, useState } from 'react';
import { AlertTriangle, Key, Terminal } from 'lucide-react';

interface Props {
  onReady: () => void;
}

export const ApiKeySelector: React.FC<Props> = ({ onReady }) => {
  const [hasKey, setHasKey] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const checkKey = async () => {
    setLoading(true);
    try {
      if (window.aistudio?.hasSelectedApiKey) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
        if (selected) {
          onReady();
        }
      } else {
        setHasKey(true);
        onReady();
      }
    } catch (e) {
      console.error("Error checking API key", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkKey();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setHasKey(true);
      onReady();
    }
  };

  if (loading || hasKey) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#021a1a]/95 backdrop-blur-sm">
      <div className="w-full max-w-md border-2 border-[#f04e4e] bg-[#021a1a] shadow-[8px_8px_0px_#0d2b2b] p-1">
        
        {/* Header */}
        <div className="bg-[#f04e4e] text-white px-3 py-2 flex items-center gap-2 mb-4">
           <AlertTriangle className="w-5 h-5" />
           <h2 className="font-bold uppercase tracking-widest font-mono">System Alert: Auth Required</h2>
        </div>

        <div className="p-6">
           <div className="flex justify-center mb-6">
             <div className="border-2 border-[#8bd0ba] p-4 bg-[#0d2b2b]">
               <Key className="w-8 h-8 text-[#8bd0ba]" />
             </div>
           </div>
           
           <p className="text-[#8bd0ba] text-center mb-6 font-mono leading-relaxed">
             > ACCESS_DENIED<br/>
             > GEMINI_3.0_PRO_MODEL_DETECTED<br/>
             > BILLING_PROJECT_REQUIRED_FOR_SYNTHESIS
           </p>

           <button
             onClick={handleSelectKey}
             className="w-full py-3 bg-[#8bd0ba] hover:bg-white text-[#021a1a] font-bold uppercase tracking-widest border-2 border-[#8bd0ba] hover:border-white transition-colors"
           >
             Connect_API_Key
           </button>

           <div className="mt-6 text-center border-t border-[#8bd0ba]/30 pt-4">
             <a 
               href="https://ai.google.dev/gemini-api/docs/billing" 
               target="_blank" 
               rel="noopener noreferrer"
               className="text-[10px] text-[#d8c8b8] uppercase hover:text-white underline decoration-dashed"
             >
               > View_Billing_Protocols
             </a>
           </div>
        </div>
      </div>
    </div>
  );
};