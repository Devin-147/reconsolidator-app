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
  const [narrativeScripts, setNarrativeScripts] = useState<string[]>([]); // State to hold generated scripts
  const [isLoadingPrereqs, setIsLoadingPrereqs] = useState(true);
  const [showResultsView, setShowResultsView] = useState(false);
  const [finalSudsResult, setFinalSudsResult] = useState<number | null>(null);
  const [improvementResult, setImprovementResult] = useState<number | null>(null);

  console.log("Treatment1.tsx - Step:", currentProcessingStep, "Loading:", isLoadingPrereqs);

  // Prerequisite Check Effect (Keep as is)
  useEffect(() => {
    console.log("T1 Prereq Check: Running. memoriesSaved:", memoriesSaved);
    const checkTimeout = setTimeout(() => {
      if (!memoriesSaved) { console.log("T1 Prereq Check: memoriesSaved false. Redirecting to '/'."); toast.error("Please complete memory setup first."); navigate('/'); return; }
      if (!memory1 || !memory2 || !targetEventTranscript || typeof calibrationSuds !== 'number') { console.warn("T1 Prereq Check: data missing. Redirecting to '/'."); toast.error("Memory data/SUDS error. Save setup again."); navigate('/'); return; }
      console.log("T1 Prereq Check: Prerequisites met. Starting step 0."); setIsLoadingPrereqs(false); setCurrentProcessingStep(0);
    }, 150);
    return () => clearTimeout(checkTimeout);
  }, [memoriesSaved, memory1, memory2, targetEventTranscript, calibrationSuds, navigate]);

  // --- Handlers and Effects ---
  const handlePredictionErrorsComplete = useCallback((errors: PredictionError[]) => { if (errors.length !== 11) { toast.error("Select 11 errors."); return; } console.log("T1: PEs selected:", errors.length); setSelectedErrors(errors); setCurrentProcessingStep(1); }, []);
  const generateNarrativeScripts = useCallback(() => { if (!memory1 || !memory2 || !targetEventTranscript || selectedErrors.length !== 11) { console.error("T1: Cannot generate scripts, data missing."); toast.error("Cannot generate: data missing."); return null; } console.log("T1: Generating scripts..."); const scripts = selectedErrors.map((error, index) => { return `Movie ${index + 1}: Memory 1 + Target Event + Prediction Error ${index + 1} + Memory 2\n\nI am in a projection booth...\n\n${memory1}\n\nThe scene fades and the screen shows a time when\n\nThe next scene...${targetEventTranscript}. However, ${error.description}\n\n I see myself in the seated in the movie theatre surprised and delighted at this scene.\n\nAnd then fades...\n\n${memory2}`; }); console.log("T1: Scripts generated:", scripts.length); setNarrativeScripts(scripts); return scripts; }, [memory1, memory2, targetEventTranscript, selectedErrors]);
  // Effect to generate scripts specifically when entering step 4
  useEffect(() => { if (currentProcessingStep === 4) { generateNarrativeScripts(); } }, [currentProcessingStep, generateNarrativeScripts]);
  const handleStep1Complete = useCallback(() => setCurrentProcessingStep(2), []);
  const handleStep2Complete = useCallback(() => setCurrentProcessingStep(3), []);
  const handleStep3Complete = useCallback(() => setCurrentProcessingStep(4), []);
  const handleStep4Complete = useCallback(() => setCurrentProcessingStep(5), []); // Narration complete
  const handleStep5Complete = useCallback(() => setCurrentProcessingStep(6), []); // Playback complete
  const handleNarrationRecorded = useCallback((index: number, audioUrl: string | null) => { if (updateNarrationAudio) updateNarrationAudio(index, audioUrl); else console.error("T1: updateNarrationAudio missing."); }, [updateNarrationAudio]);
  const handleStep6Complete = useCallback((finalSuds: number) => { if (completeTreatment && typeof calibrationSuds === 'number') { completeTreatment('Treatment 1', finalSuds); let impPct: number | null = null; if (calibrationSuds > 0) { const calcImp = ((calibrationSuds - finalSuds) / calibrationSuds) * 100; if (!isNaN(calcImp) && isFinite(calcImp)) impPct = calcImp; else console.warn("T1: Imp % NaN/Infinite."); } else console.warn("T1: Cannot calc imp, calibrationSuds missing/0."); setFinalSudsResult(finalSuds); setImprovementResult(impPct); setShowResultsView(true); toast.success("Treatment 1 complete!"); } else { console.error("T1: Cannot complete: ctx fn/calibrationSuds missing."); toast.error("Error saving results."); } }, [completeTreatment, calibrationSuds]);


  // Render Logic
  if (isLoadingPrereqs) { return (<div className="flex justify-center items-center min-h-screen">Checking Treatment Prerequisites...</div>); }
  return ( <div className="min-h-screen bg-background p-6"> <Button variant="ghost" className="mb-6" onClick={() => navigate("/")} disabled={showResultsView}> <ArrowLeft className="w-4 h-4 mr-2" /> Back to Memory Setup </Button> <div className="max-w-3xl mx-auto space-y-8"> {showResultsView ? ( <div className="text-center space-y-4 p-6 bg-card border border-border rounded-lg shadow-lg animate-container-appear"> {/* Results View */} <h2 className="text-2xl font-semibold text-primary">Treatment 1 Complete!</h2> {/* ... Results details ... */} <Button size="lg" onClick={() => navigate('/upgrade', { state: { /* ... */ } })} className="mt-2"> Unlock All Treatments </Button> <Button variant="link" size="sm" className="mt-4 block mx-auto text-muted-foreground" onClick={() => navigate('/')}> Maybe Later </Button> </div> ) : ( <> {currentProcessingStep !== null && ( <div className="text-center space-y-2"> <h1 className="text-3xl font-semibold tracking-tight">Treatment 1</h1> <p className="text-muted-foreground">Processing Steps</p> </div> )}
            {/* Step 0: Prediction Error Selection */}
            {currentProcessingStep === 0 && (<PredictionErrorSelection onComplete={handlePredictionErrorsComplete} />)}
            {/* Step 1: PhaseOne */}
            {currentProcessingStep === 1 && (<PhaseOne isCurrentPhase={true} response={phase1Response} onResponseChange={setPhase1Response} onComplete={handleStep1Complete} />)}
            {/* Step 2: PhaseTwo */}
            {currentProcessingStep === 2 && (<PhaseTwo isCurrentPhase={true} response={phase2Response} onResponseChange={setPhase2Response} onComplete={handleStep2Complete} />)}
            {/* Step 3: PhaseThree */}
            {currentProcessingStep === 3 && (<PhaseThree isCurrentPhase={true} response={phase3Response} onResponseChange={setPhase3Response} onComplete={handleStep3Complete} />)}

            {/* --- Step 4: NarrationPhase (Requires narrativeScripts) --- */}
            {currentProcessingStep === 4 && (
                <NarrationPhase
                    isCurrentPhase={true}
                    narrativeScripts={narrativeScripts} // <<< RESTORED/KEPT
                    narrationAudios={narrationAudios?.filter((audio): audio is string => audio !== null) || []}
                    onNarrationRecorded={handleNarrationRecorded}
                    onComplete={handleStep4Complete}
                    treatmentNumber={1}
                />
            )}
            {/* --- END Step 4 --- */}

            {/* --- Step 5: PhaseFive (Requires narrativeScripts, memories, errors) --- */}
            {currentProcessingStep === 5 && (
                <PhaseFive
                    isCurrentPhase={true}
                    narrativeScripts={narrativeScripts} // <<< RESTORED/KEPT
                    memory1={memory1}                   // <<< RESTORED/KEPT
                    memory2={memory2}                   // <<< RESTORED/KEPT
                    targetEventTranscript={targetEventTranscript} // <<< RESTORED/KEPT
                    predictionErrors={selectedErrors}     // <<< RESTORED/KEPT
                    onComplete={handleStep5Complete}
                    treatmentNumber={1}
                />
            )}
             {/* --- END Step 5 --- */}

            {/* --- Step 6: PhaseSix (Only needs target transcript for display) --- */}
            {currentProcessingStep === 6 && (
                <PhaseSix
                    isCurrentPhase={true}
                    targetEventTranscript={targetEventTranscript} // Keep for display reference
                    onComplete={handleStep6Complete}
                    treatmentNumber={1}
                    // Removed other unnecessary props
                />
            )}
             {/* --- END Step 6 --- */}
            </> )} </div> </div> );
};
export default Treatment1;