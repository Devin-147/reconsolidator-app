
import { useState } from "react";
import { PredictionErrorSelector, type PredictionError } from "@/components/PredictionErrorSelector";

interface PredictionErrorSelectionProps {
  onComplete: (errors: PredictionError[]) => void;
}

export const PredictionErrorSelection = ({ onComplete }: PredictionErrorSelectionProps) => {
  return (
    <>
      <div className="space-y-4 mb-6">
        <h2 className="text-xl font-semibold">Step 1: Select Prediction Errors</h2>
        <p className="text-muted-foreground">
          Before starting the treatment phases, please select 11 mismatch experiences/prediction errors to be used in your reconsolidation sessions.
        </p>
      </div>
      <PredictionErrorSelector onComplete={onComplete} />
    </>
  );
};
