// FILE: src/components/treatment/NarrationPhase.tsx

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { NarrationItem } from "./NarrationItem";
import { ArrowRight } from "lucide-react";
import { useRecording } from "@/contexts/RecordingContext";
import { useAuth } from "@/contexts/AuthContext"; 
// <<< CORRECTED IMPORT PATH (removed /treatment/) >>>
import { type PredictionError } from "@/components/PredictionErrorSelector"; 

interface NarrationPhaseProps {
  isCurrentPhase: boolean;
  narrativeScripts: string[]; 
  selectedPredictionErrors: PredictionError[]; // The 11 selected PredictionError objects
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

  const [shouldInitiateAiLoadForAll, setShouldInitiateAiLoadForAll] = useState(false);

  useEffect(() => {
    if (isCurrentPhase && (accessLevel === 'premium_lifetime' || accessLevel === 'trial' || accessLevel === 'standard_lifetime') && narrativeScripts && narrativeScripts.length > 0 && !shouldInitiateAiLoadForAll) {
      console.log(`NarrationPhase (T${treatmentNumber}): Conditions met for auto AI load trigger. Access: ${accessLevel}. Setting initiateAiForAll = true.`);
      setShouldInitiateAiLoadForAll(true);
    }
  }, [isCurrentPhase, accessLevel, narrativeScripts, shouldInitiateAiLoadForAll, treatmentNumber]);


  if (!isCurrentPhase) return null;

  const userRecordedCount = narrationAudios?.filter(audio => !!audio).length || 0;
  const allUserNarrationsRecorded = narrativeScripts && narrativeScripts.length > 0 && userRecordedCount >= narrativeScripts.length;

  console.log(`NarrationPhase (T${treatmentNumber}): Rendering. Scripts: ${narrativeScripts?.length}. User recorded: ${userRecordedCount}. Will trigger AI load: ${shouldInitiateAiLoadForAll}`);

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
            {accessLevel === 'premium_lifetime' && <li>Or, use the AI Narrator.</li>}
            {(accessLevel === 'trial' || accessLevel === 'standard_lifetime') && <li>Upgrade for AI Narrator.</li>}
        </ul>
        <p className={`mt-2 font-medium text-lg ${allUserNarrationsRecorded ? 'text-green-500' : 'text-amber-500'}`}>
           Your Recordings Progress: {userRecordedCount} / {narrativeScripts?.length || 11}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Ensure selectedPredictionErrors is available and matches length before mapping */}
        {narrativeScripts && narrativeScripts.length > 0 && selectedPredictionErrors && selectedPredictionErrors.length === narrativeScripts.length ? (
           narrativeScripts.map((script, index) => (
            <NarrationItem
              key={`treatment-${treatmentNumber}-narration-${index}`}
              index={index}
              script={script} 
              // Pass the title from the corresponding PredictionError object
              predictionErrorTitle={selectedPredictionErrors[index]?.title || `Narrative Script ${index + 1}`} 
              existingAudioUrl={narrationAudios?.[index] || null} 
              onRecordingComplete={onNarrationRecorded} 
              treatmentNumber={treatmentNumber}
              autoLoadAiNarration={shouldInitiateAiLoadForAll}
            />
          ))
        ) : (
          <p className="text-muted-foreground italic p-4 text-center md:col-span-2">
            Narrative scripts are being prepared... (Ensure Prediction Errors were selected in the previous step)
          </p>
        )}
      </div>

      <Button 
        onClick={onComplete} 
        disabled={!allUserNarrationsRecorded} 
        className="w-full mt-8 py-3 text-base font-medium" // Valid className
        size="lg"
      >
        All My Recordings Complete - Proceed to Next Step <ArrowRight className="w-5 h-5 ml-2" />
      </Button>
    </div>
  );
};