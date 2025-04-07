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
  targetEventTranscript: string;
  onComplete: (finalSuds: number) => void;
  treatmentNumber: number;
  narrativeScripts?: string[];
  memory1?: string;
  memory2?: string;
  predictionErrors?: PredictionError[];
}

export const PhaseSix: React.FC<PhaseSixProps> = ({
  isCurrentPhase,
  targetEventTranscript,
  onComplete,
  treatmentNumber,
  narrativeScripts = [],
  memory1 = '',
  memory2 = '',
  predictionErrors = [],
}: PhaseSixProps) => {
  const { targetEventTranscript: contextTargetEventTranscript, setSudsLevel, sudsLevel, calibrationSuds } = useRecording();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [currentSudsLevel, setCurrentSudsLevel] = useState(50);
  const [hasCompletedRetelling, setHasCompletedRetelling] = useState(false);

  const MAX_DURATION = 180; // 3 minutes in seconds

  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    // Add recording logic here
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setHasCompletedRetelling(true);
  };

  if (!isCurrentPhase) return null;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Phase 6: Target Event Re-assessment</h3>
        <p className="text-sm text-muted-foreground">
          Please retell your target event in 3 minutes or less. After retelling the event, 
          rate your current distress level using the SUDS scale.
        </p>
      </div>

      {!hasCompletedRetelling ? (
        <div className="space-y-4">
          <div className="p-4 bg-black/10 rounded-lg space-y-3">
            <p className="text-sm font-medium">Target Event:</p>
            <div className="whitespace-pre-wrap text-sm">{targetEventTranscript}</div>
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
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-2">
            <h4 className="text-base font-medium">Rate Your Current Distress Level</h4>
            <SUDSScale
              value={currentSudsLevel}
              onChange={setCurrentSudsLevel}
            />
          </div>
          <Button
            onClick={() => onComplete(currentSudsLevel)}
            className="w-full"
          >
            Complete Treatment {treatmentNumber}
          </Button>
        </div>
      )}
    </div>
  );
}; 