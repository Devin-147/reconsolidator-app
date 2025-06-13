// FILE: src/pages/LogoTestLab.tsx

import React, { useState, useCallback } from 'react';
import AnimatedLogoWithAudio from '@/components/AnimatedLogoWithAudio'; 
import MyActualLogo from '@/components/MyActualLogo';
import { Button } from '@/components/ui/button';

const LogoTestLab = () => {
  const [playMainAnimations, setPlayMainAnimations] = useState(false);
  const [currentZap, setCurrentZap] = useState<'zap1'|'zap2'|'zap3'|'zap5'|'zap6'|'zap7'|'zap_ils'|'zap_tlw'|'narration1_sequence'|null>(null);
  const [currentVariant, setCurrentVariant] = useState(0);

  const toggleMainAnimation = () => { setPlayMainAnimations(prev => !prev); if (currentZap) setCurrentZap(null); };
  const triggerZap = useCallback((zapType: typeof currentZap) => { setCurrentZap(zapType); }, []);
  const handleZapCompleted = useCallback(() => { setCurrentZap(null); }, []);
  const cycleVariant = () => { setCurrentVariant(prev => (prev + 1) % 3); };

  return (
    <div className="min-h-screen bg-black text-white p-8 flex flex-col items-center space-y-6">
      <h1 className="text-3xl font-bold text-primary">Logo Animation & Zap Test Lab</h1>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-2xl"> {/* Wider grid */}
        <Button onClick={toggleMainAnimation} variant="secondary" size="lg" className="col-span-full md:col-span-3">
          {playMainAnimations ? 'Stop Main Animations' : 'Start Main Animations'} (Variant: {currentVariant})
        </Button>
        <Button onClick={() => triggerZap('zap1')} disabled={!!currentZap}>Zap 1: Core Flash</Button>
        <Button onClick={() => triggerZap('zap2')} disabled={!!currentZap}>Zap 2: KR Blip Overcharge</Button>
        <Button onClick={() => triggerZap('zap3')} disabled={!!currentZap}>Zap 3: System Surge</Button>
        <Button onClick={() => triggerZap('zap5')} disabled={!!currentZap}>Zap 5: Particle Burst</Button>
        <Button onClick={() => triggerZap('zap6')} disabled={!!currentZap}>Zap 6: Fluorescent Flicker</Button>
        <Button onClick={() => triggerZap('zap7')} disabled={!!currentZap}>Zap 7: Right Shoulder Flare</Button>
        <Button onClick={() => triggerZap('zap_ils')} disabled={!!currentZap}>Zap: Left Shoulder Flare</Button>
        <Button onClick={() => triggerZap('zap_tlw')} disabled={!!currentZap}>Zap: Top Window Pulse</Button>
        <Button onClick={() => triggerZap('narration1_sequence')} disabled={!!currentZap} className="col-span-full md:col-span-3 bg-purple-600 hover:bg-purple-700">
          Trigger "AI Narration 1" Sequence
        </Button>
        <Button onClick={cycleVariant} className="col-span-full md:col-span-3 mt-2">Cycle Base Animation Variant</Button>
      </div>

      <p className="text-sm text-muted-foreground text-center max-w-md">
        Toggle main animations. Click a "Zap" or "Sequence" for one-shot effects.
        For "Particle Burst" (within sequence or standalone), background aims to be dark.
      </p>

      <div className="mt-6 p-6 border-2 border-dashed border-gray-700 rounded-lg bg-black/20">
        <h2 className="text-xl font-semibold mb-4 text-center">Animated Logo Test Area:</h2>
        <AnimatedLogoWithAudio 
          audioUrl={null} 
          playMainAnimations={playMainAnimations} 
          triggerZapEffect={currentZap}
          onZapCompleted={handleZapCompleted}
          animationVariant={currentVariant}
          width={350} height={350}
          playButtonText="" showLoadingText={false} 
        />
      </div>
      
      <hr className="w-full border-gray-700 my-8"/>
      <div> <h2 className="text-xl font-semibold mb-2 text-center">Static Preview:</h2> <MyActualLogo width={200} height={200} /> </div>
    </div>
  );
};
export default LogoTestLab;