// src/components/treatment/NarrationItem.tsx
import React from 'react';
import { NarrationRecorder } from "@/components/NarrationRecorder"; // Adjust path if needed

interface NarrationItemProps {
  script: string;
  index: number;
  // Prop from parent (NarrationPhase) - now accepts string OR null
  onRecordingComplete: (index: number, audioUrl: string | null) => void; // <<< ACCEPTS NULL
  existingAudioUrl: string | null;
  // onRecordingDeleted prop removed
}

export const NarrationItem = ({
  script,
  index,
  onRecordingComplete, // This function now handles both success and failure/delete
  existingAudioUrl
}: NarrationItemProps) => {

  // Simplified Handler: Passes result directly to parent's callback
  const handleRecorderCompletion = (audioUrl: string | null) => {
    console.log(`NarrationItem ${index}: handleRecorderCompletion received URL: ${audioUrl ? 'valid URL' : 'null'}`);
    // Call the single callback passed from NarrationPhase
    onRecordingComplete(index, audioUrl);
  };

  return (
    <div className="space-y-3 p-4 bg-black/10 rounded-lg border border-border">
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Narration {index + 1} of 11</h3>
        <div className="bg-muted/50 p-3 rounded-lg">
          <h4 className="font-medium mb-2 text-card-foreground">Script:</h4>
          <div className="text-sm whitespace-pre-wrap border p-3 rounded bg-background max-h-48 overflow-y-auto">
            {script || "Loading script..."}
          </div>
        </div>
      </div>
      <div className="mt-4">
        <h4 className="text-sm font-medium mb-2 text-card-foreground">Record Narration (Max 45s)</h4>
        <NarrationRecorder
          index={index}
          // Pass the single handler to NarrationRecorder's completion prop
          onRecordingComplete={handleRecorderCompletion}
          existingAudioUrl={existingAudioUrl}
        />
      </div>
    </div>
  );
};