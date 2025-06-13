// src/components/treatment/PhaseSix.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { Button } from "@/components/ui/button";
import { Play, StopCircle, ArrowLeft } from "lucide-react"; // Added ArrowLeft
import SUDSScale from "../SUDSScale"; // Default import
import { useRecording } from "@/contexts/RecordingContext";
import { toast } from "sonner";

interface PhaseSixProps {
  isCurrentPhase: boolean;
  targetEventTranscript: string;
  onComplete: (finalSuds: number) => void;
  treatmentNumber: number;
}

export const PhaseSix: React.FC<PhaseSixProps> = ({
  isCurrentPhase,
  targetEventTranscript,
  onComplete,
  treatmentNumber,
}: PhaseSixProps) => {
  const navigate = useNavigate(); // Hook for navigation
  const { calibrationSuds } = useRecording();
  const [isRetellingRecording, setIsRetellingRecording] = useState(false);
  const [currentSudsLevel, setCurrentSudsLevel] = useState<number>(calibrationSuds ?? 0);
  const [hasCompletedRetelling, setHasCompletedRetelling] = useState(false);

  // Placeholder recording logic handlers
  const handleStartRetelling = useCallback(() => { /* ... */ setIsRetellingRecording(true); setHasCompletedRetelling(false); toast.info("Retell target event."); }, []);
  const handleStopRetelling = useCallback(() => { /* ... */ setIsRetellingRecording(false); setHasCompletedRetelling(true); toast.success("Retelling complete."); }, []);
  const handleSudsChange = (value: number) => { setCurrentSudsLevel(value); };

  // Final completion handler
  const handleCompleteClick = () => {
    if (!hasCompletedRetelling) { toast.error("Retelling step required."); return; }
    if (typeof currentSudsLevel !== 'number' || currentSudsLevel < 0 || currentSudsLevel > 100) { toast.error("Valid SUDS score required."); return; }
    console.log(`PhaseSix: Calling onComplete with final SUDS: ${currentSudsLevel}`);
    onComplete(currentSudsLevel); // Call parent's handler
  };

  if (!isCurrentPhase) return null;

  return (
    // --- ADDED Centering Structure (if this component IS the main page content) ---
    // If PhaseSix is rendered INSIDE an already centered layout in TreatmentX.tsx, REMOVE the outer div and main tag.
    // Assuming for now it needs its own centering:
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6">
      <div className="max-w-3xl mx-auto space-y-8"> {/* <<< CENTERING APPLIED HERE */}

        {/* Optional Back Button - Adjust navigation target if needed */}
        <Button variant="ghost" className="mb-6 -ml-4" onClick={() => navigate(-1)}> {/* Go back one step? Or to setup? */}
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        {/* --- Phase Six Content --- */}
        <div className="space-y-6 p-4 border rounded-lg bg-card shadow-md">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-card-foreground">Processing Step 6: Target Event Re-assessment</h3>
            <p className="text-sm text-muted-foreground"> Mentally recall (or optionally record retelling) the original target event. Focus on how it feels *now*. Afterwards, rate your current level of distress (SUDS). </p>
          </div>

          {/* Retelling Section */}
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg space-y-3 border border-border">
              <p className="text-sm font-medium text-muted-foreground">Original Target Event Reference:</p>
              <div className="whitespace-pre-wrap text-sm p-2 bg-background rounded max-h-40 overflow-y-auto"> {targetEventTranscript || "..."} </div>
              {!hasCompletedRetelling ? ( <Button onClick={isRetellingRecording ? handleStopRetelling : handleStartRetelling} variant={isRetellingRecording ? "destructive" : "outline"} className="w-full" size="sm"> {isRetellingRecording ? ( <><StopCircle className="w-4 h-4 mr-2" /> Stop Retelling</> ) : ( <><Play className="w-4 h-4 mr-2" /> Start Retelling</> )} </Button> )
               : ( <div className="text-center text-sm text-green-500 py-2">Retelling complete. Please rate SUDS below.</div> )}
            </div>
          </div>

          {/* Final SUDS Rating Section */}
          <div className={`space-y-4 transition-opacity duration-300 ${hasCompletedRetelling ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
              <div className="space-y-2">
                <h4 className="text-base font-medium text-card-foreground">Rate Final Distress Level (0-100)</h4>
                <SUDSScale initialValue={currentSudsLevel} onValueChange={handleSudsChange} readOnly={!hasCompletedRetelling} />
              </div>
               {/* Corrected Button onClick */}
              <Button onClick={handleCompleteClick} className="w-full" disabled={!hasCompletedRetelling}> Complete Treatment {treatmentNumber} & View Results </Button>
            </div>
        </div>
         {/* --- End Phase Six Content --- */}

      </div> {/* End Centering Div */}
    </div> // End Outer Page Div
  );
};