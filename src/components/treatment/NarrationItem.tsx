// FILE: src/components/treatment/NarrationItem.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { NarrationRecorder } from "@/components/NarrationRecorder";
import { Button } from '@/components/ui/button';
import { toast } from "sonner";
import { useAuth, UserAccessLevel } from '@/contexts/AuthContext';
import { useRecording } from '@/contexts/RecordingContext'; 
import AnimatedLogoWithAudio from '@/components/AnimatedLogoWithAudio';
import { Loader2, Lock } from 'lucide-react'; 
import MyActualLogo from '@/components/MyActualLogo'; 
interface NarrationItemProps { script: string; index: number; predictionErrorTitle: string; onRecordingComplete: (index: number, audioUrl: string | null) => void; existingAudioUrl: string | null; treatmentNumber: number; autoLoadAi: boolean; }
export const NarrationItem = ({ script, index, predictionErrorTitle, onRecordingComplete, existingAudioUrl, treatmentNumber, autoLoadAi }: NarrationItemProps) => {
  const { accessLevel, userEmail } = useAuth(); 
  const { currentlyPlayingAiIndex, setCurrentlyPlayingAiIndex } = useRecording(); 
  const navigate = useNavigate();
  const [aiAudioUrl, setAiAudioUrl] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false); 
  const [aiAudioError, setAiAudioError] = useState<string | null>(null);
  const [showTeaserReady, setShowTeaserReady] = useState(false);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
  const isThisAiNarrationPlaying = currentlyPlayingAiIndex === index;
  const generateActualAiNarration = useCallback(async () => {
    if (!userEmail || !script || isLoadingAi || aiAudioUrl || aiAudioError) return;
    setIsLoadingAi(true); setAiAudioError(null); 
    try {
      const res = await fetch('/api/generate-narration-audio', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: script, userId: userEmail, treatmentNumber, narrativeIndex: index }) });
      if (!res.ok) { let e = `API Err ${res.status}`; try{const j=await res.json();e=j.error||e;}catch{} throw new Error(e); }
      const data = await res.json(); if (!data.audioUrl) throw new Error("No audio URL.");
      setAiAudioUrl(data.audioUrl); 
    } catch (error: any) { setAiAudioError(error.message); toast.error(error.message);
    } finally { setIsLoadingAi(false); }
  }, [script, index, treatmentNumber, userEmail, isLoadingAi, aiAudioUrl, aiAudioError]); 
  useEffect(() => {
    if (autoLoadAi && !hasAttemptedLoad) {
      setHasAttemptedLoad(true);
      if (accessLevel === 'premium_lifetime') { generateActualAiNarration(); } 
      else if (accessLevel === 'trial' || accessLevel === 'standard_lifetime') {
        setIsLoadingAi(true); setShowTeaserReady(false);
        const timer = setTimeout(() => { setIsLoadingAi(false); setShowTeaserReady(true); }, 1500 + (index * 150));
        return () => clearTimeout(timer);
      }
    }
  }, [autoLoadAi, hasAttemptedLoad, accessLevel, generateActualAiNarration, index]);
  const handleToggleAiPlayback = () => { if (!aiAudioUrl) return; setCurrentlyPlayingAiIndex(isThisAiNarrationPlaying ? null : index); };
  const handleUpgradeClick = () => navigate('/upgrade');
  return (
    <div className="p-4 bg-card/80 border rounded-lg flex flex-col justify-between min-h-[420px]">
      <div> <h3 className="text-base font-semibold text-primary">{predictionErrorTitle}</h3> <div className="bg-muted/40 p-2 my-2 rounded max-h-32 overflow-y-auto"><pre className="text-sm whitespace-pre-wrap">{script}</pre></div> </div>
      <div className="mt-auto"> <h4 className="text-sm font-medium">Record Your Narration:</h4> <NarrationRecorder index={index} onRecordingComplete={onRecordingComplete} existingAudioUrl={existingAudioUrl} /> </div>
      <div className="mt-4 pt-4 border-t min-h-[250px] flex flex-col items-center justify-center"> <h4 className="text-base font-semibold text-primary mb-2">AI Guided Narration</h4>
        {isLoadingAi && (<div className="text-center"><div style={{width:100,height:100}} className="opacity-60 mx-auto"><MyActualLogo/></div><p className="text-sm animate-pulse"><Loader2 className="inline mr-1 animate-spin"/>Crafting...</p></div>)}
        {aiAudioError && !isLoadingAi && (<div className="text-red-500 text-sm text-center"><p>{aiAudioError}</p><Button onClick={generateActualAiNarration} variant="link">Retry</Button></div>)}
        {!isLoadingAi && !aiAudioError && ( <>
          {aiAudioUrl && accessLevel === 'premium_lifetime' ? (
            <div> <AnimatedLogoWithAudio animationVariant={index + 1} forceIsPlaying={isThisAiNarrationPlaying} onTogglePlay={handleToggleAiPlayback} /> <Button onClick={handleToggleAiPlayback} className="w-full mt-2">{isThisAiNarrationPlaying ? 'Pause' : `Play: ${predictionErrorTitle}`}</Button> </div>
          ) : ( (accessLevel === 'trial' || accessLevel === 'standard_lifetime') && (<div className="text-center"><div style={{width:120,height:120}} className="opacity-50 mx-auto"><MyActualLogo/></div><Button onClick={handleUpgradeClick} className="mt-2"><Lock className="mr-2"/>Upgrade to Use AI</Button></div>) )}
        </>)}
      </div>
    </div>
  );
};