// src/components/treatment/NarrationItem.tsx
import React from 'react'; // Added React import
import { NarrationRecorder } from "@/components/NarrationRecorder"; // Assuming path is correct

interface NarrationItemProps {
  script: string;
  index: number;
  // This prop function expects only a valid string URL when a recording *successfully* completes
  onRecordingComplete: (index: number, audioUrl: string) => void;
  // Optional: Add a prop for when recording is deleted/nulled if parent needs to know
  // onRecordingDeleted?: (index: number) => void;
}

export const NarrationItem = ({
  script,
  index,
  onRecordingComplete,
  // onRecordingDeleted
}: NarrationItemProps) => {

  // --- CORRECTED Handler ---
  // This function receives string | null from NarrationRecorder
  const handleRecorderCompletion = (audioUrl: string | null) => {
    if (audioUrl) {
      // If we received a valid URL string, call the parent's handler
      onRecordingComplete(index, audioUrl);
    } else {
      // If we received null (e.g., recording failed or was deleted)
      // Optionally call a different handler if the parent needs notification
      // onRecordingDeleted?.(index);
      console.log(`NarrationItem ${index}: Recording completed with null URL (failed or deleted).`);
      // We don't call the main onRecordingComplete because it expects a string.
    }
  };
  // --- END CORRECTION ---

  return (
    <div className="space-y-3 p-4 bg-black/10 rounded-lg border border-border"> {/* Added border */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Narration {index + 1} of 11</h3> {/* Adjusted styling */}
        <div className="bg-muted/50 p-3 rounded-lg"> {/* Adjusted padding/bg */}
          <h4 className="font-medium mb-2 text-card-foreground">Script:</h4>
          <div className="text-sm whitespace-pre-wrap border p-3 rounded bg-background max-h-48 overflow-y-auto"> {/* Added max-height/overflow */}
            {script || "Loading script..."}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <h4 className="text-sm font-medium mb-2 text-card-foreground">Record Narration (Max 45s)</h4>
        <NarrationRecorder
          index={index}
          // Pass the new handler function
          onRecordingComplete={handleRecorderCompletion} // <<< USE CORRECTED HANDLER
          // Pass existing URL from context if needed for NarrationRecorder initialization?
          // existingAudioUrl={narrationAudios?.[index]} // Example if context has the URLs
        />
      </div>
    </div>
  );
};