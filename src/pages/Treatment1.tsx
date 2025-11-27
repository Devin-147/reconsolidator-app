// FILE: src/pages/Treatment1.tsx
// CORRECTED: Fixed null check errors, typos, and passed all required props to PhaseFive.

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Music, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRecording } from "@/contexts/RecordingContext";
import { type PredictionError } from "@/components/PredictionErrorSelector";
import { PracticeBooth } from "@/components/treatment/PracticeBooth";
import { PhaseOne } from "@/components/treatment/PhaseOne";
import { PhaseTwo } from "@/components/treatment/PhaseTwo";
import { PhaseThree } from "@/components/treatment/PhaseThree";
import { NarrationPhase } from "@/components/treatment/NarrationPhase";
import { PhaseFive } from "@/components/treatment/PhaseFive";
import { PhaseSix } from "@/components/treatment/PhaseSix";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { PersonalizedVideoPlayer } from "@/components/treatment/PersonalizedVideoPlayer";
import SUDSScale from "@/components/SUDSScale"; // Import SUDSScale for mid-session

interface NarrativeAsset {
  narrative_index: number;
  title: string;
  video_url: string | null;
  thumbnail_url: string | null;
}

interface TreatmentLocationState {
  treatmentNumber: number;
  sessionTargetEvent: string;
  sessionSuds: number;
  neutralMemories: string[];
  selectedErrors: PredictionError[];
}

