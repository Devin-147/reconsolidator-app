// FILE: src/components/treatment/PhaseFive.tsx
// Correctly passes animationVariant to AnimatedLogoWithAudio for reversed scripts.

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowDown, ArrowRight, Loader2 } from "lucide-react"; 
import { type PredictionError } from "@/components/PredictionErrorSelector"; 
import { NarrationRecorder } from "@/components/NarrationRecorder";
import { useRecording } from "@/contexts/RecordingContext";
import { toast } from "sonner";
import { useAuth, UserAccessLevel } from "@/contexts/AuthContext";
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
  const { memory1, memory2, targetEventTranscript: sessionTargetEvent } = useRecording();
  const { accessLevel, userEmail } = useAuth();
  const userIdForApi = userEmail;

  const [indicesForReversal, setIndicesForReversal] = useState<number[]>([]);
  const [reversedScriptObjects, setReversedScriptObjects] = useState<ReversedScriptItem[]>([]);
  const [isSelectionComplete, setIsSelectionComplete] = useState(false);
  const [userRecordedReverseAudios, setUserRecordedReverseAudios] = useState<(string|null)[]>([]);

  useEffect(() => { 
    if (isCurrentPhase) {
        console.log(`PhaseFive (T${treatmentNumber}): Activated. Resetting local state.`);
        setIndicesForReversal([]); 
        setReversedScriptObjects([]); 
        setIsSelectionComplete(false); 
        setUserRecordedReverseAudios(Array(8).fill(null)); 
    } else {
        setIndicesForReversal([]); 
        setReversedScriptObjects([]); 
        setIsSelectionComplete(false); 
        setUserRecordedReverseAudios([]);
    }
  }, [isCurrentPhase, treatmentNumber]);

  const handleNarrationToReverseSelect = useCallback((originalErrorIndex: number) => {
    setIndicesForReversal(prev => {
        if (prev.includes(originalErrorIndex)) { 
            return prev.filter(i => i !== originalErrorIndex); 
        } else if (prev.length < 8) { 
            return [...prev, originalErrorIndex]; 
        }
        toast.info("You can only select up to 8 narratives for reversal.");
        return prev;
    });
  }, []);

  const generateAndPrepareReverseScripts = useCallback(() => {
    if (indicesForReversal.length !== 8) { 
        toast.error("Please select exactly 8 narratives to reverse."); 
        return; 
    }
    if (!memory1 || !memory2 || !sessionTargetEvent || !selectedPredictionErrors || selectedPredictionErrors.length < 11) {
        toast.error("Cannot generate reversed scripts: Base memories or full prediction error list is missing."); 
        return;
    }
    console.log(`PhaseFive (T${treatmentNumber}): Generating 8 reversed scripts from original indices:`, indicesForReversal);
    const newReversedItems: ReversedScriptItem[] = [];
    let generationOk = true;
    indicesForReversal.forEach(originalIndex => {
      if (originalIndex < 0 || originalIndex >= selectedPredictionErrors.length) {
        console.error(`PhaseFive: Invalid originalIndex ${originalIndex}.`);
        generationOk = false; return;
      }
      const pe = selectedPredictionErrors[originalIndex];
      if (!pe) {
          console.error(`PhaseFive: PredictionError not found for original index ${originalIndex}.`);
          generationOk = false; return; 
      }
      newReversedItems.push({
        originalIndex, title: pe.title, 
        reversedText: `Reverse Script (Under 7 seconds):\n${memory2}\nThen, ${pe.description}\nThen, ${sessionTargetEvent}\nThen, ${memory1}`,
        aiAudioUrl: null, isLoadingAi: false, aiError: null,
      });
    });
    if (!generationOk || newReversedItems.length !== 8) {
        toast.error("Error: Could not generate all 8 reversed scripts.");
        setReversedScriptObjects([]); return;
    }
    setReversedScriptObjects(newReversedItems);
    setUserRecordedReverseAudios(Array(newReversedItems.length).fill(null));
    setIsSelectionComplete(true);
    toast.success("8 Reverse scripts prepared.");
    if (accessLevel === 'premium_lifetime') {
      toast.info("AI narrations for reversed scripts will load automatically.");
    }
  }, [indicesForReversal, memory1, memory2, sessionTargetEvent, selectedPredictionErrors, treatmentNumber, accessLevel]);

  const triggerSingleReverseAiLoad = useCallback(async (reversedItemIndex: number) => {
    if (!reversedScriptObjects || reversedItemIndex < 0 || reversedItemIndex >= reversedScriptObjects.length) return;
    const itemToLoad = reversedScriptObjects[reversedItemIndex];
    if (!itemToLoad || itemToLoad.isLoadingAi || itemToLoad.aiAudioUrl || itemToLoad.aiError || !userIdForApi) return;
    setReversedScriptObjects(prev => prev.map((item, i) => i === reversedItemIndex ? {...item, isLoadingAi: true, aiError: null} : item));
    try {
      const response = await fetch('/api/generate-narration-audio', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: itemToLoad.reversedText, userId: userIdForApi, treatmentNumber, narrativeIndex: `reverse-${itemToLoad.originalIndex}` }),
      });
      if (!response.ok) { let eD = `API Error ${response.status}`; try {const eJ=await response.json();eD=eJ.error||eD;}catch{} throw new Error(eD); }
      const data = await response.json();
      if (!data.audioUrl) throw new Error("No audio URL from API (reversed).");
      setReversedScriptObjects(prev => prev.map((item, i) => i === reversedItemIndex ? {...item, aiAudioUrl: data.audioUrl, isLoadingAi: false} : item));
    } catch (error: any) {
      setReversedScriptObjects(prev => prev.map((item, i) => i === reversedItemIndex ? {...item, aiError: error.message || "AI Load Fail.", isLoadingAi: false} : item));
      toast.error(`AI Error for "${itemToLoad.title}": ${error.message}`);
    }
  }, [reversedScriptObjects, userIdForApi, treatmentNumber]);

  useEffect(() => {
    if (isSelectionComplete && accessLevel === 'premium_lifetime' && reversedScriptObjects.length > 0) {
      reversedScriptObjects.forEach((rsItem, reversedItemIndex) => {
        if (!rsItem.isLoadingAi && !rsItem.aiAudioUrl && !rsItem.aiError) {
          triggerSingleReverseAiLoad(reversedItemIndex);
        }
      });
    }
  }, [isSelectionComplete, accessLevel, reversedScriptObjects, triggerSingleReverseAiLoad]);

  const handleUserReverseNarrationComplete = useCallback((reversedItemIndex: number, audioUrl: string | null) => {
    setUserRecordedReverseAudios(prev => {
        const newUrls = [...prev];
        if (reversedItemIndex >= 0 && reversedItemIndex < newUrls.length) {
             if (newUrls[reversedScriptItemIndex]?.startsWith('blob:')) URL.revokeObjectURL(newUrls[reversedScriptItemIndex]!);
             newUrls[reversedScriptItemIndex] = audioUrl;
        }
        return newUrls;
    });
  }, []);

  const completedUserReversalsCount = userRecordedReverseAudios.filter(url => !!url).length;
  const allUserReversalsRecorded = isSelectionComplete && reversedScriptObjects.length > 0 && completedUserReversalsCount === reversedScriptObjects.length;

  if (!isCurrentPhase) return null;

  return (
    <div className="space-y-6 p-4 border rounded-lg bg-card shadow-md">
      <div className="space-y-2"> 
        <h3 className="text-lg font-semibold text-card-foreground">Phase 5: Reverse Integration Narratives</h3> 
        <p className="text-sm text-muted-foreground"> 
          {!isSelectionComplete 
            ? `Select exactly 8 of your 11 narratives from Step 4 to reverse. These will be used to create short, impactful reverse-flow experiences. (${indicesForReversal.length}/8 selected)` 
            : `For each reversed script: record yourself reading it (under 7 seconds). If premium, AI versions will load automatically for you to play. (${completedUserReversalsCount}/${reversedScriptObjects.length} user recordings completed)`
          } 
        </p> 
      </div>

      {!isSelectionComplete && selectedPredictionErrors && selectedPredictionErrors.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-base font-medium text-card-foreground">Select 8 Previous Narratives for Reversal:</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto p-2 border rounded bg-muted/10 scrollbar-thin">
            {selectedPredictionErrors.map((peObject, originalIndex) => (
              <div key={peObject.id} className="flex items-center gap-3 p-1.5 rounded hover:bg-muted/50">
                <Checkbox 
                  id={`reverse-select-${peObject.id}`} 
                  checked={indicesForReversal.includes(originalIndex)} 
                  onCheckedChange={() => handleNarrationToReverseSelect(originalIndex)} 
                  disabled={indicesForReversal.length >= 8 && !indicesForReversal.includes(originalIndex)} 
                />
                <label htmlFor={`reverse-select-${peObject.id}`} className="text-sm cursor-pointer flex-1"> 
                  <span className="font-medium">{peObject.title}</span>: <span className="text-muted-foreground/80">{peObject.description.substring(0, 50)}...</span>
                </label>
              </div>
            ))}
          </div>
          <Button onClick={generateAndPrepareReverseScripts} disabled={indicesForReversal.length !== 8} className="w-full">
            <ArrowDown className="w-4 h-4 mr-2" /> Confirm Selection & Prepare Reverse Scripts 
          </Button>
        </div>
      )}

      {isSelectionComplete && reversedScriptObjects.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-base font-medium text-card-foreground">Record/Listen to Reversed Narratives:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reversedScriptObjects.map((rsItem, reversedItemIndex) => ( // reversedItemIndex is 0-7
              <div key={rsItem.originalIndex} className="p-3 bg-black/10 rounded-lg space-y-2 border border-border/50">
                 <p className="text-xs text-muted-foreground font-medium">
                   Reverse of: <span className="italic text-primary">{rsItem.title}</span> 
                   <span className="text-xs text-muted-foreground/70"> (Orig. Script #{rsItem.originalIndex + 1})</span>
                 </p>
                 <div className="whitespace-pre-wrap text-sm p-2 bg-background rounded border border-dashed border-border/30 max-h-32 overflow-y-auto scrollbar-thin">{rsItem.reversedText}</div>
                 <h5 className="text-xs font-medium pt-1 text-card-foreground">Your Recording (under 7s):</h5>
                 <NarrationRecorder 
                    index={reversedItemIndex} 
                    onRecordingComplete={(audioUrl) => handleUserReverseNarrationComplete(reversedItemIndex, audioUrl)} 
                    existingAudioUrl={userRecordedReverseAudios[reversedItemIndex]} 
                 />
                 {accessLevel === 'premium_lifetime' && (
                    <div className="mt-2 pt-2 border-t border-primary/30 space-y-2">
                      <h5 className="text-xs font-semibold text-primary">AI Version (Premium):</h5>
                      {rsItem.isLoadingAi && <div className="flex items-center text-sm text-primary animate-pulse"><Loader2 className="mr-1 h-3 w-3 animate-spin"/>Loading AI audio...</div>}
                      {rsItem.aiError && !rsItem.isLoadingAi && <div className="text-xs text-red-500">{rsItem.aiError} <Button onClick={() => triggerSingleReverseAiLoad(reversedItemIndex)} size="sm" variant="link" className="p-0 h-auto text-xs">Retry</Button></div>}
                      {rsItem.aiAudioUrl && !rsItem.isLoadingAi && !rsItem.aiError && 
                        <AnimatedLogoWithAudio 
                            audioUrl={rsItem.aiAudioUrl} 
                            width={100} 
                            height={100} 
                            playButtonText={`Play AI Reverse ${reversedItemIndex+1}`} 
                            animationVariant={reversedItemIndex + 1} // Pass variant (1-8 for reversed scripts)
                        />
                      }
                    </div>
                 )}
              </div>
            ))}
          </div>
        </div>
      )}

      {isSelectionComplete && allUserReversalsRecorded && ( 
        <div className="border-t pt-4 mt-6"> 
          <Button onClick={onComplete} className="w-full"> 
            All Reverse Recordings Done - Proceed 
            <ArrowRight className="ml-2 w-4 h-4"/> 
          </Button> 
        </div> 
      )}
    </div>
  );
};