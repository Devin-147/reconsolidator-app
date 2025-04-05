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
import { type PredictionError } from "@/components/PredictionErrorSelector";
import { PhaseSix } from "@/components/treatment/PhaseSix";

const Treatment4 = () => {
  const navigate = useNavigate();
  const { 
    memory1, 
    memory2, 
    targetEventTranscript, 
    sudsLevel, 
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
  
  useEffect(() => {
    const effectiveMemory1 = memory1 || localMemory1;
    const effectiveMemory2 = memory2 || localMemory2;
    const effectiveTargetEvent = targetEventTranscript || localTargetEvent;
    
    const savedState = localStorage.getItem('recordingState');
    const isSaved = savedState ? JSON.parse(savedState).memoriesSaved : false;
    
    if ((!effectiveMemory1 || !effectiveMemory2 || !effectiveTargetEvent) && !isSaved) {
      toast.error("Please record your memories and target event before starting Treatment 4");
      navigate("/");
    } else {
      console.log("Memories and target event are available, ready for Treatment 4");
      setCurrentPhase(0);
    }
  }, [memory1, memory2, targetEventTranscript, localMemory1, localMemory2, localTargetEvent, navigate, memoriesSaved]);

  const handlePredictionErrorsComplete = (errors: PredictionError[]) => {
    console.log("Selected prediction errors:", errors.length);
    setSelectedErrors(errors);
    setCurrentPhase(1);
  };

  const generateNarrativeScripts = () => {
    if (!selectedErrors || selectedErrors.length !== 11) {
      console.log("Not enough prediction errors selected:", selectedErrors?.length);
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

  useEffect(() => {
    if (currentPhase === 4 && selectedErrors && selectedErrors.length === 11) {
      generateNarrativeScripts();
    }
  }, [currentPhase, selectedErrors, memory1, memory2, targetEventTranscript, localMemory1, localMemory2, localTargetEvent]);

  const handlePhase5Complete = () => {
    setCurrentPhase(6);
  };

  const handlePhase6Complete = (finalSuds: number) => {
    completeTreatment('Treatment 4', finalSuds);
    toast.success("Treatment 4 responses saved successfully");
    navigate("/");
  };

  const handleSave = () => {
    completeTreatment('Treatment 4', sudsLevel);
    toast.success("Treatment 4 responses saved successfully");
    navigate("/");
  };

  const handleNarrationRecorded = (index: number, audioUrl: string) => {
    if (updateNarrationAudio) {
      updateNarrationAudio(index, audioUrl);
    }
  };

  const handlePhase4Complete = () => {
    const recordedNarrations = narrationAudios?.filter(audio => !!audio).length || 0;
    if (recordedNarrations === 11) {
      setCurrentPhase(5);
    } else {
      toast.error("Please complete all 11 narrations before proceeding to Phase 5");
    }
  };

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
          <h1 className="text-3xl font-semibold tracking-tight">Treatment 4</h1>
          <p className="text-muted-foreground">Two nights after Treatment 3</p>
        </div>

        {currentPhase === 0 ? (
          <PredictionErrorSelection onComplete={handlePredictionErrorsComplete} />
        ) : (
          <div className="space-y-8">
            <PhaseOne 
              isCurrentPhase={currentPhase === 1}
              response={phase1Response}
              onResponseChange={setPhase1Response}
              onComplete={() => setCurrentPhase(2)}
            />

            <PhaseTwo 
              isCurrentPhase={currentPhase === 2}
              response={phase2Response}
              onResponseChange={setPhase2Response}
              onComplete={() => setCurrentPhase(3)}
            />

            <PhaseThree 
              isCurrentPhase={currentPhase === 3}
              response={phase3Response}
              onResponseChange={setPhase3Response}
              onComplete={() => setCurrentPhase(4)}
            />

            <NarrationPhase 
              isCurrentPhase={currentPhase === 4}
              narrativeScripts={narrativeScripts}
              narrationAudios={narrationAudios}
              onNarrationRecorded={handleNarrationRecorded}
              onComplete={handlePhase4Complete}
            />

            {narrationAudios?.filter(audio => !!audio).length === 11 && (
              <PhaseFive
                isCurrentPhase={currentPhase === 5}
                onComplete={handlePhase5Complete}
                treatmentNumber={4}
                narrativeScripts={narrativeScripts}
                memory1={memory1 || localMemory1}
                memory2={memory2 || localMemory2}
                targetEventTranscript={targetEventTranscript || localTargetEvent}
                predictionErrors={selectedErrors}
              />
            )}

            <PhaseSix
              isCurrentPhase={currentPhase === 6}
              narrativeScripts={narrativeScripts}
              memory1={memory1 || localMemory1}
              memory2={memory2 || localMemory2}
              targetEventTranscript={targetEventTranscript || localTargetEvent}
              predictionErrors={selectedErrors}
              onComplete={handlePhase6Complete}
              treatmentNumber={4}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Treatment4;
