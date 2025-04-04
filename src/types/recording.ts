// src/types/recording.ts
export interface TreatmentResult {
  treatmentNumber: number;
  finalSuds: number;
  improvementPercentage: number;
  isImprovement: boolean;
  completedAt: string;
}

export interface RecordingContextType {
  // Recording state
  isRecordingTarget: boolean;
  recordingTime: number;
  videoBlob: Blob | null;
  startTargetRecording: () => Promise<void>;
  stopTargetRecording: () => Promise<void>;
  targetEventTranscript: string;
  setTargetEventTranscript: (transcript: string) => void;
  isRecording1: boolean;
  setIsRecording1: (value: boolean) => void;
  isRecording2: boolean;
  setIsRecording2: (value: boolean) => void;
  memory1: string;
  setMemory1: (value: string) => void;
  memory2: string;
  setMemory2: (value: string) => void;
  memory1Transcript: string;
  setMemory1Transcript: (value: string) => void;
  memory2Transcript: string;
  setMemory2Transcript: (value: string) => void;
  tempMemory1Transcript: string;
  setTempMemory1Transcript: (value: string) => void;
  tempMemory2Transcript: string;
  setTempMemory2Transcript: (value: string) => void;
  // Treatment state
  completedTreatments: TreatmentResult[];
  setCompletedTreatments: (value: TreatmentResult[]) => void;
  // UI state
  sudsLevel: number;
  calibrationSuds: number;
  showsSidebar: boolean;
  memoriesSaved: boolean;
  // Actions
  setSudsLevel: (level: number) => void;
  setCalibrationSuds: (level: number) => void;
  setShowsSidebar: (show: boolean) => void;
  setMemoriesSaved: (saved: boolean) => void;
  completeTreatment: (treatmentName: string, sudsLevel: number) => void;
}