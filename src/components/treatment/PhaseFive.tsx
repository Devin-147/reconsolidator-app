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

  const generateAndPrepareReverseScripts = useCallback(() => {
    if (indicesForReversal.length !== 8) { toast.error("Select 8 narratives."); return; }
    if (!memory1 || !memory2 || !sessionTargetEvent || !selectedPredictionErrors || selectedPredictionErrors.length < 11) { toast.error("Base data missing."); return; }
    const newReversedItems: ReversedScriptItem[] = []; let ok = true;
    indicesForReversal.forEach(idx => {
      if (idx < 0 || idx >= selectedPredictionErrors.length) { ok = false; return; }
      const pe = selectedPredictionErrors[idx]; if (!pe) { ok = false; return; }
      newReversedItems.push({ originalIndex: idx, title: pe.title, reversedText: `Reverse Script (7s max):\n${memory2}\nThen, ${pe.description}\nThen, ${sessionTargetEvent}\nThen, ${memory1}`, aiAudioUrl: null, isLoadingAi: false, aiError: null });
    });
    if (!ok || newReversedItems.length !== 8) { toast.error("Failed generating all reversed scripts."); return; }
    setReversedScriptObjects(newReversedItems); setUserRecordedReverseAudios(Array(8).fill(null));
    setIsSelectionComplete(true); toast.success("Reverse scripts prepared.");
    if (accessLevel === 'premium_lifetime') { toast.info("AI narrations will load automatically."); }
  }, [indicesForReversal, memory1, memory2, sessionTargetEvent, selectedPredictionErrors, accessLevel]);

  const triggerSingleReverseAiLoad = useCallback(async (rIdx: number) => {
    if (!reversedScriptObjects || rIdx < 0 || rIdx >= reversedScriptObjects.length) return;
    const item = reversedScriptObjects[rIdx]; if (!item || item.isLoadingAi || item.aiAudioUrl || item.aiError || !userEmail) return;
    setReversedScriptObjects(p => p.map((it, i) => i === rIdx ? {...it, isLoadingAi: true, aiError: null} : it));
    try {
      const res = await fetch('/api/generate-narration-audio', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: item.reversedText, userId: userEmail, treatmentNumber, narrativeIndex: `reverse-${item.originalIndex}` }) });
      if (!res.ok) { let e = `API Err ${res.status}`; try{const j=await res.json();e=j.error||e;}catch{} throw new Error(e); }
      const d = await res.json(); if (!d.audioUrl) throw new Error("No audio URL (rev).");
      setReversedScriptObjects(p => p.map((it, i) => i === rIdx ? {...it, aiAudioUrl: d.audioUrl, isLoadingAi: false} : it));
    } catch (err:any) { setReversedScriptObjects(p => p.map((it, i) => i === rIdx ? {...it, aiError: err.message,isLoadingAi:false} : it)); toast.error(`AI err for "${item.title}": ${err.message}`); }
  }, [reversedScriptObjects, userEmail, treatmentNumber]);

  useEffect(() => { if (isSelectionComplete && accessLevel === 'premium_lifetime') { reversedScriptObjects.forEach((rs, i) => { if (!rs.isLoadingAi && !rs.aiAudioUrl && !rs.aiError) triggerSingleReverseAiLoad(i); }); } }, [isSelectionComplete, accessLevel, reversedScriptObjects, triggerSingleReverseAiLoad]);
  
  const handleUserReverseNarrationComplete = useCallback((idx: number, url: string|null) => { setUserRecordedReverseAudios(p => {const n=[...p]; if(idx>=0 && idx<n.length){if(n[idx]?.startsWith('blob:'))URL.revokeObjectURL(n[idx]!); n[idx]=url;} return n;}); }, []);
  
  const handleToggleReverseAiPlayback = (rIdx: number) => { const pId = -(rIdx + 1); setCurrentlyPlayingAiIndex(currentlyPlayingAiIndex === pId ? null : pId); };
  
  if (!isCurrentPhase) return null;
  
  const allUserReversalsRecorded = isSelectionComplete && reversedScriptObjects.length > 0 && userRecordedReverseAudios.filter(Boolean).length === reversedScriptObjects.length;
  
  return (
    <div className="space-y-6 p-4 border rounded-lg">
      <div className="space-y-2"><h3 className="text-lg font-semibold">Phase 5: Reverse Integration</h3><p className="text-sm text-muted-foreground">{!isSelectionComplete ? `Select 8 narratives to reverse. (${indicesForReversal.length}/8)` : `Record/Listen. (${userRecordedReverseAudios.filter(Boolean).length}/${reversedScriptObjects.length})`}</p></div>
      {!isSelectionComplete ? (
        <div className="space-y-4">
          <h4>Select 8 Narratives for Reversal:</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto p-2 border rounded">{selectedPredictionErrors.map((pe,oi)=>(<div key={pe.id} className="flex items-center gap-3"><Checkbox id={`rs-${pe.id}`} checked={indicesForReversal.includes(oi)} onCheckedChange={()=>handleNarrationToReverseSelect(oi)} disabled={indicesForReversal.length>=8 && !indicesForReversal.includes(oi)}/><label htmlFor={`rs-${pe.id}`} className="flex-1"><span className="font-medium">{pe.title}</span></label></div>))}</div>
          <Button onClick={generateAndPrepareReverseScripts} disabled={indicesForReversal.length!==8} className="w-full"><ArrowDown/> Confirm & Prepare</Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {reversedScriptObjects.map((rs,rIdx)=>(
            <div key={rs.originalIndex} className="p-3 bg-black/10 rounded-lg space-y-2 border">
              <p className="text-xs"><span className="italic">{rs.title}</span> (Reversed)</p>
              <div className="whitespace-pre-wrap text-sm p-2 bg-background rounded max-h-32 overflow-y-auto">{rs.reversedText}</div>
              <h5>Your Recording:</h5>
              <NarrationRecorder index={rIdx} onRecordingComplete={(url)=>handleUserReverseNarrationComplete(rIdx,url)} existingAudioUrl={userRecordedReverseAudios[rIdx]}/>
              {accessLevel==='premium_lifetime' && (
                <div>
                  <h5>AI Version:</h5>
                  {rs.isLoadingAi && <div><Loader2 className="inline animate-spin"/>Loading...</div>}
                  {rs.aiError && <Button onClick={()=>triggerSingleReverseAiLoad(rIdx)}>Retry</Button>}
                  {rs.aiAudioUrl && !rs.isLoadingAi && !rs.aiError && 
                    // <<< FIX: Added `isAnimationActive={true}` to enable animations for premium users.
                    <AnimatedLogoWithAudio 
                      audioUrl={rs.aiAudioUrl} 
                      width={100} 
                      height={100} 
                      playButtonText={`Play Rev ${rIdx+1}`} 
                      animationVariant={rIdx+1} 
                      isAnimationActive={true}
                      forceIsPlaying={currentlyPlayingAiIndex===-(rIdx+1)} 
                      onTogglePlay={()=>handleToggleReverseAiPlayback(rIdx)}
                    />
                  }
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {allUserReversalsRecorded && (<Button onClick={onComplete} className="w-full mt-4">All Reverse Done - Proceed <ArrowRight/></Button>)}
    </div>
  );
};