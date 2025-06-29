// FILE: src/contexts/RecordingContext.tsx
import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { type TreatmentResult } from "@/types/recording"; 
import type { SetStateAction } from "react";
import { useAuth } from './AuthContext';
import { toast } from "sonner"; 
interface RecordingContextType {
  audioBlobTarget: Blob | null; setAudioBlobTarget: (blob: Blob | null) => void;
  targetEventTranscript: string; setTargetEventTranscript: (transcript: string) => void;
  isRecordingTarget: boolean; setIsRecordingTarget: (isRecording: boolean) => void;
  memory1: string; setMemory1: (memory: string) => void;
  isRecording1: boolean; setIsRecording1: (isRecording: boolean) => void;
  memory2: string; setMemory2: (memory: string) => void;
  isRecording2: boolean; setIsRecording2: (isRecording: boolean) => void;
  calibrationSuds: number | null; setCalibrationSuds: (level: number | null) => void;
  memoriesSaved: boolean; setMemoriesSaved: (saved: boolean) => void;
  completedTreatments: TreatmentResult[]; setCompletedTreatments: React.Dispatch<SetStateAction<TreatmentResult[]>>;
  narrationAudios: (string | null)[]; updateNarrationAudio: (index: number, audioUrl: string | null) => void;
  completeTreatment: (treatmentName: string, finalSuds: number, initialSudsForSession: number) => Promise<void>; 
  showsSidebar: boolean; setShowsSidebar: (show: boolean) => void;
  currentlyPlayingAiIndex: number | null; setCurrentlyPlayingAiIndex: (index: number | null) => void; 
}
const RecordingContext = createContext<RecordingContextType | undefined>(undefined);
export const RecordingProvider = ({ children }: { children: ReactNode }) => {
  const { userEmail } = useAuth();
  const [audioBlobTarget, setAudioBlobTarget] = useState<Blob | null>(null);
  const [targetEventTranscript, setTargetEventTranscript] = useState("");
  const [isRecordingTarget, setIsRecordingTarget] = useState(false);
  const [memory1, setMemory1] = useState("");
  const [isRecording1, setIsRecording1] = useState(false);
  const [memory2, setMemory2] = useState("");
  const [isRecording2, setIsRecording2] = useState(false);
  const [calibrationSuds, setCalibrationSuds] = useState<number | null>(null);
  const [memoriesSaved, setMemoriesSaved] = useState(false);
  const [completedTreatments, setCompletedTreatments] = useState<TreatmentResult[]>([]);
  const [narrationAudios, setNarrationAudios] = useState<(string | null)[]>(Array(11).fill(null));
  const [showsSidebar, setShowsSidebar] = useState(false);
  const [currentlyPlayingAiIndex, setCurrentlyPlayingAiIndex] = useState<number | null>(null);
  const updateNarrationAudio = useCallback((index: number, audioUrl: string | null) => { setNarrationAudios((prev) => { const newAudios = [...prev]; newAudios[index] = audioUrl; return newAudios; }); }, []);
  const completeTreatment = useCallback(async (treatmentName: string, finalSuds: number, initialSudsForSession: number): Promise<void> => {
    if (typeof initialSudsForSession !== 'number') { toast.error("Cannot save result: Session SUDS missing."); return; }
    const treatmentNumber = parseInt(treatmentName.replace(/[^0-9]/g, ''), 10) || 0;
    let improvementPercentage: number | null = null;
    if (initialSudsForSession > 0) { const calculatedImprovement = ((initialSudsForSession - finalSuds) / initialSudsForSession) * 100; if (!isNaN(calculatedImprovement)) improvementPercentage = calculatedImprovement; }
    const treatmentResult: TreatmentResult = { treatmentNumber, finalSuds, improvementPercentage, isImprovement: improvementPercentage !== null ? improvementPercentage > 0 : undefined, completedAt: new Date().toISOString(), initialSuds: initialSudsForSession };
    setCompletedTreatments(prev => [...prev.filter(t => t.treatmentNumber !== treatmentNumber), treatmentResult].sort((a, b) => a.treatmentNumber - b.treatmentNumber));
    if (userEmail && treatmentNumber >= 1 && treatmentNumber <= 5) {
      try { await fetch('/api/send-treatment-summary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...treatmentResult, userEmail: userEmail }), }); } catch (error) { toast.error("Network error sending summary email."); }
    }
  }, [userEmail]); 
  const value = {
    audioBlobTarget, setAudioBlobTarget, targetEventTranscript, setTargetEventTranscript,
    isRecordingTarget, setIsRecordingTarget, memory1, setMemory1, isRecording1, setIsRecording1,
    memory2, setMemory2, isRecording2, setIsRecording2, calibrationSuds, setCalibrationSuds,
    showsSidebar, setShowsSidebar, memoriesSaved, setMemoriesSaved, completedTreatments, setCompletedTreatments,
    narrationAudios, updateNarrationAudio, completeTreatment, currentlyPlayingAiIndex, setCurrentlyPlayingAiIndex, 
  };
  return ( <RecordingContext.Provider value={value}> {children} </RecordingContext.Provider> );
};
export const useRecording = () => { const context = useContext(RecordingContext); if (!context) { throw new Error("useRecording must be used within a RecordingProvider"); } return context; };