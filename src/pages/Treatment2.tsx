// src/pages/Treatment2.tsx
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

const Treatment2 = () => {
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
  // Removed local state for memories/target

  console.log("Treatment2.tsx - Step:", currentProcessingStep, "Loading:", isLoadingPrereqs);

  // --- Corrected Prerequisite Check Effect ---
  useEffect(() => {
    console.log("T2 Prereq Check: Running. memoriesSaved:", memoriesSaved);
    const checkTimeout = setTimeout(() => {
      if (!memoriesSaved) {
        console.log("T2 Prereq Check: memoriesSaved is false. Redirecting to '/'.");
        toast.error("Please complete the memory setup first.");
        navigate('/'); // Redirect back to setup page
        return;
      }
      if (!memory1 || !memory2 || !targetEventTranscript || typeof calibrationSuds !== 'number') {
        console.warn("T2 Prereq Check: memoriesSaved true, but required data missing. Redirecting to '/'.");
        toast.error("Memory data or initial SUDS error. Please save setup again.");
        navigate('/'); // Redirect back to setup page
        return;
      }
      console.log("T2 Prereq Check: Prerequisites met. Starting processing steps.");
      setIsLoadingPrereqs(false);
      setCurrentProcessingStep(0); // Start first processing step for T2
    }, 150); // Short delay
    return () => clearTimeout(checkTimeout);
  }, [memoriesSaved, memory1, memory2, targetEventTranscript, calibrationSuds, navigate]); // Correct dependencies


  // --- Handlers and Effects for Processing Steps ---
  const handlePredictionErrorsComplete = useCallback((errors: PredictionError[]) => { if (errors.length !== 11) { toast.error("Select 11 errors."); return; } console.log("T2: PEs selected:", errors.length); setSelectedErrors(errors); setCurrentProcessingStep(1); }, []);
  const generateNarrativeScripts = useCallback(() => { if (!memory1 || !memory2 || !targetEventTranscript || selectedErrors.length !== 11) { console.error("T2: Cannot generate scripts, data missing."); toast.error("Cannot generate: data missing."); return null; } console.log("T2: Generating scripts..."); const scripts = selectedErrors.map((error, index) => { /* ... template ... */ return `Movie ${index + 1}: ...`; }); console.log("T2: Scripts generated:", scripts.length); setNarrativeScripts(scripts); return scripts; }, [memory1, memory2, targetEventTranscript, selectedErrors]);
  useEffect(() => { if (currentProcessingStep === 4) { generateNarrativeScripts(); } }, [currentProcessingStep, generateNarrativeScripts]);
  const handleStep1Complete = useCallback(() => setCurrentProcessingStep(2), []);
  const handleStep2Complete = useCallback(() => setCurrentProcessingStep(3), []);
  const handleStep3Complete = useCallback(() => setCurrentProcessingStep(4), []);
  const handleStep4Complete = useCallback(() => setCurrentProcessingStep(5), []);
  const handleStep5Complete = useCallback(() => setCurrentProcessingStep(6), []);
  const handleNarrationRecorded = useCallback((index: number, audioUrl: string | null) => { if (updateNarrationAudio) updateNarrationAudio(index, audioUrl); else console.error("T2: updateNarrationAudio missing."); }, [updateNarrationAudio]);

  // --- Corrected Handler for Step 6 Completion ---
  const handleStep6Complete = useCallback((finalSuds: number) => { // Receives finalSuds
      if (completeTreatment && typeof calibrationSuds === 'number') {
          completeTreatment('Treatment 2', finalSuds); // <<< USE finalSuds ARGUMENT
          toast.success("Treatment 2 complete!");
          // Optional: Show results or navigate
          // setShowResultsView(true);
          navigate("/"); // Navigate home for now
      } else { console.error("T2: Cannot complete: ctx fn/calibrationSuds missing."); toast.error("Error saving results."); }
  }, [completeTreatment, calibrationSuds, navigate]); // Added navigate


  // --- Render Logic ---
  if (isLoadingPrereqs) { return (<div className="flex justify-center items-center min-h-screen">Checking Treatment Prerequisites...</div>); }

  return (
    <div className="min-h-screen bg-background p-6">
      <Button variant="ghost" className="mb-6" onClick={() => navigate("/")}> <ArrowLeft className="w-4 h-4 mr-2" /> Back to Memory Setup </Button>
      <div className="max-w-3xl mx-auto space-y-8">
         {/* Add Results View logic here if T2-5 show results */}
         {showResultsView ? (
             <div>Treatment 2 Results...</div>
         ) : (
            // --- Processing Steps View ---
            <>
              {currentProcessingStep !== null && (
                <div className="text-center space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight">Treatment 2</h1>
                  <p className="text-muted-foreground">Two nights after Treatment 1</p> {/* Update description */}
                </div>
              )}
              {/* Render component based on currentProcessingStep */}
              {currentProcessingStep === 0 && (<PredictionErrorSelection onComplete={handlePredictionErrorsComplete} />)}
              {currentProcessingStep === 1 && (<PhaseOne isCurrentPhase={true} response={phase1Response} onResponseChange={setPhase1Response} onComplete={handleStep1Complete} />)}
              {currentProcessingStep === 2 && (<PhaseTwo isCurrentPhase={true} response={phase2Response} onResponseChange={setPhase2Response} onComplete={handleStep2Complete} />)}
              {currentProcessingStep === 3 && (<PhaseThree isCurrentPhase={true} response={phase3Response} onResponseChange={setPhase3Response} onComplete={handleStep3Complete} />)}
              {currentProcessingStep === 5 && (<PhaseFive isCurrentPhase={true} narrativeScripts={narrativeScripts} memory1={memory1} memory2={memory2} targetEventTranscript={targetEventTranscript} predictionErrors={selectedErrors} onComplete={handleStep5Complete} treatmentNumber={2}/>)}

              {/* --- Corrected PhaseSix Usage --- */}
              {currentProcessingStep === 6 && (
                  <PhaseSix
                      isCurrentPhase={true}
                      targetEventTranscript={targetEventTranscript} // Keep
                      onComplete={handleStep6Complete} // Keep
                      treatmentNumber={2} // Keep (Set correct number)
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

export default Treatment2;