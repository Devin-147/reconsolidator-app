
import { useState } from "react";
import { Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface PhaseOneProps {
  isCurrentPhase: boolean;
  response: string;
  onResponseChange: (response: string) => void;
  onComplete: () => void;
}

export const PhaseOne = ({ 
  isCurrentPhase, 
  response, 
  onResponseChange, 
  onComplete 
}: PhaseOneProps) => {
  return (
    <div className={`space-y-4 transition-opacity duration-300 ${isCurrentPhase ? 'opacity-100' : 'opacity-50'}`}>
      <div className="flex items-center gap-3">
        <Film className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-semibold">Phase 1: Movie Screen Perspective</h2>
      </div>
      <p className="text-muted-foreground">
        Imagine you're sitting in a movie theater, watching yourself on the big screen as you experience Memory 1. 
        Describe what you see as if you're watching a movie of yourself. What does the character (you) look like? 
        What's happening around them?
      </p>
      <Textarea
        value={response}
        onChange={(e) => onResponseChange(e.target.value)}
        placeholder="Describe what you see on the movie screen..."
        className="min-h-[150px]"
        disabled={!isCurrentPhase}
      />
      {isCurrentPhase && response && (
        <Button 
          className="w-full"
          onClick={onComplete}
        >
          Continue to Phase 2
        </Button>
      )}
    </div>
  );
};
