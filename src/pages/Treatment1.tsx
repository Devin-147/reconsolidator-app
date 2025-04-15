// src/pages/Treatment1.tsx
import React, { useState, useEffect } from "react"; // Import React
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
import { PhaseSix } from "@/components/treatment/PhaseSix";
import { supabase } from '../supabaseClient';
// Import TreatmentResult type if needed for state
import { TreatmentResult } from "@/types/recording"; // Adjust path if needed

const Treatment1 = () => {
  const navigate = useNavigate();
  const {
    memory1,
    memory2,
    // videoBlob, // videoBlob seems unused in this component's logic after recording
    targetEventTranscript,
    // sudsLevel, // Initial SUDS likely comes from calibrationSuds now
    calibrationSuds, // Assuming this holds the SUDS before Treatment 1
    memoriesSaved,
    narrationAudios,
    updateNarrationAudio,
    completeTreatment, // Assuming this updates context/state
    // Ensure completeTreatment is actually available from useRecording
  } = useRecording();

  // State for component logic
  const [selectedErrors, setSelectedErrors] = useState<PredictionError[]>([]);
  const [phase1Response, setPhase1Response] = useState("");
  const [phase2Response, setPhase2Response] = useState("");
  const [phase3Response, setPhase3Response] = useState("");
  const [currentPhase, setCurrentPhase] = useState(0); // Start at 0 (Prediction Error Selection)
  const [narrativeScripts, setNarrativeScripts] = useState<string[]>([]);

  // State for local storage fallback
  const [localMemory1, setLocalMemory1] = useState("");
  const [localMemory2, setLocalMemory2] = useState("");
  const [localTargetEvent, setLocalTargetEvent] = useState("");

  // --- ADDED State for Results View ---
  const [showResultsView, setShowResultsView] = useState(false);
  const [finalSudsResult, setFinalSudsResult] = useState<number | null>(null);
  const [improvementResult, setImprovementResult] = useState<number | null>(null);
  // --- END ADDED State ---

  console.log("Current Phase:", currentPhase);

  // --- Load from localStorage effect (Consider doing this in Context Provider) ---
 useEffect(() => {
  const hasAccess = localStorage.getItem('reconsolidator_access_granted') === 'true';

  if (!hasAccess) {
    // Fallback: Check Supabase for access
    const checkAccess = async () => {
      const { data, error } = await supabase
        .from('user_payments') // Replace with your table name
        .select('has_access')
        .eq('email', localStorage.getItem('reconsolidator_user_email'));

      if (error || !data || !data[0]?.has_access) {
        navigate('/'); // Redirect if no access
      }
    };

    checkAccess();
  }
}, [navigate]);

  // --- Check prerequisites effect ---
  useEffect(() => {
    const effectiveMemory1 = memory1 || localMemory1;
    const effectiveMemory2 = memory2 || localMemory2;
    const effectiveTargetEvent = targetEventTranscript || localTargetEvent;

    // Check context flag first, then localStorage as fallback? Ensure consistency
    const isSaved = memoriesSaved; // Rely on context 'memoriesSaved' flag

    if (!effectiveMemory1 || !effectiveMemory2 || !effectiveTargetEvent || !isSaved) {
      // Only navigate away if memories truly aren't available/saved according to context
      if (!isSaved) {
         toast.error("Please record memories and target event on the main page first.");
         navigate("/");
      } else {
          // Data might exist in context but not locally yet, let it load
          console.log("T1: Waiting for memory data from context or localStorage...");
      }
    } else {
      console.log("T1: Memories and target event ready.");
      setCurrentPhase(0); // Start phase progression
    }
    // Carefully consider dependencies based on how state is managed (context vs local)
  }, [memory1, memory2, targetEventTranscript, localMemory1, localMemory2, localTargetEvent, navigate, memoriesSaved]);


  const handlePredictionErrorsComplete = (errors: PredictionError[]) => {
    // Add validation if needed (e.g., exactly 11 errors)
    if (errors.length !== 11) {
        toast.error("Please select exactly 11 prediction errors.");
        return; // Don't proceed
    }
    console.log("T1: Selected prediction errors:", errors.length);
    setSelectedErrors(errors);
    setCurrentPhase(1); // Move to Phase One
  };

  // --- generateNarrativeScripts ---
  const generateNarrativeScripts = () => {
    if (!selectedErrors || selectedErrors.length !== 11) {
      console.log("T1: Cannot generate scripts - not enough errors:", selectedErrors?.length);
       toast.error("Cannot generate scripts: 11 prediction errors required.");
      return; // Stop if errors aren't ready
    }

    const memory1Text = memory1 || localMemory1 || "No Memory 1 Available";
    const memory2Text = memory2 || localMemory2 || "No Memory 2 Available";
    const targetEventDescription = targetEventTranscript || localTargetEvent || "the target event";

    console.log("T1: Generating narrative scripts...");

    // Using your exact script template
    const scripts = selectedErrors.map((error, index) => {
            return `Movie ${index + 1}: Memory 1 + Target Event + Prediction Error ${index + 1} + Memory 2

I am in a projection booth of a movie theatre and from the booth, I also see myself seated in one of the plush movie seats. I see myself watching a movie. The movie scene starts by showing me in the following situation:

${memory1Text}

I smile from the projection booth when seeing this part of the movie and I notice that the other me seated in the plush movie seat is watching this scene and smiling also.

The next scene in this movie cuts to me experiencing ${targetEventDescription}. However, in this version, something different happens: ${error.description}

I see the version of me in the movie seat is surprised and delighted at this scene.

And then fades into a new scene. There I am again but this time:

${memory2Text}`;
    });

    console.log("T1: Generated narrative scripts:", scripts.length);
    setNarrativeScripts(scripts);
  };

  // Generate scripts when Phase 4 starts and errors are ready
  useEffect(() => {
    if (currentPhase === 4 && selectedErrors?.length === 11) {
      generateNarrativeScripts();
    }
     // Clear scripts if phase changes away from 4? Optional cleanup.
     // if (currentPhase !== 4) setNarrativeScripts([]);
  }, [currentPhase, selectedErrors]); // Dependencies seem correct


  // Removed unused handleSave function

  const handleNarrationRecorded = (index: number, audioUrl: string) => {
    if (updateNarrationAudio) {
      updateNarrationAudio(index, audioUrl);
    } else {
        console.error("T1: updateNarrationAudio function is not available in context.");
    }
  };

  // Advance phase after Narration is complete
  const handlePhase4Complete = () => {
     // Optional check: ensure all narrations recorded?
     // const recordedCount = narrationAudios?.filter(a => !!a).length || 0;
     // if (recordedCount < 11) { toast.error(...) return; }
     setCurrentPhase(5); // Move to Phase Five
  };

  // Advance phase after Phase Five is complete
  const handlePhase5Complete = () => {
    setCurrentPhase(6); // Move to Phase Six
  };

  // --- MODIFIED: Handle Phase Six Completion ---
  const handlePhase6Complete = (finalSuds: number) => {
    // Ensure context functions/values are available
    if (completeTreatment && typeof calibrationSuds === 'number') {
        // 1. Mark treatment as complete in context/state
        completeTreatment('Treatment 1', finalSuds);

        // 2. Calculate improvement percentage
        let improvementPercentage: number | null = null;
        if (calibrationSuds > 0) { // Avoid division by zero
            const calculatedImprovement = ((calibrationSuds - finalSuds) / calibrationSuds) * 100;
            // Ensure result is a valid number
            if (!isNaN(calculatedImprovement) && isFinite(calculatedImprovement)) {
                improvementPercentage = calculatedImprovement;
            } else {
                 console.warn("T1: Calculated improvement percentage is NaN or Infinite.");
            }
        } else {
            console.warn("T1: Cannot calculate improvement, calibrationSuds is 0 or undefined.");
        }

        // 3. Update local state to show results view
        setFinalSudsResult(finalSuds);
        setImprovementResult(improvementPercentage);
        setShowResultsView(true); // <<<--- Trigger results display

        toast.success("Treatment 1 complete! Review your results below.");

    } else {
         console.error("T1: Cannot complete treatment - completeTreatment function or calibrationSuds missing from context.");
         toast.error("Error saving treatment results. Please try again or contact support.");
         // Optionally navigate away on critical error
         // navigate("/");
    }
  };
  // --- END MODIFICATION ---

  // --- Get effective memory/event values for props ---
  const effectiveMemory1 = memory1 || localMemory1;
  const effectiveMemory2 = memory2 || localMemory2;
  const effectiveTargetEvent = targetEventTranscript || localTargetEvent;


  return (
    <div className="min-h-screen bg-background p-6">
      {/* Keep Back Button consistent */}
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate("/")}
        disabled={showResultsView} // Optionally disable when showing results
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Main
      </Button>

      <div className="max-w-3xl mx-auto space-y-8">
        {/* --- Conditional Rendering: Results View OR Treatment Phases --- */}
        {showResultsView ? (
          // --- RESULTS / UPGRADE VIEW ---
          <div className="text-center space-y-4 p-6 bg-card border border-border rounded-lg shadow-lg animate-container-appear"> {/* Added animation */}
            <h2 className="text-2xl font-semibold text-primary">Treatment 1 Complete!</h2>
            {finalSudsResult !== null && (
               <p className="text-lg">Your final SUDS score: <span className="font-bold">{finalSudsResult}</span></p>
            )}
            {improvementResult !== null ? (
              // Dynamically style based on improvement
              <p className={`text-lg font-semibold ${improvementResult > 0 ? 'text-green-500' : improvementResult < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                Distress Reduction: {improvementResult.toFixed(0)}%
                {improvementResult > 0 ? ' Improvement' : improvementResult < 0 ? ' Increase' : ' (No Change)'}
              </p>
            ) : (
               <p className="text-sm text-muted-foreground">(Initial calibration SUDS needed to calculate change)</p>
            )}
            <p className="mt-4 text-lg text-muted-foreground">
              Excellent work completing the first step. Ready to continue your progress and achieve lasting relief?
            </p>
            {/* UPGRADE BUTTON - Navigates to Payment Page */}
            <Button
              size="lg"
              // Navigate to /upgrade and pass results via state
              onClick={() => navigate('/upgrade', { state: { sudsReduction: improvementResult, initialSuds: calibrationSuds, finalSuds: finalSudsResult } })}
              className="mt-2"
            >
              Unlock All 5 Treatments for $47
            </Button>
            {/* END UPGRADE BUTTON */}
            <Button variant="link" size="sm" className="mt-4 block mx-auto text-muted-foreground" onClick={() => navigate('/')}>
                Maybe Later (Return Home)
            </Button>
          </div>
          // --- END RESULTS / UPGRADE VIEW ---

        ) : (

          // --- ORIGINAL TREATMENT PHASES VIEW ---
          <>
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight">Treatment 1</h1>
              <p className="text-muted-foreground">Memory Retelling Phases</p>
            </div>

            {/* Phase 0: Prediction Error Selection */}
            {currentPhase === 0 && (
              <PredictionErrorSelection onComplete={handlePredictionErrorsComplete} />
            )}

            {/* Phases 1-6 Rendered Conditionally */}
            {currentPhase > 0 && (
              <div className="space-y-8">
                {/* Phase One */}
                {currentPhase >= 1 && (
                     <PhaseOne
                        isCurrentPhase={currentPhase === 1}
                        response={phase1Response}
                        onResponseChange={setPhase1Response}
                        onComplete={() => setCurrentPhase(2)}
                    />
                )}

                {/* Phase Two */}
                 {currentPhase >= 2 && (
                    <PhaseTwo
                        isCurrentPhase={currentPhase === 2}
                        response={phase2Response}
                        onResponseChange={setPhase2Response}
                        onComplete={() => setCurrentPhase(3)}
                    />
                 )}

                {/* Phase Three */}
                 {currentPhase >= 3 && (
                    <PhaseThree
                        isCurrentPhase={currentPhase === 3}
                        response={phase3Response}
                        onResponseChange={setPhase3Response}
                        onComplete={() => setCurrentPhase(4)}
                    />
                 )}

                {/* Narration Phase */}
                 {currentPhase >= 4 && (
                    <NarrationPhase
                        isCurrentPhase={currentPhase === 4}
                        narrativeScripts={narrativeScripts} // Pass generated scripts
                        narrationAudios={narrationAudios} // Pass current audio state
                        onNarrationRecorded={handleNarrationRecorded}
                        onComplete={handlePhase4Complete} // Advances to Phase 5
                        treatmentNumber={1} // Pass correct treatment number
                    />
                 )}

                {/* Phase Five */}
                 {currentPhase === 5 && (
                    <PhaseFive
                        isCurrentPhase={true}
                        // Pass ALL required props
                        narrativeScripts={narrativeScripts}
                        memory1={effectiveMemory1}
                        memory2={effectiveMemory2}
                        targetEventTranscript={effectiveTargetEvent}
                        predictionErrors={selectedErrors}
                        onComplete={handlePhase5Complete} // Advances to Phase 6
                        treatmentNumber={1}
                    />
                 )}

                {/* Phase Six */}
                 {currentPhase === 6 && (
                    <PhaseSix
                        isCurrentPhase={true}
                         // Pass ALL required props
                        narrativeScripts={narrativeScripts}
                        memory1={effectiveMemory1}
                        memory2={effectiveMemory2}
                        targetEventTranscript={effectiveTargetEvent}
                        predictionErrors={selectedErrors}
                        onComplete={handlePhase6Complete} // Saves results, triggers results view
                        treatmentNumber={1}
                    />
                 )}
              </div>
            )}
          </>
          // --- END ORIGINAL TREATMENT PHASES VIEW ---
        )}
        {/* --- End Conditional Rendering --- */}
      </div>
    </div>
  );
};

export default Treatment1;
