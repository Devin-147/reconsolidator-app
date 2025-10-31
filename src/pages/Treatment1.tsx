// FILE: src/pages/Treatment1.tsx
// UPGRADED: Inserts the PracticeBooth as the first step (the time buffer).

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRecording } from "@/contexts/RecordingContext";
import { type PredictionError } from "@/components/PredictionErrorSelector"; 
import { PracticeBooth } from "@/components/treatment/PracticeBooth"; // <<< NEW IMPORT
import { PhaseOne } from "@/components/treatment/PhaseOne";
import { PhaseTwo } from "@/components/treatment/PhaseTwo";
import { PhaseThree } from "@/components/treatment/PhaseThree";
import { NarrationPhase } from "@/components/treatment/NarrationPhase";
import { PhaseFive } from "@/components/treatment/PhaseFive";
import { PhaseSix } from "@/components/treatment/PhaseSix";
import { useAuth } from "@/contexts/AuthContext";

interface TreatmentLocationState {
  treatmentNumber: number;
  sessionTargetEvent: string;
  sessionSuds: number;
  neutralMemories: string[];
  selectedErrors: PredictionError[];
}

const Treatment1 = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userEmail } = useAuth();
  const { memory1, memory2, updateNarrationAudio, completeTreatment } = useRecording();

  const THIS_TREATMENT_NUMBER = 1;

  // --- State for managing the treatment flow ---
  const [currentProcessingStep, setCurrentProcessingStep] = useState<number | null>(null);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  
  // --- Data passed in from the Calibration page ---
  const [sessionTargetEvent, setSessionTargetEvent] = useState<string>('');
  const [sessionSuds, setSessionSuds] = useState<number>(0);
  const [neutralMemories, setNeutralMemories] = useState<string[]>([]);
  const [selectedErrors, setSelectedErrors] = useState<PredictionError[]>([]);
  
  // --- State for individual phase responses ---
  const [phase1Response, setPhase1Response] = useState("");
  const [phase2Response, setPhase2Response] = useState("");
  const [phase3Response, setPhase3Response] = useState("");
  const [narrativeScripts, setNarrativeScripts] = useState<string[]>([]);
  
  // --- State for the final results view ---
  const [showResultsView, setShowResultsView] = useState(false);
  const [finalSudsResult, setFinalSudsResult] = useState<number | null>(null);
  const [improvementResult, setImprovementResult] = useState<number | null>(null);

  // Effect to load data from the Calibration page
  useEffect(() => {
    setIsLoadingPage(true);
    const locState = location.state as TreatmentLocationState | null;

    if (locState?.sessionTargetEvent && locState.neutralMemories?.length > 0 && locState.selectedErrors?.length === 11) {
      setSessionTargetEvent(locState.sessionTargetEvent); 
      setSessionSuds(locState.sessionSuds);
      setNeutralMemories(locState.neutralMemories);
      setSelectedErrors(locState.selectedErrors);
      setCurrentProcessingStep(0); // <<< Start at the NEW Step 0 (PracticeBooth)
      setIsLoadingPage(false);
    } else {
      toast.error(`Calibration data is missing. Please re-calibrate for Treatment ${THIS_TREATMENT_NUMBER}.`);
      navigate(`/calibrate/${THIS_TREATMENT_NUMBER}`, { replace: true });
    }
  }, [location.state, navigate]);

  const generateNarrativeScripts = useCallback(() => {
    // ... (This function is unchanged)
    if (!memory1 || !memory2 || !sessionTargetEvent || selectedErrors.length !== 11) { return; }
    const scripts = selectedErrors.map((errorObject) => `Imagine you are in the projection booth... But then, ${errorObject.description}. Then I see the movie ending on a scene when ${memory2}.`);
    setNarrativeScripts(scripts);
  }, [memory1, memory2, sessionTargetEvent, selectedErrors]);
  
  useEffect(() => {
    if (currentProcessingStep === 4) { // Now step 4 is NarrationPhase
      generateNarrativeScripts();
    }
  }, [currentProcessingStep, generateNarrativeScripts]);

  // --- Handlers to advance through the phases ---
  const handlePracticeBoothComplete = useCallback(() => setCurrentProcessingStep(1), []);
  const handlePhase1Complete = useCallback(() => setCurrentProcessingStep(2), []);
  const handlePhase2Complete = useCallback(() => setCurrentProcessingStep(3), []);
  const handlePhase3Complete = useCallback(() => setCurrentProcessingStep(4), []);
  const handleNarrationPhaseComplete = useCallback(() => setCurrentProcessingStep(5), []);
  const handlePhase5Complete = useCallback(() => setCurrentProcessingStep(6), []);
  
  const handleUserNarrationRecorded = useCallback((index: number, audioUrl: string | null) => {
    updateNarrationAudio?.(index, audioUrl);
  }, [updateNarrationAudio]);
  
  const handlePhase6Complete = useCallback((finalSudsFromPhaseSix: number) => {
    // ... (This function is unchanged)
    if (completeTreatment) {
      completeTreatment(`Treatment ${THIS_TREATMENT_NUMBER}`, finalSudsFromPhaseSix, sessionSuds);
      let impPct: number | null = null;
      if (sessionSuds > 0) {
        impPct = ((sessionSuds - finalSudsFromPhaseSix) / sessionSuds) * 100;
      }
      setFinalSudsResult(finalSudsFromPhaseSix); 
      setImprovementResult(impPct);
      setShowResultsView(true); 
      toast.success(`Treatment ${THIS_TREATMENT_NUMBER} complete!`);
    }
  }, [completeTreatment, sessionSuds]);

  const getPhaseTitle = () => {
    if (currentProcessingStep === 0) return "Practice Session"; // New Step 0
    if (currentProcessingStep === 1) return "Processing Phase 1";
    if (currentProcessingStep === 2) return "Processing Phase 2";
    if (currentProcessingStep === 3) return "Processing Phase 3";
    if (currentProcessingStep === 4) return "Guided Narrations (Audio)";
    if (currentProcessingStep === 5) return "Reverse Integration (Audio)";
    if (currentProcessingStep === 6) return "Final SUDS Rating";
    return "Loading Phase...";
  };

  if (isLoadingPage) { return <div className="flex justify-center items-center min-h-screen">Loading Treatment...</div>; }
  
  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <Button variant="ghost" className="mb-6 -ml-4" onClick={() => navigate("/")} disabled={showResultsView}> <ArrowLeft className="w-4 h-4 mr-2" /> Back to Main Setup </Button>
        {showResultsView ? (
          // ... (Results view JSX is unchanged)
          <div className="text-center">Results...</div>
        ) : (
          <>
            <div className="text-center space-y-1 mb-6"> <h1 className="text-3xl md:text-4xl font-bold text-primary">Treatment {THIS_TREATMENT_NUMBER}</h1> <p className="text-lg text-muted-foreground">{getPhaseTitle()}</p> </div>
            
            {/* --- THE NEW STEP-BY-STEP FLOW --- */}
            {currentProcessingStep === 0 && <PracticeBooth neutralMemory={neutralMemories[0] || 'a pleasant, recent activity'} onComplete={handlePracticeBoothComplete} />}
            {currentProcessingStep === 1 && <PhaseOne isCurrentPhase={true} response={phase1Response} onResponseChange={setPhase1Response} onComplete={handlePhase1Complete} />}
            {currentProcessingStep === 2 && <PhaseTwo isCurrentPhase={true} response={phase2Response} onResponseChange={setPhase2Response} onComplete={handlePhase2Complete} />}
            {currentProcessingStep === 3 && <PhaseThree isCurrentPhase={true} response={phase3Response} onResponseChange={setPhase3Response} onComplete={handlePhase3Complete} />}
            {currentProcessingStep === 4 && <NarrationPhase isCurrentPhase={true} narrativeScripts={narrativeScripts} selectedPredictionErrors={selectedErrors} onNarrationRecorded={handleUserNarrationRecorded} onComplete={handleNarrationPhaseComplete} treatmentNumber={THIS_TREATMENT_NUMBER} />}
            {currentProcessingStep === 5 && <PhaseFive isCurrentPhase={true} selectedPredictionErrors={selectedErrors} onComplete={handlePhase5Complete} treatmentNumber={THIS_TREATMENT_NUMBER} />}
            {currentProcessingStep === 6 && sessionTargetEvent && ( <PhaseSix isCurrentPhase={true} targetEventTranscript={sessionTargetEvent} onComplete={handlePhase6Complete} treatmentNumber={THIS_TREATMENT_NUMBER}/> )}
          </>
        )}
      </div>
    </div>
  );
};
export default Treatment1;
