// FILE: src/pages/Treatment5.tsx
// FINAL CORRECTED VERSION

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
import SUDSScale from "@/components/SUDSScale";

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

const Treatment5 = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userEmail, accessLevel } = useAuth();
  const { memory1, memory2, updateNarrationAudio, completeTreatment } = useRecording();
  const isPremium = accessLevel === 'premium_lifetime';
  const THIS_TREATMENT_NUMBER = 5;

  const [currentProcessingStep, setCurrentProcessingStep] = useState<number | null>(null);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [sessionTargetEvent, setSessionTargetEvent] = useState('');
  const [sessionSuds, setSessionSuds] = useState(0);
  const [neutralMemories, setNeutralMemories] = useState<string[]>([]);
  const [selectedErrors, setSelectedErrors] = useState<PredictionError[]>([]);
  const [phase1Response, setPhase1Response] = useState("");
  const [phase2Response, setPhase2Response] = useState("");
  const [phase3Response, setPhase3Response] = useState("");
  const [narrativeScripts, setNarrativeScripts] = useState<string[]>([]);
  const [showResultsView, setShowResultsView] = useState(false);
  const [narrativeAssets, setNarrativeAssets] = useState<NarrativeAsset[]>([]);
  const [areVideosReady, setAreVideosReady] = useState(false);
  const [experienceMode, setExperienceMode] = useState<'audio' | 'video'>('audio');
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [midSessionSuds, setMidSessionSuds] = useState<number | null>(null);

  useEffect(() => {
    setIsLoadingPage(true);
    const locState = location.state as TreatmentLocationState | null;
    if (locState?.sessionTargetEvent) {
      setSessionTargetEvent(locState.sessionTargetEvent);
      setSessionSuds(locState.sessionSuds);
      setNeutralMemories(locState.neutralMemories || []);
      setSelectedErrors(locState.selectedErrors || []);
      setCurrentProcessingStep(0);
      setIsLoadingPage(false);
    } else {
      toast.error(`Calibration data missing. Please re-calibrate.`);
      navigate(`/calibrate/${THIS_TREATMENT_NUMBER}`, { replace: true });
    }
  }, [location.state, navigate]);

  useEffect(() => {
    if (!isPremium || !userEmail) return;
    const fetchNarrativeAssets = async () => {
      const sessionId = `${userEmail}_t${THIS_TREATMENT_NUMBER}`;
      const { data, error } = await supabase.from('narratives').select('*').eq('session_id', sessionId).order('narrative_index');
      if (error) { console.error("Error fetching assets:", error); return; }
      if (data && data.length === 11 && data.every(item => item.video_url)) {
        setNarrativeAssets(data);
        setAreVideosReady(true);
        clearInterval(intervalId);
      }
    };
    const intervalId = setInterval(fetchNarrativeAssets, 15000);
    fetchNarrativeAssets();
    return () => clearInterval(intervalId);
  }, [isPremium, userEmail]);

  const generateNarrativeScripts = useCallback(() => {
    if (!memory1 || !memory2 || !sessionTargetEvent || selectedErrors.length !== 11) return;
    setNarrativeScripts(selectedErrors.map(e => `Imagine... ${e.description}.`));
  }, [memory1, memory2, sessionTargetEvent, selectedErrors]);

  useEffect(() => { if (currentProcessingStep !== null && currentProcessingStep >= 4) { generateNarrativeScripts(); } }, [currentProcessingStep, generateNarrativeScripts]);

  const handlePracticeBoothComplete = useCallback(() => setCurrentProcessingStep(1), []);
  const handlePhase1Complete = useCallback(() => setCurrentProcessingStep(2), []);
  const handlePhase2Complete = useCallback(() => setCurrentProcessingStep(3), []);
  const handlePhase3Complete = useCallback(() => setCurrentProcessingStep(4), []);
  const handleNarrationPhaseComplete = useCallback(() => setCurrentProcessingStep(4.5), []);
  const handleMidSudsComplete = useCallback(() => { setCurrentProcessingStep(5); }, []);
  const handlePhase5Complete = useCallback(() => setCurrentProcessingStep(6), []);
  const handleUserNarrationRecorded = useCallback((index: number, audioUrl: string | null) => { updateNarrationAudio?.(index, audioUrl); }, [updateNarrationAudio]);
  const handlePhase6Complete = useCallback((finalSuds: number) => { 
      if (completeTreatment) {
        completeTreatment(`Treatment ${THIS_TREATMENT_NUMBER}`, finalSuds, sessionSuds);
        setShowResultsView(true);
      }
  }, [completeTreatment, sessionSuds]);
  
  const getPhaseTitle = () => {
    if (currentProcessingStep === 0) return "Practice Session";
    if (currentProcessingStep !== null && currentProcessingStep >= 1 && currentProcessingStep < 4) return `Processing Phase ${currentProcessingStep}`;
    if (currentProcessingStep === 4) return experienceMode === 'audio' ? "Guided Narrations (Audio)" : "Visual Narratives (Video)";
    if (currentProcessingStep === 4.5) return "Mid-Session Checkpoint";
    if (currentProcessingStep === 5) return "Reverse Integration";
    if (currentProcessingStep === 6) return "Final SUDS Rating";
    return "Loading Phase...";
  };

  if (isLoadingPage) { return <div>Loading...</div>; }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <Button variant="ghost" className="mb-6 -ml-4" onClick={() => navigate("/")} disabled={showResultsView}> <ArrowLeft /> Back </Button>
        {showResultsView ? (
          <div>...Results...</div>
        ) : (
          <>
            <div className="text-center"><h1>Treatment {THIS_TREATMENT_NUMBER}</h1><p>{getPhaseTitle()}</p></div>
            
            {currentProcessingStep === 0 && <PracticeBooth neutralMemory={neutralMemories[0]} onComplete={handlePracticeBoothComplete} />}
            {currentProcessingStep === 1 && <PhaseOne isCurrentPhase={true} response={phase1Response} onResponseChange={setPhase1Response} onComplete={handlePhase1Complete} />}
            {currentProcessingStep === 2 && <PhaseTwo isCurrentPhase={true} response={phase2Response} onResponseChange={setPhase2Response} onComplete={handlePhase2Complete} />}
            {currentProcessingStep === 3 && <PhaseThree isCurrentPhase={true} response={phase3Response} onResponseChange={setPhase3Response} onComplete={handlePhase3Complete} />}

            {currentProcessingStep === 4 && (
              <div className="space-y-6">
                {isPremium && areVideosReady && (
                  <div className="p-4 border rounded-lg text-center">
                    <h3>Choose Your Experience</h3>
                    <div className="flex justify-center gap-4 mt-2">
                      <Button onClick={() => setExperienceMode('audio')} variant={experienceMode === 'audio' ? 'default' : 'outline'}><Music />Audio</Button>
                      <Button onClick={() => setExperienceMode('video')} variant={experienceMode === 'video' ? 'default' : 'outline'}><Video />Video</Button>
                    </div>
                  </div>
                )}
                {experienceMode === 'audio' ? (
                  <NarrationPhase isCurrentPhase={true} narrativeScripts={narrativeScripts} selectedPredictionErrors={selectedErrors} onNarrationRecorded={handleUserNarrationRecorded} onComplete={handleNarrationPhaseComplete} treatmentNumber={THIS_TREATMENT_NUMBER} />
                ) : (
                  <div className="space-y-4">
                    <PersonalizedVideoPlayer videoUrl={narrativeAssets[currentVideoIndex]?.video_url} title={`Visual Narrative ${currentVideoIndex + 1}`} />
                    <div className="flex justify-between">
                      <Button onClick={() => setCurrentVideoIndex(p => p - 1)} disabled={currentVideoIndex === 0}>Prev</Button>
                      {currentVideoIndex < 10 ? (<Button onClick={() => setCurrentVideoIndex(p => p + 1)}>Next</Button>) : (<Button onClick={handleNarrationPhaseComplete}>Finish</Button>)}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {currentProcessingStep === 4.5 && (
              <div className="p-6 border rounded-lg">
                <h3 className="text-xl font-semibold">Mid-Session Checkpoint</h3>
                <SUDSScale initialValue={midSessionSuds ?? sessionSuds} onValueChange={setMidSessionSuds} />
                <Button onClick={handleMidSudsComplete} className="w-full">Continue</Button>
              </div>
            )}

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

            {currentProcessingStep === 6 && sessionTargetEvent && ( <PhaseSix isCurrentPhase={true} targetEventTranscript={sessionTargetEvent} onComplete={handlePhase6Complete} treatmentNumber={THIS_TREATMENT_NUMBER}/> )}
          </>
        )}
      </div>
    </div>
  );
};
export default Treatment5;
