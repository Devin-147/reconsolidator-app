// FILE: src/pages/ActivationPage.tsx
// UPGRADED: Now a complete, multi-step calibration manager.

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Info, ArrowRight, Mic, Square, AlertCircle, Loader2, PartyPopper } from "lucide-react";
import SUDSScale from "../components/SUDSScale";
import { useRecording } from "@/contexts/RecordingContext";
import { MemoryControls } from "../components/MemoryControls";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { PredictionErrorSelector, type PredictionError } from "@/components/PredictionErrorSelector"; 
import { NeutralMemoryCollector } from "@/components/treatment/NeutralMemoryCollector"; // <<< NEW IMPORT
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTargetRecording } from "@/hooks/useTargetRecording";
import { formatTime } from "@/utils/formatTime";

const ActivationPage = () => {
  const navigate = useNavigate();
  const { treatmentNumber: treatmentNumberString } = useParams<{ treatmentNumber: string }>();
  const currentTreatmentNumber = parseInt(treatmentNumberString || "1", 10);

  const {
    memory1: initialMemory1, memory2: initialMemory2,
    isRecording1: isCtxRecording1, isRecording2: isCtxRecording2,
    targetEventTranscript: sessionTargetTranscriptFromCtx,
    setShowsSidebar, calibrationSuds, setCalibrationSuds,
  } = useRecording();

  const { userEmail } = useAuth();

  const {
    isRecordingTarget: isRecordingSessionTarget, recordingTime: sessionTargetRecordingTime,
    liveTranscript: sessionTargetLiveTranscript, startTargetRecording, stopTargetRecording,
    error: sessionTargetRecordingError, isSupported: isTargetRecordingSupported,
  } = useTargetRecording();

  // --- NEW STATE MANAGEMENT FOR THE FULL CALIBRATION FLOW ---
  const [sessionSuds, setSessionSuds] = useState<number>(calibrationSuds ?? 50);
  const [neutralMemories, setNeutralMemories] = useState<string[]>([]); // <<< NEW
  const [selectedErrors, setSelectedErrors] = useState<PredictionError[]>([]); // <<< NEW
  const [isCalibrationComplete, setIsCalibrationComplete] = useState(false); // <<< NEW
  const [isSaving, setIsSaving] = useState(false); // <<< NEW

  useEffect(() => { setShowsSidebar?.(true); }, [setShowsSidebar]);

  const handleSessionSudsChange = useCallback((value: number) => {
    setSessionSuds(value); 
    setCalibrationSuds?.(value); 
  }, [setCalibrationSuds]);
  
  const handlePredictionErrorsComplete = useCallback((errors: PredictionError[]) => {
    setSelectedErrors(errors);
  }, []);

  const handleFinishCalibration = async () => {
    // --- FINAL VALIDATION ---
    if (!sessionTargetTranscriptFromCtx || sessionTargetTranscriptFromCtx.trim().length < 5) {
      toast.error("Please record a valid Target Event."); return;
    }
    if (sessionSuds < 0 || sessionSuds > 100) { 
      toast.error("Please rate your SUDS (0-100)."); return;
    }
    if (currentTreatmentNumber === 1 && (!initialMemory1 || !initialMemory2)) {
        toast.error("Please record both Positive Context Memories (M1 & M2)."); return;
    }
    if (neutralMemories.length < 1) {
        toast.error("Please list at least one neutral or pleasant memory for the practice session."); return;
    }
    if (selectedErrors.length !== 11) {
        toast.error("Please select exactly 11 prediction errors."); return;
    }

    // --- ALL DATA IS VALID, PROCEED TO SAVE ---
    setIsSaving(true);
    toast.info("Saving your calibration and preparing your session...");

    try {
        const response = await fetch('/api/save-and-generate-narratives', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userEmail: userEmail,
                narratives: selectedErrors,
                // We can also send other calibration data here if needed
                targetEvent: sessionTargetTranscriptFromCtx,
                initialSuds: sessionSuds,
                memory1: initialMemory1,
                memory2: initialMemory2,
                neutralMemories: neutralMemories
            }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to save calibration.");

        toast.success("Calibration complete! Your session is ready.");
        setIsCalibrationComplete(true);

    } catch (error: any) {
        console.error("Failed to save calibration:", error);
        toast.error(error.message || "An error occurred while saving.");
    } finally {
        setIsSaving(false);
    }
  };

  const startTreatment = () => {
    navigate(`/treatment-${currentTreatmentNumber}`, {
        state: {
          treatmentNumber: currentTreatmentNumber,
          sessionTargetEvent: sessionTargetTranscriptFromCtx,
          sessionSuds: sessionSuds,
          neutralMemories: neutralMemories, // Pass all data to the treatment page
          selectedErrors: selectedErrors,
        },
      });
  };

  // Determines if the M1/M2 section should be active
  const needsToRecordM1M2 = currentTreatmentNumber === 1;

  if (isSaving) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Saving and preparing your personalized session...</p>
        </div>
    );
  }

  if (isCalibrationComplete) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
            <PartyPopper className="w-16 h-16 text-green-500" />
            <h2 className="text-2xl font-bold">Calibration Complete!</h2>
            <p className="text-muted-foreground max-w-md">
                All your session materials are prepared. When you are ready, begin the experiential part of your treatment.
            </p>
            <Button onClick={startTreatment} size="lg" className="px-8 py-4 text-lg">
                Begin Treatment {currentTreatmentNumber} <ArrowRight className="w-5 h-5 ml-2"/>
            </Button>
        </div>
    );
  }

  return (
    <div className="w-full space-y-8 animate-fadeIn">
      <h2 className="text-xl font-semibold text-center text-primary mb-6">
        Calibration for Treatment {currentTreatmentNumber}
      </h2>

      {/* --- STEP 1: TARGET EVENT --- */}
      <section className="space-y-4 p-4 border rounded-lg bg-card shadow-md">
        <h3 className="text-lg font-semibold flex items-center text-white">1. Re-activate & Record Target Event</h3>
        {/* ... (rest of the target event recording JSX is unchanged) ... */}
        <div className="flex items-center justify-between">
          {!isRecordingSessionTarget ? (<Button onClick={startTargetRecording} size="sm"><Mic className="w-4 h-4 mr-2" /> Start Target Recording</Button>) 
          : (<Button onClick={stopTargetRecording} variant="destructive" size="sm"><Square className="w-4 h-4 mr-2" /> Stop Recording ({formatTime(sessionTargetRecordingTime)})</Button>)}
        </div>
        {(isRecordingSessionTarget || sessionTargetTranscriptFromCtx) && (
          <div className="mt-4 p-3 bg-muted/50 rounded border"><p className="text-sm">{isRecordingSessionTarget ? sessionTargetLiveTranscript : sessionTargetTranscriptFromCtx}</p></div>
        )}
      </section>

      {/* --- STEP 2: SUDS RATING --- */}
      <section className="space-y-4 p-4 rounded-lg bg-card shadow-md">
        <h3 className="text-lg font-semibold text-white">2. Rate Current Distress (SUDS)</h3>
        <SUDSScale initialValue={sessionSuds} onValueChange={handleSessionSudsChange} />
      </section>

      {/* --- STEP 3: BOOKENDS (M1 & M2) --- */}
      <section className={`space-y-4 p-4 border rounded-lg bg-card shadow-md ${needsToRecordM1M2 ? 'border-yellow-500' : 'border-gray-700 opacity-70'}`}>
        <h3 className="text-lg font-semibold text-white">3. Positive Context Memories (Audio)</h3>
        {/* ... (rest of the M1/M2 JSX is unchanged) ... */}
        <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2"> 
                <h4 className="font-medium text-muted-foreground">Positive Memory 1 (Before Event)</h4>
                <MemoryControls memoryNumber={1} isRecording={isCtxRecording1} />
            </div>
            <div className="space-y-2"> 
                <h4 className="font-medium text-muted-foreground">Positive Memory 2 (After Event)</h4>
                <MemoryControls memoryNumber={2} isRecording={isCtxRecording2} />
            </div>
        </div>
      </section>
      
      {/* --- STEP 4 (NEW): NEUTRAL MEMORIES --- */}
      <NeutralMemoryCollector neutralMemories={neutralMemories} setNeutralMemories={setNeutralMemories} />
      
      {/* --- STEP 5 (NEW): PREDICTION ERRORS --- */}
      <section className="p-4 rounded-lg bg-card shadow-md">
        <PredictionErrorSelector onComplete={handlePredictionErrorsComplete} />
      </section>

      {/* --- FINAL SUBMIT BUTTON --- */}
      <div className="flex justify-end pt-4">
        <Button onClick={handleFinishCalibration} className="px-6 py-3 text-base bg-green-600 hover:bg-green-700" size="lg">
          Finish Calibration & Prepare Session <ArrowRight className="w-5 h-5 ml-2"/>
        </Button>
      </div>
    </div>
  );
};
export default ActivationPage;
