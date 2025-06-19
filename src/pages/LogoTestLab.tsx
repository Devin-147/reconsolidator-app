// FILE: src/pages/LogoTestLab.tsx

// FILE: src/pages/LogoTestLab.tsx
// DEPLOY_MARKER_JUNE_18_VERY_LATEST_TEST_LAB
// ... rest of the file
import React, { useState, useCallback } from 'react';
import AnimatedLogoWithAudio from '@/components/AnimatedLogoWithAudio'; 
import MyActualLogo from '@/components/MyActualLogo'; // MyActualLogo should have default export
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // For speed control

type ZapType = 'zap1_disco' | 'zap2_kr_overcharge' | 'zap3_system_surge' | 'zap5_particle_burst' | 'zap6_fluorescent' | 'zap7_shoulder_trill' | 'narration1_sequence' | null;
type TrillSpeed = 'fast' | 'medium' | 'slow';

const LogoTestLab = () => {
  const [playMainAnimations, setPlayMainAnimations] = useState(false);
  const [currentZap, setCurrentZap] = useState<ZapType>(null);
  const [currentVariant, setCurrentVariant] = useState(0);
  const [trillSpeed, setTrillSpeed] = useState<TrillSpeed>('fast');

  const toggleMainAnimation = () => { setPlayMainAnimations(prev => !prev); if (currentZap) setCurrentZap(null); };
  const triggerZap = useCallback((zapType: ZapType) => { setCurrentZap(zapType); }, []);
  const handleZapCompleted = useCallback(() => { setCurrentZap(null); }, []);
  const cycleVariant = () => { setCurrentVariant(prev => (prev + 1) % 3); };

  return (
    <div className="min-h-screen bg-black text-white p-8 flex flex-col items-center space-y-4">
      <h1 className="text-3xl font-bold text-primary mb-4">Logo Animation & Zap Test Lab</h1>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-2xl">
        <Button onClick={toggleMainAnimation} variant="secondary" size="lg" className="col-span-full">
          {playMainAnimations ? 'Stop Main Animations' : 'Start Main Animations'} (Base Variant: {currentVariant})
        </Button>
        <Button onClick={() => triggerZap('zap1_disco')} disabled={!!currentZap}>Zap 1: Disco Flash</Button>
        <Button onClick={() => triggerZap('zap2_kr_overcharge')} disabled={!!currentZap}>Zap 2: KR Overcharge</Button>
        <Button onClick={() => triggerZap('zap3_system_surge')} disabled={!!currentZap}>Zap 3: System Surge</Button>
        <Button onClick={() => triggerZap('zap5_particle_burst')} disabled={!!currentZap}>Zap 5: Particle Burst</Button>
        <Button onClick={() => triggerZap('zap6_fluorescent')} disabled={!!currentZap}>Zap 6: Fluorescent Flicker</Button>
        <Button onClick={() => triggerZap('zap7_shoulder_trill')} disabled={!!currentZap}>Zap 7: Shoulder Trill</Button>
        {/* <Button onClick={() => triggerZap('narration1_sequence')} disabled={!!currentZap} className="col-span-full bg-purple-600 hover:bg-purple-700">
          Trigger "AI Narration 1" Sequence
        </Button> */}
        <div className="col-span-full md:col-span-2">
             <Select value={trillSpeed} onValueChange={(value) => setTrillSpeed(value as TrillSpeed)}>
                <SelectTrigger className="w-full bg-gray-800 border-gray-700"> <SelectValue placeholder="Shoulder Trill Speed" /> </SelectTrigger>
                <SelectContent className="bg-gray-800 text-white border-gray-700">
                    <SelectItem value="fast">Trill Speed: Fast</SelectItem>
                    <SelectItem value="medium">Trill Speed: Medium</SelectItem>
                    <SelectItem value="slow">Trill Speed: Slow</SelectItem>
                </SelectContent>
             </Select>
        </div>
        <Button onClick={cycleVariant} className="col-span-full md:col-span-2">Cycle Base Animation Variant</Button>
      </div>

      <p className="text-sm text-muted-foreground text-center max-w-md">
        Toggle main animations. Click a "Zap" for a one-shot effect. For "Particle Burst", background should be dark.
      </p>

      <div className="mt-4 p-4 border-2 border-dashed border-gray-700 rounded-lg bg-black/20 w-full max-w-lg flex justify-center items-center">
        <AnimatedLogoWithAudio 
          audioUrl={null} 
          playMainAnimations={playMainAnimations} 
          triggerZapEffect={currentZap}
          onZapCompleted={handleZapCompleted}
          animationVariant={currentVariant}
          shoulderTrillSpeed={trillSpeed} // Pass selected speed
          width={350} height={350}
          playButtonText="" showLoadingText={false} 
        />
      </div>
      
      <hr className="w-full border-gray-700 my-6"/>
      <div> <h2 className="text-xl font-semibold mb-2 text-center">Static Preview:</h2> <MyActualLogo width={150} height={150} /> </div>
    </div>
  );
};
export default LogoTestLab;