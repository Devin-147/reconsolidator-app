// FILE: src/components/treatment/PhaseOne.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface PhaseOneProps {
    isCurrentPhase: boolean;
    response: string;
    onResponseChange: (value: string) => void;
    onComplete: () => void;
}

export const PhaseOne: React.FC<PhaseOneProps> = ({ isCurrentPhase, response, onResponseChange, onComplete }) => {
    if (!isCurrentPhase) return null;
    const handleComplete = () => {
        if (response.trim().length < 10) { toast.error("Please provide a more detailed description."); return; }
        onComplete();
    };
    return (
        <div className="p-6 border rounded-lg bg-card shadow-lg space-y-4">
            <h3 className="text-xl font-semibold text-primary">Phase 1: Movie Screen Perspective</h3>
            <p className="text-sm text-muted-foreground">Imagine you're in a movie theater, watching yourself on screen as you experience Memory 1 (your "before" positive memory). Describe what the character (you) looks like and what's happening.</p>
            <Textarea value={response} onChange={(e) => onResponseChange(e.target.value)} placeholder="Describe what you see..." rows={6} />
            <Button onClick={handleComplete} disabled={response.trim().length < 10} className="w-full">Complete Phase 1</Button>
        </div>
    );
};