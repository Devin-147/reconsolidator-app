// FILE: src/pages/Treatment4.tsx
// Corrected completeTreatment call.

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRecording } from "@/contexts/RecordingContext";
import { PredictionErrorSelector, type PredictionError } from "@/components/PredictionErrorSelector"; 
import { PhaseOne } from "@/components/treatment/PhaseOne";
import { PhaseTwo } from "@/components/treatment/PhaseTwo";
import { PhaseThree } from "@/components/treatment/PhaseThree";
import { NarrationPhase } from "@/components/treatment/NarrationPhase";
import { PhaseFive } from "@/components/treatment/PhaseFive";
import { PhaseSix } from "@/components/treatment/PhaseSix";

interface TreatmentLocationState { treatmentNumber: number; sessionTargetEvent: string; sessionSuds: number; }

const Treatment4 = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { memory1, memory2, narrationAudios, updateNarrationAudio, completeTreatment } = useRecording();
  const THIS_TREATMENT_NUMBER = 4;
  const [sessionTargetEvent, setSessionTargetEvent] = useState<string | null>(null);
  const [sessionSuds, setSessionSuds] = useState<number | null>(null);
  const [selectedErrors, setSelectedErrors] = useState<PredictionError[]>([]);
  const [currentProcessingStep, setCurrentProcessingStep] = useState<number | null>(null);
  const [narrativeScripts, setNarrativeScripts] = useState<string[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [showResultsView, setShowResultsView] = useState(false);
  const [finalSudsResult, setFinalSudsResult] = useState<number | null>(null);
  const [improvementResult, setImprovementResult] = useState<number | null>(null);

  useEffect(() => {
    setIsLoadingPage(true);
    if (!memory1 || !memory2) {
      toast.error("M1/M2 missing. Calibrate first.");
      navigate('/calibrate/1', { replace: true }); return;
    }
    const locState = location.state as TreatmentLocationState | null;
    if (locState?.sessionTargetEvent && typeof locState?.sessionSuds === 'number' && locState?.treatmentNumber === THIS_TREATMENT_NUMBER) {
      setSessionTargetEvent(locState.sessionTargetEvent); setSessionSuds(locState.sessionSuds);
      setCurrentProcessingStep(0); setIsLoadingPage(false);
    } else {
      toast.info(`Please calibrate for T${THIS_TREATMENT_NUMBER}.`);
      navigate(`/calibrate/${THIS_TREATMENT_NUMBER}`, { replace: true });
    }
  }, [location.state, memory1, memory2, navigate]);
  
  const handlePredictionErrorsComplete = useCallback((errors: PredictionError[]) => { setSelectedErrors(errors); setCurrentProcessingStep(1); }, []);
  const generateNarrativeScripts = useCallback(() => {
    if (!memory1 || !memory2 || !sessionTargetEvent || !selectedErrors) return null;
    const scripts = selectedErrors.map((e: PredictionError) => `Imagine...${memory1}...${sessionTargetEvent}...${e.description}...${memory2}`);
    setNarrativeScripts(scripts); return scripts;
  }, [memory1, memory2, sessionTargetEvent, selectedErrors]);
  useEffect(() => { if (currentProcessingStep === 4) { generateNarrativeScripts(); } }, [currentProcessingStep, generateNarrativeScripts]);
  const handlePhase1Complete = useCallback(() => setCurrentProcessingStep(2), []);
  const handlePhase2Complete = useCallback(() => setCurrentProcessingStep(3), []);
  const handlePhase3Complete = useCallback(() => setCurrentProcessingStep(4), []);
  const handleNarrationPhaseComplete = useCallback(() => setCurrentProcessingStep(5), []);
  const handlePhase5Complete = useCallback(() => setCurrentProcessingStep(6), []);
  const handleUserNarrationRecorded = useCallback((index: number, audioUrl: string | null) => { if (updateNarrationAudio) updateNarrationAudio(index, audioUrl); }, [updateNarrationAudio]);
  
  const handlePhase6Complete = useCallback((finalSudsFromPhaseSix: number) => {
    if (completeTreatment && typeof sessionSuds === 'number') {
      completeTreatment(`Treatment ${THIS_TREATMENT_NUMBER}`, finalSudsFromPhaseSix, sessionSuds); // <<< CORRECTED
      let impPct: number | null = null;
      if (sessionSuds > 0) { const calcImp = ((sessionSuds - finalSudsFromPhaseSix) / sessionSuds) * 100; if (!isNaN(calcImp)) impPct = calcImp; }
      setFinalSudsResult(finalSudsFromPhaseSix); setImprovementResult(impPct);
      setShowResultsView(true); toast.success(`T${THIS_TREATMENT_NUMBER} complete!`);
    } else { toast.error(`Error saving results for T${THIS_TREATMENT_NUMBER}.`); }
  }, [completeTreatment, sessionSuds, THIS_TREATMENT_NUMBER]);

  const getPhaseTitle = () => { /* ... (Same as before) ... */ };
  if (isLoadingPage) { return (<div>Loading...</div>); }
  
  return (
    <div className="p-4 md:p-6"> <div className="max-w-3xl mx-auto space-y-8">
        <Button variant="ghost" onClick={() => navigate("/")} disabled={showResultsView}> <ArrowLeft className="mr-2" /> Back </Button>
        {showResultsView ? (
          <div className="text-center p-6 bg-card border rounded-xl"> <h2 className="text-3xl">T{THIS_TREATMENT_NUMBER} Results!</h2> <p>Initial SUDS: {sessionSuds}</p> <p>Final SUDS: {finalSudsResult}</p> {improvementResult !== null && (<p>Improvement: {improvementResult.toFixed(0)}%</p>)} <Button onClick={() => navigate(`/calibrate/${THIS_TREATMENT_NUMBER + 1}`)}>Start T{THIS_TREATMENT_NUMBER + 1}</Button> </div>
        ) : (
          <>
            <div className="text-center"> <h1 className="text-4xl font-bold">Treatment {THIS_TREATMENT_NUMBER}</h1> <p>{getPhaseTitle()}</p> </div>
            <div className="p-4 border rounded"> <p>M1: {memory1?.substring(0,70)}...</p> <p>M2: {memory2?.substring(0,70)}...</p> {sessionTargetEvent && <p>Target: {sessionTargetEvent.substring(0,70)}... (SUDS: {sessionSuds})</p>} </div>
            {currentProcessingStep === 0 && <PredictionErrorSelector onComplete={handlePredictionErrorsComplete} />}
            {currentProcessingStep === 1 && <PhaseOne isCurrentPhase={true} onComplete={handlePhase1Complete} />}
            {currentProcessingStep === 2 && <PhaseTwo isCurrentPhase={true} onComplete={handlePhase2Complete} />}
            {currentProcessingStep === 3 && <PhaseThree isCurrentPhase={true} onComplete={handlePhase3Complete} />}
            {currentProcessingStep === 4 && <NarrationPhase isCurrentPhase={true} narrativeScripts={narrativeScripts} selectedPredictionErrors={selectedErrors} onNarrationRecorded={handleUserNarrationRecorded} onComplete={handleNarrationPhaseComplete} treatmentNumber={THIS_TREATMENT_NUMBER} />}
            {currentProcessingStep === 5 && <PhaseFive isCurrentPhase={true} selectedPredictionErrors={selectedErrors} onComplete={handlePhase5Complete} treatmentNumber={THIS_TREATMENT_NUMBER} />}
            {currentProcessingStep === 6 && sessionTargetEvent && ( <PhaseSix isCurrentPhase={true} targetEventTranscript={sessionTargetEvent} onComplete={handlePhase6Complete} treatmentNumber={THIS_TREATMENT_NUMBER}/> )}
          </>
        )}
    </div></div>
  );
};
export default Treatment4;