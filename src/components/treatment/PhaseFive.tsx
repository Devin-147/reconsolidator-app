// FILE: src/components/treatment/PhaseFive.tsx

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowDown, ArrowRight, Loader2 } from "lucide-react"; 
// <<< CORRECTED IMPORT PATH (removed /treatment/) >>>
import { type PredictionError } from "@/components/PredictionErrorSelector"; 
import { NarrationRecorder } from "@/components/NarrationRecorder";
import { useRecording } from "@/contexts/RecordingContext";
import { toast } from "sonner";
import { useAuth, UserAccessLevel } from "@/contexts/AuthContext";
import AnimatedLogoWithAudio from "@/components/AnimatedLogoWithAudio";
import MyActualLogo from "@/components/MyActualLogo";


interface PhaseFiveProps {
  isCurrentPhase: boolean;
  selectedPredictionErrors: PredictionError[]; // These are the 11 PEs selected in TreatmentX's step 0
  onComplete: () => void; 
  treatmentNumber: number;
}

interface ReversedScriptItem {
    originalIndex: number; // Index from the 0-10 range of selectedPredictionErrors
    title: string; 
    reversedText: string; 
    aiAudioUrl?: string | null;
    isLoadingAi?: boolean;
    aiError?: string | null;
}

export const PhaseFive: React.FC<PhaseFiveProps> = ({
  isCurrentPhase,
  selectedPredictionErrors, // These are the 11 selected PEs
  onComplete,
  treatmentNumber,
}) => {
  // M1, M2, and sessionTargetEvent are needed to construct the reversed scripts
  const { memory1, memory2, targetEventTranscript: sessionTargetEvent } = useRecording(); 
  const { accessLevel, userEmail } = useAuth();
  const userIdForApi = userEmail;

  // State for this phase
  const [indicesForReversal, setIndicesForReversal] = useState<number[]>([]); // Stores the original indices (0-10) of the 8 PEs chosen for reversal
  const [reversedScriptObjects, setReversedScriptObjects] = useState<ReversedScriptItem[]>([]); // Array of 8 reversed script items (title, text, AI state)
  const [isSelectionComplete, setIsSelectionComplete] = useState(false); // True after 8 are selected and scripts generated
  const [userRecordedReverseAudios, setUserRecordedReverseAudios] = useState<(string|null)[]>([]); // User's recordings for the 8 reversed scripts

  // Effect to reset local state when this phase becomes active or inactive
  useEffect(() => { 
    if (isCurrentPhase) {
        console.log(`PhaseFive (T${treatmentNumber}): Activated. Resetting local state.`);
        setIndicesForReversal([]); 
        setReversedScriptObjects([]); 
        setIsSelectionComplete(false); 
        // Initialize for 8 items, but only once scripts are actually generated.
        // For now, an empty array is fine, it will be sized in generateAndPrepareReverseScripts.
        setUserRecordedReverseAudios([]); 
    } else {
        // Optionally reset when becoming inactive
        setIndicesForReversal([]); 
        setReversedScriptObjects([]); 
        setIsSelectionComplete(false); 
        setUserRecordedReverseAudios([]);
    }
  }, [isCurrentPhase, treatmentNumber]); // Added treatmentNumber to deps

  // Handler for selecting/deselecting one of the 11 PEs for reversal
  const handleNarrationToReverseSelect = useCallback((originalPredictionErrorIndex: number) => {
    setIndicesForReversal(prev => {
        if (prev.includes(originalPredictionErrorIndex)) { 
            return prev.filter(i => i !== originalPredictionErrorIndex); 
        } else if (prev.length < 8) { 
            return [...prev, originalPredictionErrorIndex]; 
        }
        toast.info("You can only select up to 8 narratives for reversal.");
        return prev;
    });
  }, []); // No external dependencies because it only uses its argument and previous state

  // Generates the 8 reversed scripts once 8 PEs are selected
  const generateAndPrepareReverseScripts = useCallback(() => {
    if (indicesForReversal.length !== 8) { 
        toast.error("Please select exactly 8 narratives to reverse."); 
        return; 
    }
    if (!memory1 || !memory2 || !sessionTargetEvent || !selectedPredictionErrors || selectedPredictionErrors.length < 11) {
        toast.error("Cannot generate reversed scripts: Missing base memories (M1, M2, Target) or the full list of prediction errors."); 
        return;
    }

    console.log(`PhaseFive (T${treatmentNumber}): Generating 8 reversed scripts from original PE indices:`, indicesForReversal);
    const newReversedItems: ReversedScriptItem[] = [];
    let generationOk = true;

    indicesForReversal.forEach(originalIndex => {
      // selectedPredictionErrors is the array of 11 PEs passed as a prop
      const pe = selectedPredictionErrors[originalIndex]; 
      if (!pe) {
          console.error(`PhaseFive: PredictionError object not found for original index ${originalIndex}. This indicates an issue with selectedPredictionErrors prop.`);
          generationOk = false; 
          return; 
      }
      newReversedItems.push({
        originalIndex,
        title: pe.title, // Use the title from the PredictionError object
        reversedText: `Reverse Script (Under 7 seconds):\n${memory2}\nThen, ${pe.description}\nThen, ${sessionTargetEvent}\nThen, ${memory1}`,
        aiAudioUrl: null,
        isLoadingAi: false,
        aiError: null,
      });
    });
    
    if (!generationOk || newReversedItems.length !== 8) {
        toast.error("Error: Could not generate all 8 reversed scripts due to data issues with selected prediction errors.");
        setReversedScriptObjects([]); // Clear if incomplete
        return;
    }

    setReversedScriptObjects(newReversedItems);
    setUserRecordedReverseAudios(Array(newReversedItems.length).fill(null)); // Initialize for the 8 items
    setIsSelectionComplete(true);
    toast.success("8 Reverse scripts prepared. Please record each one quickly, or listen to the AI version if premium.");
  }, [indicesForReversal, memory1, memory2, sessionTargetEvent, selectedPredictionErrors, treatmentNumber]);

  // Function to trigger AI load for a single reversed script item
  const triggerSingleReverseAiLoad = useCallback(async (reversedItemIndex: number) => {
    // Ensure reversedScriptObjects has items and index is valid
    if (!reversedScriptObjects || reversedItemIndex < 0 || reversedItemIndex >= reversedScriptObjects.length) {
        console.error(`PhaseFive: Invalid reversedItemIndex (${reversedItemIndex}) or reversedScriptObjects not ready for AI load.`);
        return;
    }
    const itemToLoad = reversedScriptObjects[reversedItemIndex];
    if (!itemToLoad || itemToLoad.isLoadingAi || itemToLoad.aiAudioUrl || itemToLoad.aiError || !userIdForApi) {
        return; // Already loading, loaded, errored, or no user
    }

    // Update state to show this specific item is loading
    setReversedScriptObjects(prev => prev.map((item, i) => 
        i === reversedItemIndex ? { ...item, isLoadingAi: true, aiError: null } : item
    ));
    
    try {
      console.log(`PhaseFive (T${treatmentNumber}): Requesting AI narration for REVERSED script titled: "${itemToLoad.title}" (Original PE Index: ${itemToLoad.originalIndex}).`);
      const response = await fetch('/api/generate-narration-audio', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            text: itemToLoad.reversedText, 
            userId: userIdForApi, 
            treatmentNumber, 
            narrativeIndex: `reverse-T${treatmentNumber}-PE${itemToLoad.originalIndex}` // More unique index
        }),
      });
      if (!response.ok) { 
        let eD = `API Error ${response.status}`; 
        try { const eJ=await response.json(); eD=eJ.error||eD; } catch {} 
        throw new Error(eD); 
      }
      const data = await response.json();
      if (!data.audioUrl) throw new Error("No audio URL from API for reversed script.");
      setReversedScriptObjects(prev => prev.map((item, i) => 
        i === reversedItemIndex ? { ...item, aiAudioUrl: data.audioUrl, isLoadingAi: false } : item
      ));
    } catch (error: any) {
      setReversedScriptObjects(prev => prev.map((item, i) => 
        i === reversedItemIndex ? { ...item, aiError: error.message || "Failed to load AI.", isLoadingAi: false } : item
      ));
      toast.error(`Error loading AI for "${itemToLoad.title}": ${error.message || "Unknown error"}`);
    }
  }, [reversedScriptObjects, userIdForApi, treatmentNumber]);

  // Effect to auto-load all AI narrations for reversed scripts if premium and selection is complete
  useEffect(() => {
    if (isSelectionComplete && accessLevel === 'premium_lifetime' && reversedScriptObjects.length > 0) {
      console.log(`PhaseFive (T${treatmentNumber}): Premium user & selection complete. Auto-triggering AI load for ${reversedScriptObjects.length} reversed scripts.`);
      reversedScriptObjects.forEach((rsItem, reversedItemIndex) => {
        if (!rsItem.isLoadingAi && !rsItem.aiAudioUrl && !rsItem.aiError) { // Check before triggering
          triggerSingleReverseAiLoad(reversedItemIndex);
        }
      });
    }
  // triggerSingleReverseAiLoad is a dependency here.
  }, [isSelectionComplete, accessLevel, reversedScriptObjects, triggerSingleReverseAiLoad, treatmentNumber]);


  const handleUserReverseNarrationComplete = useCallback((reversedScriptItemIndex: number, audioUrl: string | null) => {
    setUserRecordedReverseAudios(prev => {
        const newUrls = [...prev];
        if (reversedScriptItemIndex >= 0 && reversedScriptItemIndex < newUrls.length) {
             if (newUrls[reversedScriptItemIndex]?.startsWith('blob:')) URL.revokeObjectURL(newUrls[reversedScriptItemIndex]!);
             newUrls[reversedScriptItemIndex] = audioUrl;
        }
        return newUrls;
    });
  }, []); // No external deps

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
            {selectedPredictionErrors.map((peObject, originalIndex) => ( // originalIndex here is 0-10
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
            {reversedScriptObjects.map((rsItem, reversedItemIndex) => ( // reversedItemIndex here is 0-7
              <div key={rsItem.originalIndex} className="p-3 bg-black/10 rounded-lg space-y-2 border border-border/50">
                 <p className="text-xs text-muted-foreground font-medium">
                   Reverse of: <span className="italic text-primary">{rsItem.title}</span> 
                   <span className="text-xs text-muted-foreground/70"> (Original Script PE Index: {rsItem.originalIndex + 1})</span>
                 </p>
                 <div className="whitespace-pre-wrap text-sm p-2 bg-background rounded border border-dashed border-border/30 max-h-32 overflow-y-auto scrollbar-thin">{rsItem.reversedText}</div>
                 <h5 className="text-xs font-medium pt-1 text-card-foreground">Your Recording (under 7s):</h5>
                 <NarrationRecorder 
                    index={reversedItemIndex} 
                    onRecordingComplete={(audioUrl) => handleUserReverseNarrationComplete(reversedItemIndex, audioUrl)} 
                    existingAudioUrl={userRecordedReverseAudios[reversedItemIndex]} 
                    // maxDuration prop removed
                 />
                 {accessLevel === 'premium_lifetime' && (
                    <div className="mt-2 pt-2 border-t border-primary/30 space-y-2">
                      <h5 className="text-xs font-semibold text-primary">AI Version (Premium):</h5>
                      {rsItem.isLoadingAi && <div className="flex items-center text-sm text-primary animate-pulse"><Loader2 className="mr-1 h-3 w-3 animate-spin"/>Loading AI audio...</div>}
                      {rsItem.aiError && !rsItem.isLoadingAi && <div className="text-xs text-red-500">{rsItem.aiError} <Button onClick={() => triggerSingleReverseAiLoad(reversedItemIndex)} size="sm" variant="link" className="p-0 h-auto text-xs">Retry</Button></div>} {/* Changed size to "sm" */}
                      {rsItem.aiAudioUrl && !rsItem.isLoadingAi && !rsItem.aiError && <AnimatedLogoWithAudio audioUrl={rsItem.aiAudioUrl} width={100} height={100} playButtonText={`Play AI Reverse ${reversedItemIndex+1}`} />}
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