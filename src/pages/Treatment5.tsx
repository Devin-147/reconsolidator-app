// src/pages/Treatment5.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRecording } from "@/contexts/RecordingContext"; // Import context hook
import { PredictionErrorSelection } from "@/components/treatment/PredictionErrorSelection";
import { PhaseOne } from "@/components/treatment/PhaseOne";
import { PhaseTwo } from "@/components/treatment/PhaseTwo";
import { PhaseThree } from "@/components/treatment/PhaseThree";
import { NarrationPhase } from "@/components/treatment/NarrationPhase";
import { PhaseFive } from "@/components/treatment/PhaseFive";
import { type PredictionError } from "@/components/PredictionErrorSelector";
import { PhaseSix } from "@/components/treatment/PhaseSix"; // Adjust path if needed

const Treatment5 = () => {
  const navigate = useNavigate();
  const {
    // Get necessary state from context
    memory1,
    memory2,
    targetEventTranscript,
    calibrationSuds, // Needed for completeTreatment calculation
    memoriesSaved,     // Needed for prerequisite check
    narrationAudios,
    updateNarrationAudio,
    completeTreatment, // Function to call on completion
    // Removed sudsLevel
  } = useRecording();

  // State specific to this treatment page's flow
  const [selectedErrors, setSelectedErrors] = useState<PredictionError[]>([]);
  const [phase1Response, setPhase1Response] = useState("");
  const [phase2Response, setPhase2Response] = useState("");
  const [phase3Response, setPhase3Response] = useState("");
  const [currentProcessingStep, setCurrentProcessingStep] = useState<number | null>(null); // Start null
  const [narrativeScripts, setNarrativeScripts] = useState<string[]>([]);
  const [isLoadingPrereqs, setIsLoadingPrereqs] = useState(true); // Loading state
  const [showResultsView, setShowResultsView] = useState(false); // State for results view
  const [finalSudsResult, setFinalSudsResult] = useState<number | null>(null); // For results view
  const [improvementResult, setImprovementResult] = useState<number | null>(null); // For results view
  // Removed local state for memories/target

  console.log("Treatment5.tsx - Step:", currentProcessingStep, "Loading:", isLoadingPrereqs);

  // --- Corrected Prerequisite Check Effect ---
  useEffect(() => {
    console.log("T5 Prereq Check: Running. memoriesSaved:", memoriesSaved);
    const checkTimeout = setTimeout(() => {
      if (!memoriesSaved) {
        console.log("T5 Prereq Check: memoriesSaved is false. Redirecting to '/'.");
        toast.error("Please complete the memory setup first.");
        navigate('/'); // Redirect back to setup page
        return;
      }
      if (!memory1 || !memory2 || !targetEventTranscript || typeof calibrationSuds !== 'number') {
        console.warn("T5 Prereq Check: memoriesSaved true, but required data missing. Redirecting to '/'.");
        toast.error("Memory data or initial SUDS error. Please save setup again.");
        navigate('/'); // Redirect back to setup page
        return;
      }
      console.log("T5 Prereq Check: Prerequisites met. Starting processing steps.");
      setIsLoadingPrereqs(false);
      setCurrentProcessingStep(0); // Start first processing step for T5
    }, 150); // Short delay
    return () => clearTimeout(checkTimeout);
  }, [memoriesSaved, memory1, memory2, targetEventTranscript, calibrationSuds, navigate]); // Correct dependencies


  // --- Handlers and Effects for Processing Steps ---
  const handlePredictionErrorsComplete = useCallback((errors: PredictionError[]) => { if (errors.length !== 11) { toast.error("Select 11 errors."); return; } console.log("T5: PEs selected:", errors.length); setSelectedErrors(errors); setCurrentProcessingStep(1); }, []);
  const generateNarrativeScripts = useCallback(() => { if (!memory1 || !memory2 || !targetEventTranscript || selectedErrors.length !== 11) { console.error("T5: Cannot generate scripts, data missing."); toast.error("Cannot generate: data missing."); return null; } console.log("T5: Generating scripts..."); const scripts = selectedErrors.map((error, index) => { /* ... template ... */ return `Movie ${index + 1}: ...`; }); console.log("T5: Scripts generated:", scripts.length); setNarrativeScripts(scripts); return scripts; }, [memory1, memory2, targetEventTranscript, selectedErrors]);
  useEffect(() => { if (currentProcessingStep === 4) { generateNarrativeScripts(); } }, [currentProcessingStep, generateNarrativeScripts]);
  const handleStep1Complete = useCallback(() => setCurrentProcessingStep(2), []);
  const handleStep2Complete = useCallback(() => setCurrentProcessingStep(3), []);
  const handleStep3Complete = useCallback(() => setCurrentProcessingStep(4), []);
  const handleStep4Complete = useCallback(() => setCurrentProcessingStep(5), []);
  const handleStep5Complete = useCallback(() => setCurrentProcessingStep(6), []);
  const handleNarrationRecorded = useCallback((index: number, audioUrl: string | null) => { if (updateNarrationAudio) updateNarrationAudio(index, audioUrl); else console.error("T5: updateNarrationAudio missing."); }, [updateNarrationAudio]);

  // --- Corrected Handler for Step 6 Completion ---
  const handleStep6Complete = useCallback((finalSuds: number) => { // Receives finalSuds from PhaseSix
      if (completeTreatment && typeof calibrationSuds === 'number') {
          completeTreatment('Treatment 5', finalSuds); // <<< USE finalSuds ARGUMENT
          toast.success("Treatment 5 complete! View Follow-up instructions or return home.");
          // Decide where to navigate - maybe a specific results/completion page? Or FollowUp?
          // For now, navigate home, assuming FollowUp might be accessed separately later.
          setShowResultsView(true); // Show a results summary on *this* page instead of navigating immediately
          // navigate("/follow-up"); // Or navigate directly
      } else { console.error("T5: Cannot complete: ctx fn/calibrationSuds missing."); toast.error("Error saving results."); }
  }, [completeTreatment, calibrationSuds, navigate]); // Added navigate


  // --- Render Logic ---
  if (isLoadingPrereqs) { return (<div className="flex justify-center items-center min-h-screen">Checking Treatment Prerequisites...</div>); }

  return (
    <div className="min-h-screen bg-background p-6">
      <Button variant="ghost" className="mb-6" onClick={() => navigate("/")} disabled={showResultsView}> <ArrowLeft className="w-4 h-4 mr-2" /> Back to Memory Setup </Button>
      <div className="max-w-3xl mx-auto space-y-8">
         {/* Conditionally show results or processing steps */}
         {showResultsView ? (
            // --- Simple Results/Next Steps View ---
            <div className="text-center space-y-4 p-6 bg-card border border-border rounded-lg shadow-lg animate-container-appear">
                <h2 className="text-2xl font-semibold text-primary">Treatment 5 Complete!</h2>
                 {finalSudsResult !== null && ( <p className="text-lg">Your final SUDS score for this session: <span className="font-bold">{finalSudsResult}</span></p> )}
                 {improvementResult !== null ? (
                   <p className={`text-lg font-semibold ${improvementResult > 0 ? 'text-green-500' : improvementResult < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                     Distress Reduction this session: {improvementResult.toFixed(0)}% {improvementResult > 0 ? ' Improvement' : improvementResult < 0 ? ' Increase' : ' (No Change)'}
                   </p>
                 ) : ( <p className="text-sm text-muted-foreground">(Could not calculate change for this session)</p> )}
                 <p className="mt-4 text-muted-foreground">You have completed the core treatments. Please proceed to the Follow-Up instructions when ready (typically after 6 weeks).</p>
                 <Button size="lg" onClick={() => navigate('/follow-up')} className="mt-2"> Go to Follow-Up </Button>
                 <Button variant="link" size="sm" className="mt-4 block mx-auto text-muted-foreground" onClick={() => navigate('/')}> Return Home </Button>
            </div>
         ) : (
            // --- Processing Steps View ---
            <>
              {currentProcessingStep !== null && (
                <div className="text-center space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight">Treatment 5</h1>
                  <p className="text-muted-foreground">Two nights after Treatment 4</p> {/* Update description */}
                </div>
              )}
              {/* Render component based on currentProcessingStep */}
              {currentProcessingStep === 0 && (<PredictionErrorSelection onComplete={handlePredictionErrorsComplete} />)}
              {currentProcessingStep === 1 && (<PhaseOne isCurrentPhase={true} response={phase1Response} onResponseChange={setPhase1Response} onComplete={handleStep1Complete} />)}
              {currentProcessingStep === 2 && (<PhaseTwo isCurrentPhase={true} response={phase2Response} onResponseChange={setPhase2Response} onComplete={handleStep2Complete} />)}
              {currentProcessingStep === 3 && (<PhaseThree isCurrentPhase={true} response={phase3Response} onResponseChange={setPhase3Response} onComplete={handleStep3Complete} />)}
              {currentProcessingStep === 4 && (<NarrationPhase isCurrentPhase={true} narrativeScripts={narrativeScripts} narrationAudios={narrationAudios?.filter(a=>a!==null) as string[]} onNarrationRecorded={handleNarrationRecorded} onComplete={handleStep4Complete} treatmentNumber={5}/>)}
              {currentProcessingStep === 5 && (<PhaseFive isCurrentPhase={true} narrativeScripts={narrativeScripts} memory1={memory1} memory2={memory2} targetEventTranscript={targetEventTranscript} predictionErrors={selectedErrors} onComplete={handleStep5Complete} treatmentNumber={5}/>)}
              {/* --- Corrected PhaseSix Usage --- */}
              {currentProcessingStep === 6 && (
                  <PhaseSix
                      isCurrentPhase={true}
                      targetEventTranscript={targetEventTranscript} // Keep
                      onComplete={handleStep6Complete} // Keep
                      treatmentNumber={5} // Keep (Set correct number)
                      // Removed unnecessary props
                  />
              )}
               {/* --- END Corrected PhaseSix --- */}
            </>
         )}
      </div>
    </div>
  );
};

export default Treatment5;