// FILE: src/components/treatment/NarrationItem.tsx

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { NarrationRecorder } from "@/components/NarrationRecorder";
import { Button } from '@/components/ui/button';
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import { useRecording } from '@/contexts/RecordingContext'; 
import AnimatedLogoWithAudio from '@/components/AnimatedLogoWithAudio';
import { Loader2, Lock, Sparkles } from 'lucide-react'; 

interface NarrationItemProps { 
  script: string;
  index: number; 
  predictionErrorTitle: string; 
  onRecordingComplete: (index: number, audioUrl: string | null) => void;
  existingAudioUrl: string | null;
  treatmentNumber: number;
  // <<< CHANGE: The two props below are removed as they are no longer needed.
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

  const handleUserRecordingCompletion = (audioUrl: string | null) => { onRecordingComplete(index, audioUrl); };

  // <<< CHANGE: This function is now ONLY called when the user clicks a button.
  const generateAiNarration = useCallback(async () => {
    if (!isPremiumUser) {
      toast.info("Upgrade to premium to use AI-generated narrations.");
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
        try { const errorJson = await response.json(); errorDetail = errorJson.error || errorDetail; } catch {}
        throw new Error(errorDetail);
      }
      
      const data = await response.json();
      if (!data.audioUrl) throw new Error("Received an empty audio URL from server.");
      
      setAiAudioUrl(data.audioUrl);
      toast.success(`Narration for "${predictionErrorTitle}" is ready!`);

    } catch (error: any) {
      setAiAudioError(error.message);
      toast.error(`Failed to generate narration: ${error.message}`);
    } finally {
      setIsLoadingAi(false);
    }
  }, [userEmail, script, isPremiumUser, index, treatmentNumber, predictionErrorTitle, navigate]); 

  // <<< CHANGE: The automatic useEffect has been removed entirely to prevent the "Thundering Herd" problem.

  const handleToggleAiPlayback = () => {
    if (!aiAudioUrl) return;
    setCurrentlyPlayingAiIndex(isThisAiNarrationPlaying ? null : index);
  };
  
  const handleUpgradeClick = () => navigate('/upgrade');
  
  // <<< CHANGE: New rendering logic for the AI section.
  const renderAiSection = () => {
    if (isLoadingAi) {
      return (
        <div className="text-center flex flex-col items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2"/>
          <p className="text-sm text-muted-foreground animate-pulse">Crafting narration...</p>
        </div>
      );
    }

    if (aiAudioError) {
      return (
        <div className="text-center flex flex-col items-center justify-center h-full">
          <p className="text-red-500 text-sm mb-2">{aiAudioError}</p>
          <Button onClick={generateAiNarration} variant="link" size="sm">Try again</Button>
        </div>
      );
    }

    if (aiAudioUrl) {
      return (
        <AnimatedLogoWithAudio 
          audioUrl={aiAudioUrl} 
          width={180} 
          height={180} 
          playButtonText={predictionErrorTitle} 
          animationVariant={index + 1}
          isAnimationActive={isPremiumUser}
          forceIsPlaying={isThisAiNarrationPlaying}
          onTogglePlay={handleToggleAiPlayback}
        />
      );
    }

    // Default state: show Generate button for premium, or Upgrade for others.
    if (isPremiumUser) {
      return (
        <div className="text-center flex flex-col items-center justify-center h-full">
          <AnimatedLogoWithAudio
             width={180} height={180}
             isAnimationActive={true}
             forceIsPlaying={false}
             onTogglePlay={() => {}}
             animationVariant={index + 1}
           />
          <Button onClick={generateAiNarration} className="mt-4">
            <Sparkles className="mr-2 h-4 w-4"/> Generate AI Narration
          </Button>
        </div>
      );
    } else {
       return (
        <div className="text-center flex flex-col items-center justify-center h-full">
           <AnimatedLogoWithAudio
             width={180} height={180}
             isAnimationActive={false} // Static logo for non-premium
             forceIsPlaying={false}
             onTogglePlay={() => {}}
             animationVariant={index + 1}
           />
           <Button onClick={handleUpgradeClick} className="mt-4">
             <Lock className="mr-2 h-4 w-4"/>Upgrade to Use AI
           </Button>
        </div>
       );
    }
  };

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
        <NarrationRecorder index={index} onRecordingComplete={handleUserRecordingCompletion} existingAudioUrl={existingAudioUrl} />
      </div>

      <div className="mt-4 pt-4 border-t border-primary/20 min-h-[250px] flex flex-col items-center justify-center">
        <h4 className="text-base font-semibold text-primary mb-2">AI Guided Narration</h4>
        {renderAiSection()}
      </div>
    </div>
  );
};