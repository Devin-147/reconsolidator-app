import { useState, useEffect } from "react";
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
// Make sure PredictionError type is correctly imported if needed by PhaseFive/Six directly
// You might need to adjust the import path based on where PredictionError is defined
import { type PredictionError } from "@/components/PredictionErrorSelector"; // Assuming this path is correct
import { PhaseSix } from "@/components/treatment/PhaseSix";

const Treatment5 = () => {
  const navigate = useNavigate();
  const {
    memory1,
    memory2,
    targetEventTranscript,
    sudsLevel, // Note: sudsLevel from context might be the initial one, PhaseSix likely calculates final
    memoriesSaved,
    narrationAudios,
    updateNarrationAudio,
    completeTreatment
  } = useRecording();

  const [selectedErrors, setSelectedErrors] = useState<PredictionError[]>([]);
  const [phase1Response, setPhase1Response] = useState("");
  const [phase2Response, setPhase2Response] = useState("");
  const [phase3Response, setPhase3Response] = useState("");
  const [currentPhase, setCurrentPhase] = useState(0);
  const [narrativeScripts, setNarrativeScripts] = useState<string[]>([]);

  const [localMemory1, setLocalMemory1] = useState("");
  const [localMemory2, setLocalMemory2] = useState("");
  const [localTargetEvent, setLocalTargetEvent] = useState("");

  console.log("Current phase:", currentPhase);

  // --- Load from localStorage effect (looks okay) ---
  useEffect(() => {
    if (!memory1 || !memory2 || !targetEventTranscript) {
      const savedState = localStorage.getItem('recordingState');
      if (savedState) {
        try {
          const state = JSON.parse(savedState);
          if (state.memory1) setLocalMemory1(state.memory1);
          if (state.memory2) setLocalMemory2(state.memory2);
          if (state.targetEventTranscript) setLocalTargetEvent(state.targetEventTranscript);

          console.log("Loaded memories from localStorage:", {
            memory1: state.memory1 ? state.memory1.substring(0, 30) + "..." : "none",
            memory2: state.memory2 ? state.memory2.substring(0, 30) + "..." : "none",
            targetEvent: state.targetEventTranscript ? state.targetEventTranscript.substring(0, 30) + "..." : "none"
          });
        } catch (error) {
          console.error("Error parsing localStorage data:", error);
        }
      }
    }
  }, [memory1, memory2, targetEventTranscript]);

  // --- Check prerequisites effect (looks okay, might need refinement based on actual flow) ---
  useEffect(() => {
    const effectiveMemory1 = memory1 || localMemory1;
    const effectiveMemory2 = memory2 || localMemory2;
    const effectiveTargetEvent = targetEventTranscript || localTargetEvent;

    // Refined check: Use memoriesSaved from context if reliable, otherwise check localStorage again
    const stateIsSaved = memoriesSaved || (localStorage.getItem('recordingState') ? JSON.parse(localStorage.getItem('recordingState')!).memoriesSaved : false);

    if (!effectiveMemory1 || !effectiveMemory2 || !effectiveTargetEvent /* && !stateIsSaved - add if needed */ ) {
      toast.error("Please record your memories and target event before starting Treatment 5");
      navigate("/");
    } else {
      console.log("Memories and target event are available, ready for Treatment 5");
      // Determine initial phase based on state if needed, otherwise start at 0
      // Maybe load selectedErrors from somewhere if resuming? For now, start fresh.
      setCurrentPhase(0);
      setSelectedErrors([]); // Reset errors for the new treatment
      setNarrativeScripts([]); // Reset scripts
    }
    // Dependencies need review based on exact logic for starting treatment
  }, [memory1, memory2, targetEventTranscript, localMemory1, localMemory2, localTargetEvent, navigate, memoriesSaved]);

  const handlePredictionErrorsComplete = (errors: PredictionError[]) => {
    console.log("Selected prediction errors:", errors.length);
    // Ensure exactly 11 errors are selected if that's a hard requirement
    if (errors.length !== 11) {
       toast.error("Please select exactly 11 prediction errors.");
       return;
    }
    setSelectedErrors(errors);
    setCurrentPhase(1); // Move to Phase One
  };

  // --- generateNarrativeScripts (looks okay) ---
  const generateNarrativeScripts = () => {
    if (!selectedErrors || selectedErrors.length !== 11) {
      console.log("Not enough prediction errors selected:", selectedErrors?.length);
       toast.error("Cannot generate scripts: 11 prediction errors needed.");
      return;
    }

    const memory1Text = memory1 || localMemory1 || "No memory 1 recorded";
    const memory2Text = memory2 || localMemory2 || "No memory 2 recorded";
    const targetEventDescription = targetEventTranscript || localTargetEvent || "your traumatic experience";

    console.log("Generating narrative scripts with:", {
      memory1: memory1Text.substring(0, 30) + "...",
      memory2: memory2Text.substring(0, 30) + "...",
      targetEvent: targetEventDescription.substring(0, 30) + "..."
    });

    const scripts = selectedErrors.map((error, index) => {
            // --- Using your exact script template ---
            return `Movie ${index + 1}: Memory 1 + Target Event + Prediction Error ${index + 1} + Memory 2

I am in a projection booth of a movie theatre and from the booth, I also see myself seated in one of the plush movie seats. I see myself watching a movie. The movie scene starts by showing me in the following situation:

${memory1Text}

I smile from the projection booth when seeing this part of the movie and I notice that the other me seated in the plush movie seat is watching this scene and smiling also.

The next scene in this movie cuts to me experiencing ${targetEventDescription}. However, in this version, something different happens: ${error.description}

I see that the version of me in the movie seat is surprised and delighted at this scene.

And then it fades out and we see a new scene. There I am again but this time:

${memory2Text}`;
    });

    console.log("Generated narrative scripts:", scripts.length);
    setNarrativeScripts(scripts);
  };

  // --- useEffect to generate scripts (looks okay) ---
  useEffect(() => {
    // Ensure this runs when phase becomes 4 AND errors are selected
    if (currentPhase === 4 && selectedErrors?.length === 11) {
      generateNarrativeScripts();
    }
  }, [currentPhase, selectedErrors, memory1, memory2, targetEventTranscript, localMemory1, localMemory2, localTargetEvent]); // Added selectedErrors dependency


  const handlePhase5Complete = () => {
    setCurrentPhase(6); // Move to Phase Six
  };

  const handlePhase6Complete = (finalSuds: number) => {
    completeTreatment('Treatment 5', finalSuds); // Make sure completeTreatment exists and works
    toast.success("Treatment 5 responses saved successfully");
    navigate("/"); // Navigate after completion
  };

  // Removed unused handleSave function if PhaseSix handles completion

  const handleNarrationRecorded = (index: number, audioUrl: string) => {
    if (updateNarrationAudio) { // Check if function exists in context
      updateNarrationAudio(index, audioUrl);
    } else {
      console.error("updateNarrationAudio function is missing from context");
    }
  };

  const handlePhase4Complete = () => {
     // Check if all narrations are recorded before proceeding
     // Assuming narrationAudios is an array reflecting the 11 scripts
     const recordedNarrations = narrationAudios?.filter(audio => !!audio).length || 0;
     if (recordedNarrations === 11) {
       setCurrentPhase(5); // Move to Phase Five
     } else {
       toast.error(`Please complete all 11 narrations (${recordedNarrations}/11 recorded)`);
     }
  };


  // --- Get effective memory/event values to pass as props ---
  const effectiveMemory1 = memory1 || localMemory1;
  const effectiveMemory2 = memory2 || localMemory2;
  const effectiveTargetEvent = targetEventTranscript || localTargetEvent;


  return (
    <div className="min-h-screen bg-background p-6">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate("/")}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Main
      </Button>

      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Treatment 5</h1>
          <p className="text-muted-foreground">Two nights after Treatment 4</p>
        </div>

        {currentPhase === 0 ? (
          <PredictionErrorSelection onComplete={handlePredictionErrorsComplete} />
        ) : (
          <div className="space-y-8">
            {/* Phase One */}
            <PhaseOne
              isCurrentPhase={currentPhase === 1}
              response={phase1Response}
              onResponseChange={setPhase1Response}
              onComplete={() => setCurrentPhase(2)}
            />

            {/* Phase Two */}
            <PhaseTwo
              isCurrentPhase={currentPhase === 2}
              response={phase2Response}
              onResponseChange={setPhase2Response}
              onComplete={() => setCurrentPhase(3)}
            />

            {/* Phase Three */}
            <PhaseThree
              isCurrentPhase={currentPhase === 3}
              response={phase3Response}
              onResponseChange={setPhase3Response}
              onComplete={() => setCurrentPhase(4)}
            />

            {/* Narration Phase */}
            <NarrationPhase
              isCurrentPhase={currentPhase === 4}
              narrativeScripts={narrativeScripts} // Pass generated scripts
              narrationAudios={narrationAudios} // Pass current audio state
              onNarrationRecorded={handleNarrationRecorded}
              onComplete={handlePhase4Complete}
            />

            {/* Phase Five - Render only when phase is 5 */}
            {currentPhase === 5 && ( // Only render when phase is 5
                <PhaseFive
                    isCurrentPhase={true} // Explicitly true
                    onComplete={handlePhase5Complete}
                    treatmentNumber={5}
                    // --- FIXED: Added missing props ---
                    narrativeScripts={narrativeScripts}
                    memory1={effectiveMemory1}
                    memory2={effectiveMemory2}
                    targetEventTranscript={effectiveTargetEvent}
                    predictionErrors={selectedErrors}
                 />
            )}


            {/* Phase Six - Render only when phase is 6 */}
             {currentPhase === 6 && ( // Only render when phase is 6
                <PhaseSix
                    isCurrentPhase={true} // Explicitly true
                    narrativeScripts={narrativeScripts}
                    memory1={effectiveMemory1}
                    memory2={effectiveMemory2}
                    targetEventTranscript={effectiveTargetEvent}
                    predictionErrors={selectedErrors}
                    onComplete={handlePhase6Complete}
                    // --- FIXED: Added missing prop ---
                    treatmentNumber={5}
                />
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Treatment5;