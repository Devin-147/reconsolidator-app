// FILE: src/components/treatment/NarrationPhase.tsx
// Implements staggered auto-loading for premium, signals all for teaser for non-premium.

import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { NarrationItem } from "./NarrationItem";
import { ArrowRight } from "lucide-react";
import { useRecording } from "@/contexts/RecordingContext";
import { useAuth } from "@/contexts/AuthContext"; 
import { type PredictionError } from "@/components/PredictionErrorSelector"; 

interface NarrationPhaseProps {
  isCurrentPhase: boolean;
  narrativeScripts: string[]; 
  selectedPredictionErrors: PredictionError[]; 
  onComplete: () => void;
  treatmentNumber: number;
  onNarrationRecorded: (index: number, audioUrl: string | null) => void;
}

export const NarrationPhase: React.FC<NarrationPhaseProps> = ({
  isCurrentPhase, narrativeScripts, selectedPredictionErrors, 
  onComplete, treatmentNumber, onNarrationRecorded,
}) => {
  const { narrationAudios } = useRecording();
  const { accessLevel } = useAuth(); 

  // State to manage the staggered loading for premium users
  const [currentAiLoadPermissionIndex, setCurrentAiLoadPermissionIndex] = useState<number>(-1); // -1 means none, 0 is first item
  // State to track completion status of each item's AI load attempt
  const [aiItemLoadStatus, setAiItemLoadStatus] = useState<Array<{ attempted: boolean, error: boolean }>>([]);
  // Signal to all items that the phase is ready for them to consider their loading logic
  const [phaseReadyForAiProcessing, setPhaseReadyForAiProcessing] = useState(false);


  useEffect(() => {
    if (isCurrentPhase && narrativeScripts && narrativeScripts.length > 0) {
      setAiItemLoadStatus(narrativeScripts.map(() => ({ attempted: false, error: false })));
      setPhaseReadyForAiProcessing(true); // Signal all items to check their conditions
      if (accessLevel === 'premium_lifetime') {
        setCurrentAiLoadPermissionIndex(0); // Start loading the first item for premium
        console.log(`NarrationPhase (T${treatmentNumber}): Premium. Initializing AI load for item 0.`);
      } else {
        // For non-premium, all items will receive phaseReadyForAiProcessing=true
        // and their internal useEffect will trigger their simulated teaser logic.
        setCurrentAiLoadPermissionIndex(-1); // No specific item targeted for actual load by phase.
        console.log(`NarrationPhase (T${treatmentNumber}): Non-Premium (${accessLevel}). Teaser logic will be handled by items.`);
      }
    } else {
      setPhaseReadyForAiProcessing(false);
      setCurrentAiLoadPermissionIndex(-1);
    }
  }, [isCurrentPhase, narrativeScripts, accessLevel, treatmentNumber]);

  const handleAiNarrationItemCompleted = useCallback((completedItemIndex: number, hadError: boolean) => {
    console.log(`NarrationPhase: Item ${completedItemIndex + 1} reported AI load completion. Error: ${hadError}`);
    setAiItemLoadStatus(prevStatus => 
      prevStatus.map((status, idx) => idx === completedItemIndex ? { attempted: true, error: hadError } : status)
    );

    // If premium, trigger the next item in sequence after a short delay
    if (accessLevel === 'premium_lifetime') {
      const nextIndex = completedItemIndex + 1;
      if (nextIndex < narrativeScripts.length) {
        console.log(`NarrationPhase: Triggering AI load for next premium item: ${nextIndex + 1}`);
        setTimeout(() => {
          setCurrentAiLoadPermissionIndex(nextIndex);
        }, 300); // 300ms delay between starting each API call
      } else {
        console.log("NarrationPhase: All premium AI narrations initiated.");
        setCurrentAiLoadPermissionIndex(-1); // All triggered
      }
    }
  }, [accessLevel, narrativeScripts.length]); // narrativeScripts.length can change if scripts prop changes


  if (!isCurrentPhase) return null;
  const userRecordedCount = narrationAudios?.filter(audio => !!audio).length || 0;
  const allUserNarrationsRecorded = narrativeScripts && narrativeScripts.length > 0 && userRecordedCount >= narrativeScripts.length;

  return (
    <div className="space-y-6 p-4 md:p-6 border rounded-lg bg-card shadow-xl animate-fadeIn">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-semibold text-primary">Step 4: Guided Narrations</h2>
        <p className="text-md text-muted-foreground">For each of the 11 generated narratives below:</p>
        <ul className="list-disc list-inside text-sm text-muted-foreground inline-block text-left">
            <li>Record yourself reading the script aloud.</li>
            {accessLevel === 'premium_lifetime' && <li>AI narrations will load automatically for playback.</li>}
            {(accessLevel === 'trial' || accessLevel === 'standard_lifetime') && <li>Upgrade to premium to hear AI narrations.</li>}
        </ul>
        <p className={`mt-2 font-medium text-lg ${allUserNarrationsRecorded ? 'text-green-500' : 'text-amber-500'}`}>
           Your Recordings Progress: {userRecordedCount} / {narrativeScripts?.length || 11}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {narrativeScripts && narrativeScripts.length > 0 && selectedPredictionErrors && selectedPredictionErrors.length === narrativeScripts.length ? (
           narrativeScripts.map((script, index) => (
            <NarrationItem
              key={`treatment-${treatmentNumber}-narration-${index}`}
              index={index}
              script={script} 
              predictionErrorTitle={selectedPredictionErrors[index]?.title || `Narration Script ${index + 1}`} 
              existingAudioUrl={narrationAudios?.[index] || null} 
              onRecordingComplete={onNarrationRecorded} 
              treatmentNumber={treatmentNumber}
              // For premium, autoLoad is true only for the current item in sequence.
              // For non-premium, autoLoad is true for all so they can start their teaser simulation.
              autoLoadAiNarration={
                phaseReadyForAiProcessing && 
                (accessLevel === 'premium_lifetime' ? currentAiLoadPermissionIndex === index : true)
              }
              onAiNarrationItemCompleted={handleAiNarrationItemCompleted}
            />
          ))
        ) : ( <p className="text-muted-foreground italic p-4 text-center md:col-span-2">Narrative scripts are being prepared...</p> )}
      </div>
      <Button onClick={onComplete} disabled={!allUserNarrationsRecorded} className="w-full mt-8 py-3 text-base" size="lg">
        All My Recordings Complete - Proceed <ArrowRight className="w-5 h-5 ml-2" />
      </Button>
    </div>
  );
};