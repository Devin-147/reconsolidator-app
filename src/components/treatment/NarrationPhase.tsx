// FILE: src/components/treatment/NarrationPhase.tsx
import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { NarrationItem } from "./NarrationItem";
import { ArrowRight } from "lucide-react";
import { useRecording } from "@/contexts/RecordingContext";
import { useAuth } from "@/contexts/AuthContext"; 
import { type PredictionError } from "@/components/PredictionErrorSelector"; 
interface NarrationPhaseProps { isCurrentPhase: boolean; narrativeScripts: string[]; selectedPredictionErrors: PredictionError[]; onComplete: () => void; treatmentNumber: number; onNarrationRecorded: (index: number, audioUrl: string | null) => void; }
export const NarrationPhase: React.FC<NarrationPhaseProps> = ({ isCurrentPhase, narrativeScripts, selectedPredictionErrors, onComplete, treatmentNumber, onNarrationRecorded }) => {
  const { narrationAudios, accessLevel } = useRecording();
  const [currentAiLoadPermissionIndex, setCurrentAiLoadPermissionIndex] = useState<number>(-1);
  const [phaseReadyForAiProcessing, setPhaseReadyForAiProcessing] = useState(false);
  useEffect(() => { if (isCurrentPhase && narrativeScripts?.length > 0 && !phaseReadyForAiProcessing) { setPhaseReadyForAiProcessing(true); if (accessLevel === 'premium_lifetime') { setCurrentAiLoadPermissionIndex(0); } } }, [isCurrentPhase, narrativeScripts, accessLevel, phaseReadyForAiProcessing]);
  const handleAiNarrationItemCompleted = useCallback((completedItemIndex: number) => { if (accessLevel === 'premium_lifetime') { const nextIndex = completedItemIndex + 1; if (nextIndex < narrativeScripts.length) { setTimeout(() => { setCurrentAiLoadPermissionIndex(nextIndex); }, 300); } else { setCurrentAiLoadPermissionIndex(-1); } } }, [accessLevel, narrativeScripts.length]);
  if (!isCurrentPhase) return null;
  const userRecordedCount = narrationAudios.filter(Boolean).length;
  const allUserNarrationsRecorded = userRecordedCount >= (narrativeScripts?.length || 11);
  return (
    <div className="space-y-6 p-4">
      <div className="text-center"> <h2 className="text-2xl font-semibold text-primary">Step 4: Guided Narrations</h2> <p className="text-muted-foreground">Record each script. For premium users, AI narrations will load automatically.</p> <p className={`mt-2 font-medium ${allUserNarrationsRecorded ? 'text-green-500' : 'text-amber-500'}`}>Recordings: {userRecordedCount} / {narrativeScripts.length || 11}</p> </div>
      <div className="grid md:grid-cols-2 gap-4">{narrativeScripts.map((script, index) => (
        <NarrationItem key={index} index={index} script={script} predictionErrorTitle={selectedPredictionErrors[index]?.title || `Custom`} existingAudioUrl={narrationAudios[index]} onRecordingComplete={onNarrationRecorded} treatmentNumber={treatmentNumber} shouldAttemptAiLoad={phaseReadyForAiProcessing && (accessLevel === 'premium_lifetime' ? currentAiLoadPermissionIndex === index : true)} onAiLoadAttemptFinished={handleAiNarrationItemCompleted} />
      ))}</div>
      <Button onClick={onComplete} disabled={!allUserNarrationsRecorded} className="w-full mt-8" size="lg">All Recordings Complete <ArrowRight className="ml-2" /></Button>
    </div>
  );
};