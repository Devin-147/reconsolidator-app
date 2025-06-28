// FILE: src/components/treatment/NarrationPhase.tsx
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { NarrationItem } from "./NarrationItem";
import { ArrowRight } from "lucide-react";
import { useRecording } from "@/contexts/RecordingContext";
import { useAuth } from "@/contexts/AuthContext"; 
import { type PredictionError } from "@/components/PredictionErrorSelector"; 
interface NarrationPhaseProps { isCurrentPhase: boolean; narrativeScripts: string[]; selectedPredictionErrors: PredictionError[]; onComplete: () => void; treatmentNumber: number; onNarrationRecorded: (index: number, audioUrl: string | null) => void; }
export const NarrationPhase: React.FC<NarrationPhaseProps> = ({ isCurrentPhase, narrativeScripts, selectedPredictionErrors, onComplete, treatmentNumber, onNarrationRecorded }) => {
  const { narrationAudios } = useRecording();
  const { accessLevel } = useAuth(); 
  const [shouldInitiateAiLoad, setShouldInitiateAiLoad] = useState(false);
  useEffect(() => { if (isCurrentPhase && narrativeScripts?.length > 0 && !shouldInitiateAiLoad) { setShouldInitiateAiLoad(true); } }, [isCurrentPhase, narrativeScripts, shouldInitiateAiLoad]);
  if (!isCurrentPhase) return null;
  const userRecordedCount = narrationAudios.filter(Boolean).length;
  const allUserNarrationsRecorded = userRecordedCount >= (narrativeScripts?.length || 11);
  return (
    <div className="space-y-6 p-4"> <div className="text-center"> <h2 className="text-2xl font-semibold text-primary">Step 4: Guided Narrations</h2> <ul className="list-disc list-inside text-sm text-muted-foreground"><li>Record yourself reading each script.</li>{accessLevel === 'premium_lifetime' ? <li>AI narrations will load automatically for playback.</li> : <li>Upgrade for AI narrations.</li>}</ul> <p className={`mt-2 ${allUserNarrationsRecorded ? 'text-green-500' : 'text-amber-500'}`}>Recordings: {userRecordedCount} / {narrativeScripts.length || 11}</p> </div>
      <div className="grid md:grid-cols-2 gap-4">{narrativeScripts.map((script, index) => (
        <NarrationItem key={index} index={index} script={script} predictionErrorTitle={selectedPredictionErrors[index]?.title || `Script ${index + 1}`} existingAudioUrl={narrationAudios[index]} onRecordingComplete={onNarrationRecorded} treatmentNumber={treatmentNumber} autoLoadAi={shouldInitiateAiLoad} />
      ))}</div>
      <Button onClick={onComplete} disabled={!allUserNarrationsRecorded} className="w-full mt-8" size="lg">All Recordings Complete - Proceed <ArrowRight className="ml-2" /></Button>
    </div>
  );
};