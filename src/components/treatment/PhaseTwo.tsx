// FILE: src/components/treatment/PhaseTwo.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface PhaseTwoProps {
    isCurrentPhase: boolean;
    response: string;
    onResponseChange: (value: string) => void;
    onComplete: () => void;
}

export const PhaseTwo: React.FC<PhaseTwoProps> = ({ isCurrentPhase, response, onResponseChange, onComplete }) => {
    if (!isCurrentPhase) return null;

    const handleComplete = () => {
        if (response.trim().length < 10) {
            toast.error("Please provide a more detailed description for this phase.");
            return;
        }
        onComplete();
    };

    return (
        <div className="p-6 border rounded-lg bg-card shadow-lg space-y-4 animate-fadeIn">
            <h3 className="text-xl font-semibold text-primary">Phase 2: Black & White Dissociated Movie</h3>
            <p className="text-sm text-muted-foreground">
                Now, imagine the movie of your Target Event begins, but it's in grainy black and white. You are still safe in the movie theater seat, watching from a distance. Describe this black and white movie. How does the lack of color change the feeling?
            </p>
            <Textarea
                value={response}
                onChange={(e) => onResponseChange(e.target.value)}
                placeholder="Describe the black and white movie..."
                rows={6}
                className="bg-background focus:ring-primary focus:border-primary"
            />
            <Button onClick={handleComplete} disabled={response.trim().length < 10} className="w-full">
                Complete Phase 2
            </Button>
        </div>
    );
};