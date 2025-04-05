import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ArrowDown, Play, StopCircle, ArrowUp } from "lucide-react";
import SUDSScale from "../SUDSScale";
import { type PredictionError } from "@/components/PredictionErrorSelector";
import { useRecording } from "@/contexts/RecordingContext";
import { toast } from "sonner";

interface PhaseSixProps {
  isCurrentPhase: boolean;
  narrativeScripts: string[];
  memory1: string;
  memory2: string;
  targetEventTranscript: string;
  predictionErrors: PredictionError[];
  onComplete: (finalSuds: number) => void;
  treatmentNumber: number;
}

export const PhaseSix: React.FC<PhaseSixProps> = ({
  isCurrentPhase,
  narrativeScripts,
  memory1,
  memory2,
  targetEventTranscript,
  predictionErrors,
  onComplete,
  treatmentNumber,
}: PhaseSixProps) => {
  const { targetEventTranscript: contextTargetEventTranscript, setSudsLevel, sudsLevel, calibrationSuds } = useRecording();
  const [selectedNarrations, setSelectedNarrations] = useState<number[]>([]);
  const [reversedScripts, setReversedScripts] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [tempTranscript, setTempTranscript] = useState("");
  const [currentSudsLevel, setCurrentSudsLevel] = useState(sudsLevel || 50);
  const [hasCompletedReverseNarrations, setHasCompletedReverseNarrations] = useState(false);
  const [hasCompletedRetelling, setHasCompletedRetelling] = useState(false);

  const MAX_DURATION = 180; // 3 minutes in seconds

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timerRef = useRef<number | null>(null);

  const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;

  const handleNarrationSelect = (index: number) => {
    if (selectedNarrations.includes(index)) {
      setSelectedNarrations(prev => prev.filter(i => i !== index));
    } else if (selectedNarrations.length < 8) {
      setSelectedNarrations(prev => [...prev, index]);
    }
  };

  const generateReverseScripts = () => {
    const reversed = selectedNarrations.map(index => {
      const originalScript = narrativeScripts[index];
      return `Reverse Narration (Under 3 seconds):
Memory 2: ${memory2}
Prediction Error: ${predictionErrors[index].description}
Target Event: ${targetEventTranscript}
Memory 1: ${memory1}`;
    });
    setReversedScripts(reversed);
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    // Add recording logic here
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setHasCompletedReverseNarrations(true);
  };

  if (!isCurrentPhase) return null;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Phase 6: Target Event Re-assessment</h3>
        <p className="text-sm text-muted-foreground">
          Now that you've completed the reverse integration, please re-tell your target event in 3 minutes or less. 
          After retelling the event, you'll rate your distress level using the SUDS scale.
        </p>
      </div>

      {/* Selection Section */}
      {!reversedScripts.length && (
        <div className="space-y-4">
          <h4 className="text-base font-medium">Select 8 Narratives to Reverse</h4>
          <div className="space-y-2">
            {narrativeScripts.map((script, index) => (
              <div key={index} className="flex items-start gap-2">
                <Checkbox
                  id={`narration-${index}`}
                  checked={selectedNarrations.includes(index)}
                  onCheckedChange={() => handleNarrationSelect(index)}
                  disabled={selectedNarrations.length >= 8 && !selectedNarrations.includes(index)}
                />
                <label htmlFor={`narration-${index}`} className="text-sm">
                  Narration {index + 1}
                </label>
              </div>
            ))}
          </div>
          <Button
            onClick={generateReverseScripts}
            disabled={selectedNarrations.length !== 8}
            className="w-full"
          >
            <ArrowDown className="w-4 h-4 mr-2" />
            Generate Reverse Scripts
          </Button>
        </div>
      )}

      {/* Recording Section */}
      {reversedScripts.length > 0 && !hasCompletedReverseNarrations && (
        <div className="space-y-4">
          <h4 className="text-base font-medium">Record Reverse Narrations</h4>
          <p className="text-sm text-muted-foreground">
            Record each reversed narrative in under 3 seconds. Experience everything undoing itself rapidly
            in full color while fully associated in the experience.
          </p>
          <div className="space-y-4">
            {reversedScripts.map((script, index) => (
              <div key={index} className="p-4 bg-black/10 rounded-lg space-y-3">
                <div className="whitespace-pre-wrap text-sm">{script}</div>
                <Button
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                  variant={isRecording ? "destructive" : "default"}
                  className="w-full"
                >
                  {isRecording ? (
                    <>
                      <StopCircle className="w-4 h-4 mr-2" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Start Recording
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUDS Assessment Section */}
      {hasCompletedReverseNarrations && (
        <div className="space-y-4">
          <h4 className="text-base font-medium">Final SUDS Assessment</h4>
          <p className="text-sm text-muted-foreground">
            Now that you've completed the reverse narrations, please rate your current level of distress.
          </p>
          <SUDSScale
            onValueChange={setCurrentSudsLevel}
            initialValue={currentSudsLevel}
            readOnly={false}
          />
          <Button
            onClick={() => onComplete(currentSudsLevel)}
            className="w-full"
          >
            Complete Treatment
          </Button>
        </div>
      )}
    </div>
  );
}; 