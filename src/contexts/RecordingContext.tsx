// FILE: src/contexts/RecordingContext.tsx

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { type TreatmentResult } from "@/types/recording"; 
import type { SetStateAction } from "react";
import { useAuth } from './AuthContext';
import { toast } from "sonner"; 

interface RecordingContextType {
  audioBlobTarget: Blob | null;
  setAudioBlobTarget: (blob: Blob | null) => void;
  targetEventTranscript: string;
  setTargetEventTranscript: (transcript: string) => void;
  memory1: string;
  setMemory1: (memory: string) => void;
  memory2: string;
  setMemory2: (memory: string) => void;
  calibrationSuds: number | null;
  setCalibrationSuds: (level: number | null) => void;
  memoriesSaved: boolean;
  setMemoriesSaved: (saved: boolean) => void;
  completedTreatments: TreatmentResult[];
  setCompletedTreatments: React.Dispatch<SetStateAction<TreatmentResult[]>>;
  narrationAudios: (string | null)[];
  updateNarrationAudio: (index: number, audioUrl: string | null) => void;
  completeTreatment: (treatmentName: string, finalSuds: number, initialSudsForSession: number) => Promise<void>; 
  showsSidebar: boolean;
  setShowsSidebar: (show: boolean) => void;
  currentlyPlayingAiIndex: number | null;
  setCurrentlyPlayingAiIndex: (index: number | null) => void; 
}

const RecordingContext = createContext<RecordingContextType | undefined>(undefined);

export const RecordingProvider = ({ children }: { children: ReactNode }) => {
  const { userEmail } = useAuth();

  const [audioBlobTarget, setAudioBlobTarget] = useState<Blob | null>(null);
  const [targetEventTranscript, setTargetEventTranscript] = useState("");
  const [memory1, setMemory1] = useState("");
  const [memory2, setMemory2] = useState("");
  const [calibrationSuds, setCalibrationSuds] = useState<number | null>(null);
  const [memoriesSaved, setMemoriesSaved] = useState(false);
  const [completedTreatments, setCompletedTreatments] = useState<TreatmentResult[]>([]);
  const [narrationAudios, setNarrationAudios] = useState<(string | null)[]>(Array(11).fill(null));
  const [showsSidebar, setShowsSidebar] = useState(false);
  const [currentlyPlayingAiIndex, setCurrentlyPlayingAiIndex] = useState<number | null>(null);

  const updateNarrationAudio = useCallback((index: number, audioUrl: string | null) => {
    console.log(`RecordingContext: Updating user narration ${index} with URL: ${audioUrl ? 'exists' : 'null'}`);
    setNarrationAudios((prev) => {
      if (index < 0 || index >= prev.length) { 
        console.warn(`updateNarrationAudio: Invalid index ${index}`); 
        return prev; 
      }
      const newAudios = [...prev];
      if (newAudios[index] && newAudios[index]?.startsWith('blob:')) { 
        URL.revokeObjectURL(newAudios[index]!); 
      }
      newAudios[index] = audioUrl;
      return newAudios;
    });
  }, []);

  const completeTreatment = useCallback(async (treatmentName: string, finalSuds: number, initialSudsForSession: number): Promise<void> => {
    if (typeof initialSudsForSession !== 'number') {
         console.error("Cannot complete treatment: Session SUDS rating is missing.");
         toast.error("Cannot save result: Session SUDS rating is missing.");
         return; 
    }

    const treatmentNumber = parseInt(treatmentName.replace(/[^0-9]/g, ''), 10) || 0;
    let improvementPercentage: number | null = null;
    let isImprovement: boolean | undefined = undefined;

    if (initialSudsForSession > 0) {
        const calculatedImprovement = ((initialSudsForSession - finalSuds) / initialSudsForSession) * 100;
        if (!isNaN(calculatedImprovement) && isFinite(calculatedImprovement)) {
            improvementPercentage = calculatedImprovement;
            isImprovement = improvementPercentage > 0;
        }
    }
    const treatmentResult: TreatmentResult = {
      treatmentNumber,
      finalSuds,
      improvementPercentage,
      isImprovement,
      completedAt: new Date().toISOString(),
      initialSuds: initialSudsForSession,
    };

    console.log("RecordingContext: Completing treatment locally:", treatmentResult);
    setCompletedTreatments(prev => [...prev.filter(t => t.treatmentNumber !== treatmentNumber), treatmentResult].sort((a, b) => a.treatmentNumber - b.treatmentNumber));

    if (userEmail && treatmentNumber >= 1 && treatmentNumber <= 5) {
      console.log(`RecordingContext: Sending summary email for T${treatmentNumber}...`);
      try {
        const response = await fetch('/api/send-treatment-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...treatmentResult, userEmail: userEmail }),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("API Error sending summary email:", response.status, errorData);
          toast.warning(`Treatment result saved, but summary email failed (${response.status}).`);
        } else {
           console.log("Summary email API call successful.");
        }
      } catch (error) {
        console.error("Network Error calling send summary email API:", error);
        toast.error("Network error: Could not send summary email.");
      }
    }
  }, [userEmail]); 

  const value = {
    audioBlobTarget,
    setAudioBlobTarget,
    targetEventTranscript,
    setTargetEventTranscript,
    memory1,
    setMemory1,
    memory2,
    setMemory2,
    calibrationSuds,
    setCalibrationSuds,
    showsSidebar,
    setShowsSidebar,
    memoriesSaved,
    setMemoriesSaved,
    completedTreatments,
    setCompletedTreatments,
    narrationAudios,
    updateNarrationAudio,
    completeTreatment,
    currentlyPlayingAiIndex,
    setCurrentlyPlayingAiIndex,
  };

  return (
    <RecordingContext.Provider value={value}>
      {children}
    </RecordingContext.Provider>
  );
};

export const useRecording = () => {
  const context = useContext(RecordingContext);
  if (!context) { throw new Error("useRecording must be used within a RecordingProvider"); }
  return context;
};