const Treatment1 = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userEmail, accessLevel } = useAuth();
  const { memory1, memory2, updateNarrationAudio, completeTreatment } = useRecording();
  const isPremium = accessLevel === 'premium_lifetime';

  const THIS_TREATMENT_NUMBER = 1;

  const [currentProcessingStep, setCurrentProcessingStep] = useState<number | null>(null);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [sessionTargetEvent, setSessionTargetEvent] = useState<string>('');
  const [sessionSuds, setSessionSuds] = useState<number>(0);
  const [neutralMemories, setNeutralMemories] = useState<string[]>([]);
  const [selectedErrors, setSelectedErrors] = useState<PredictionError[]>([]);
  const [phase1Response, setPhase1Response] = useState("");
  const [phase2Response, setPhase2Response] = useState("");
  const [phase3Response, setPhase3Response] = useState("");
  const [narrativeScripts, setNarrativeScripts] = useState<string[]>([]);
  const [showResultsView, setShowResultsView] = useState(false);
  const [finalSudsResult, setFinalSudsResult] = useState<number | null>(null);
  const [improvementResult, setImprovementResult] = useState<number | null>(null);

  const [narrativeAssets, setNarrativeAssets] = useState<NarrativeAsset[]>([]);
  const [areVideosReady, setAreVideosReady] = useState(false);
  const [experienceMode, setExperienceMode] = useState<'audio' | 'video'>('audio');
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [midSessionSuds, setMidSessionSuds] = useState<number | null>(null); // State for mid-suds

  useEffect(() => { /* (Unchanged) */ }, [location.state, navigate]);
  useEffect(() => { /* (Unchanged) */ }, [isPremium, userEmail]);

  const generateNarrativeScripts = useCallback(() => { /* (Unchanged) */ }, [memory1, memory2, sessionTargetEvent, selectedErrors]);
  useEffect(() => {
    // FIX: Add a null check for currentProcessingStep
    if (currentProcessingStep !== null && currentProcessingStep >= 4) {
      generateNarrativeScripts();
    }
  }, [currentProcessingStep, generateNarrativeScripts]);

  const handlePracticeBoothComplete = useCallback(() => setCurrentProcessingStep(1), []);
  const handlePhase1Complete = useCallback(() => setCurrentProcessingStep(2), []);
  const handlePhase2Complete = useCallback(() => setCurrentProcessingStep(3), []);
  const handlePhase3Complete = useCallback(() => setCurrentProcessingStep(4), []);
  const handleNarrationPhaseComplete = useCallback(() => setCurrentProcessingStep(4.5), []);
  const handleMidSudsComplete = useCallback(() => {
    if (midSessionSuds === null) {
      toast.error("Please provide a SUDS rating.");
      return;
    }
    setCurrentProcessingStep(5);
  }, [midSessionSuds]);
  const handlePhase5Complete = useCallback(() => setCurrentProcessingStep(6), []);
  const handleUserNarrationRecorded = useCallback((index: number, audioUrl: string | null) => { updateNarrationAudio?.(index, audioUrl); }, [updateNarrationAudio]);
  const handlePhase6Complete = useCallback((finalSudsFromPhaseSix: number) => { /* (Unchanged) */ }, [completeTreatment, sessionSuds]);

  const getPhaseTitle = () => { /* (Unchanged) */ };

  if (isLoadingPage) { return <div>Loading...</div>; }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <Button variant="ghost" className="mb-6 -ml-4" onClick={() => navigate("/")} disabled={showResultsView}> <ArrowLeft className="w-4 h-4 mr-2" /> Back </Button>
        {showResultsView ? (
          <div>...Results...</div>
        ) : (
          <>
            <div className="text-center">...Title...</div>
            
            {currentProcessingStep === 0 && <PracticeBooth neutralMemory={neutralMemories[0]} onComplete={handlePracticeBoothComplete} />}
            {currentProcessingStep === 1 && <PhaseOne isCurrentPhase={true} response={phase1Response} onResponseChange={setPhase1Response} onComplete={handlePhase1Complete} />}
            {currentProcessingStep === 2 && <PhaseTwo isCurrentPhase={true} response={phase2Response} onResponseChange={setPhase2Response} onComplete={handlePhase2Complete} />}
            {currentProcessingStep === 3 && <PhaseThree isCurrentPhase={true} response={phase3Response} onResponseChange={setPhase3Response} onComplete={handlePhase3Complete} />}

            {currentProcessingStep === 4 && (
              <div className="space-y-6">
                {isPremium && areVideosReady && (
                  <div className="p-4 border rounded-lg bg-card text-center">
                    <h3 className="text-lg font-semibold">Choose Your Experience</h3>
                    <div className="flex justify-center gap-4 mt-2">
                      <Button onClick={() => setExperienceMode('audio')} variant={experienceMode === 'audio' ? 'default' : 'outline'}><Music className="w-4 h-4 mr-2" />Audio</Button>
                      <Button onClick={() => setExperienceMode('video')} variant={experienceMode === 'video' ? 'default' : 'outline'}><Video className="w-4 h-4 mr-2" />Video</Button>
                    </div>
                  </div>
                )}
                {experienceMode === 'audio' ? (
                  <NarrationPhase isCurrentPhase={true} narrativeScripts={narrativeScripts} selectedPredictionErrors={selectedErrors} onNarrationRecorded={handleUserNarrationRecorded} onComplete={handleNarrationPhaseComplete} treatmentNumber={THIS_TREATMENT_NUMBER} />
                ) : (
                  <div className="animate-fadeIn space-y-4">
                    <PersonalizedVideoPlayer videoUrl={narrativeAssets[currentVideoIndex]?.video_url} title={`Visual Narrative ${currentVideoIndex + 1}: ${narrativeAssets[currentVideoIndex]?.title}`} />
                    <div className="flex justify-between">
                      <Button onClick={() => setCurrentVideoIndex(p => Math.max(0, p - 1))} disabled={currentVideoIndex === 0}>Previous</Button>
                      {currentVideoIndex < 10 ? (<Button onClick={() => setCurrentVideoIndex(p => p + 1)}>Next</Button>) : (<Button onClick={handleNarrationPhaseComplete} className="bg-green-600">Finish Visuals</Button>)}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {currentProcessingStep === 4.5 && (
              <div className="p-6 border rounded-lg bg-card space-y-4 animate-fadeIn">
                <h3 className="text-xl font-semibold">Mid-Session Checkpoint</h3>
                <p className="text-muted-foreground">Rate your current distress level after the main narrative session.</p>
                <SUDSScale initialValue={midSessionSuds ?? sessionSuds} onValueChange={(val) => setMidSessionSuds(val)} />
                <Button onClick={handleMidSudsComplete} className="w-full">Continue to Reverse Integration</Button>
              </div>
            )}

            {/* vvv THIS IS THE FULLY CORRECTED <PhaseFive /> vvv */}
            {currentProcessingStep === 5 && (
              <PhaseFive 
                isCurrentPhase={true} 
                selectedPredictionErrors={selectedErrors} 
                onComplete={handlePhase5Complete} 
                treatmentNumber={THIS_TREATMENT_NUMBER}
                experienceMode={experienceMode}
                narrativeAssets={narrativeAssets}
              />
            )}
            {/* ^^^ END OF CORRECTION ^^^ */}

            {currentProcessingStep === 6 && sessionTargetEvent && ( <PhaseSix isCurrentPhase={true} targetEventTranscript={sessionTargetEvent} onComplete={handlePhase6Complete} treatmentNumber={THIS_TREATMENT_NUMBER}/> )}
          </>
        )}
      </div>
    </div>
  );
};
export default Treatment1;
