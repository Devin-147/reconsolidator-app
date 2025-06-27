// FILE: src/pages/Treatment2.tsx

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRecording } from "@/contexts/RecordingContext";
import { PredictionErrorSelector, type PredictionError } from "@/components/PredictionErrorSelector"; 
import { PhaseOne } from "@/components/treatment/PhaseOne";
import { PhaseTwo } from "@/components/treatment/PhaseTwo";
import { PhaseThree } from "@/components/treatment/PhaseThree";
import { NarrationPhase } from "@/components/treatment/NarrationPhase";
import { PhaseFive } from "@/components/treatment/PhaseFive";
import { PhaseSix } from "@/components/treatment/PhaseSix";

interface TreatmentLocationState {
  treatmentNumber: number;
  sessionTargetEvent: string;
  sessionSuds: number;
}

const Treatment2 = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    memory1, memory2,
    narrationAudios, updateNarrationAudio, completeTreatment,
  } = useRecording();

  const THIS_TREATMENT_NUMBER = 2;

  const [sessionTargetEvent, setSessionTargetEvent] = useState<string | null>(null);
  const [sessionSuds, setSessionSuds] = useState<number | null>(null);
  const [selectedErrors, setSelectedErrors] = useState<PredictionError[]>([]);
  const [phase1Response, setPhase1Response] = useState("");
  const [phase2Response, setPhase2Response] = useState("");
  const [phase3Response, setPhase3Response] = useState("");
  const [currentProcessingStep, setCurrentProcessingStep] = useState<number | null>(null);
  const [narrativeScripts, setNarrativeScripts] = useState<string[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [showResultsView, setShowResultsView] = useState(false);
  const [finalSudsResult, setFinalSudsResult] = useState<number | null>(null);
  const [improvementResult, setImprovementResult] = useState<number | null>(null);

  useEffect(() => {
    setIsLoadingPage(true);
    if (!memory1 || !memory2 || memory1.trim() === "" || memory2.trim() === "") {
      toast.error("Core M1/M2 memories are missing. Please complete initial calibration first.");
      navigate('/calibrate/1', { replace: true }); return;
    }
    const locState = location.state as TreatmentLocationState | null;
    if (locState?.sessionTargetEvent && typeof locState?.sessionSuds === 'number' && locState?.treatmentNumber === THIS_TREATMENT_NUMBER) {
      setSessionTargetEvent(locState.sessionTargetEvent); 
      setSessionSuds(locState.sessionSuds);
      setCurrentProcessingStep(0); 
      setIsLoadingPage(false);
    } else {
      toast.info(`Please calibrate for Treatment ${THIS_TREATMENT_NUMBER} first.`);
      navigate(`/calibrate/${THIS_TREATMENT_NUMBER}`, { replace: true });
    }
  }, [location.state, memory1, memory2, navigate]);

  const handlePredictionErrorsComplete = useCallback((errors: PredictionError[]) => {
    if (errors.length !== 11) { toast.error("Please select 11 prediction errors."); return; }
    setSelectedErrors(errors); setCurrentProcessingStep(1);
  }, []);

  const generateNarrativeScripts = useCallback(() => {
    if (!memory1 || !memory2 || !sessionTargetEvent || !selectedErrors || selectedErrors.length !== 11) {
      toast.error("Cannot generate narrative scripts: essential data is missing.");
      setNarrativeScripts([]); return null;
    }
    const scripts = selectedErrors.map((errorObject: PredictionError) => {
      return `Imagine you are in the projection booth of a movie theatre, looking out at the screen. You also see another version of yourself sitting comfortably in the theatre seats below, watching the screen also.\n\nThe movie begins, showing a time when ${memory1}. Then the movie shows a time when ${sessionTargetEvent}. But then, ${errorObject.description}. You are noticing yourself being surprised and delighted with this change of scene. Then I see the movie ending on a scene when ${memory2}`;
    });
    setNarrativeScripts(scripts);
    return scripts;
  }, [memory1, memory2, sessionTargetEvent, selectedErrors]);

  useEffect(() => {
    if (currentProcessingStep === 4 && sessionTargetEvent && selectedErrors.length === 11) {
      generateNarrativeScripts();
    }
  }, [currentProcessingStep, generateNarrativeScripts, sessionTargetEvent, selectedErrors]);

  const handlePhase1Complete = useCallback(() => setCurrentProcessingStep(2), []);
  const handlePhase2Complete = useCallback(() => setCurrentProcessingStep(3), []);
  const handlePhase3Complete = useCallback(() => setCurrentProcessingStep(4), []);
  const handleNarrationPhaseComplete = useCallback(() => setCurrentProcessingStep(5), []);
  const handlePhase5Complete = useCallback(() => setCurrentProcessingStep(6), []);
  const handleUserNarrationRecorded = useCallback((index: number, audioUrl: string | null) => { if (updateNarrationAudio) { updateNarrationAudio(index, audioUrl); } }, [updateNarrationAudio]);
  
  const handlePhase6Complete = useCallback((finalSudsFromPhaseSix: number) => {
    if (completeTreatment && typeof sessionSuds === 'number') {
      completeTreatment(`Treatment ${THIS_TREATMENT_NUMBER}`, finalSudsFromPhaseSix, sessionSuds);
      let impPct: number | null = null;
      if (sessionSuds > 0) {
        const calcImp = ((sessionSuds - finalSudsFromPhaseSix) / sessionSuds) * 100;
        if (!isNaN(calcImp) && isFinite(calcImp)) impPct = calcImp;
      }
      setFinalSudsResult(finalSudsFromPhaseSix); 
      setImprovementResult(impPct);
      setShowResultsView(true); 
      toast.success(`Treatment ${THIS_TREATMENT_NUMBER} complete!`);
    } else { 
      toast.error(`Error saving results for T${THIS_TREATMENT_NUMBER}. Session SUDS missing.`); 
    }
  }, [completeTreatment, sessionSuds, THIS_TREATMENT_NUMBER]);

  const getPhaseTitle = () => {
    if (currentProcessingStep === 0) return "Select Mismatch Experiences";
    if (currentProcessingStep === 1) return "Processing Phase 1";
    if (currentProcessingStep === 2) return "Processing Phase 2";
    if (currentProcessingStep === 3) return "Processing Phase 3";
    if (currentProcessingStep === 4) return "Guided Narrations";
    if (currentProcessingStep === 5) return "Reverse Integration Narratives";
    if (currentProcessingStep === 6) return "Final SUDS Rating";
    return "Loading Phase...";
  };

  if (isLoadingPage) { return (<div className="flex justify-center items-center min-h-screen">Loading Treatment Data...</div>); }
  
  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <Button variant="ghost" className="mb-6 -ml-4" onClick={() => navigate("/")} disabled={showResultsView}> <ArrowLeft className="w-4 h-4 mr-2" /> Back to Main Setup </Button>
        {showResultsView ? (
          <div className="text-center space-y-6 p-6 bg-card border rounded-xl shadow-2xl animate-fadeIn">
             <h2 className="text-3xl font-bold text-primary">Treatment {THIS_TREATMENT_NUMBER} Results!</h2>
             <div className="text-lg space-y-2 text-card-foreground">
                <p>Initial SUDS (this session): <span className="font-semibold">{sessionSuds}</span></p>
                <p>Final SUDS (this session): <span className="font-semibold">{finalSudsResult}</span></p>
                {improvementResult !== null && (<p>Improvement this session: <span className={`font-semibold ${improvementResult >= 0 ? 'text-green-500' : 'text-red-500'}`}>{improvementResult >= 0 ? '+' : ''}{improvementResult.toFixed(0)}%</span></p>)}
             </div>
             <Button onClick={() => navigate(THIS_TREATMENT_NUMBER < 5 ? `/calibrate/${THIS_TREATMENT_NUMBER + 1}` : '/follow-up')} className="mt-6" size="lg">
                {THIS_TREATMENT_NUMBER < 5 ? `Start Calibration for T${THIS_TREATMENT_NUMBER + 1}` : "Go to Follow-Up"}
             </Button>
          </div>
        ) : (
          <>
            <div className="text-center space-y-1 mb-6"> <h1 className="text-3xl md:text-4xl font-bold text-primary">Treatment {THIS_TREATMENT_NUMBER}</h1> <p className="text-lg text-muted-foreground">{getPhaseTitle()}</p> </div>
            <div className="p-4 border rounded-lg bg-muted/30 space-y-2 text-sm mb-6 shadow"> <p><span className="font-medium text-card-foreground">M1:</span> <span className="text-muted-foreground">{memory1?.substring(0, 70)}...</span></p> <p><span className="font-medium text-card-foreground">M2:</span> <span className="text-muted-foreground">{memory2?.substring(0, 70)}...</span></p> {sessionTargetEvent && <p><span className="font-medium text-card-foreground">Target (Session):</span> <span className="text-muted-foreground">{sessionTargetEvent.substring(0, 70)}... (SUDS: {sessionSuds})</span></p>} </div>
            {currentProcessingStep === 0 && <PredictionErrorSelector onComplete={handlePredictionErrorsComplete} />}
            {currentProcessingStep === 1 && <PhaseOne isCurrentPhase={true} response={phase1Response} onResponseChange={setPhase1Response} onComplete={handlePhase1Complete} />}
            {currentProcessingStep === 2 && <PhaseTwo isCurrentPhase={true} response={phase2Response} onResponseChange={setPhase2Response} onComplete={handlePhase2Complete} />}
            {currentProcessingStep === 3 && <PhaseThree isCurrentPhase={true} response={phase3Response} onResponseChange={setPhase3Response} onComplete={handlePhase3Complete} />}
            {currentProcessingStep === 4 && narrativeScripts.length > 0 && selectedErrors.length === 11 && (
                <NarrationPhase isCurrentPhase={true} narrativeScripts={narrativeScripts} selectedPredictionErrors={selectedErrors} onNarrationRecorded={handleUserNarrationRecorded} onComplete={handleNarrationPhaseComplete} treatmentNumber={THIS_TREATMENT_NUMBER} />
            )}
            {currentProcessingStep === 5 && selectedErrors.length === 11 && (
                <PhaseFive isCurrentPhase={true} selectedPredictionErrors={selectedErrors} onComplete={handlePhase5Complete} treatmentNumber={THIS_TREATMENT_NUMBER} />
            )}
            {currentProcessingStep === 6 && sessionTargetEvent && ( <PhaseSix isCurrentPhase={true} targetEventTranscript={sessionTargetEvent} onComplete={handlePhase6Complete} treatmentNumber={THIS_TREATMENT_NUMBER}/> )}
          </>
        )}
      </div>
    </div>
  );
};
export default Treatment2;