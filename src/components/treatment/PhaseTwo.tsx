
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface PhaseTwoProps {
  isCurrentPhase: boolean;
  response: string;
  onResponseChange: (response: string) => void;
  onComplete: () => void;
}

export const PhaseTwo = ({ 
  isCurrentPhase, 
  response, 
  onResponseChange, 
  onComplete 
}: PhaseTwoProps) => {
  return (
    <div className={`space-y-4 transition-opacity duration-300 ${isCurrentPhase ? 'opacity-100' : 'opacity-50'}`}>
      <div className="flex items-center gap-3">
        <Camera className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-semibold">Phase 2: Black and White Film</h2>
      </div>
      <p className="text-muted-foreground">
        Now imagine the same scene, but the movie is in black and white. How does removing the color change your 
        perception? What details stand out differently? Which changes are you noticing in this version?
      </p>
      <Textarea
        value={response}
        onChange={(e) => onResponseChange(e.target.value)}
        placeholder="Describe the black and white version..."
        className="min-h-[150px]"
        disabled={!isCurrentPhase}
      />
      {isCurrentPhase && response && (
        <Button 
          className="w-full"
          onClick={onComplete}
        >
          Continue to Phase 3
        </Button>
      )}
    </div>
  );
};
