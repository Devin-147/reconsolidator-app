// src/components/treatment/NarrationPhase.tsx
import React, { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { NarrationItem } from "./NarrationItem"; // Use corrected NarrationItem
import { ArrowRight } from "lucide-react";
import { useRecording } from "@/contexts/RecordingContext";

// Props expected FROM the parent TreatmentX page
interface NarrationPhaseProps {
  isCurrentPhase: boolean;
  narrativeScripts: string[];
  onComplete: () => void; // Function to call when phase is done
  treatmentNumber: number;
  // No onNarrationRecorded needed from parent
}

export const NarrationPhase: React.FC<NarrationPhaseProps> = ({
  isCurrentPhase,
  narrativeScripts,
  onComplete,
  treatmentNumber,
}) => {
  // Get state and the UPDATE function from context
  const { narrationAudios, updateNarrationAudio } = useRecording();

  // Handler defined INSIDE NarrationPhase to be passed down to NarrationItem.
  // This function calls the context's update function.
  // Accepts string | null, matching NarrationItem's callback signature.
  const handleSingleNarrationComplete = useCallback((index: number, audioUrl: string | null) => {
     if (updateNarrationAudio) {
          console.log(`NarrationPhase: Updating context for index ${index} with URL: ${audioUrl ? 'exists' : 'null'}`);
          updateNarrationAudio(index, audioUrl); // Update central context state
     } else {
         console.error("NarrationPhase: updateNarrationAudio function missing from context.");
     }
  }, [updateNarrationAudio]);

  if (!isCurrentPhase) return null;

  const recordedCount = narrationAudios?.filter(audio => !!audio).length || 0;
  const allNarrationsRecorded = narrativeScripts && narrativeScripts.length > 0 && recordedCount === narrativeScripts.length;

  return (
    <div className="space-y-6 p-4 border rounded-lg bg-card shadow-md">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-card-foreground">Processing Step 4: Narration Recording</h3>
        <p className="text-sm text-muted-foreground">
          Record yourself reading each of the 11 narrative scripts generated below. Speak clearly. Each recording has a maximum duration of 45 seconds.
          <br/>
          <span className={`font-medium ${allNarrationsRecorded ? 'text-green-500' : 'text-muted-foreground'}`}>
             {recordedCount} / {narrativeScripts?.length || 11} narrations recorded.
          </span>
        </p>
      </div>

      <div className="space-y-4">
        {narrativeScripts && narrativeScripts.length > 0 ? (
           narrativeScripts.map((script, index) => (
            <NarrationItem
              key={index}
              index={index}
              script={script}
              existingAudioUrl={narrationAudios?.[index] || null}
              // Pass the single handler that accepts string | null
              onRecordingComplete={handleSingleNarrationComplete} // <<< ONLY PASS THIS
              // onRecordingDeleted prop removed from NarrationItem usage
            />
          ))
        ) : (
          <p className="text-muted-foreground italic p-4 text-center">Generating narrative scripts...</p>
        )}
      </div>

      <Button onClick={onComplete} disabled={!allNarrationsRecorded} className="w-full mt-6" title={allNarrationsRecorded ? "Proceed to next step" : "Record all 11 narrations first"}>
        Proceed to Next Step <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
};