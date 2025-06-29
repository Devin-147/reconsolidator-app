// FILE: src/components/treatment/NarrationItem.tsx
// Correctly implements auto-load/teaser logic based on shouldAttemptAiLoad prop.
// Restores AI UI block and corrects font style.

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { NarrationRecorder } from "@/components/NarrationRecorder";
import { Button } from '@/components/ui/button';
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import { useRecording } from '@/contexts/RecordingContext'; 
import AnimatedLogoWithAudio from '@/components/AnimatedLogoWithAudio';
import { Loader2, Lock } from 'lucide-react'; 
import MyActualLogo from '@/components/MyActualLogo'; 

interface NarrationItemProps { 
  script: string;
  index: number; 
  predictionErrorTitle: string; 
  onRecordingComplete: (index: number, audioUrl: string | null) => void;
  existingAudioUrl: string | null;
  treatmentNumber: number;
  shouldAttemptAiLoad: boolean; // Signal from NarrationPhase
  onAiLoadAttemptFinished: (index: number) => void;
}

export const NarrationItem = ({
  script, index, predictionErrorTitle, onRecordingComplete, 
  existingAudioUrl, treatmentNumber, shouldAttemptAiLoad, onAiLoadAttemptFinished
}: NarrationItemProps) => {
  const { accessLevel, userEmail } = useAuth(); 
  const { currentlyPlayingAiIndex, setCurrentlyPlayingAiIndex } = useRecording(); 
  const navigate = useNavigate();
  const [aiAudioUrl, setAiAudioUrl] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false); 
  const [aiAudioError, setAiAudioError] = useState<string | null>(null);
  const [showTeaserReady, setShowTeaserReady] = useState(false);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);

  const isThisAiNarrationPlaying = currentlyPlayingAiIndex === index;

  const handleUserRecordingCompletion = (audioUrl: string | null) => onRecordingComplete(index, audioUrl);

  const generateOrSimulateAiNarration = useCallback(async () => {
    setHasAttemptedLoad(true);
    if (accessLevel === 'premium_lifetime') {
        if (!userEmail || !script) { setAiAudioError("Internal error."); onAiLoadAttemptFinished(index); return; }
        setIsLoadingAi(true); setAiAudioError(null); 
        try {
          const response = await fetch('/api/generate-narration-audio', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: script, userId: userEmail, treatmentNumber, narrativeIndex: index }) });
          if (!response.ok) { let eD = `API Error ${response.status}`; try { const eJ = await response.json(); eD = eJ.error || eD; } catch {} throw new Error(eD); }
          const data = await response.json(); if (!data.audioUrl) throw new Error("No audio URL.");
          setAiAudioUrl(data.audioUrl); 
        } catch (error: any) { setAiAudioError(error.message); toast.error(error.message); } 
        finally { setIsLoadingAi(false); onAiLoadAttemptFinished(index); }
    } else if (accessLevel === 'trial' || accessLevel === 'standard_lifetime') {
        setIsLoadingAi(true); setShowTeaserReady(false);
        const timer = setTimeout(() => { setIsLoadingAi(false); setShowTeaserReady(true); onAiLoadAttemptFinished(index); }, 1500 + (index * 150));
        return () => clearTimeout(timer);
    } else {
        onAiLoadAttemptFinished(index); 
    }
  }, [userEmail, script, accessLevel, index, onAiLoadAttemptFinished, treatmentNumber]); 

  useEffect(() => {
    if (shouldAttemptAiLoad && !hasAttemptedLoad) {
      generateOrSimulateAiNarration();
    }
  }, [shouldAttemptAiLoad, hasAttemptedLoad, generateOrSimulateAiNarration]);

  const handleToggleAiPlayback = () => { if (!aiAudioUrl) return; setCurrentlyPlayingAiIndex(isThisAiNarrationPlaying ? null : index); };
  const handleUpgradeClick = () => navigate('/upgrade');

  return (
    <div className="p-4 bg-card/80 border border-border rounded-lg flex flex-col justify-between min-h-[420px]">
      <div className="flex-grow">
        <h3 className="font-semibold text-primary">{predictionErrorTitle}</h3>
        <div className="bg-muted/40 p-2 my-2 rounded-md max-h-32 overflow-y-auto scrollbar-thin">
          <p className="text-sm whitespace-pre-wrap font-sans">{script}</p>
        </div>
      </div>
      <div className="mt-auto">
        <h4 className="text-sm font-medium mt-4">Record Your Narration:</h4>
        <NarrationRecorder index={index} onRecordingComplete={handleUserRecordingCompletion} existingAudioUrl={existingAudioUrl} />
      </div>
      <div className="mt-4 pt-4 border-t border-primary/20 min-h-[250px] flex flex-col items-center justify-center">
        <h4 className="text-base font-semibold text-primary mb-2">AI Guided Narration</h4>
        {isLoadingAi && (<div className="text-center"><div style={{width:120,height:120}} className="opacity-70 mx-auto"><MyActualLogo/></div><p className="text-sm animate-pulse mt-2"><Loader2 className="inline mr-1 animate-spin"/>Crafting narration...</p></div>)}
        {aiAudioError && !isLoadingAi && (<div className="text-red-500 text-sm text-center"><p>{aiAudioError}</p><Button onClick={generateOrSimulateAiNarration} variant="link" size="sm">Try again</Button></div>)}
        {!isLoadingAi && !aiAudioError && (
          <>
            {aiAudioUrl && accessLevel === 'premium_lifetime' ? (
              <AnimatedLogoWithAudio audioUrl={aiAudioUrl} onPlaybackEnd={handleToggleAiPlayback} width={180} height={180} playButtonText={predictionErrorTitle} showLoadingText={true} animationVariant={index + 1} forceIsPlaying={isThisAiNarrationPlaying} onTogglePlay={handleToggleAiPlayback}/>
            ) : ( (accessLevel === 'trial' || accessLevel === 'standard_lifetime') && showTeaserReady && (
              <div className="text-center"><div style={{width:120,height:120}} className="opacity-40 mx-auto"><MyActualLogo/></div><Button onClick={handleUpgradeClick} className="mt-2"><Lock className="mr-2 h-4 w-4"/>Upgrade to Use AI</Button></div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};