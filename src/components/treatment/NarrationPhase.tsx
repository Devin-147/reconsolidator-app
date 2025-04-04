import { PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NarrationItem } from "./NarrationItem";
import { ArrowRight } from "lucide-react";

interface NarrationPhaseProps {
  isCurrentPhase: boolean;
  narrativeScripts: string[];
  narrationAudios?: string[];
  onNarrationRecorded: (index: number, audioUrl: string) => void;
  onComplete: () => void;
}

export const NarrationPhase = ({ 
  isCurrentPhase, 
  narrativeScripts, 
  narrationAudios = [], 
  onNarrationRecorded, 
  onComplete 
}: NarrationPhaseProps) => {
  // Check if all 11 narrations are recorded AND played
  const isPhaseComplete = narrationAudios.filter(url => !!url).length === 11;

  return (
    <div className={`space-y-4 transition-opacity duration-300 ${isCurrentPhase ? 'opacity-100' : 'opacity-50'}`}>
      <div className="flex items-center gap-3">
        <PlayCircle className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-semibold">Phase 4: Sequential Memory Integration</h2>
      </div>
      <p className="text-muted-foreground">
        In this phase, you'll narrate 11 short "movies" in black and white, each featuring Memory 1, the Target Event 
        (with a different alternative ending each time), and Memory 2. For each script, record yourself narrating it.
        Each narration must be 45 seconds or less. You must complete all 11 recordings before proceeding to Phase 5.
      </p>
      
      <div className="space-y-6">
        {narrativeScripts.map((script, index) => (
          <NarrationItem
            key={index}
            script={script}
            index={index}
            onRecordingComplete={onNarrationRecorded}
          />
        ))}
      </div>

      {isCurrentPhase && (
        <div className="space-y-4">
          {isPhaseComplete ? (
            <>
              <p className="text-sm text-green-500">
                ✓ All 11 narrations have been completed successfully.
              </p>
              <Button 
                className="w-full"
                onClick={onComplete}
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Continue to Phase 5
              </Button>
            </>
          ) : (
            <p className="text-sm text-amber-500">
              Please complete all 11 narrations before proceeding to Phase 5. {narrationAudios.filter(url => !!url).length} of 11 completed.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
