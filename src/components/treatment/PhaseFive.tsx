// FILE: src/components/treatment/PhaseFive.tsx
// Adds missing props (forceIsPlaying, onTogglePlay) to AnimatedLogoWithAudio call.

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowDown, ArrowRight, Loader2 } from "lucide-react"; 
import { type PredictionError } from "@/components/PredictionErrorSelector"; 
import { NarrationRecorder } from "@/components/NarrationRecorder";
import { useRecording } from "@/contexts/RecordingContext";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import AnimatedLogoWithAudio from "@/components/AnimatedLogoWithAudio";
import MyActualLogo from "@/components/MyActualLogo";

interface PhaseFiveProps {
  isCurrentPhase: boolean;
  selectedPredictionErrors: PredictionError[]; 
  onComplete: () => void; 
  treatmentNumber: number;
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
  isCurrentPhase,
  selectedPredictionErrors,
  onComplete,
  treatmentNumber,
}) => {
  const { memory1, memory2, targetEventTranscript: sessionTargetEvent, currentlyPlayingAiIndex, setCurrentlyPlayingAiIndex } = useRecording();
  const { accessLevel, userEmail } = useAuth();
  const userIdForApi = userEmail;

  const [indicesForReversal, setIndicesForReversal] = useState<number[]>([]);
  const [reversedScriptObjects, setReversedScriptObjects] = useState<ReversedScriptItem[]>([]);
  const [isSelectionComplete, setIsSelectionComplete] = useState(false);
  const [userRecordedReverseAudios, setUserRecordedReverseAudios] = useState<(string|null)[]>([]);

  useEffect(() => { 
    if (isCurrentPhase) {
        setIndicesForReversal([]); setReversedScriptObjects([]); 
        setIsSelectionComplete(false); setUserRecordedReverseAudios(Array(8).fill(null)); 
    } else {
        setIndicesForReversal([]); setReversedScriptObjects([]); 
        setIsSelectionComplete(false); setUserRecordedReverseAudios([]);
    }
  }, [isCurrentPhase]);

  const handleNarrationToReverseSelect = useCallback((originalErrorIndex: number) => {
    setIndicesForReversal(prev => {
        if (prev.includes(originalErrorIndex)) { return prev.filter(i => i !== originalErrorIndex); }
        else if (prev.length < 8) { return [...prev, originalErrorIndex]; }
        toast.info("Max 8 selections for reversal."); return prev;
    });
  }, []);

  const generateAndPrepareReverseScripts = useCallback(() => {
    if (indicesForReversal.length !== 8) { toast.error("Select 8 narratives."); return; }
    if (!memory1 || !memory2 || !sessionTargetEvent || !selectedPredictionErrors || selectedPredictionErrors.length < 11) {
        toast.error("Base data missing."); return;
    }
    const newReversedItems: ReversedScriptItem[] = []; let ok = true;
    indicesForReversal.forEach(idx => {
      if (idx < 0 || idx >= selectedPredictionErrors.length) { ok = false; return; }
      const pe = selectedPredictionErrors[idx]; if (!pe) { ok = false; return; }
      newReversedItems.push({ originalIndex: idx, title: pe.title, reversedText: `Reverse Script (7s max):\n${memory2}\nThen, ${pe.description}\nThen, ${sessionTargetEvent}\nThen, ${memory1}`, aiAudioUrl: null, isLoadingAi: false, aiError: null });
    });
    if (!ok || newReversedItems.length !== 8) { toast.error("Error generating all reversed scripts."); return; }
    setReversedScriptObjects(newReversedItems); setUserRecordedReverseAudios(Array(8).fill(null));
    setIsSelectionComplete(true); toast.success("Reverse scripts prepared.");
  }, [indicesForReversal, memory1, memory2, sessionTargetEvent, selectedPredictionErrors]);

  const triggerSingleReverseAiLoad = useCallback(async (reversedItemIndex: number) => {
    if (!reversedScriptObjects || reversedItemIndex < 0 || reversedItemIndex >= reversedScriptObjects.length) return;
    const itemToLoad = reversedScriptObjects[reversedItemIndex];
    if (!itemToLoad || itemToLoad.isLoadingAi || itemToLoad.aiAudioUrl || itemToLoad.aiError || !userIdForApi) return;
    setReversedScriptObjects(p => p.map((it, i) => i === reversedItemIndex ? {...it, isLoadingAi: true, aiError: null} : it));
    try {
      const res = await fetch('/api/generate-narration-audio', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ text: itemToLoad.reversedText, userId: userIdForApi, treatmentNumber, narrativeIndex: `reverse-${itemToLoad.originalIndex}`})});
      if (!res.ok) { let e = `API Err ${res.status}`; try{const j=await res.json();e=j.error||e;}catch{} throw new Error(e); }
      const d = await res.json(); if (!d.audioUrl) throw new Error("No audio URL (rev).");
      setReversedScriptObjects(p => p.map((it, i) => i === reversedItemIndex ? {...it, aiAudioUrl: d.audioUrl, isLoadingAi: false} : it));
    } catch (err:any) { setReversedScriptObjects(p => p.map((it, i) => i === reversedItemIndex ? {...it, aiError: err.message,isLoadingAi:false} : it)); toast.error(`AI err for "${itemToLoad.title}": ${err.message}`);}
  }, [reversedScriptObjects, userIdForApi, treatmentNumber]);

  useEffect(() => {
    if (isSelectionComplete && accessLevel === 'premium_lifetime' && reversedScriptObjects.length > 0) {
      reversedScriptObjects.forEach((rs, i) => { if (!rs.isLoadingAi && !rs.aiAudioUrl && !rs.aiError) triggerSingleReverseAiLoad(i); });
    }
  }, [isSelectionComplete, accessLevel, reversedScriptObjects, triggerSingleReverseAiLoad]);

  const handleUserReverseNarrationComplete = useCallback((idx: number, url: string|null) => { setUserRecordedReverseAudios(p => {const n=[...p]; if(idx>=0 && idx<n.length){if(n[idx]?.startsWith('blob:'))URL.revokeObjectURL(n[idx]!); n[idx]=url;} return n;}); }, []);
  
  const handleToggleReverseAiPlayback = (reversedItemIndex: number) => {
    // Use a unique negative index range to avoid conflicts with NarrationPhase's 0-10 indices
    const playbackId = -(reversedItemIndex + 1); // e.g., -1, -2, ..., -8
    if (currentlyPlayingAiIndex === playbackId) {
      setCurrentlyPlayingAiIndex(null); // Stop this one
    } else {
      setCurrentlyPlayingAiIndex(playbackId); // Play this one
    }
  };
  
  if (!isCurrentPhase) return null;
  const completedUserReversalsCount = userRecordedReverseAudios.filter(url => !!url).length;
  const allUserReversalsRecorded = isSelectionComplete && reversedScriptObjects.length > 0 && completedUserReversalsCount === reversedScriptObjects.length;

  return (
    <div className="space-y-6 p-4 border rounded-lg bg-card shadow-md">
      <div className="space-y-2"> <h3 className="text-lg font-semibold">Phase 5: Reverse Integration</h3> <p className="text-sm text-muted-foreground">{!isSelectionComplete ? `Select 8 narratives to reverse. (${indicesForReversal.length}/8)` : `Record/Listen. (${completedUserReversalsCount}/${reversedScriptObjects.length})`}</p> </div>
      {!isSelectionComplete && selectedPredictionErrors && selectedPredictionErrors.length > 0 && (
        <div className="space-y-4"> <h4 className="text-base">Select 8 for Reversal:</h4> <div className="space-y-2 max-h-60 overflow-y-auto p-2 border rounded">{selectedPredictionErrors.map((pe, oi) => (<div key={pe.id} className="flex items-center gap-3 p-1.5"><Checkbox id={`rs-${pe.id}`} checked={indicesForReversal.includes(oi)} onCheckedChange={()=>handleNarrationToReverseSelect(oi)} disabled={indicesForReversal.length >= 8 && !indicesForReversal.includes(oi)}/><label htmlFor={`rs-${pe.id}`} className="text-sm flex-1"><span className="font-medium">{pe.title}</span></label></div>))}</div> <Button onClick={generateAndPrepareReverseScripts} disabled={indicesForReversal.length !== 8} className="w-full"><ArrowDown className="mr-2"/>Confirm & Prepare</Button> </div>
      )}
      {isSelectionComplete && reversedScriptObjects.length > 0 && (
        <div className="space-y-4"> <h4 className="text-base">Reversed Narratives:</h4> <div className="grid md:grid-cols-2 gap-4">{reversedScriptObjects.map((rsItem, reversedItemIndex) => (
          <div key={rsItem.originalIndex} className="p-3 bg-black/10 rounded-lg space-y-2 border">
             <p className="text-xs"><span className="italic">{rsItem.title}</span> (Reversed)</p> <div className="whitespace-pre-wrap text-sm p-2 bg-background rounded max-h-32 overflow-y-auto">{rsItem.reversedText}</div>
             <h5 className="text-xs pt-1">Your Recording (7s max):</h5> <NarrationRecorder index={reversedItemIndex} onRecordingComplete={(url) => handleUserReverseNarrationComplete(reversedItemIndex, url)} existingAudioUrl={userRecordedReverseAudios[reversedItemIndex]} />
             {accessLevel === 'premium_lifetime' && (
              <div className="mt-2 pt-2 border-t space-y-2"> <h5 className="text-xs text-primary">AI Version:</h5>
                {rsItem.isLoadingAi && <div className="flex items-center text-sm"><Loader2 className="mr-1 animate-spin"/>Loading...</div>}
                {rsItem.aiError && !rsItem.isLoadingAi && <div className="text-xs text-red-500">{rsItem.aiError} <Button onClick={()=>triggerSingleReverseAiLoad(reversedItemIndex)} size="sm" variant="link">Retry</Button></div>}
                {rsItem.aiAudioUrl && !rsItem.isLoadingAi && !rsItem.aiError && 
                    <AnimatedLogoWithAudio 
                        audioUrl={rsItem.aiAudioUrl} 
                        width={100} height={100} 
                        playButtonText={`Play AI Rev ${reversedItemIndex+1}`} 
                        animationVariant={reversedItemIndex + 1} // Pass variant 1-8
                        forceIsPlaying={currentlyPlayingAiIndex === -(reversedItemIndex + 1)} // Check against unique negative index
                        onTogglePlay={() => handleToggleReverseAiPlayback(reversedItemIndex)} // Pass the handler
                    />
                }
              </div>)}
          </div>))}</div>
        </div>
      )}
      {isSelectionComplete && allUserReversalsRecorded && ( <div className="border-t pt-4 mt-6"> <Button onClick={onComplete} className="w-full">All Reverse Done - Proceed <ArrowRight className="ml-2"/></Button> </div> )}
    </div>
  );
};