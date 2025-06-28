// FILE: src/components/treatment/PhaseFive.tsx
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
interface PhaseFiveProps { isCurrentPhase: boolean; selectedPredictionErrors: PredictionError[]; onComplete: () => void; treatmentNumber: number; }
interface ReversedScriptItem { originalIndex: number; title: string; reversedText: string; aiAudioUrl?: string | null; isLoadingAi?: boolean; aiError?: string | null; }
export const PhaseFive: React.FC<PhaseFiveProps> = ({ isCurrentPhase, selectedPredictionErrors, onComplete, treatmentNumber }) => {
  const { memory1, memory2, targetEventTranscript: sessionTargetEvent, currentlyPlayingAiIndex, setCurrentlyPlayingAiIndex } = useRecording();
  const { accessLevel, userEmail } = useAuth();
  const [indicesForReversal, setIndicesForReversal] = useState<number[]>([]);
  const [reversedScriptObjects, setReversedScriptObjects] = useState<ReversedScriptItem[]>([]);
  const [isSelectionComplete, setIsSelectionComplete] = useState(false);
  const [userRecordedReverseAudios, setUserRecordedReverseAudios] = useState<(string|null)[]>([]);
  useEffect(() => { if (!isCurrentPhase) { setIndicesForReversal([]); setReversedScriptObjects([]); setIsSelectionComplete(false); setUserRecordedReverseAudios([]);} }, [isCurrentPhase]);
  const handleNarrationToReverseSelect = useCallback((idx: number) => { setIndicesForReversal(p => p.includes(idx) ? p.filter(i => i !== idx) : (p.length < 8 ? [...p, idx] : p)); }, []);
  const generateAndPrepareReverseScripts = useCallback(() => { /* ... (full function) ... */ }, [/* ...deps... */]);
  const triggerSingleReverseAiLoad = useCallback(async (rIdx: number) => { /* ... (full function) ... */ }, [/* ...deps... */]);
  useEffect(() => { if (isSelectionComplete && accessLevel === 'premium_lifetime') { reversedScriptObjects.forEach((_, i) => triggerSingleReverseAiLoad(i)); } }, [isSelectionComplete, accessLevel, reversedScriptObjects, triggerSingleReverseAiLoad]);
  const handleUserReverseNarrationComplete = useCallback((idx: number, url: string|null) => { /* ... */ }, []);
  const handleToggleReverseAiPlayback = (rIdx: number) => { const pId = -(rIdx + 1); setCurrentlyPlayingAiIndex(currentlyPlayingAiIndex === pId ? null : pId); };
  if (!isCurrentPhase) return null;
  const allUserReversalsRecorded = isSelectionComplete && reversedScriptObjects.length > 0 && userRecordedReverseAudios.filter(Boolean).length === reversedScriptObjects.length;
  return (
    <div className="space-y-6 p-4 border rounded-lg">
        {!isSelectionComplete ? (<div className="space-y-4"><h4>Select 8 Narratives for Reversal:</h4><div className="space-y-2 max-h-60 overflow-y-auto p-2 border rounded">{selectedPredictionErrors.map((pe,oi)=>(<div key={pe.id} className="flex items-center gap-3"><Checkbox id={`rs-${pe.id}`} checked={indicesForReversal.includes(oi)} onCheckedChange={()=>handleNarrationToReverseSelect(oi)} disabled={indicesForReversal.length>=8 && !indicesForReversal.includes(oi)}/><label htmlFor={`rs-${pe.id}`} className="flex-1"><span className="font-medium">{pe.title}</span></label></div>))}</div><Button onClick={generateAndPrepareReverseScripts} disabled={indicesForReversal.length!==8} className="w-full"><ArrowDown/>Confirm & Prepare</Button></div>)
        : (<div className="space-y-4"><h4>Reversed Narratives:</h4><div className="grid md:grid-cols-2 gap-4">{reversedScriptObjects.map((rs,rIdx)=>(<div key={rs.originalIndex} className="p-3 bg-black/10 rounded-lg space-y-2 border"><p><span className="italic">{rs.title}</span> (Reversed)</p><div className="whitespace-pre-wrap text-sm p-2 bg-background rounded max-h-32 overflow-y-auto">{rs.reversedText}</div><h5>Your Recording:</h5><NarrationRecorder index={rIdx} onRecordingComplete={(url)=>handleUserReverseNarrationComplete(rIdx, url)} existingAudioUrl={userRecordedReverseAudios[rIdx]}/>{accessLevel==='premium_lifetime' && (<div className="mt-2 pt-2 border-t"><h5>AI Version:</h5>{rs.isLoadingAi && <div><Loader2 className="inline animate-spin"/>Loading...</div>}{rs.aiError && !rs.isLoadingAi && <div className="text-red-500">{rs.aiError} <Button onClick={()=>triggerSingleReverseAiLoad(rIdx)} size="sm">Retry</Button></div>}{rs.aiAudioUrl && !rs.isLoadingAi && !rs.aiError && <AnimatedLogoWithAudio audioUrl={rs.aiAudioUrl} width={100} height={100} playButtonText={`Play Rev ${rIdx+1}`} animationVariant={rIdx+1} forceIsPlaying={currentlyPlayingAiIndex===-(rIdx+1)} onTogglePlay={()=>handleToggleReverseAiPlayback(rIdx)} onPlaybackEnd={()=>handleToggleReverseAiPlayback(rIdx)} showLoadingText={true}/>}</div>)}</div>))}</div></div>)}
        {allUserReversalsRecorded && (<div className="border-t pt-4 mt-6"><Button onClick={onComplete} className="w-full">All Reverse Done - Proceed<ArrowRight/></Button></div>)}
    </div>
  );
};