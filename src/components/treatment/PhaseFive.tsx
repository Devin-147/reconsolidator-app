// FILE: src/components/treatment/PhaseFive.tsx
// Corrected props passed to AnimatedLogoWithAudio.

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowDown, ArrowRight, Loader2 } from "lucide-react"; 
import { type PredictionError } from "@/components/PredictionErrorSelector"; 
import { NarrationRecorder } from "@/components/NarrationRecorder";
import { useRecording } from "@/contexts/RecordingContext";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import AnimatedLogoWithAudio from "@/components/AnimatedLogoWithAudio";
import MyActualLogo from "@/components/MyActualLogo";

interface PhaseFiveProps { /* ... (same as before) ... */ }
interface ReversedScriptItem { /* ... (same as before) ... */ }

export const PhaseFive: React.FC<PhaseFiveProps> = ({ isCurrentPhase, selectedPredictionErrors, onComplete, treatmentNumber }) => {
  const { memory1, memory2, targetEventTranscript: sessionTargetEvent, currentlyPlayingAiIndex, setCurrentlyPlayingAiIndex } = useRecording();
  const { accessLevel, userEmail } = useAuth();
  const userIdForApi = userEmail;
  const [indicesForReversal, setIndicesForReversal] = useState<number[]>([]);
  const [reversedScriptObjects, setReversedScriptObjects] = useState<ReversedScriptItem[]>([]);
  const [isSelectionComplete, setIsSelectionComplete] = useState(false);
  const [userRecordedReverseAudios, setUserRecordedReverseAudios] = useState<(string|null)[]>([]);
  
  const handleNarrationToReverseSelect = useCallback((idx: number) => { setIndicesForReversal(p => p.includes(idx) ? p.filter(i => i !== idx) : (p.length < 8 ? [...p, idx] : p)); }, []);
  const generateAndPrepareReverseScripts = useCallback(() => { /* ... (same as before) ... */ }, [/* ...deps... */]);
  const triggerSingleReverseAiLoad = useCallback(async (rIdx: number) => { /* ... (same as before) ... */ }, [/* ...deps... */]);
  useEffect(() => { if (isSelectionComplete && accessLevel === 'premium_lifetime' && reversedScriptObjects.length > 0) { reversedScriptObjects.forEach((_, i) => triggerSingleReverseAiLoad(i)); } }, [isSelectionComplete, accessLevel, reversedScriptObjects, triggerSingleReverseAiLoad]);
  const handleUserReverseNarrationComplete = useCallback((idx: number, url: string|null) => { /* ... */ }, []);
  const handleToggleReverseAiPlayback = (rIdx: number) => { const playbackId = -(rIdx + 1); setCurrentlyPlayingAiIndex(currentlyPlayingAiIndex === playbackId ? null : playbackId); };
  
  if (!isCurrentPhase) return null;
  const allUserReversalsRecorded = isSelectionComplete && reversedScriptObjects.length > 0 && userRecordedReverseAudios.filter(Boolean).length === reversedScriptObjects.length;

  return (
    <div className="space-y-6 p-4 border rounded-lg">
      {/* ... (Selection UI JSX is IDENTICAL) ... */}
      {isSelectionComplete && reversedScriptObjects.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-base">Reversed Narratives:</h4>
          <div className="grid md:grid-cols-2 gap-4">
            {reversedScriptObjects.map((rsItem, rIdx) => (
              <div key={rsItem.originalIndex} className="p-3 bg-black/10 rounded-lg space-y-2 border">
                 <p className="text-xs"><span className="italic">{rsItem.title}</span> (Reversed)</p>
                 <div className="whitespace-pre-wrap text-sm p-2 bg-background rounded max-h-32 overflow-y-auto">{rsItem.reversedText}</div>
                 <h5 className="text-xs pt-1">Your Recording (7s max):</h5>
                 <NarrationRecorder index={rIdx} onRecordingComplete={(url) => handleUserReverseNarrationComplete(rIdx, url)} existingAudioUrl={userRecordedReverseAudios[rIdx]} />
                 {accessLevel === 'premium_lifetime' && (
                    <div className="mt-2 pt-2 border-t space-y-2">
                      <h5 className="text-xs text-primary">AI Version:</h5>
                      {rsItem.isLoadingAi && <div><Loader2 className="inline mr-1 animate-spin"/>Loading...</div>}
                      {rsItem.aiError && !rsItem.isLoadingAi && <div className="text-xs text-red-500">{rsItem.aiError} <Button onClick={()=>triggerSingleReverseAiLoad(rIdx)} size="sm" variant="link">Retry</Button></div>}
                      {rsItem.aiAudioUrl && !rsItem.isLoadingAi && !rsItem.aiError && 
                        <AnimatedLogoWithAudio 
                            audioUrl={rsItem.aiAudioUrl} 
                            width={100} height={100} 
                            playButtonText={`Play AI Rev ${rIdx+1}`} 
                            animationVariant={rIdx + 1}
                            forceIsPlaying={currentlyPlayingAiIndex === -(rIdx + 1)} // <<< PROP PASSED
                            onTogglePlay={() => handleToggleReverseAiPlayback(rIdx)}   // <<< PROP PASSED
                            onPlaybackEnd={() => handleToggleReverseAiPlayback(rIdx)} // <<< PROP PASSED
                            showLoadingText={true}
                        />
                      }
                    </div>
                 )}
              </div>
            ))}
          </div>
        </div>
      )}
      {isSelectionComplete && allUserReversalsRecorded && ( <div className="border-t pt-4 mt-6"> <Button onClick={onComplete} className="w-full">All Reverse Done - Proceed <ArrowRight className="ml-2"/></Button> </div> )}
    </div>
  );
};