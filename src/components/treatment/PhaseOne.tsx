// FILE: src/components/treatment/PhaseOne.tsx
import React, { useState } from "react";
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
        if (response.trim().length < 10) {
            toast.error("Please provide a more detailed description for this phase.");
            return;
        }
        onComplete();
    };

    return (
        <div className="p-6 border rounded-lg bg-card shadow-lg space-y-4 animate-fadeIn">
            <h3 className="text-xl font-semibold text-primary">Phase 1: Movie Screen Perspective</h3>
            <p className="text-sm text-muted-foreground">
                Imagine you're sitting in a movie theater, watching yourself on the big screen as you experience Memory 1 (your "before" positive memory). Describe what you see as if you're watching a movie of yourself. What does the character (you) look like? What's happening around them?
            </p>
            <Textarea
                value={response}
                onChange={(e) => onResponseChange(e.target.value)}
                placeholder="Describe what you see on the imagined movie screen..."
                rows={6}
                className="bg-background focus:ring-primary focus:border-primary"
            />
            <Button onClick={handleComplete} disabled={response.trim().length < 10} className="w-full">
                Complete Phase 1
            </Button>
        </div>
    );
};