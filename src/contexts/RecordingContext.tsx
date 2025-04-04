// src/contexts/RecordingContext.tsx
import { createContext, useContext, useState, useRef, ReactNode } from "react";
import { TreatmentResult } from "@/types/recording";

// Import SetStateAction from React to properly type setState functions
import type { SetStateAction } from "react";

interface RecordingContextType {
  videoBlob: Blob | null;
  setVideoBlob: (blob: Blob | null) => void;
  memory1: string;
  setMemory1: (memory: string) => void;
  memory2: string;
  setMemory2: (memory: string) => void;
  memory1Transcript: string;
  setMemory1Transcript: (transcript: string) => void;
  memory2Transcript: string;
  setMemory2Transcript: (transcript: string) => void;
  tempMemory1Transcript: string;
  setTempMemory1Transcript: (transcript: string) => void;
  tempMemory2Transcript: string;
  setTempMemory2Transcript: (transcript: string) => void;
  targetEventTranscript: string;
  setTargetEventTranscript: (transcript: string) => void;
  isRecording1: boolean;
  setIsRecording1: (isRecording: boolean) => void;
  isRecording2: boolean;
  setIsRecording2: (isRecording: boolean) => void;
  isRecordingTarget: boolean;
  setIsRecordingTarget: (isRecording: boolean) => void;
  recordingTime: number;
  setRecordingTime: (time: SetStateAction<number>) => void; // Updated to allow function updater
  startTargetRecording: () => void;
  stopTargetRecording: () => void;
  sudsLevel: number;
  setSudsLevel: (level: number) => void;
  calibrationSuds: number;
  setCalibrationSuds: (level: number) => void;
  showsSidebar: boolean;
  setShowsSidebar: (show: boolean) => void;
  memoriesSaved: boolean;
  setMemoriesSaved: (saved: boolean) => void;
  completedTreatments: TreatmentResult[];
  setCompletedTreatments: (treatments: TreatmentResult[]) => void;
  narrationAudios: (string | null)[];
  updateNarrationAudio: (index: number, audioUrl: string) => void;
  completeTreatment: (treatmentName: string, finalSuds: number) => void;
}

const RecordingContext = createContext<RecordingContextType | undefined>(undefined);

export const RecordingProvider = ({ children }: { children: ReactNode }) => {
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [memory1, setMemory1] = useState("");
  const [memory2, setMemory2] = useState("");
  const [memory1Transcript, setMemory1Transcript] = useState("");
  const [memory2Transcript, setMemory2Transcript] = useState("");
  const [tempMemory1Transcript, setTempMemory1Transcript] = useState("");
  const [tempMemory2Transcript, setTempMemory2Transcript] = useState("");
  const [targetEventTranscript, setTargetEventTranscript] = useState("");
  const [isRecording1, setIsRecording1] = useState(false);
  const [isRecording2, setIsRecording2] = useState(false);
  const [isRecordingTarget, setIsRecordingTarget] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [sudsLevel, setSudsLevel] = useState(0);
  const [calibrationSuds, setCalibrationSuds] = useState(0);
  const [showsSidebar, setShowsSidebar] = useState(false);
  const [memoriesSaved, setMemoriesSaved] = useState(false);
  const [completedTreatments, setCompletedTreatments] = useState<TreatmentResult[]>([]);
  const [narrationAudios, setNarrationAudios] = useState<(string | null)[]>(Array(11).fill(null));

  // MediaRecorder and SpeechRecognition refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;

  const startTargetRecording = () => {
    if (!SpeechRecognition) {
      console.error("Speech recognition not supported in this browser.");
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        streamRef.current = stream;

        // Set up MediaRecorder for video/audio recording
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: "video/webm" });
          setVideoBlob(blob);
          stream.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        };

        mediaRecorder.start();
        setIsRecordingTarget(true);
        setRecordingTime(0);

        // Set up SpeechRecognition for live transcription
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map((result) => result[0].transcript)
            .join("");
          window.dispatchEvent(
            new CustomEvent("targetTranscriptUpdate", {
              detail: { transcript },
            })
          );
        };

        recognition.onerror = (event) => {
          console.error("Speech recognition error:", event.error);
        };

        recognition.onend = () => {
          setIsRecordingTarget(false);
        };

        recognition.start();
      })
      .catch((err) => {
        console.error("Error accessing media devices:", err);
        setIsRecordingTarget(false);
      });
  };

  const stopTargetRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsRecordingTarget(false);
    setRecordingTime(0);
  };

  const updateNarrationAudio = (index: number, audioUrl: string) => {
    setNarrationAudios((prev) => {
      const newAudios = [...prev];
      newAudios[index] = audioUrl;
      return newAudios;
    });
  };

  const completeTreatment = (treatmentName: string, finalSuds: number) => {
    const treatmentNumber = treatmentName === "Follow-Up" ? 0 : parseInt(treatmentName.replace(/[^0-9]/g, ''));
    const improvementPercentage = ((calibrationSuds - finalSuds) / calibrationSuds) * 100;
    
    // Create the treatment result
    const treatmentResult = {
      treatmentNumber,
      finalSuds,
      improvementPercentage,
      isImprovement: finalSuds < calibrationSuds,
      completedAt: new Date().toISOString(),
    };

    // Update state, ensuring no duplicates
    setCompletedTreatments(prev => {
      // Remove any existing treatment with the same number
      const filtered = prev.filter(t => t.treatmentNumber !== treatmentNumber);
      // Add the new treatment
      return [...filtered, treatmentResult];
    });
    
    setSudsLevel(finalSuds);
  };

  return (
    <RecordingContext.Provider
      value={{
        videoBlob,
        setVideoBlob,
        memory1,
        setMemory1,
        memory2,
        setMemory2,
        memory1Transcript,
        setMemory1Transcript,
        memory2Transcript,
        setMemory2Transcript,
        tempMemory1Transcript,
        setTempMemory1Transcript,
        tempMemory2Transcript,
        setTempMemory2Transcript,
        targetEventTranscript,
        setTargetEventTranscript,
        isRecording1,
        setIsRecording1,
        isRecording2,
        setIsRecording2,
        isRecordingTarget,
        setIsRecordingTarget,
        recordingTime,
        setRecordingTime,
        startTargetRecording,
        stopTargetRecording,
        sudsLevel,
        setSudsLevel,
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
      }}
    >
      {children}
    </RecordingContext.Provider>
  );
};

export const useRecording = () => {
  const context = useContext(RecordingContext);
  if (!context) {
    throw new Error("useRecording must be used within a RecordingProvider");
  }
  return context;
};