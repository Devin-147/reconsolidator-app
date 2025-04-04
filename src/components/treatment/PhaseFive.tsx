// src/components/treatment/PhaseFive.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowDown, Play, StopCircle } from "lucide-react";
import { type PredictionError } from "@/components/PredictionErrorSelector";

interface PhaseFiveProps {
  isCurrentPhase: boolean;
  narrativeScripts: string[];
  memory1: string;
  memory2: string;
  targetEventTranscript: string;
  predictionErrors: PredictionError[];
  onComplete: () => void;
  treatmentNumber: number;
}

export const PhaseFive = ({
  isCurrentPhase,
  narrativeScripts,
  memory1,
  memory2,
  targetEventTranscript,
  predictionErrors,
  onComplete,
  treatmentNumber,
}: PhaseFiveProps) => {
  const [selectedNarrations, setSelectedNarrations] = useState<number[]>([]);
  const [reversedScripts, setReversedScripts] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [hasCompletedReverseNarrations, setHasCompletedReverseNarrations] = useState(false);

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
        <h3 className="text-lg font-semibold">Phase 5: Reverse Integration</h3>
        <p className="text-sm text-muted-foreground">
          Select 8 narratives from Phase 4 to reverse. You will then record each reversed narrative in under 3 seconds,
          experiencing everything undoing itself rapidly in full color while fully associated in the experience.
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

      {hasCompletedReverseNarrations && (
        <div className="space-y-4">
          <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
            <p className="text-green-500 font-medium">
              Great work! You've completed all reverse narrations.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Just one final phase to go - you'll do a final assessment of your target event.
            </p>
          </div>
          <Button
            onClick={onComplete}
            className="w-full"
          >
            Continue to Final Assessment for Treatment {treatmentNumber}
          </Button>
        </div>
      )}
    </div>
  );
};