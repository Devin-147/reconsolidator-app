// FILE: src/components/treatment/NarrationItem.tsx
// MODIFIED TO FIX API ERRORS & RESTRUCTURE ANIMATION LOGIC

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { NarrationRecorder } from "@/components/NarrationRecorder";
import { Button } from '@/components/ui/button';
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import { useRecording } from '@/contexts/RecordingContext'; 
import AnimatedLogoWithAudio from '@/components/AnimatedLogoWithAudio';
import { Loader2, Lock, Wand2 } from 'lucide-react'; 

interface NarrationItemProps { 
  script: string;
  index: number; 
  predictionErrorTitle: string; 
  onRecordingComplete: (index: number, audioUrl: string | null) => void;
  existingAudioUrl: string | null;
  treatmentNumber: number;
  // These props are no longer needed as the parent component won't manage loading anymore
  // shouldAttemptAiLoad: boolean;
  // onAiLoadAttemptFinished: (index: number) => void;
}

export const NarrationItem = ({
  script, index, predictionErrorTitle, onRecordingComplete, 
  existingAudioUrl, treatmentNumber
}: NarrationItemProps) => {
  const { accessLevel, userEmail } = useAuth(); 
  const { currentlyPlayingAiIndex, setCurrentlyPlayingAiIndex } = useRecording(); 
  const navigate = useNavigate();

  const [aiAudioUrl, setAiAudioUrl] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false); 
  const [aiAudioError, setAiAudioError] = useState<string | null>(null);
  
  const isPremiumUser = accessLevel === 'premium_lifetime';
  const isThisAiNarrationPlaying = currentlyPlayingAiIndex === index;

  const handleUserRecordingCompletion = (audioUrl: string | null) => {
    onRecordingComplete(index, audioUrl);
  };

  const generateAiNarration = useCallback(async () => {
    if (!isPremiumUser) {
      toast.info("AI Narration is a premium feature.");
      navigate('/upgrade');
      return;
    }
    
    if (!userEmail || !script) {
      setAiAudioError("Internal error: Missing user or script data.");
      return;
    }

    setIsLoadingAi(true);
    setAiAudioError(null); 
    
    try {
      const response = await fetch('/api/generate-narration-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: script, 
          userId: userEmail, 
          treatmentNumber, 
          narrativeIndex: index 
        })
      });

      if (!response.ok) {
        let errorDetail = `API Error ${response.status}`;
        try {
          const errorJson = await response.json();
          errorDetail = errorJson.error || errorDetail;
        } catch {}
        throw new Error(errorDetail);
      }

      const data = await response.json();
      if (!data.audioUrl) {
        throw new Error("API response did not include an audio URL.");
      }

      setAiAudioUrl(data.audioUrl); 

    } catch (error: any) {
      setAiAudioError(error.message);
      toast.error(`Failed to generate narration: ${error.message}`);
    } finally {
      setIsLoadingAi(false);
    }
  }, [userEmail, script, isPremiumUser, index, treatmentNumber, navigate]); 

  const handleToggleAiPlayback = () => {
    if (!aiAudioUrl) return;
    setCurrentlyPlayingAiIndex(isThisAiNarrationPlaying ? null : index);
  };
  
  const handleUpgradeClick = () => navigate('/upgrade');

  return (
    <div className="p-4 bg-card/80 border border-border rounded-lg flex flex-col justify-between min-h-[420px]">
      <div className="flex-grow">
        <h3 className="font-semibold text-primary">{predictionErrorTitle}</h3>
        <div className="bg-muted/40 p-2 my-2 rounded-md max-h-32 overflow-y-auto scrollbar-thin">
          <p className="text-sm font-sans whitespace-pre-wrap">{script}</p>
        </div>
      </div>

      <div className="mt-auto">
        <h4 className="text-sm font-medium mt-4">Record Your Narration:</h4>
        <NarrationRecorder
          index={index}
          onRecordingComplete={handleUserRecordingCompletion}
          existingAudioUrl={existingAudioUrl}
        />
      </div>

      <div className="mt-4 pt-4 border-t border-primary/20 min-h-[250px] flex flex-col items-center justify-center">
        <h4 className="text-base font-semibold text-primary mb-2">AI Guided Narration</h4>
        
        <AnimatedLogoWithAudio 
          audioUrl={aiAudioUrl}
          isAnimationActive={isPremiumUser} // Always pass the user's premium status
          forceIsPlaying={isThisAiNarrationPlaying}
          onTogglePlay={handleToggleAiPlayback}
          animationVariant={index + 1}
          playButtonText={predictionErrorTitle}
          width={180}
          height={180}
        />

        {isLoadingAi && (
          <p className="text-sm text-primary animate-pulse mt-2 flex items-center">
            <Loader2 className="inline mr-2 h-4 w-4 animate-spin"/>
            Crafting AI narration...
          </p>
        )}

        {aiAudioError && !isLoadingAi && (
          <div className="text-red-500 text-sm text-center mt-2">
            <p>{aiAudioError}</p>
            <Button onClick={generateAiNarration} variant="link" size="sm">Try again</Button>
          </div>
        )}
        
        {!isLoadingAi && !aiAudioError && !aiAudioUrl && (
          <div className="text-center mt-2">
            {isPremiumUser ? (
              <Button onClick={generateAiNarration}>
                <Wand2 className="mr-2 h-4 w-4"/>
                Generate AI Narration
              </Button>
            ) : (
              <Button onClick={handleUpgradeClick}>
                <Lock className="mr-2 h-4 w-4"/>
                Upgrade for AI Narration
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};