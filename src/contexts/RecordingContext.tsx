// src/contexts/RecordingContext.tsx
import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { TreatmentResult } from "@/types/recording"; // Ensure path is correct
import type { SetStateAction } from "react";
import { useAuth } from './AuthContext'; // <<< Import useAuth to get userEmail
import { toast } from "sonner"; // <<< Import toast for user feedback

// --- Define the shape of the context ---
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
  calibrationSuds: number | null; // <<< Consider allowing null for unset state
  setCalibrationSuds: (level: number | null) => void; // <<< Allow setting null
  memoriesSaved: boolean;
  setMemoriesSaved: (saved: boolean) => void;
  completedTreatments: TreatmentResult[];
  setCompletedTreatments: React.Dispatch<SetStateAction<TreatmentResult[]>>;
  narrationAudios: (string | null)[];
  updateNarrationAudio: (index: number, audioUrl: string | null) => void;
  completeTreatment: (treatmentName: string, finalSuds: number) => Promise<void>; // <<< Changed to Promise
  showsSidebar: boolean;
  setShowsSidebar: (show: boolean) => void;
}

const RecordingContext = createContext<RecordingContextType | undefined>(undefined);

export const RecordingProvider = ({ children }: { children: ReactNode }) => {
  const { userEmail } = useAuth(); // Get userEmail for API call

  // State definitions
  const [audioBlobTarget, setAudioBlobTarget] = useState<Blob | null>(null);
  const [targetEventTranscript, setTargetEventTranscript] = useState("");
  const [isRecordingTarget, setIsRecordingTarget] = useState(false);
  const [memory1, setMemory1] = useState("");
  const [isRecording1, setIsRecording1] = useState(false);
  const [memory2, setMemory2] = useState("");
  const [isRecording2, setIsRecording2] = useState(false);
  const [calibrationSuds, setCalibrationSuds] = useState<number | null>(null); // Initialize as null
  const [memoriesSaved, setMemoriesSaved] = useState(false);
  const [completedTreatments, setCompletedTreatments] = useState<TreatmentResult[]>([]);
  const [narrationAudios, setNarrationAudios] = useState<(string | null)[]>(Array(11).fill(null));
  const [showsSidebar, setShowsSidebar] = useState(false);

  // --- Context Functions ---
  const updateNarrationAudio = useCallback((index: number, audioUrl: string | null) => {
    console.log(`RecordingContext: Updating narration ${index} with URL: ${audioUrl ? 'exists' : 'null'}`);
    setNarrationAudios((prev) => {
      if (index < 0 || index >= prev.length) { console.warn(`updateNarrationAudio: Invalid index ${index}`); return prev; }
      const newAudios = [...prev];
      if (newAudios[index] && newAudios[index]?.startsWith('blob:')) { URL.revokeObjectURL(newAudios[index]!); }
      newAudios[index] = audioUrl;
      return newAudios;
    });
  }, []);

  // --- MODIFIED completeTreatment to be async and call API ---
  const completeTreatment = useCallback(async (treatmentName: string, finalSuds: number): Promise<void> => { // <<< Added async/Promise
    // Ensure calibration SUDS was actually set
    if (calibrationSuds === null) { // <<< Check for null
         console.error("Cannot complete treatment: Initial calibration SUDS is missing.");
         toast.error("Cannot save result: Initial SUDS rating is missing.");
         return; // Stop if initial SUDS not set
    }

    const treatmentNumber = treatmentName === "Follow-Up" ? 0 : parseInt(treatmentName.replace(/[^0-9]/g, ''), 10);
    let improvementPercentage: number | null = null;
    let isImprovement: boolean | undefined = undefined;

    // Calculate improvement only if calibrationSuds is valid and positive
    if (calibrationSuds > 0) {
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
      initialSuds: calibrationSuds, // calibrationSuds is guaranteed number here
    };

    console.log("RecordingContext: Completing treatment locally:", treatmentResult);
    // Update local state first for immediate UI feedback
    setCompletedTreatments(prev => [...prev.filter(t => t.treatmentNumber !== treatmentNumber), treatmentResult].sort((a, b) => a.treatmentNumber - b.treatmentNumber));

    // TODO: Persist the entire completedTreatments array to Supabase backend for the user

    // --- Call Backend API to Send Summary Email ---
    if (userEmail && treatmentNumber >= 1 && treatmentNumber <= 5) { // Send only for T1-T5
      console.log(`RecordingContext: Attempting to send summary email for T${treatmentNumber}...`);
      try {
        const response = await fetch('/api/send-treatment-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // Send the specific result data AND the user's email
          body: JSON.stringify({ ...treatmentResult, userEmail: userEmail }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("API Error: Failed to send summary email:", response.status, errorData);
          // Optional: Show a less critical toast, as the main result was saved locally
           toast.warning(`Treatment result saved, but summary email failed (${response.status}).`);
        } else {
           const successData = await response.json().catch(() => ({}));
           console.log("Summary email API call successful:", successData?.message);
           // No success toast needed here, as PhaseSix already shows one
        }
      } catch (error) {
        console.error("Network Error calling send summary email API:", error);
        toast.error("Network error: Could not send summary email.");
      }
    } else {
        console.log("RecordingContext: Skipping summary email send (Not T1-T5 or userEmail missing).");
    }
    // --- END API Call ---

  }, [calibrationSuds, userEmail]); // Dependencies: calibrationSuds for calculation, userEmail for API call


  // --- Provide Context Value ---
  return (
    <RecordingContext.Provider
      value={{
        audioBlobTarget, setAudioBlobTarget, targetEventTranscript, setTargetEventTranscript,
        isRecordingTarget, setIsRecordingTarget, memory1, setMemory1, isRecording1, setIsRecording1,
        memory2, setMemory2, isRecording2, setIsRecording2,
        calibrationSuds: calibrationSuds === null ? 0 : calibrationSuds, // Provide 0 if null for components expecting number
        setCalibrationSuds, // Pass the setter that accepts null
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