// src/pages/Treatment1.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRecording } from "@/contexts/RecordingContext";
import { PredictionErrorSelection } from "@/components/treatment/PredictionErrorSelection";
import { PhaseOne } from "@/components/treatment/PhaseOne";
import { PhaseTwo } from "@/components/treatment/PhaseTwo";
import { PhaseThree } from "@/components/treatment/PhaseThree";
import { NarrationPhase } from "@/components/treatment/NarrationPhase";
import { PhaseFive } from "@/components/treatment/PhaseFive";
import { type PredictionError } from "@/components/PredictionErrorSelector";
import { PhaseSix } from "@/components/treatment/PhaseSix"; // Adjust path if needed

const Treatment1 = () => {
  const navigate = useNavigate();
  const {
    memory1, memory2, targetEventTranscript, calibrationSuds, memoriesSaved,
    narrationAudios, updateNarrationAudio, completeTreatment,
  } = useRecording();

  const [selectedErrors, setSelectedErrors] = useState<PredictionError[]>([]);
  const [phase1Response, setPhase1Response] = useState("");
  const [phase2Response, setPhase2Response] = useState("");
  const [phase3Response, setPhase3Response] = useState("");
  const [currentProcessingStep, setCurrentProcessingStep] = useState<number | null>(null);
  const [narrativeScripts, setNarrativeScripts] = useState<string[]>([]);
  const [isLoadingPrereqs, setIsLoadingPrereqs] = useState(true);
  const [showResultsView, setShowResultsView] = useState(false);
  const [finalSudsResult, setFinalSudsResult] = useState<number | null>(null);
  const [improvementResult, setImprovementResult] = useState<number | null>(null);

  console.log("Treatment1.tsx - Step:", currentProcessingStep, "Loading:", isLoadingPrereqs);

  // Prerequisite Check Effect (Keep as is)
  useEffect(() => {
    console.log("T1 Prereq Check: Running. memoriesSaved:", memoriesSaved);
    const checkTimeout = setTimeout(() => {
      if (!memoriesSaved) { console.log("T1 Prereq Check: memoriesSaved false. Redirecting '/'."); toast.error("Setup missing."); navigate('/'); return; }
      if (!memory1 || !memory2 || !targetEventTranscript || typeof calibrationSuds !== 'number') { console.warn("T1 Prereq Check: data missing. Redirecting '/'."); toast.error("Setup data error."); navigate('/'); return; }
      console.log("T1 Prereq Check: Met. Starting step 0."); setIsLoadingPrereqs(false); setCurrentProcessingStep(0);
    }, 150);
    return () => clearTimeout(checkTimeout);
  }, [memoriesSaved, memory1, memory2, targetEventTranscript, calibrationSuds, navigate]);

  // --- Handlers and Effects (Keep as is) ---
  const handlePredictionErrorsComplete = useCallback((errors: PredictionError[]) => { if (errors.length !== 11) { toast.error("Select 11 errors."); return; } console.log("T1: PEs selected:", errors.length); setSelectedErrors(errors); setCurrentProcessingStep(1); }, []);
  const generateNarrativeScripts = useCallback(() => { if (!memory1 || !memory2 || !targetEventTranscript || selectedErrors.length !== 11) { console.error("T1: Cannot generate scripts, data missing."); toast.error("Cannot generate: data missing."); return null; } console.log("T1: Generating scripts..."); const scripts = selectedErrors.map((error, index) => { return `Movie ${index + 1}: ...`; }); console.log("T1: Scripts generated:", scripts.length); setNarrativeScripts(scripts); return scripts; }, [memory1, memory2, targetEventTranscript, selectedErrors]);
  useEffect(() => { if (currentProcessingStep === 4) { generateNarrativeScripts(); } }, [currentProcessingStep, generateNarrativeScripts]);
  const handleStep1Complete = useCallback(() => setCurrentProcessingStep(2), []);
  const handleStep2Complete = useCallback(() => setCurrentProcessingStep(3), []);
  const handleStep3Complete = useCallback(() => setCurrentProcessingStep(4), []);
  const handleStep4Complete = useCallback(() => setCurrentProcessingStep(5), []);
  const handleStep5Complete = useCallback(() => setCurrentProcessingStep(6), []);
  // handleNarrationRecorded removed - NarrationPhase calls context directly
  const handleStep6Complete = useCallback((finalSuds: number) => { if (completeTreatment && typeof calibrationSuds === 'number') { completeTreatment('Treatment 1', finalSuds); let impPct: number | null = null; if (calibrationSuds > 0) { const calcImp = ((calibrationSuds - finalSuds) / calibrationSuds) * 100; if (!isNaN(calcImp) && isFinite(calcImp)) impPct = calcImp; } setFinalSudsResult(finalSuds); setImprovementResult(impPct); setShowResultsView(true); toast.success("Treatment 1 complete!"); } else { console.error("T1: Cannot complete: ctx fn/calibrationSuds missing."); toast.error("Error saving results."); } }, [completeTreatment, calibrationSuds]);


  // --- Render Logic ---
  if (isLoadingPrereqs) { return (<div className="flex justify-center items-center min-h-screen">Checking Treatment Prerequisites...</div>); }
  return ( <div className="min-h-screen bg-background text-foreground p-4 md:p-6"> <div className="max-w-3xl mx-auto space-y-8"> <Button variant="ghost" className="mb-6 -ml-4" onClick={() => navigate("/")} disabled={showResultsView}> <ArrowLeft className="w-4 h-4 mr-2" /> Back to Memory Setup </Button> {showResultsView ? ( <div className="text-center ..."> {/* Results View */} </div> ) : ( <> {currentProcessingStep !== null && ( <div className="text-center space-y-2"> <h1 className="text-3xl font-semibold tracking-tight">Treatment 1</h1> <p className="text-muted-foreground">Processing Steps</p> </div> )} {currentProcessingStep !== null && !isLoadingPrereqs && ( <div className="p-3 border rounded-lg bg-muted/30 space-y-2 text-sm"> {/* Memory Reminders */} <p><span className="font-medium text-muted-foreground">Context M1:</span> {memory1?.substring(0, 50)}{memory1?.length > 50 ? '...' : ''}</p><p><span className="font-medium text-muted-foreground">Context M2:</span> {memory2?.substring(0, 50)}{memory2?.length > 50 ? '...' : ''}</p></div> )}

            {/* --- CORRECTED Processing Step Components with Props --- */}
            {currentProcessingStep === 0 && (<PredictionErrorSelection onComplete={handlePredictionErrorsComplete} />)}
            {currentProcessingStep === 1 && (
                <PhaseOne
                    isCurrentPhase={true}
                    response={phase1Response}
                    onResponseChange={setPhase1Response}
                    onComplete={handleStep1Complete}
                />
            )}
            {currentProcessingStep === 2 && (
                <PhaseTwo
                    isCurrentPhase={true}
                    response={phase2Response}
                    onResponseChange={setPhase2Response}
                    onComplete={handleStep2Complete}
                />
            )}
            {currentProcessingStep === 3 && (
                <PhaseThree
                    isCurrentPhase={true}
                    response={phase3Response}
                    onResponseChange={setPhase3Response}
                    onComplete={handleStep3Complete}
                />
            )}
            {currentProcessingStep === 4 && (
                <NarrationPhase
                    isCurrentPhase={true}
                    narrativeScripts={narrativeScripts}
                    // No narrationAudios prop needed
                    // No onNarrationRecorded prop needed
                    onComplete={handleStep4Complete}
                    treatmentNumber={1}
                />
            )}
            {currentProcessingStep === 5 && (
                <PhaseFive
                    isCurrentPhase={true}
                    narrativeScripts={narrativeScripts}
                    memory1={memory1} memory2={memory2} targetEventTranscript={targetEventTranscript}
                    predictionErrors={selectedErrors}
                    onComplete={handleStep5Complete}
                    treatmentNumber={1}
                />
            )}
            {currentProcessingStep === 6 && (
                <PhaseSix
                    isCurrentPhase={true}
                    targetEventTranscript={targetEventTranscript}
                    onComplete={handleStep6Complete}
                    treatmentNumber={1}
                    // No other props needed
                />
            )}
             {/* --- END CORRECTION --- */}
            </> )} </div> </div> );
};
export default Treatment1;