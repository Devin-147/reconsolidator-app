// FILE: src/components/treatment/NarrationItem.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { NarrationRecorder } from "@/components/NarrationRecorder";
import { Button } from '@/components/ui/button';
import { toast } from "sonner";
import { useAuth, UserAccessLevel } from '@/contexts/AuthContext';
import AnimatedLogoWithAudio from '@/components/AnimatedLogoWithAudio';
import { Loader2, Lock } from 'lucide-react'; 
import MyActualLogo from '@/components/MyActualLogo'; 

interface NarrationItemProps { 
  script: string;
  index: number;
  predictionErrorTitle: string; // Title of the PE this script is based on
  onRecordingComplete: (index: number, audioUrl: string | null) => void;
  existingAudioUrl: string | null;
  treatmentNumber: number;
  autoLoadAiNarration: boolean; 
}

export const NarrationItem = ({
  script, index, predictionErrorTitle,
  onRecordingComplete, existingAudioUrl, treatmentNumber, autoLoadAiNarration
}: NarrationItemProps) => {
  const { accessLevel, userEmail } = useAuth(); 
  const userIdForApi = userEmail; 
  const navigate = useNavigate();

  const [aiAudioUrl, setAiAudioUrl] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false); 
  const [aiAudioError, setAiAudioError] = useState<string | null>(null);
  const [showTeaserReady, setShowTeaserReady] = useState(false);

  const handleUserRecordingCompletion = (audioUrl: string | null) => onRecordingComplete(index, audioUrl);

  const generateActualAiNarration = useCallback(async () => {
    if (!userIdForApi || !script) { 
        setAiAudioError("User/script info missing."); 
        console.error(`NarrationItem ${index + 1}: Cannot generate AI narration - missing userId or script.`);
        return; 
    }
    if (isLoadingAi || aiAudioUrl || aiAudioError) {
        return;
    }
    setIsLoadingAi(true); setAiAudioError(null); 
    try {
      console.log(`NarrationItem ${index + 1}: Requesting REAL AI narration for T${treatmentNumber} (${predictionErrorTitle}). Script: "${script.substring(0,30)}..."`);
      const response = await fetch('/api/generate-narration-audio', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: script, userId: userIdForApi, treatmentNumber, narrativeIndex: index }),
      });
      if (!response.ok) { 
        let eD = `API Error ${response.status}`; 
        try { const eJ = await response.json(); eD = eJ.error || eD; } catch {} 
        throw new Error(eD); 
      }
      const data = await response.json();
      if (!data.audioUrl) throw new Error("No audio URL from API.");
      setAiAudioUrl(data.audioUrl); 
      console.log(`AI Narration ${index + 1} (${predictionErrorTitle}) ready!`);
    } catch (error: any) { 
      const errorMsg = error.message || `Failed to load AI for "${predictionErrorTitle}".`;
      setAiAudioError(errorMsg); toast.error(errorMsg);
    } finally { setIsLoadingAi(false); }
  }, [script, index, treatmentNumber, userIdForApi, isLoadingAi, aiAudioUrl, aiAudioError, predictionErrorTitle]); 

  useEffect(() => {
    if (autoLoadAiNarration && !aiAudioUrl && !isLoadingAi && !aiAudioError) {
      if (accessLevel === 'premium_lifetime') {
        console.log(`NarrationItem ${index + 1} (${predictionErrorTitle}): Premium user. Auto-loading AI.`);
        generateActualAiNarration();
      } else if (accessLevel === 'trial' || accessLevel === 'standard_lifetime') {
        console.log(`NarrationItem ${index + 1} (${predictionErrorTitle}): Non-premium (${accessLevel}). Simulating AI load.`);
        setIsLoadingAi(true); setShowTeaserReady(false);
        const timer = setTimeout(() => { setIsLoadingAi(false); setShowTeaserReady(true); }, 1000 + (index * 200) + Math.random() * 300);
        return () => clearTimeout(timer);
      }
    }
  }, [autoLoadAiNarration, accessLevel, aiAudioUrl, isLoadingAi, aiAudioError, generateActualAiNarration, index, predictionErrorTitle]);

  const handleAiPlaybackEnd = () => { console.log(`NarrationItem ${index + 1} (${predictionErrorTitle}): AI playback finished.`); };
  const handleUpgradeClick = () => { navigate('/upgrade'); };

  return (
    <div className="space-y-3 p-4 bg-card/80 backdrop-blur-sm rounded-lg border border-border shadow-md flex flex-col justify-between min-h-[380px] md:min-h-[420px]">
      <div className="space-y-1 flex-grow">
        <h3 className="text-base font-semibold text-primary">{predictionErrorTitle || `Narration Script ${index + 1}`}</h3>
        <div className="bg-muted/40 p-3 rounded-md border border-border/50 max-h-28 md:max-h-32 overflow-y-auto scrollbar-thin">
          <pre className="text-sm whitespace-pre-wrap font-sans text-muted-foreground">{script || "Script..."}</pre>
        </div>
      </div>
      <div className="mt-auto space-y-1">
        <h4 className="text-sm font-medium text-card-foreground">Record Your Narration:</h4>
        <NarrationRecorder index={index} onRecordingComplete={handleUserRecordingCompletion} existingAudioUrl={existingAudioUrl} />
      </div>

      <div className="mt-4 pt-4 border-t border-primary/50 space-y-3 min-h-[240px] flex flex-col items-center justify-center">
        <h4 className="text-base font-semibold text-primary mb-2 text-center">AI Guided Narration</h4>
        {isLoadingAi && (
          <div className="flex flex-col items-center text-center p-3 space-y-2">
            <div style={{ width: 100, height: 100 }} className="opacity-60"> <MyActualLogo width="100%" height="100%" /> </div>
            <p className="text-sm text-primary animate-pulse flex items-center"> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Crafting: <span className="italic ml-1 truncate max-w-[150px]">{predictionErrorTitle}</span>...</p>
          </div>
        )}
        {accessLevel === 'premium_lifetime' && aiAudioUrl && !isLoadingAi && !aiAudioError && (
          <AnimatedLogoWithAudio audioUrl={aiAudioUrl} onPlaybackEnd={handleAiPlaybackEnd} width={180} height={180} playButtonText={`Play: ${predictionErrorTitle}`} showLoadingText={true} />
        )}
        {accessLevel === 'premium_lifetime' && aiAudioError && !isLoadingAi && (
          <div className="text-red-500 text-sm text-center py-2"> <p>{aiAudioError}</p> <Button onClick={generateActualAiNarration} variant="link" size="sm" className="mt-1 text-primary">Try again</Button> </div>
        )}
        {accessLevel === 'premium_lifetime' && !aiAudioUrl && !isLoadingAi && !aiAudioError && (
             <div className="flex flex-col items-center text-center p-3 space-y-2"> <div style={{ width: 100, height: 100 }} className="opacity-30"> <MyActualLogo width="100%" height="100%" /> </div> <p className="text-sm text-muted-foreground">AI: <span className="italic">{predictionErrorTitle}</span> queued...</p> </div>
        )}
        {(accessLevel === 'trial' || accessLevel === 'standard_lifetime') && !isLoadingAi && showTeaserReady && (
          <div className="flex flex-col items-center text-center p-3 space-y-3"> <div style={{ width: 120, height: 120 }} className="opacity-80"> <MyActualLogo width="100%" height="100%" /> </div> <Button onClick={handleUpgradeClick} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg"> <Lock className="w-4 h-4 mr-2" /> Upgrade for "{predictionErrorTitle}"</Button> </div>
        )}
        {(accessLevel === 'trial' || accessLevel === 'standard_lifetime') && !isLoadingAi && !showTeaserReady && !aiAudioError && (
             <div className="flex flex-col items-center text-center p-3 space-y-2"> <div style={{ width: 100, height: 100 }} className="opacity-30"> <MyActualLogo width="100%" height="100%" /> </div> <p className="text-sm text-muted-foreground">Premium AI for "{predictionErrorTitle}" available.</p> </div>
        )}
        {(accessLevel === 'none' || accessLevel === 'not_found' ) && !isLoadingAi && ( <div className="flex flex-col items-center text-center p-3 space-y-2"> <p className="text-sm text-muted-foreground">AI narration unavailable.</p> </div> )}
      </div>
    </div>
  );
};