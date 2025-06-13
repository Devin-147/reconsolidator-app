// FILE: src/pages/ActivationPage.tsx
// (This is the version that correctly updates context's calibrationSuds)

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Info, ArrowRight, Mic, Square, AlertCircle } from "lucide-react";
import SUDSScale from "../components/SUDSScale";
import { useRecording } from "@/contexts/RecordingContext";
import { MemoryControls } from "../components/MemoryControls";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input"; // This was missing in one of my earlier "full" versions
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
    memory1: initialMemory1,
    memory2: initialMemory2,
    isRecording1: isCtxRecording1,
    isRecording2: isCtxRecording2,
    // setMemory1, // Assuming MemoryControls calls context setters directly
    // setMemory2,
    targetEventTranscript: sessionTargetTranscriptFromCtx,
    audioBlobTarget: sessionTargetAudioBlobFromCtx,
    setMemoriesSaved,
    memoriesSaved,
    setShowsSidebar,
    calibrationSuds, // Get current calibrationSuds from context
    setCalibrationSuds, // Destructure setCalibrationSuds from context
  } = useRecording();

  const { userEmail, checkAuthStatus, userStatus, isLoading: isAuthLoading } = useAuth();

  const {
    isRecordingTarget: isRecordingSessionTarget,
    recordingTime: sessionTargetRecordingTime,
    liveTranscript: sessionTargetLiveTranscript,
    startTargetRecording,
    stopTargetRecording,
    error: sessionTargetRecordingError,
    isSupported: isTargetRecordingSupported,
  } = useTargetRecording();

  const [sessionSuds, setSessionSuds] = useState<number | null>(() => {
    // Initialize local sessionSuds based on context or default
    if (currentTreatmentNumber === 1 && (calibrationSuds === null || calibrationSuds === 0)) {
      return 50; // Default for very first time on T1 if context is 0/null
    }
    return calibrationSuds !== null ? calibrationSuds : 50; // Use context or default
  });

  useEffect(() => {
    if (setShowsSidebar) { setShowsSidebar(true); }
  }, [setShowsSidebar]);

  useEffect(() => {
    if (checkAuthStatus && (userStatus === 'loading' || (userEmail && userStatus === 'none'))) {
      checkAuthStatus();
    }
  }, [checkAuthStatus, userEmail, userStatus]);

  // This effect updates the local sessionSuds if the context's calibrationSuds changes
  // AND if this page is for T1 and context calibrationSuds was initially null/0.
  // This helps sync if context is updated externally or on first load.
  useEffect(() => {
    if (calibrationSuds !== null && sessionSuds !== calibrationSuds) {
        // If context has a value and local doesn't match, prefer context as initial value
        // unless user has already interacted with the slider on this page instance
        // For simplicity, let's keep the init in useState for sessionSuds
        // console.log(`ActivationPage (T${currentTreatmentNumber}): Context SUDS changed to ${calibrationSuds}, sessionSuds is ${sessionSuds}. Considering update.`);
    }
  }, [calibrationSuds, sessionSuds, currentTreatmentNumber]);


  const MIN_MEMORY_LENGTH = 5; 
  const needsToRecordM1M2 = currentTreatmentNumber === 1 && 
                           (!initialMemory1 || initialMemory1.trim().length < MIN_MEMORY_LENGTH || 
                            !initialMemory2 || initialMemory2.trim().length < MIN_MEMORY_LENGTH);

  const handleSessionSudsChange = useCallback((value: number) => {
    console.log(`ActivationPage (T${currentTreatmentNumber}): SUDS slider changed to:`, value);
    setSessionSuds(value); 
    if (setCalibrationSuds) { 
      setCalibrationSuds(value); 
      console.log(`ActivationPage (T${currentTreatmentNumber}): Context calibrationSuds updated to:`, value);
    }
  }, [currentTreatmentNumber, setCalibrationSuds]);

  const handleProceedToTreatment = () => {
    console.log(`Calibration for T${currentTreatmentNumber}: handleProceedToTreatment called.`);
    console.log("Values before validation:");
    console.log("  sessionTargetTranscriptFromCtx:", sessionTargetTranscriptFromCtx);
    console.log("  sessionSuds (local state, being used for this session):", sessionSuds);
    console.log("  calibrationSuds (context state, for sidebar):", calibrationSuds);
    console.log("  needsToRecordM1M2 (derived):", needsToRecordM1M2);
    console.log("  initialMemory1 (from context):", initialMemory1);
    console.log("  initialMemory2 (from context):", initialMemory2);
    
    if (!sessionTargetTranscriptFromCtx || sessionTargetTranscriptFromCtx.trim().length < MIN_MEMORY_LENGTH) {
      toast.error(`Please record a valid Target Event for Treatment ${currentTreatmentNumber}.`);
      return;
    }
    if (sessionSuds === null || sessionSuds < 0 || sessionSuds > 100) { 
      toast.error(`Please rate your SUDS (0-100) for Treatment ${currentTreatmentNumber}.`);
      return;
    }

    if (needsToRecordM1M2) { 
      if (!initialMemory1 || initialMemory1.trim().length < MIN_MEMORY_LENGTH || 
          !initialMemory2 || initialMemory2.trim().length < MIN_MEMORY_LENGTH) {
        toast.error("Please record both Positive Context Memories (M1 & M2 fully) for the initial setup.");
        return; 
      }
      if (setMemoriesSaved && currentTreatmentNumber === 1) {
         setMemoriesSaved(true); 
         console.log("ActivationPage: memoriesSaved flag set to true in context.");
      }
      // Also update the global calibrationSuds when M1/M2 are saved successfully for the first time.
      if (setCalibrationSuds && sessionSuds !== null) {
        setCalibrationSuds(sessionSuds);
      }
      toast.success("Initial Calibration Setup Complete!");
    } else {
      // For subsequent treatments (T2-T5), or T1 if M1/M2 were already set,
      // still update the global calibrationSuds with this session's SUDS if it's T1.
      // For T2-T5, the sidebar's "Initial SUDS" should ideally remain the *very first* SUDS.
      // Let's only update context's calibrationSuds on T1, or if it's currently null.
      if (currentTreatmentNumber === 1 && setCalibrationSuds && sessionSuds !== null) {
        setCalibrationSuds(sessionSuds);
      } else if (calibrationSuds === null && setCalibrationSuds && sessionSuds !== null){
        setCalibrationSuds(sessionSuds); // If it was never set, set it now.
      }
      toast.success(`Calibration for Treatment ${currentTreatmentNumber} Complete!`);
    }
    
    navigate(`/treatment-${currentTreatmentNumber}`, {
      state: {
        treatmentNumber: currentTreatmentNumber,
        sessionTargetEvent: sessionTargetTranscriptFromCtx,
        sessionSuds: sessionSuds, 
      },
    });
  };

  if (isAuthLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading User Data...</div>;
  }

  return (
    <div className="w-full space-y-8 animate-fadeIn">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <img src="/images/logo.png" alt="Logo" className="h-8 w-auto" />
          <h1 className="text-2xl font-bold text-white">The Reconsolidation Program</h1>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="p-1 rounded-full hover:bg-muted/50 inline-flex items-center justify-center">
              <Info className="w-5 h-5 text-gray-400" />
            </TooltipTrigger>
            <TooltipContent><p>Calibrate your target memory for this treatment session.</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <h2 className="text-xl font-semibold text-center text-primary mb-6">
        Calibration for Treatment {currentTreatmentNumber}
      </h2>

      <section className="space-y-4 p-4 border-2 rounded-lg bg-card shadow-md" style={{ borderColor: '#4A1212' }}>
        <h3 className="text-lg font-semibold flex items-center text-white">
          1. Re-activate & Record Target Event (Audio - Under 2 mins)
          <TooltipProvider delayDuration={100}><Tooltip>
            <TooltipTrigger className="ml-2 cursor-help"><Info size={16} className="text-muted-foreground"/></TooltipTrigger>
            <TooltipContent><p>Briefly recall and describe the specific memory you are targeting for this treatment session.</p></TooltipContent>
          </Tooltip></TooltipProvider>
        </h3>
        {!isTargetRecordingSupported && ( <div className="text-red-500 flex items-center space-x-2"><AlertCircle className="w-5 h-5"/><span>Browser not fully supported for recording.</span></div> )}
        {sessionTargetRecordingError && ( <div className="text-red-500 flex items-center space-x-2"><AlertCircle className="w-5 h-5"/><span>{sessionTargetRecordingError}</span></div> )}
        <div className="flex items-center justify-between">
          {!isRecordingSessionTarget ? (
            <Button onClick={startTargetRecording} disabled={!isTargetRecordingSupported || isRecordingSessionTarget} size="sm">
              <Mic className="w-4 h-4 mr-2" /> Start Target Recording (Session {currentTreatmentNumber})
            </Button>
          ) : (
            <Button onClick={stopTargetRecording} variant="destructive" disabled={!isRecordingSessionTarget} size="sm">
              <Square className="w-4 h-4 mr-2" /> Stop Recording ({formatTime(sessionTargetRecordingTime)} / 180s)
            </Button>
          )}
          {sessionTargetAudioBlobFromCtx && !isRecordingSessionTarget && ( <span className="text-sm text-green-500 ml-4">Target Audio for T{currentTreatmentNumber} Recorded</span> )}
        </div>
        {(isRecordingSessionTarget || sessionTargetTranscriptFromCtx) && (
          <div className="mt-4 p-3 bg-muted/50 rounded border border-border min-h-[60px]">
            <p className="text-sm text-muted-foreground italic">{isRecordingSessionTarget ? "Live transcript..." : `Final transcript for T${currentTreatmentNumber}:`}</p>
            <p className="text-sm">{isRecordingSessionTarget ? sessionTargetLiveTranscript : sessionTargetTranscriptFromCtx}</p>
          </div>
        )}
      </section>

      <section className="space-y-4 p-4 rounded-lg bg-card shadow-md">
        <h3 className="text-lg font-semibold flex items-center text-white">
          2. Rate Current Distress (SUDS) for Treatment {currentTreatmentNumber}
           <TooltipProvider><Tooltip>
                <TooltipTrigger className="ml-2 cursor-help"><Info size={16} className="text-muted-foreground"/></TooltipTrigger>
                <TooltipContent><p>Rate your distress (0-100) thinking about the Target Event *right now*.</p></TooltipContent>
            </Tooltip></TooltipProvider>
        </h3>
        <SUDSScale 
          initialValue={sessionSuds === null ? 50 : sessionSuds} 
          onValueChange={handleSessionSudsChange} 
        />
      </section>

      <section className={`space-y-4 p-4 border rounded-lg bg-card shadow-md ${needsToRecordM1M2 ? 'border-yellow-500' : 'border-gray-700 opacity-70'}`}>
        <h3 className="text-lg font-semibold text-white">
          3. Positive Context Memories (Audio)
          {!needsToRecordM1M2 && <span className="text-sm font-normal text-muted-foreground"> (Recorded during initial setup)</span>}
        </h3>
        <p className="text-sm text-muted-foreground">
          {needsToRecordM1M2 
            ? "Record two brief positive memories (around 30 seconds each): one from before the target event, and one from after."
            : "These positive memories were recorded during your initial setup and will be used for this treatment."
          }
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2"> 
            <h4 className="font-medium text-muted-foreground">Positive Memory 1 (Before Event)</h4>
            {needsToRecordM1M2 && <p className="text-xs italic text-muted-foreground/80 px-1">Please start your description with "I was..."</p>}
            {needsToRecordM1M2 ? (
              <MemoryControls memoryNumber={1} isRecording={isCtxRecording1} />
            ) : (
              <div className="p-3 bg-muted/50 rounded border border-border min-h-[40px] text-sm text-muted-foreground italic">
                {initialMemory1 ? `Previously recorded: "${initialMemory1.substring(0,70)}..."` : "Not recorded yet."}
              </div>
            )}
          </div>
          <div className="space-y-2"> 
            <h4 className="font-medium text-muted-foreground">Positive Memory 2 (After Event)</h4>
            {needsToRecordM1M2 && <p className="text-xs italic text-muted-foreground/80 px-1">Please start your description with "I was..."</p>}
            {needsToRecordM1M2 ? (
              <MemoryControls memoryNumber={2} isRecording={isCtxRecording2} />
            ) : (
              <div className="p-3 bg-muted/50 rounded border border-border min-h-[40px] text-sm text-muted-foreground italic">
                {initialMemory2 ? `Previously recorded: "${initialMemory2.substring(0,70)}..."` : "Not recorded yet."}
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="flex justify-end pt-4">
        <Button 
          onClick={handleProceedToTreatment} 
          disabled={
            !sessionTargetTranscriptFromCtx || sessionTargetTranscriptFromCtx.trim().length < MIN_MEMORY_LENGTH ||
            sessionSuds === null || sessionSuds < 0 || sessionSuds > 100 ||
            (needsToRecordM1M2 && 
              (!initialMemory1 || initialMemory1.trim().length < MIN_MEMORY_LENGTH || 
               !initialMemory2 || initialMemory2.trim().length < MIN_MEMORY_LENGTH)
            )
          } 
          className="px-6 py-3 text-base bg-green-600 hover:bg-green-700 flex items-center"
          size="lg"
        >
          Proceed to Reconsolidation Protocol (Treatment {currentTreatmentNumber}) <ArrowRight className="w-5 h-5 ml-2"/>
        </Button>
      </div>
    </div>
  );
};
export default ActivationPage;