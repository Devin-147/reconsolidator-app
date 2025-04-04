
import { Rewind } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface PhaseThreeProps {
  isCurrentPhase: boolean;
  response: string;
  onResponseChange: (response: string) => void;
  onComplete: () => void;
}

export const PhaseThree = ({ 
  isCurrentPhase, 
  response, 
  onResponseChange, 
  onComplete
}: PhaseThreeProps) => {
  return (
    <div className={`space-y-4 transition-opacity duration-300 ${isCurrentPhase ? 'opacity-100' : 'opacity-50'}`}>
      <div className="flex items-center gap-3">
        <Rewind className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-semibold">Phase 3: Reverse Sequence</h2>
      </div>
      <p className="text-muted-foreground">
        For this final phase, imagine stepping into the movie and experiencing the entire scene in reverse. 
        Start from the end and move backwards to the beginning. How does the scene unfold in reverse? What new 
        perspectives does this give you?
      </p>
      <Textarea
        value={response}
        onChange={(e) => onResponseChange(e.target.value)}
        placeholder="Describe the scene in reverse..."
        className="min-h-[150px]"
        disabled={!isCurrentPhase}
      />
      {isCurrentPhase && response && (
        <Button 
          className="w-full"
          onClick={onComplete}
        >
          Continue to Phase 4
        </Button>
      )}
    </div>
  );
};
