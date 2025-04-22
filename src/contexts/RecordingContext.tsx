// src/contexts/RecordingContext.tsx
import React, { createContext, useContext, useState, useRef, ReactNode, useCallback } from "react";
import { TreatmentResult } from "@/types/recording"; // Ensure path is correct
import type { SetStateAction } from "react";

interface RecordingContextType {
  audioBlobTarget: Blob | null;
  setAudioBlobTarget: (blob: Blob | null) => void;
  targetEventTranscript: string;
  setTargetEventTranscript: (transcript: string) => void;
  isRecordingTarget: boolean;
  setIsRecordingTarget: (isRecording: boolean) => void;
  memory1: string;
  setMemory1: (memory: string) => void;
  isRecording1: boolean;
  setIsRecording1: (isRecording: boolean) => void;
  memory2: string;
  setMemory2: (memory: string) => void;
  isRecording2: boolean;
  setIsRecording2: (isRecording: boolean) => void;
  calibrationSuds: number;
  setCalibrationSuds: (level: number) => void;
  memoriesSaved: boolean;
  setMemoriesSaved: (saved: boolean) => void;
  completedTreatments: TreatmentResult[];
  setCompletedTreatments: React.Dispatch<SetStateAction<TreatmentResult[]>>;
  narrationAudios: (string | null)[];
  updateNarrationAudio: (index: number, audioUrl: string | null) => void;
  completeTreatment: (treatmentName: string, finalSuds: number) => void;
  showsSidebar: boolean;
  setShowsSidebar: (show: boolean) => void;
  // Removed separate sudsLevel
}

const RecordingContext = createContext<RecordingContextType | undefined>(undefined);

export const RecordingProvider = ({ children }: { children: ReactNode }) => {
  const [audioBlobTarget, setAudioBlobTarget] = useState<Blob | null>(null);
  const [targetEventTranscript, setTargetEventTranscript] = useState("");
  const [isRecordingTarget, setIsRecordingTarget] = useState(false);
  const [memory1, setMemory1] = useState("");
  const [isRecording1, setIsRecording1] = useState(false);
  const [memory2, setMemory2] = useState("");
  const [isRecording2, setIsRecording2] = useState(false);
  const [calibrationSuds, setCalibrationSuds] = useState(0);
  const [memoriesSaved, setMemoriesSaved] = useState(false);
  const [completedTreatments, setCompletedTreatments] = useState<TreatmentResult[]>([]);
  const [narrationAudios, setNarrationAudios] = useState<(string | null)[]>(Array(11).fill(null));
  const [showsSidebar, setShowsSidebar] = useState(false);

  const updateNarrationAudio = useCallback((index: number, audioUrl: string | null) => {
    setNarrationAudios((prev) => {
      if (index < 0 || index >= prev.length) return prev;
      const newAudios = [...prev]; newAudios[index] = audioUrl; return newAudios;
    });
  }, []);

  const completeTreatment = useCallback((treatmentName: string, finalSuds: number) => {
    const treatmentNumber = treatmentName === "Follow-Up" ? 0 : parseInt(treatmentName.replace(/[^0-9]/g, ''), 10);
    let improvementPercentage: number | null = null; // Initialize as null
    let isImprovement: boolean | undefined = undefined; // Initialize as undefined

    if (typeof calibrationSuds === 'number' && calibrationSuds > 0) {
        const calculatedImprovement = ((calibrationSuds - finalSuds) / calibrationSuds) * 100;
        if (!isNaN(calculatedImprovement) && isFinite(calculatedImprovement)) {
            improvementPercentage = calculatedImprovement;
            // --- FIX: Calculate isImprovement only if percentage is valid ---
            isImprovement = improvementPercentage > 0;
            // --- END FIX ---
        }
    }

    // Create result object matching the corrected type
    const treatmentResult: TreatmentResult = {
      treatmentNumber,
      finalSuds,
      improvementPercentage, // Can be null
      isImprovement,         // Can be undefined
      completedAt: new Date().toISOString(),
      initialSuds: calibrationSuds,
    };

    console.log("Completing treatment:", treatmentResult);
    setCompletedTreatments(prev => [...prev.filter(t => t.treatmentNumber !== treatmentNumber), treatmentResult].sort((a, b) => a.treatmentNumber - b.treatmentNumber));
    // Persist results to backend here
  }, [calibrationSuds]); // Dependency remains


  return (
    <RecordingContext.Provider
      value={{
        audioBlobTarget, setAudioBlobTarget, targetEventTranscript, setTargetEventTranscript,
        isRecordingTarget, setIsRecordingTarget, memory1, setMemory1, isRecording1, setIsRecording1,
        memory2, setMemory2, isRecording2, setIsRecording2, calibrationSuds, setCalibrationSuds,
        showsSidebar, setShowsSidebar, memoriesSaved, setMemoriesSaved,
        completedTreatments, setCompletedTreatments, narrationAudios, updateNarrationAudio,
        completeTreatment,
      }}
    >
      {children}
    </RecordingContext.Provider>
  );
};

export const useRecording = () => {
  const context = useContext(RecordingContext);
  if (!context) { throw new Error("useRecording must be used within a RecordingProvider"); }
  return context;
};