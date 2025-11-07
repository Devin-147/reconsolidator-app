// FILE: src/pages/Treatment1.tsx
// UPGRADED: Now fetches video data and displays the "Experience Selector" choice.

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
import { supabase } from "@/lib/supabaseClient"; // <<< IMPORTANT: Import Supabase client
import { PersonalizedVideoPlayer } from "@/components/treatment/PersonalizedVideoPlayer";

// Define the shape of our narrative data from the database
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

  // --- EXISTING STATE ---
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

  // --- vvv NEW STATE for video feature vvv ---
  const [narrativeAssets, setNarrativeAssets] = useState<NarrativeAsset[]>([]);
  const [areVideosReady, setAreVideosReady] = useState(false);
  const [experienceMode, setExperienceMode] = useState<'audio' | 'video'>('audio');
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0); // To cycle through the 11 videos
  // --- ^^^ END NEW STATE ^^^ ---

  useEffect(() => {
    // (This useEffect is unchanged)
    setIsLoadingPage(true);
    const locState = location.state as TreatmentLocationState | null;
    if (locState?.sessionTargetEvent) {
      setSessionTargetEvent(locState.sessionTargetEvent); 
      setSessionSuds(locState.sessionSuds);
      setNeutralMemories(locState.neutralMemories);
      setSelectedErrors(locState.selectedErrors);
      setCurrentProcessingStep(0);
      setIsLoadingPage(false);
    } else {
      toast.error(`Calibration data missing. Please re-calibrate.`);
      navigate(`/calibrate/${THIS_TREATMENT_NUMBER}`, { replace: true });
    }
  }, [location.state, navigate]);

  // --- vvv NEW: Effect to fetch video asset data from Supabase vvv ---
  useEffect(() => {
    if (!isPremium || !userEmail) return;

    const fetchNarrativeAssets = async () => {
      const sessionId = `${userEmail}_t${THIS_TREATMENT_NUMBER}`;
      const { data, error } = await supabase
        .from('narratives')
        .select('narrative_index, title, video_url, thumbnail_url')
        .eq('session_id', sessionId)
        .order('narrative_index', { ascending: true });

      if (error) {
        console.error("Error fetching narrative assets:", error);
        return; // Don't stop polling on a single error
      }

      if (data && data.length === 11 && data.every(item => item.video_url)) {
        console.log("All 11 video assets are ready!");
        setNarrativeAssets(data as NarrativeAsset[]);
        setAreVideosReady(true);
        // Once ready, we can stop polling.
        clearInterval(intervalId);
      }
    };
    
    // Poll for the video data every 15 seconds.
    const intervalId = setInterval(fetchNarrativeAssets, 15000);
    fetchNarrativeAssets(); // Check immediately on load

    return () => clearInterval(intervalId);
  }, [isPremium, userEmail]);
  // --- ^^^ END NEW EFFECT ^^^ ---

  const generateNarrativeScripts = useCallback(() => { /* (This function is unchanged) */ }, [memory1, memory2, sessionTargetEvent, selectedErrors]);
  useEffect(() => { if (currentProcessingStep === 4) generateNarrativeScripts(); }, [currentProcessingStep, generateNarrativeScripts]);

  // (All phase completion handlers are unchanged)
  const handlePracticeBoothComplete = useCallback(() => setCurrentProcessingStep(1), []);
  const handlePhase1Complete = useCallback(() => setCurrentProcessingStep(2), []);
  const handlePhase2Complete = useCallback(() => setCurrentProcessingStep(3), []);
  const handlePhase3Complete = useCallback(() => setCurrentProcessingStep(4), []);
  const handleNarrationPhaseComplete = useCallback(() => {
    // After audio/video phase, we now go to our mid-session SUDS
    setCurrentProcessingStep(4.5); // Using a decimal to insert a new step
  }, []);
  const handleMidSudsComplete = useCallback(() => setCurrentProcessingStep(5), []); // New handler
  const handlePhase5Complete = useCallback(() => setCurrentProcessingStep(6), []);
  const handleUserNarrationRecorded = useCallback((index: number, audioUrl: string | null) => { updateNarrationAudio?.(index, audioUrl); }, [updateNarrationAudio]);
  const handlePhase6Complete = useCallback((finalSudsFromPhaseSix: number) => { /* (This function is unchanged) */ }, [completeTreatment, sessionSuds]);

  const getPhaseTitle = () => {
    if (currentProcessingStep === 0) return "Practice Session";
    if (currentProcessingStep >= 1 && currentProcessingStep < 4) return `Processing Phase ${currentProcessingStep}`;
    if (currentProcessingStep === 4) return experienceMode === 'audio' ? "Guided Narrations (Audio)" : "Visual Narratives (Video)";
    if (currentProcessingStep === 4.5) return "Mid-Session Checkpoint";
    if (currentProcessingStep === 5) return "Reverse Integration";
    if (currentProcessingStep === 6) return "Final SUDS Rating";
    return "Loading Phase...";
  };

  if (isLoadingPage) { return <div className="flex justify-center items-center min-h-screen">Loading Treatment...</div>; }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <Button variant="ghost" className="mb-6 -ml-4" onClick={() => navigate("/")} disabled={showResultsView}> <ArrowLeft className="w-4 h-4 mr-2" /> Back to Main Setup </Button>
        {showResultsView ? (
          <div>...Results View...</div> // (Results view JSX is unchanged)
        ) : (
          <>
            <div className="text-center space-y-1 mb-6"> <h1 className="text-3xl md:text-4xl font-bold text-primary">Treatment {THIS_TREATMENT_NUMBER}</h1> <p className="text-lg text-muted-foreground">{getPhaseTitle()}</p> </div>
            
            {currentProcessingStep === 0 && <PracticeBooth neutralMemory={neutralMemories[0]} onComplete={handlePracticeBoothComplete} />}
            {currentProcessingStep === 1 && <PhaseOne isCurrentPhase={true} response={phase1Response} onResponseChange={setPhase1Response} onComplete={handlePhase1Complete} />}
            {currentProcessingStep === 2 && <PhaseTwo isCurrentPhase={true} response={phase2Response} onResponseChange={setPhase2Response} onComplete={handlePhase2Complete} />}
            {currentProcessingStep === 3 && <PhaseThree isCurrentPhase={true} response={phase3Response} onResponseChange={setPhase3Response} onComplete={handlePhase3Complete} />}

            {/* --- vvv UPGRADED NARRATION PHASE vvv --- */}
            {currentProcessingStep === 4 && (
              <div className="space-y-6">
                {isPremium && areVideosReady && (
                  <div className="p-4 border rounded-lg bg-card shadow-lg space-y-3 text-center animate-fadeIn">
                    <h3 className="text-lg font-semibold">Choose Your Experience</h3>
                    <div className="flex justify-center gap-4">
                      <Button onClick={() => setExperienceMode('audio')} variant={experienceMode === 'audio' ? 'default' : 'outline'}><Music className="w-4 h-4 mr-2" />Audio</Button>
                      <Button onClick={() => setExperienceMode('video')} variant={experienceMode === 'video' ? 'default' : 'outline'}><Video className="w-4 h-4 mr-2" />Video</Button>
                    </div>
                  </div>
                )}
                
                {experienceMode === 'audio' ? (
                  <NarrationPhase isCurrentPhase={true} narrativeScripts={narrativeScripts} selectedPredictionErrors={selectedErrors} onNarrationRecorded={handleUserNarrationRecorded} onComplete={handleNarrationPhaseComplete} treatmentNumber={THIS_TREATMENT_NUMBER} />
                ) : (
                  <div className="animate-fadeIn space-y-4">
                    <PersonalizedVideoPlayer 
                      videoUrl={narrativeAssets[currentVideoIndex]?.video_url}
                      title={`Visual Narrative ${currentVideoIndex + 1} of 11: ${narrativeAssets[currentVideoIndex]?.title}`} 
                    />
                    <div className="flex justify-between">
                      <Button onClick={() => setCurrentVideoIndex(p => Math.max(0, p - 1))} disabled={currentVideoIndex === 0}>Previous</Button>
                      {currentVideoIndex < 10 ? (
                        <Button onClick={() => setCurrentVideoIndex(p => p + 1)}>Next</Button>
                      ) : (
                        <Button onClick={handleNarrationPhaseComplete} className="bg-green-600 hover:bg-green-700">Finish Visuals</Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* --- ^^^ END UPGRADED NARRATION PHASE ^^^ --- */}
            
            {/* --- vvv NEW MID-SESSION SUDS PHASE vvv --- */}
            {currentProcessingStep === 4.5 && (
              <div className="p-6 border rounded-lg bg-card shadow-lg space-y-4 animate-fadeIn">
                <h3 className="text-xl font-semibold">Mid-Session Checkpoint</h3>
                <p className="text-muted-foreground">You've completed the main narrative session. Take a moment to bring the original target event to mind and rate your current level of distress.</p>
                {/* We'll need a simple SUDS scale here, for now a button will do */}
                <Button onClick={handleMidSudsComplete} className="w-full">Continue to Reverse Integration</Button>
              </div>
            )}
            {/* --- ^^^ END NEW MID-SESSION SUDS PHASE ^^^ --- */}

            {currentProcessingStep === 5 && <PhaseFive isCurrentPhase={true} selectedPredictionErrors={selectedErrors} onComplete={handlePhase5Complete} treatmentNumber={THIS_TREAT_NUMBER} />}
            {currentProcessingStep === 6 && sessionTargetEvent && ( <PhaseSix isCurrentPhase={true} targetEventTranscript={sessionTargetEvent} onComplete={handlePhase6Complete} treatmentNumber={THIS_TREATMENT_NUMBER}/> )}
          </>
        )}
      </div>
    </div>
  );
};
export default Treatment1;
