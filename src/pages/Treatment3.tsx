// FILE: src/pages/Treatment3.tsx
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

const Treatment3 = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userEmail, accessLevel } = useAuth();
  const { memory1, memory2, updateNarrationAudio, completeTreatment } = useRecording();
  const isPremium = accessLevel === 'premium_lifetime';
  const THIS_TREATMENT_NUMBER = 3;

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
  const [finalSudsResult, setFinalSudsResult] = useState<number | null>(null);
  const [improvementResult, setImprovementResult] = useState<number | null>(null);
  const [midSessionSuds, setMidSessionSuds] = useState<number | null>(null);
  const [narrativeAssets, setNarrativeAssets] = useState<NarrativeAsset[]>([]);
  const [areVideosReady, setAreVideosReady] = useState(false);
  const [experienceMode, setExperienceMode] = useState<'audio' | 'video'>('audio');
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

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
