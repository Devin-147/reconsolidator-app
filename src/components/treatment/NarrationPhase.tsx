// FILE: src/components/treatment/NarrationPhase.tsx

import React from 'react';
import { Button } from '@/components/ui/button';
import { PredictionError } from '@/components/PredictionErrorSelector'; 
import { NarrationItem } from './NarrationItem';

interface NarrationPhaseProps {
    isCurrentPhase: boolean;
    narrativeScripts: string[];
    selectedPredictionErrors: PredictionError[];
    onNarrationRecorded: (index: number, audioUrl: string | null) => void;
    onComplete: () => void;
    treatmentNumber: number;
}

export const NarrationPhase = ({ 
    isCurrentPhase, 
    narrativeScripts, 
    selectedPredictionErrors, 
    onNarrationRecorded, 
    onComplete, 
    treatmentNumber 
}: NarrationPhaseProps) => {

    // <<< CHANGE: All state related to AI loading has been removed, as the child component now handles its own loading.
    // const [aiItemsToLoad, setAiItemsToLoad] = useState<number[]>([]);
    // const [aiItemsFinished, setAiItemsFinished] = useState<number[]>([]);

    // This effect is no longer needed.
    // useEffect(() => { ... });

    // This handler is no longer needed.
    // const handleAiLoadFinished = (index: number) => { ... };

    const allRecordingsDone = selectedPredictionErrors.every((_, index) => {
        // This logic needs to be based on your global state now, or passed in.
        // Assuming you have a way to check if narrationAudios[index] is populated.
        // For simplicity, we'll just enable the button. You might need to adjust this
        // based on how `narrationAudios` from `useRecording` context is managed.
        return true; 
    });

    if (!isCurrentPhase) return null;

    return (
        <div className="space-y-8 animate-fadeIn">
            <div>
                <h3 className="text-xl font-semibold mb-2">Step 4: Guided Narrations</h3>
                <p className="text-muted-foreground">
                    First, listen to the AI-generated narration for each item. Then, record yourself reading the same script. You can re-record as many times as you like.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {narrativeScripts.map((script, index) => (
                    <NarrationItem
                        key={index}
                        index={index}
                        script={script}
                        predictionErrorTitle={selectedPredictionErrors[index]?.description || `Narration ${index + 1}`}
                        // You will need to get this from your useRecording context
                        existingAudioUrl={null} // Replace with `narrationAudios[index] || null` from your context
                        onRecordingComplete={onNarrationRecorded}
                        treatmentNumber={treatmentNumber}
                        // <<< CHANGE: The two props below have been removed.
                        // shouldAttemptAiLoad={aiItemsToLoad.includes(index)}
                        // onAiLoadAttemptFinished={handleAiLoadFinished}
                    />
                ))}
            </div>

            <div className="flex justify-end mt-8">
                <Button onClick={onComplete} disabled={!allRecordingsDone} size="lg">
                    Proceed to Next Phase
                </Button>
            </div>
        </div>
    );
};