import { PlayCircle, Play, StopCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NarrationItem } from "./NarrationItem";
import { ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface NarrationPhaseProps {
  isCurrentPhase: boolean;
  narrativeScripts: string[];
  onComplete: () => void;
  treatmentNumber: number;
  narrationAudios?: string[];
  onNarrationRecorded?: (index: number, audioUrl: string) => void;
}

export const NarrationPhase: React.FC<NarrationPhaseProps> = ({
  isCurrentPhase,
  narrativeScripts,
  onComplete,
  treatmentNumber,
  narrationAudios: initialNarrationAudios = [],
  onNarrationRecorded,
}) => {
  const [narrationAudios, setNarrationAudios] = useState<(string | null)[]>(initialNarrationAudios || Array(11).fill(null));
  const [isRecording, setIsRecording] = useState(false);
  const [currentNarrationIndex, setCurrentNarrationIndex] = useState(0);
  const [hasPlayedAllNarrations, setHasPlayedAllNarrations] = useState(false);
  const [previousRecordings, setPreviousRecordings] = useState<{ [key: string]: string[] }>({});

  useEffect(() => {
    // Load previous recordings from localStorage
    const loadPreviousRecordings = () => {
      const savedRecordings = localStorage.getItem('narrationRecordings');
      if (savedRecordings) {
        setPreviousRecordings(JSON.parse(savedRecordings));
      }
    };
    loadPreviousRecordings();
  }, []);

  const handleStartRecording = (index: number) => {
    setIsRecording(true);
    setCurrentNarrationIndex(index);
    // Add recording logic here
  };

  const handleStopRecording = (index: number, audioUrl: string) => {
    setIsRecording(false);
    const newNarrationAudios = [...narrationAudios];
    newNarrationAudios[index] = audioUrl;
    setNarrationAudios(newNarrationAudios);

    // Save recording to localStorage
    const newRecordings = {
      ...previousRecordings,
      [`treatment${treatmentNumber}`]: newNarrationAudios,
    };
    localStorage.setItem('narrationRecordings', JSON.stringify(newRecordings));
  };

  const handleUsePreviousRecording = (index: number, treatmentKey: string) => {
    if (previousRecordings[treatmentKey]?.[index]) {
      const newNarrationAudios = [...narrationAudios];
      newNarrationAudios[index] = previousRecordings[treatmentKey][index];
      setNarrationAudios(newNarrationAudios);
    }
  };

  const handlePlayNarration = (index: number) => {
    // Add playback logic here
    if (index === narrativeScripts.length - 1) {
      setHasPlayedAllNarrations(true);
    }
  };

  if (!isCurrentPhase) return null;

  const availablePreviousTreatments = Object.keys(previousRecordings).filter(
    key => key !== `treatment${treatmentNumber}`
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Phase 4: Sequential Memory Integration</h3>
        <p className="text-sm text-muted-foreground">
          Record each narrative script, then listen to all recordings in sequence.
          {narrationAudios.filter(audio => !!audio).length}/11 narrations recorded.
        </p>
      </div>

      <div className="space-y-4">
        {narrativeScripts.map((script, index) => (
          <div key={index} className="p-4 bg-black/10 rounded-lg space-y-3">
            <div className="whitespace-pre-wrap text-sm">{script}</div>
            <div className="space-y-2">
              {narrationAudios[index] ? (
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handlePlayNarration(index)}
                    variant="secondary"
                    className="flex-1"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Play Recording
                  </Button>
                  <Button
                    onClick={() => handleStartRecording(index)}
                    variant="outline"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Re-record
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Button
                    onClick={() => handleStartRecording(index)}
                    variant={isRecording && currentNarrationIndex === index ? "destructive" : "default"}
                    className="w-full"
                  >
                    {isRecording && currentNarrationIndex === index ? (
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
                  {availablePreviousTreatments.length > 0 && (
                    <Select onValueChange={(value) => handleUsePreviousRecording(index, value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Use recording from previous treatment" />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePreviousTreatments.map((treatmentKey) => (
                          <SelectItem key={treatmentKey} value={treatmentKey}>
                            Use recording from {treatmentKey}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {narrationAudios.every(audio => !!audio) && (
        <Button
          onClick={onComplete}
          disabled={!hasPlayedAllNarrations}
          className="w-full"
        >
          Complete Phase 4
        </Button>
      )}
    </div>
  );
};
