// FILE: src/components/treatment/NarrationItem.tsx
// Fixes signature mismatch for onRecordingComplete and passes all required props to AnimatedLogoWithAudio.

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

interface NarrationItemProps { 
  script: string;
  index: number; 
  predictionErrorTitle: string; 
  onRecordingComplete: (index: number, audioUrl: string | null) => void;
  existingAudioUrl: string | null;
  treatmentNumber: number;
}

export const NarrationItem = ({
  script, index, predictionErrorTitle,
  onRecordingComplete, existingAudioUrl, treatmentNumber
}: NarrationItemProps) => {
  const { accessLevel, userEmail } = useAuth(); 
  const { currentlyPlayingAiIndex, setCurrentlyPlayingAiIndex } = useRecording(); 
  const userIdForApi = userEmail; 
  const navigate = useNavigate();

  const [aiAudioUrl, setAiAudioUrl] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false); 
  const [aiAudioError, setAiAudioError] = useState<string | null>(null);

  const isThisAiNarrationPlaying = currentlyPlayingAiIndex === index;

  const handleUserRecordingCompletion = (audioUrl: string | null) => {
    // This wrapper correctly calls the parent's handler with the index
    onRecordingComplete(index, audioUrl);
  };

  const handleLoadAiNarration = useCallback(async () => {
    if (!userIdForApi || !script || isLoadingAi || aiAudioUrl) return;
    setIsLoadingAi(true); setAiAudioError(null); 
    try {
      const response = await fetch('/api/generate-narration-audio', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: script, userId: userIdForApi, treatmentNumber, narrativeIndex: index }),
      });
      if (!response.ok) { let eD = `API Error ${response.status}`; try { const eJ = await response.json(); eD = eJ.error || eD; } catch {} throw new Error(eD); }
      const data = await response.json();
      if (!data.audioUrl) throw new Error("No audio URL from API.");
      setAiAudioUrl(data.audioUrl); 
      toast.success(`AI Narration for "${predictionErrorTitle}" is ready!`);
    } catch (error: any) { 
      const errorMsg = error.message || `Failed to load AI for "${predictionErrorTitle}".`;
      setAiAudioError(errorMsg); toast.error(errorMsg);
    } finally { setIsLoadingAi(false); }
  }, [script, index, treatmentNumber, userIdForApi, isLoadingAi, aiAudioUrl, predictionErrorTitle]); 

  const handleToggleAiPlayback = () => {
    if (!aiAudioUrl) return;
    setCurrentlyPlayingAiIndex(isThisAiNarrationPlaying ? null : index);
  };

  const handleUpgradeClick = () => { navigate('/upgrade'); };

  return (
    <div className="space-y-3 p-4 bg-card/80 rounded-lg border flex flex-col justify-between min-h-[420px]">
      <div className="space-y-1 flex-grow">
        <h3 className="text-base font-semibold text-primary">{predictionErrorTitle}</h3>
        <div className="bg-muted/40 p-3 rounded max-h-32 overflow-y-auto"><pre className="text-sm whitespace-pre-wrap">{script}</pre></div>
      </div>
      <div className="mt-auto space-y-1">
        <h4 className="text-sm font-medium">Record Your Narration:</h4>
        <NarrationRecorder index={index} onRecordingComplete={handleUserRecordingCompletion} existingAudioUrl={existingAudioUrl} />
      </div>

      {(accessLevel === 'premium_lifetime') && (
        <div className="mt-4 pt-4 border-t space-y-3 min-h-[250px] flex flex-col items-center justify-center">
          <h4 className="text-base font-semibold text-primary mb-2">AI Guided Narration</h4>
          {isLoadingAi && (<div className="text-center"><div style={{width:100,height:100}} className="opacity-60 mx-auto"><MyActualLogo/></div><p className="animate-pulse"><Loader2 className="inline mr-1 animate-spin"/>Crafting...</p></div>)}
          {aiAudioError && !isLoadingAi && (<div className="text-red-500 text-sm"><p>{aiAudioError}</p><Button onClick={handleLoadAiNarration} variant="link" size="sm">Retry</Button></div>)}
          {!isLoadingAi && !aiAudioError && (
            <>
              {aiAudioUrl ? (
                <AnimatedLogoWithAudio 
                  audioUrl={aiAudioUrl} 
                  onPlaybackEnd={handleToggleAiPlayback} 
                  width={180} height={180} 
                  playButtonText={`Play: ${predictionErrorTitle}`} 
                  showLoadingText={true} 
                  animationVariant={index + 1}
                  forceIsPlaying={isThisAiNarrationPlaying}
                  onTogglePlay={handleToggleAiPlayback}
                />
              ) : (
                <Button onClick={handleLoadAiNarration}>Load AI Narration & Animated Logo</Button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};