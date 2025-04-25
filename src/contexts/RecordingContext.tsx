// src/contexts/RecordingContext.tsx
import React, { createContext, useContext, useState, useRef, ReactNode, useCallback } from "react";
import { TreatmentResult } from "@/types/recording"; // Ensure path is correct
import type { SetStateAction } from "react";

// --- Define the shape of the context ---
interface RecordingContextType {
  // Target Event Recording State (Audio + Transcript)
  audioBlobTarget: Blob | null;
  setAudioBlobTarget: (blob: Blob | null) => void;
  targetEventTranscript: string;
  setTargetEventTranscript: (transcript: string) => void;
  isRecordingTarget: boolean; // For Target Event button state
  setIsRecordingTarget: (isRecording: boolean) => void;

  // Memory 1 Recording State
  memory1: string; // Holds the final transcript for Memory 1
  setMemory1: (memory: string) => void;
  isRecording1: boolean; // Recording status for Memory 1 button
  setIsRecording1: (isRecording: boolean) => void;

  // Memory 2 Recording State
  memory2: string; // Holds the final transcript for Memory 2
  setMemory2: (memory: string) => void;
  isRecording2: boolean; // Recording status for Memory 2 button
  setIsRecording2: (isRecording: boolean) => void;

  // SUDS Levels
  calibrationSuds: number; // Initial SUDS set on Activation page
  setCalibrationSuds: (level: number) => void;

  // Treatment Progress State
  memoriesSaved: boolean; // Flag set by Activation page on save
  setMemoriesSaved: (saved: boolean) => void;
  completedTreatments: TreatmentResult[];
  setCompletedTreatments: React.Dispatch<SetStateAction<TreatmentResult[]>>;

  // Narration Audio State (For Treatment processing steps)
  narrationAudios: (string | null)[]; // Stores blob URLs (or AI URLs)
  updateNarrationAudio: (index: number, audioUrl: string | null) => void; // Handles success or deletion/failure
  completeTreatment: (treatmentName: string, finalSuds: number) => void; // Records final SUDS

  // UI State (Optional)
  showsSidebar: boolean;
  setShowsSidebar: (show: boolean) => void;
}

const RecordingContext = createContext<RecordingContextType | undefined>(undefined);

export const RecordingProvider = ({ children }: { children: ReactNode }) => {
  // State definitions
  const [audioBlobTarget, setAudioBlobTarget] = useState<Blob | null>(null);
  const [targetEventTranscript, setTargetEventTranscript] = useState("");
  const [isRecordingTarget, setIsRecordingTarget] = useState(false);
  const [memory1, setMemory1] = useState("");
  const [isRecording1, setIsRecording1] = useState(false);
  const [memory2, setMemory2] = useState("");
  const [isRecording2, setIsRecording2] = useState(false);
  const [calibrationSuds, setCalibrationSuds] = useState(0); // Or null/undefined as default?
  const [memoriesSaved, setMemoriesSaved] = useState(false);
  const [completedTreatments, setCompletedTreatments] = useState<TreatmentResult[]>([]);
  const [narrationAudios, setNarrationAudios] = useState<(string | null)[]>(Array(11).fill(null));
  const [showsSidebar, setShowsSidebar] = useState(false);

  // --- Context Functions ---
  const updateNarrationAudio = useCallback((index: number, audioUrl: string | null) => {
    console.log(`RecordingContext: Updating narration ${index} with URL: ${audioUrl ? audioUrl.substring(0,50)+'...' : 'null'}`);
    setNarrationAudios((prev) => {
      if (index < 0 || index >= prev.length) {
          console.warn(`updateNarrationAudio: Invalid index ${index}`);
          return prev; // Return previous state if index is invalid
      }
      const newAudios = [...prev];
      // Revoke previous object URL if it exists and a new one is being set (or nulled)
      if (newAudios[index] && newAudios[index]?.startsWith('blob:')) {
         URL.revokeObjectURL(newAudios[index]!);
         console.log(`Revoked old blob URL for index ${index}`);
      }
      newAudios[index] = audioUrl;
      return newAudios;
    });
  }, []); // Empty dependency array, relies on setState closure

  const completeTreatment = useCallback((treatmentName: string, finalSuds: number) => {
    const treatmentNumber = treatmentName === "Follow-Up" ? 0 : parseInt(treatmentName.replace(/[^0-9]/g, ''), 10);
    let improvementPercentage: number | null = null;
    let isImprovement: boolean | undefined = undefined;

    if (typeof calibrationSuds === 'number' && calibrationSuds > 0) {
        const calculatedImprovement = ((calibrationSuds - finalSuds) / calibrationSuds) * 100;
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
      initialSuds: typeof calibrationSuds === 'number' ? calibrationSuds : -1, // Store initial SUDS, handle potential undefined case
    };

    console.log("RecordingContext: Completing treatment:", treatmentResult);
    setCompletedTreatments(prev => [...prev.filter(t => t.treatmentNumber !== treatmentNumber), treatmentResult].sort((a, b) => a.treatmentNumber - b.treatmentNumber));
    // TODO: Persist completedTreatments array to Supabase here
  }, [calibrationSuds]);


  // --- Provide Context Value ---
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

// Custom hook to consume the context
export const useRecording = () => {
  const context = useContext(RecordingContext);
  if (!context) { throw new Error("useRecording must be used within a RecordingProvider"); }
  return context;
};