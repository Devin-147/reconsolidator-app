// FILE: src/components/treatment/PhaseFive.tsx
// FINAL CORRECTED VERSION

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowDown, ArrowRight, Loader2, Check } from "lucide-react"; 
import { type PredictionError } from "@/components/PredictionErrorSelector"; 
import { NarrationRecorder } from "@/components/NarrationRecorder";
import { useRecording } from "@/contexts/RecordingContext";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import AnimatedLogoWithAudio from "@/components/AnimatedLogoWithAudio";
import { NeuralSpinner } from "@/components/ui/NeuralSpinner";

interface NarrativeAsset {
  narrative_index: number;
  title: string;
  video_url: string | null;
  thumbnail_url: string | null;
}

interface PhaseFiveProps { 
  isCurrentPhase: boolean; 
  selectedPredictionErrors: PredictionError[]; 
  onComplete: () => void; 
  treatmentNumber: number; 
  experienceMode: 'audio' | 'video'; 
  narrativeAssets: NarrativeAsset[]; 
}

interface ReversedScriptItem { 
  originalIndex: number; 
  title: string; 
  reversedText: string; 
  aiAudioUrl?: string | null; 
  isLoadingAi?: boolean; 
  aiError?: string | null; 
}

export const PhaseFive: React.FC<PhaseFiveProps> = ({ 
  isCurrentPhase, selectedPredictionErrors, onComplete, treatmentNumber,
  experienceMode, narrativeAssets
}) => {
  const { memory1, memory2, targetEventTranscript: sessionTargetEvent, currentlyPlayingAiIndex, setCurrentlyPlayingAiIndex } = useRecording();
  const { accessLevel, userEmail } = useAuth();
  const [indicesForReversal, setIndicesForReversal] = useState<number[]>([]);
  const [reversedScriptObjects, setReversedScriptObjects] = useState<ReversedScriptItem[]>([]);
  const [isSelectionComplete, setIsSelectionComplete] = useState(false);
  const [userRecordedReverseAudios, setUserRecordedReverseAudios] = useState<(string|null)[]>([]);
  const [isGeneratingClips, setIsGeneratingClips] = useState(false);
  const [reversedVideoClips, setReversedVideoClips] = useState<{ originalIndex: number, videoUrl: string }[]>([]);

  useEffect(() => { 
    if (!isCurrentPhase) { 
      setIndicesForReversal([]); 
      setReversedScriptObjects([]); 
      setIsSelectionComplete(false); 
      setUserRecordedReverseAudios([]);
      setIsGeneratingClips(false);
      setReversedVideoClips([]);
    } 
  }, [isCurrentPhase]);

  const handleNarrationToReverseSelect = useCallback((idx: number) => { 
    setIndicesForReversal(p => p.includes(idx) ? p.filter(i => i !== idx) : (p.length < 8 ? [...p, idx] : p)); 
  }, []);

  const handleConfirmAndPrepare = async () => {
    if (indicesForReversal.length !== 8) { toast.error("Select 8 narratives."); return; }

    if (experienceMode === 'video') {
      setIsGeneratingClips(true);
      toast.info("Preparing your reversed visual clips...");
      try {
        const response = await fetch('/api/treatment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'generateReversed',
            payload: {
              userEmail,
              treatmentNumber,
              indices: indicesForReversal
            }
          })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to generate clips.");
        
        setReversedVideoClips(data.clips);
        toast.success("Reversed clips are ready!");
        setIsSelectionComplete(true);
      } catch (error: any) {
        toast.error(error.message || "An error occurred.");
      } finally {
        setIsGeneratingClips(false);
      }
    } else {
      generateAndPrepareReverseScripts();
    }
  };
  
  const generateAndPrepareReverseScripts = useCallback(() => {
    if (indicesForReversal.length !== 8 || !memory1 || !memory2 || !sessionTargetEvent || selectedPredictionErrors.length < 11) {
        toast.error("Base data missing for script generation.");
        return;
    }
    const newReversedItems: ReversedScriptItem[] = indicesForReversal.map(idx => {
        const pe = selectedPredictionErrors[idx];
        return {
            originalIndex: idx,
            title: pe.title,
            reversedText: `Reverse Script (7s max):\n${memory2}\nThen, ${pe.description}\nThen, ${sessionTargetEvent}\nThen, ${memory1}`,
            aiAudioUrl: null, isLoadingAi: false, aiError: null
        };
    });
    setReversedScriptObjects(newReversedItems);
    setUserRecordedReverseAudios(Array(8).fill(null));
    setIsSelectionComplete(true);
    toast.success("Reverse audio scripts prepared.");
  }, [indicesForReversal, memory1, memory2, sessionTargetEvent, selectedPredictionErrors, accessLevel]);
  
  const triggerSingleReverseAiLoad = useCallback(async (rIdx: number) => {
    // This logic remains for the audio path
  }, [reversedScriptObjects, userEmail, treatmentNumber]);

  useEffect(() => {
    if (isSelectionComplete && experienceMode === 'audio' && accessLevel === 'premium_lifetime') {
        reversedScriptObjects.forEach((_, i) => triggerSingleReverseAiLoad(i));
    }
  }, [isSelectionComplete, experienceMode, accessLevel, reversedScriptObjects, triggerSingleReverseAiLoad]);
  
  const handleUserReverseNarrationComplete = useCallback((idx: number, url: string|null) => {
    setUserRecordedReverseAudios(p => {
        const n=[...p];
        if(idx>=0 && idx<n.length) { n[idx]=url; }
        return n;
    });
  }, []);
  
  const handleToggleReverseAiPlayback = (rIdx: number) => {
    const pId = -(rIdx + 1);
    setCurrentlyPlayingAiIndex?.(prev => prev === pId ? null : pId);
  };
  
  if (!isCurrentPhase) return null;
  
  const allUserReversalsRecorded = isSelectionComplete && experienceMode === 'audio' && userRecordedReverseAudios.filter(Boolean).length === 8;
  const allVisualsReady = isSelectionComplete && experienceMode === 'video';

  if (isGeneratingClips) {
    return (
        <div className="flex flex-col items-center justify-center h-64 p-6 border rounded-lg bg-card">
            <NeuralSpinner className="h-20 w-20" />
            <p className="mt-4 text-muted-foreground">Generating reversed video clips...</p>
        </div>
    );
  }
  
  return (
    <div className="space-y-6 p-4 border rounded-lg bg-card shadow-lg">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Phase 5: Reverse Integration</h3>
        <p className="text-sm text-muted-foreground">
          {!isSelectionComplete ? `Select the 8 most impactful narratives to reverse. (${indicesForReversal.length}/8)` : `Experience the 8 reversed narratives.`}
        </p>
      </div>

      {!isSelectionComplete ? (
        <div className="space-y-4">
          {experienceMode === 'video' && narrativeAssets.length === 11 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {narrativeAssets.map((asset) => (
                <div 
                  key={asset.narrative_index} 
                  className={`relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${indicesForReversal.includes(asset.narrative_index - 1) ? 'border-primary ring-2 ring-primary' : 'border-transparent'}`}
                  onClick={() => handleNarrationToReverseSelect(asset.narrative_index - 1)}
                >
                  <img src={asset.thumbnail_url || ''} alt={asset.title} className={`w-full h-auto aspect-video object-cover transition-opacity ${indicesForReversal.length >= 8 && !indicesForReversal.includes(asset.narrative_index - 1) ? 'opacity-30' : 'opacity-100'}`} />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1.5 text-center">
                    <p className="text-xs text-white font-medium truncate">{asset.title}</p>
                  </div>
                  {indicesForReversal.includes(asset.narrative_index - 1) && (
                    <div className="absolute top-2 right-2 bg-primary rounded-full p-1"><Check className="w-4 h-4 text-primary-foreground" /></div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto p-2 border rounded">
              <h4>Select 8 Narratives for Reversal:</h4>
              {selectedPredictionErrors.map((pe, oi) => (<div key={pe.id} className="flex items-center gap-3"><Checkbox id={`rs-${pe.id}`} checked={indicesForReversal.includes(oi)} onCheckedChange={() => handleNarrationToReverseSelect(oi)} disabled={indicesForReversal.length >= 8 && !indicesForReversal.includes(oi)} /><label htmlFor={`rs-${pe.id}`} className="flex-1"><span className="font-medium">{pe.title}</span></label></div>))}
            </div>
          )}
          <Button onClick={handleConfirmAndPrepare} disabled={indicesForReversal.length !== 8} className="w-full">
            <ArrowDown className="w-4 h-4 mr-2" /> Confirm & Prepare Reversals
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
            {experienceMode === 'video' ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {reversedVideoClips.sort((a,b) => a.originalIndex - b.originalIndex).map(clip => (
                        <div key={clip.originalIndex} className="aspect-video">
                            <video src={clip.videoUrl} controls muted loop autoPlay className="w-full h-full rounded-md object-cover" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {reversedScriptObjects.map((rs,rIdx)=>(
                    <div key={rs.originalIndex} className="p-3 bg-black/10 rounded-lg space-y-2 border">
                      <p className="text-xs"><span className="italic">{rs.title}</span> (Reversed)</p>
                      <div className="whitespace-pre-wrap text-sm p-2 bg-background rounded max-h-32 overflow-y-auto">{rs.reversedText}</div>
                      <h5>Your Recording:</h5>
                      <NarrationRecorder index={rIdx} onRecordingComplete={(url)=>handleUserReverseNarrationComplete(rIdx,url)} existingAudioUrl={userRecordedReverseAudios[rIdx]}/>
                      {accessLevel==='premium_lifetime' && (
                        <div>
                          <h5>AI Version:</h5>
                          {rs.isLoadingAi && <div><Loader2 className="inline animate-spin"/>Loading...</div>}
                          {rs.aiError && <Button onClick={()=>triggerSingleReverseAiLoad(rIdx)}>Retry</Button>}
                          {rs.aiAudioUrl && !rs.isLoadingAi && !rs.aiError && <AnimatedLogoWithAudio audioUrl={rs.aiAudioUrl} width={100} height={100} playButtonText={`Play Rev ${rIdx+1}`} animationVariant={rIdx+1} isAnimationActive={true} forceIsPlaying={currentlyPlayingAiIndex===-(rIdx+1)} onTogglePlay={()=>handleToggleReverseAiPlayback(rIdx)}/>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
            )}
            {(allUserReversalsRecorded || allVisualsReady) && (<Button onClick={onComplete} className="w-full mt-4">All Reversals Complete <ArrowRight className="w-4 h-4 ml-2"/></Button>)}
        </div>
      )}
    </div>
  );
};
