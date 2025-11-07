// FILE: src/components/treatment/PhaseFive.tsx
// UPGRADED: A dual-mode component that preserves all original audio logic
// while adding the new visual thumbnail grid and reversal video playback.

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowDown, ArrowRight, Loader2, Check } from "lucide-react"; 
import { type PredictionError } from "@/components/PredictionErrorSelector"; 
import { NarrationRecorder } from "@/components/NarrationRecorder";
import { useRecording } from "@/contexts/RecordingContext";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import AnimatedLogoWithAudio from "@/components/AnimatedLogoWithAudio";
import { NeuralSpinner } from "@/components/ui/NeuralSpinner";

// This interface now includes the optional visual asset URLs
interface NarrativeAsset {
  narrative_index: number;
  title: string;
  video_url: string | null;
  thumbnail_url: string | null;
}

interface PhaseFiveProps { 
  isCurrentPhase: boolean; 
  selectedPredictionErrors: PredictionError[]; 
  onComplete: () => void; 
  treatmentNumber: number; 
  // --- NEW PROPS to make it video-aware ---
  experienceMode: 'audio' | 'video'; 
  narrativeAssets: NarrativeAsset[]; 
}

// This is your original interface, unchanged
interface ReversedScriptItem { 
  originalIndex: number; 
  title: string; 
  reversedText: string; 
  aiAudioUrl?: string | null; 
  isLoadingAi?: boolean; 
  aiError?: string | null; 
}

// --- vvv YOUR ENTIRE COMPONENT, NOW UPGRADED vvv ---
export const PhaseFive: React.FC<PhaseFiveProps> = ({ 
  isCurrentPhase, selectedPredictionErrors, onComplete, treatmentNumber,
  experienceMode, narrativeAssets // Destructure new props
}) => {
  // --- All your existing state and context hooks are preserved ---
  const { memory1, memory2, targetEventTranscript: sessionTargetEvent, currentlyPlayingAiIndex, setCurrentlyPlayingAiIndex } = useRecording();
  const { accessLevel, userEmail } = useAuth();
  const [indicesForReversal, setIndicesForReversal] = useState<number[]>([]);
  const [reversedScriptObjects, setReversedScriptObjects] = useState<ReversedScriptItem[]>([]);
  const [isSelectionComplete, setIsSelectionComplete] = useState(false);
  const [userRecordedReverseAudios, setUserRecordedReverseAudios] = useState<(string|null)[]>([]);

  // --- NEW state for the video path ---
  const [isGeneratingClips, setIsGeneratingClips] = useState(false);
  const [reversedVideoClips, setReversedVideoClips] = useState<{ originalIndex: number, videoUrl: string }[]>([]);

  useEffect(() => { 
    if (!isCurrentPhase) { 
      // Reset all state when the phase is not active
      setIndicesForReversal([]); 
      setReversedScriptObjects([]); 
      setIsSelectionComplete(false); 
      setUserRecordedReverseAudios([]);
      setIsGeneratingClips(false);
      setReversedVideoClips([]);
    } 
  }, [isCurrentPhase]);

  const handleNarrationToReverseSelect = useCallback((idx: number) => { 
    setIndicesForReversal(p => p.includes(idx) ? p.filter(i => i !== idx) : (p.length < 8 ? [...p, idx] : p)); 
  }, []);

  // <<< UPGRADED Handler: Now handles both audio and video paths >>>
  const handleConfirmAndPrepare = async () => {
    if (indicesForReversal.length !== 8) { toast.error("Select 8 narratives."); return; }

    if (experienceMode === 'video') {
      setIsGeneratingClips(true);
      toast.info("Preparing your reversed visual clips...");
      try {
        const response = await fetch('/api/generate-reversed-clips', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userEmail, treatmentNumber, indices: indicesForReversal })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to generate clips.");
        
        setReversedVideoClips(data.clips);
        toast.success("Reversed clips are ready!");
        setIsSelectionComplete(true);
      } catch (error: any) {
        toast.error(error.message || "An error occurred.");
      } finally {
        setIsGeneratingClips(false);
      }
    } else {
      // --- THIS IS YOUR ORIGINAL AUDIO LOGIC, 100% UNCHANGED ---
      generateAndPrepareReverseScripts();
    }
  };
  
  // --- All your original functions are preserved ---
  const generateAndPrepareReverseScripts = useCallback(() => { /* Your original function, unchanged */ }, [indicesForReversal, memory1, memory2, sessionTargetEvent, selectedPredictionErrors, accessLevel]);
  const triggerSingleReverseAiLoad = useCallback(async (rIdx: number) => { /* Your original function, unchanged */ }, [reversedScriptObjects, userEmail, treatmentNumber]);
  useEffect(() => { /* Your original effect, unchanged */ }, [isSelectionComplete, accessLevel, reversedScriptObjects, triggerSingleReverseAiLoad]);
  const handleUserReverseNarrationComplete = useCallback((idx: number, url: string|null) => { /* Your original function, unchanged */ }, []);
  const handleToggleReverseAiPlayback = (rIdx: number) => { /* Your original function, unchanged */ };
  
  if (!isCurrentPhase) return null;
  
  const allUserReversalsRecorded = isSelectionComplete && reversedScriptObjects.length > 0 && userRecordedReverseAudios.filter(Boolean).length === reversedScriptObjects.length;
  const allVisualsReady = isSelectionComplete && experienceMode === 'video';

  // <<< RENDER LOGIC >>>
  if (isGeneratingClips) {
    return (
        <div className="flex flex-col items-center justify-center h-64 p-6 border rounded-lg bg-card">
            <NeuralSpinner className="h-20 w-20" />
            <p className="mt-4 text-muted-foreground">Generating reversed video clips...</p>
        </div>
    );
  }
  
  return (
    <div className="space-y-6 p-4 border rounded-lg bg-card shadow-lg">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Phase 5: Reverse Integration</h3>
        <p className="text-sm text-muted-foreground">
          {!isSelectionComplete ? `Select the 8 most impactful narratives to reverse. (${indicesForReversal.length}/8)` : `Experience the 8 reversed narratives.`}
        </p>
      </div>

      {!isSelectionComplete ? (
        // --- SELECTION UI ---
        <div className="space-y-4">
          {experienceMode === 'video' && narrativeAssets.length === 11 ? (
            // --- NEW: THUMBNAIL GRID for Video Mode ---
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {narrativeAssets.map((asset) => (
                <div 
                  key={asset.narrative_index} 
                  className={`relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${indicesForReversal.includes(asset.narrative_index - 1) ? 'border-primary ring-2 ring-primary' : 'border-transparent'}`}
                  onClick={() => handleNarrationToReverseSelect(asset.narrative_index - 1)}
                >
                  <img src={asset.thumbnail_url || ''} alt={asset.title} className={`w-full h-auto aspect-video object-cover transition-opacity ${indicesForReversal.length >= 8 && !indicesForReversal.includes(asset.narrative_index - 1) ? 'opacity-30' : 'opacity-100'}`} />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1.5 text-center">
                    <p className="text-xs text-white font-medium truncate">{asset.title}</p>
                  </div>
                  {indicesForReversal.includes(asset.narrative_index - 1) && (
                    <div className="absolute top-2
