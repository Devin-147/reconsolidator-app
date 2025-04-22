// src/pages/Treatment4.tsx
import React, { useState, useEffect, useCallback } from "react"; // Added React, useCallback
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

const Treatment4 = () => {
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
  const [phase1Response, setPhase1Response] = useState(""); // Keep if PhaseOne uses it
  const [phase2Response, setPhase2Response] = useState(""); // Keep if PhaseTwo uses it
  const [phase3Response, setPhase3Response] = useState(""); // Keep if PhaseThree uses it
  const [currentProcessingStep, setCurrentProcessingStep] = useState<number | null>(null); // Start null
  const [narrativeScripts, setNarrativeScripts] = useState<string[]>([]);
  const [isLoadingPrereqs, setIsLoadingPrereqs] = useState(true); // Loading state
  const [showResultsView, setShowResultsView] = useState(false); // State for showing results (if applicable here)
  // Removed local state for memories/target, rely on context

  console.log("Treatment4.tsx - Step:", currentProcessingStep, "Loading:", isLoadingPrereqs);

  // --- Corrected Prerequisite Check Effect ---
  // Matches the logic in Treatment1.tsx
  useEffect(() => {
    console.log("T4 Prereq Check: Running. memoriesSaved:", memoriesSaved);
    const checkTimeout = setTimeout(() => {
      if (!memoriesSaved) {
        console.log("T4 Prereq Check: memoriesSaved is false. Redirecting to '/'.");
        toast.error("Please complete the memory setup first.");
        navigate('/'); // Redirect back to setup page
        return;
      }
      // Also check if core data exists in context
      if (!memory1 || !memory2 || !targetEventTranscript || typeof calibrationSuds !== 'number') {
        console.warn("T4 Prereq Check: memoriesSaved true, but required data missing. Redirecting to '/'.");
        toast.error("Memory data or initial SUDS error. Please save setup again.");
        navigate('/'); // Redirect back to setup page
        return;
      }
      console.log("T4 Prereq Check: Prerequisites met. Starting processing steps.");
      setIsLoadingPrereqs(false);
      setCurrentProcessingStep(0); // Start first processing step for T4
    }, 150); // Short delay
    return () => clearTimeout(checkTimeout);
  }, [memoriesSaved, memory1, memory2, targetEventTranscript, calibrationSuds, navigate]); // Correct dependencies


  // --- Handlers and Effects for Processing Steps ---
  const handlePredictionErrorsComplete = useCallback((errors: PredictionError[]) => { if (errors.length !== 11) { toast.error("Select 11 errors."); return; } console.log("T4: PEs selected:", errors.length); setSelectedErrors(errors); setCurrentProcessingStep(1); }, []);
  const generateNarrativeScripts = useCallback(() => { if (!memory1 || !memory2 || !targetEventTranscript || selectedErrors.length !== 11) { console.error("T4: Cannot generate scripts, data missing."); toast.error("Cannot generate: data missing."); return null; } console.log("T4: Generating scripts..."); const scripts = selectedErrors.map((error, index) => { /* ... template ... */ return `Movie ${index + 1}: ...`; }); console.log("T4: Scripts generated:", scripts.length); setNarrativeScripts(scripts); return scripts; }, [memory1, memory2, targetEventTranscript, selectedErrors]);
  useEffect(() => { if (currentProcessingStep === 4) { generateNarrativeScripts(); } }, [currentProcessingStep, generateNarrativeScripts]);
  const handleStep1Complete = useCallback(() => setCurrentProcessingStep(2), []);
  const handleStep2Complete = useCallback(() => setCurrentProcessingStep(3), []);
  const handleStep3Complete = useCallback(() => setCurrentProcessingStep(4), []);
  const handleStep4Complete = useCallback(() => setCurrentProcessingStep(5), []);
  const handleStep5Complete = useCallback(() => setCurrentProcessingStep(6), []);
  const handleNarrationRecorded = useCallback((index: number, audioUrl: string | null) => { if (updateNarrationAudio) updateNarrationAudio(index, audioUrl); else console.error("T4: updateNarrationAudio missing."); }, [updateNarrationAudio]);

  // --- Corrected Handler for Step 6 Completion ---
  const handleStep6Complete = useCallback((finalSuds: number) => { // Receives finalSuds from PhaseSix
      if (completeTreatment && typeof calibrationSuds === 'number') {
          // Calls the context function with correct treatment name and final SUDS
          completeTreatment('Treatment 4', finalSuds); // <<< USE finalSuds ARGUMENT
          toast.success("Treatment 4 complete!");
          // Decide where to navigate after completion
          navigate("/"); // Navigate back to setup page for next treatment? Or to a dashboard?
          // Or maybe setShowResultsView(true); if showing results on this page
      } else { console.error("T4: Cannot complete: ctx fn/calibrationSuds missing."); toast.error("Error saving results."); }
  }, [completeTreatment, calibrationSuds, navigate]); // Added navigate to dependencies

  // Removed redundant handleSave function


  // --- Render Logic ---
  if (isLoadingPrereqs) { return (<div className="flex justify-center items-center min-h-screen">Checking Treatment Prerequisites...</div>); }

  // Potentially show results view if implemented for T2-5
  // if (showResultsView) { return ( <div>Treatment 4 Results...</div> ); }

  return (
    <div className="min-h-screen bg-background p-6">
      <Button variant="ghost" className="mb-6" onClick={() => navigate("/")}> <ArrowLeft className="w-4 h-4 mr-2" /> Back to Memory Setup </Button>
      <div className="max-w-3xl mx-auto space-y-8">
         {/* Render only if not showing results and loading is done */}
         {!showResultsView && currentProcessingStep !== null && (
            <>
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight">Treatment 4</h1>
                <p className="text-muted-foreground">Two nights after Treatment 3</p> {/* Update description */}
              </div>

              {/* Render component based on currentProcessingStep */}
              {currentProcessingStep === 0 && (<PredictionErrorSelection onComplete={handlePredictionErrorsComplete} />)}
              {currentProcessingStep === 1 && (<PhaseOne isCurrentPhase={true} response={phase1Response} onResponseChange={setPhase1Response} onComplete={handleStep1Complete} />)}
              {currentProcessingStep === 2 && (<PhaseTwo isCurrentPhase={true} response={phase2Response} onResponseChange={setPhase2Response} onComplete={handleStep2Complete} />)}
              {currentProcessingStep === 3 && (<PhaseThree isCurrentPhase={true} response={phase3Response} onResponseChange={setPhase3Response} onComplete={handleStep3Complete} />)}
              {currentProcessingStep === 4 && (<NarrationPhase isCurrentPhase={true} narrativeScripts={narrativeScripts} narrationAudios={narrationAudios?.filter(a=>a!==null) as string[]} onNarrationRecorded={handleNarrationRecorded} onComplete={handleStep4Complete} treatmentNumber={4}/>)}
              {currentProcessingStep === 5 && (<PhaseFive isCurrentPhase={true} narrativeScripts={narrativeScripts} memory1={memory1} memory2={memory2} targetEventTranscript={targetEventTranscript} predictionErrors={selectedErrors} onComplete={handleStep5Complete} treatmentNumber={4}/>)}

              {/* --- Corrected PhaseSix Usage --- */}
              {currentProcessingStep === 6 && (
                  <PhaseSix
                      isCurrentPhase={true}
                      targetEventTranscript={targetEventTranscript} // Keep
                      onComplete={handleStep6Complete} // Keep
                      treatmentNumber={4} // Keep (Set correct number)
                      // Removed unnecessary props
                  />
              )}
               {/* --- END Corrected PhaseSix --- */}
            </>
         )}
         {/* Add Results View JSX here if needed */}
         {/* {showResultsView && ( <div> ... Results ... </div> )} */}
      </div>
    </div>
  );
};

export default Treatment4;