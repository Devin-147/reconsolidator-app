// FILE: src/components/treatment/PhaseThree.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface PhaseThreeProps {
    isCurrentPhase: boolean;
    response: string;
    onResponseChange: (value: string) => void;
    onComplete: () => void;
}

export const PhaseThree: React.FC<PhaseThreeProps> = ({ isCurrentPhase, response, onResponseChange, onComplete }) => {
    if (!isCurrentPhase) return null;
    const handleComplete = () => {
        if (response.trim().length < 10) { toast.error("Please provide a more detailed description."); return; }
        onComplete();
    };
    return (
        <div className="p-6 border rounded-lg bg-card shadow-lg space-y-4">
            <h3 className="text-xl font-semibold text-primary">Phase 3: Floating to the Projection Booth</h3>
            <p className="text-sm text-muted-foreground">Imagine yourself floating out of your body, up and into the projection booth. From there, you can see yourself down in the seat, watching the black and white movie. Describe this double-dissociated perspective.</p>
            <Textarea value={response} onChange={(e) => onResponseChange(e.target.value)} placeholder="Describe your view from the booth..." rows={6} />
            <Button onClick={handleComplete} disabled={response.trim().length < 10} className="w-full">Complete Phase 3</Button>
        </div>
    );
};