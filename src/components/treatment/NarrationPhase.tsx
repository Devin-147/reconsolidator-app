// FILE: src/components/treatment/NarrationPhase.tsx
// Removes the autoLoadAiNarration prop from the NarrationItem call.

import React, { useEffect, useState } from "react";
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
  isCurrentPhase,
  narrativeScripts,
  selectedPredictionErrors,
  onComplete,
  treatmentNumber,
  onNarrationRecorded,
}) => {
  const { narrationAudios } = useRecording();
  const { accessLevel } = useAuth(); 

  if (!isCurrentPhase) return null;

  const userRecordedCount = narrationAudios?.filter(audio => !!audio).length || 0;
  const allUserNarrationsRecorded = narrativeScripts && narrativeScripts.length > 0 && userRecordedCount >= narrativeScripts.length;

  return (
    <div className="space-y-6 p-4 md:p-6 border rounded-lg bg-card shadow-xl animate-fadeIn">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-semibold text-primary">
          Step 4: Guided Narrations
        </h2>
        <p className="text-md text-muted-foreground">
          For each of the 11 generated narratives below:
        </p>
        <ul className="list-disc list-inside text-sm text-muted-foreground inline-block text-left">
            <li>Please record yourself reading the script aloud.</li>
            {accessLevel === 'premium_lifetime' && <li>As a premium user, you can also choose to load and listen to an AI Narrator with an animated visual for each script.</li>}
            {(accessLevel === 'trial' || accessLevel === 'standard_lifetime') && <li>Upgrade to premium to use the AI Narrator.</li>}
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
              // autoLoadAiNarration prop is REMOVED
              // onAiNarrationItemCompleted callback is also REMOVED as it's not needed for on-demand loading
            />
          ))
        ) : (
          <p className="text-muted-foreground italic p-4 text-center md:col-span-2">
            Narrative scripts are being prepared... (Ensure Prediction Errors were selected)
          </p>
        )}
      </div>

      <Button 
        onClick={onComplete} 
        disabled={!allUserNarrationsRecorded} 
        className="w-full mt-8 py-3 text-base"
        size="lg"
      >
        All My Recordings Complete - Proceed <ArrowRight className="w-5 h-5 ml-2" />
      </Button>
    </div>
  );
};