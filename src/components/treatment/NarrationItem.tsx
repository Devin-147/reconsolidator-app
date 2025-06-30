// FILE: src/components/treatment/NarrationItem.tsx
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { NarrationRecorder } from "@/components/NarrationRecorder";
import { Button } from '@/components/ui/button';
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import { useRecording } from '@/contexts/RecordingContext'; 
import AnimatedLogoWithAudio from '@/components/AnimatedLogoWithAudio';
import { Loader2, Lock } from 'lucide-react'; 
import MyActualLogo from '@/components/MyActualLogo'; 
interface NarrationItemProps { script: string; index: number; predictionErrorTitle: string; onRecordingComplete: (index: number, audioUrl: string | null) => void; existingAudioUrl: string | null; treatmentNumber: number; }
export const NarrationItem = ({ script, index, predictionErrorTitle, onRecordingComplete, existingAudioUrl, treatmentNumber }: NarrationItemProps) => {
  const { accessLevel, userEmail } = useAuth(); 
  const { currentlyPlayingAiIndex, setCurrentlyPlayingAiIndex } = useRecording(); 
  const navigate = useNavigate();
  const [aiAudioUrl, setAiAudioUrl] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false); 
  const [aiAudioError, setAiAudioError] = useState<string | null>(null);
  const isThisAiNarrationPlaying = currentlyPlayingAiIndex === index;
  const handleUserRecordingCompletion = (audioUrl: string | null) => { onRecordingComplete(index, audioUrl); };
  const handleLoadAiNarration = useCallback(async () => {
    if (!userEmail || !script || isLoadingAi || aiAudioUrl) return;
    setIsLoadingAi(true); setAiAudioError(null); 
    try {
      const response = await fetch('/api/generate-narration-audio', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: script, userId: userEmail, treatmentNumber, narrativeIndex: index }) });
      if (!response.ok) { let eD = `API Error ${response.status}`; try { const eJ = await response.json(); eD = eJ.error || eD; } catch {} throw new Error(eD); }
      const data = await response.json(); if (!data.audioUrl) throw new Error("No audio URL from API.");
      setAiAudioUrl(data.audioUrl); 
    } catch (error: any) { setAiAudioError(error.message); toast.error(error.message); } 
    finally { setIsLoadingAi(false); }
  }, [script, index, treatmentNumber, userEmail, isLoadingAi, aiAudioUrl]); 
  const handleToggleAiPlayback = () => { if (!aiAudioUrl) return; setCurrentlyPlayingAiIndex(isThisAiNarrationPlaying ? null : index); };
  const handleUpgradeClick = () => navigate('/upgrade');
  return (
    <div className="p-4 bg-card/80 border rounded-lg flex flex-col min-h-[420px]">
      <div className="flex-grow"><h3 className="font-semibold text-primary">{predictionErrorTitle}</h3><div className="bg-muted/40 p-2 my-2 rounded max-h-32 overflow-y-auto"><p className="text-sm font-sans whitespace-pre-wrap">{script}</p></div></div>
      <div className="mt-auto"><h4>Record Your Narration:</h4><NarrationRecorder index={index} onRecordingComplete={handleUserRecordingCompletion} existingAudioUrl={existingAudioUrl} /></div>
      {(accessLevel === 'premium_lifetime') ? (
        <div className="mt-4 pt-4 border-t min-h-[250px] flex flex-col items-center justify-center">
          <h4 className="font-semibold text-primary mb-2">AI Guided Narration</h4>
          {isLoadingAi && (<div className="text-center"><div style={{width:120,height:120}} className="opacity-70 mx-auto"><MyActualLogo/></div><p className="animate-pulse"><Loader2 className="inline mr-1 animate-spin"/>Crafting...</p></div>)}
          {aiAudioError && !isLoadingAi && (<div className="text-red-500 text-sm"><p>{aiAudioError}</p><Button onClick={handleLoadAiNarration} variant="link" size="sm">Retry</Button></div>)}
          {!isLoadingAi && !aiAudioError && (<>
            {aiAudioUrl ? (
              <AnimatedLogoWithAudio audioUrl={aiAudioUrl} width={180} height={180} playButtonText={`${predictionErrorTitle}`} showLoadingText={true} animationVariant={index + 1} forceIsPlaying={isThisAiNarrationPlaying} onTogglePlay={handleToggleAiPlayback}/>
            ) : ( <Button onClick={handleLoadAiNarration}>Load AI Narration & Animated Logo</Button> )}
          </>)}
        </div>
      ) : ( (accessLevel === 'trial' || accessLevel === 'standard_lifetime') && (<div className="mt-4 pt-4 border-t min-h-[250px] flex flex-col items-center justify-center"><h4 className="font-semibold text-primary mb-2">AI Guided Narration</h4><div className="text-center"><div style={{width:120,height:120}} className="opacity-50 mx-auto"><MyActualLogo/></div><Button onClick={handleUpgradeClick} className="mt-2"><Lock className="mr-2"/>Upgrade to Use AI</Button></div></div>) )}
    </div>
  );
};