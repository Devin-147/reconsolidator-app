// src/components/treatment/PhaseSix.tsx
import React, { useState, useEffect, useRef } from "react"; // Added React import
import { Button } from "@/components/ui/button";
// Removed Checkbox import as it's not used
import { Textarea } from "@/components/ui/textarea"; // Keep if used for retelling display/edit? Currently not used.
import { ArrowDown, Play, StopCircle, ArrowUp } from "lucide-react"; // Check if all used
import  SUDSScale  from "../SUDSScale"; // Corrected path? Assuming it's '../SUDSScale' not './SUDSScale'
import { type PredictionError } from "@/components/PredictionErrorSelector"; // Keep if needed indirectly? Not used directly here.
import { useRecording } from "@/contexts/RecordingContext"; // Only need calibrationSuds potentially
import { toast } from "sonner"; // Keep if adding toasts

interface PhaseSixProps {
  isCurrentPhase: boolean;
  // Removed targetEventTranscript prop if context is used below? Or keep for display? Let's keep for now.
  targetEventTranscript: string;
  onComplete: (finalSuds: number) => void; // Callback with the final SUDS rating
  treatmentNumber: number;
  // These seem unused in PhaseSix directly, remove if not needed:
  // narrativeScripts?: string[];
  // memory1?: string;
  // memory2?: string;
  // predictionErrors?: PredictionError[];
}

export const PhaseSix: React.FC<PhaseSixProps> = ({
  isCurrentPhase,
  targetEventTranscript, // Use this prop for display
  onComplete,
  treatmentNumber,
  // narrativeScripts = [], // Removed if unused
  // memory1 = '', // Removed if unused
  // memory2 = '', // Removed if unused
  // predictionErrors = [], // Removed if unused
}: PhaseSixProps) => {
  // Get only necessary values from context (calibrationSuds might be useful for comparison/display)
  // REMOVED setSudsLevel and sudsLevel
  const { calibrationSuds } = useRecording();

  // State for this phase
  const [isRetellingRecording, setIsRetellingRecording] = useState(false); // More specific name
  // const [recordingTime, setRecordingTime] = useState(0); // Remove if not needed/implemented fully
  const [currentSudsLevel, setCurrentSudsLevel] = useState<number>(calibrationSuds ?? 0); // Initialize with calibration SUDS or 0
  const [hasCompletedRetelling, setHasCompletedRetelling] = useState(false);

  // Refs for potential audio recording/playback if added later
  // const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  // const audioChunksRef = useRef<Blob[]>([]);
  // const streamRef = useRef<MediaStream | null>(null);
  // const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // --- Recording Logic (Simplified Placeholders - Needs Implementation) ---
  // This phase *requires* the user to retell the target event again.
  // We need a way to capture this retelling (audio recording is recommended)
  // and signal when it's complete to enable the final SUDS rating.
  // For now, just using a simple button toggle and state flag.
  const handleStartRetelling = () => {
    console.log("PhaseSix: Starting retelling 'recording' (placeholder)");
    setIsRetellingRecording(true);
    setHasCompletedRetelling(false); // Reset completion flag if re-recording
    // TODO: Implement actual audio recording start here if needed
    // Start timer?
    toast.info("Please retell the target event now.");
  };

  const handleStopRetelling = () => {
    console.log("PhaseSix: Stopping retelling 'recording' (placeholder)");
    setIsRetellingRecording(false);
    // TODO: Implement actual audio recording stop here (save blob/transcript?)
    // Stop timer?
    setHasCompletedRetelling(true); // Mark retelling as done
    toast.success("Retelling complete. Please rate your distress.");
  };
  // --- End Recording Logic Placeholders ---


  // Only render if this is the active phase
  if (!isCurrentPhase) return null;

  return (
    <div className="space-y-6 p-4 border rounded-lg bg-card shadow-md">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-card-foreground">Phase 6: Target Event Re-assessment</h3>
        <p className="text-sm text-muted-foreground">
          Please mentally (or optionally, record yourself) retelling the original target event again.
          Focus on how it feels *now*. Afterwards, rate your current level of distress (SUDS).
        </p>
      </div>

      {/* Section for retelling the event */}
      <div className="space-y-4">
        <div className="p-4 bg-muted/50 rounded-lg space-y-3 border border-border">
          <p className="text-sm font-medium text-muted-foreground">Original Target Event for Reference:</p>
          {/* Display original transcript read-only */}
          <div className="whitespace-pre-wrap text-sm p-2 bg-background rounded max-h-40 overflow-y-auto">
             {targetEventTranscript || "Target event transcript not available."}
          </div>

          {/* Placeholder Recording Controls for Retelling */}
          {!hasCompletedRetelling ? (
            <Button
                onClick={isRetellingRecording ? handleStopRetelling : handleStartRetelling}
                variant={isRetellingRecording ? "destructive" : "outline"}
                className="w-full"
                size="sm"
            >
                {isRetellingRecording ? (
                    <> <StopCircle className="w-4 h-4 mr-2" /> Stop Retelling </>
                ) : (
                    <> <Play className="w-4 h-4 mr-2" /> Start Retelling (Optional Recording) </>
                )}
            </Button>
          ) : (
            <div className="text-center text-sm text-green-500 py-2">Retelling step complete. Please rate SUDS below.</div>
          )}
           {/* Add actual audio recorder component here if implementing */}
        </div>
      </div>


      {/* Section for Final SUDS rating - Enabled only after retelling */}
      <div className={`space-y-4 transition-opacity duration-300 ${hasCompletedRetelling ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
          <div className="space-y-2">
            <h4 className="text-base font-medium text-card-foreground">Rate Final Distress Level (0-100)</h4>
             {/* --- CORRECTED SUDSScale Props --- */}
            <SUDSScale
              initialValue={currentSudsLevel} // Use local state for final SUDS
              onValueChange={setCurrentSudsLevel} // Update local state
              readOnly={!hasCompletedRetelling} // Make read-only until retelling done
            />
             {/* --- END CORRECTION --- */}
          </div>
          <Button
            onClick={() => onComplete(currentSudsLevel)} // Pass final local SUDS value
            className="w-full"
            disabled={!hasCompletedRetelling} // Enable only after retelling
          >
            Complete Treatment {treatmentNumber} & View Results
          </Button>
        </div>

    </div>
  );
};