// FILE: src/components/treatment/NarrationPhase.tsx
// Removes the autoLoadAi prop.

import React from "react";
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
  if (!isCurrentPhase) return null;
  const userRecordedCount = narrationAudios.filter(Boolean).length;
  const allUserNarrationsRecorded = userRecordedCount >= (narrativeScripts?.length || 11);

  return (
    <div className="space-y-6 p-4 md:p-6 border rounded-lg bg-card shadow-xl animate-fadeIn">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-primary">Step 4: Guided Narrations</h2>
        <p className="text-md text-muted-foreground">Please record yourself reading each script. Premium users may click to load and use the AI Narrator.</p>
        <p className={`mt-2 font-medium ${allUserNarrationsRecorded ? 'text-green-500' : 'text-amber-500'}`}>
          Your Recordings Progress: {userRecordedCount} / {narrativeScripts.length || 11}
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {narrativeScripts.map((script, index) => (
          <NarrationItem
            key={index}
            index={index}
            script={script}
            predictionErrorTitle={selectedPredictionErrors[index]?.title || `Script ${index + 1}`}
            existingAudioUrl={narrationAudios[index]}
            onRecordingComplete={onNarrationRecorded}
            treatmentNumber={treatmentNumber}
          />
        ))}
      </div>
      <Button onClick={onComplete} disabled={!allUserNarrationsRecorded} className="w-full mt-8" size="lg">
        All My Recordings Complete - Proceed <ArrowRight className="ml-2" />
      </Button>
    </div>
  );
};