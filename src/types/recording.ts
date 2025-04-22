// src/types/recording.ts

/**
 * Represents the result of a completed treatment session.
 * Updated to allow nullable/optional fields based on calculation logic.
 */
export interface TreatmentResult {
  /** The number of the treatment (e.g., 1, 2, 3, 4, 5, or 0 for Follow-Up). */
  treatmentNumber: number;

  /** The final SUDS score recorded at the end of the treatment session. */
  finalSuds: number;

  /** The calculated percentage change from calibration SUDS. Can be null if calculation wasn't possible. */
  improvementPercentage: number | null; // <<< CHANGED: Allow null

  /** Indicates if the final SUDS was lower than the initial calibration SUDS. Optional if percentage couldn't be calculated. */
  isImprovement?: boolean;             // <<< CHANGED: Make optional

  /** ISO 8601 timestamp string of when the treatment was marked as complete. */
  completedAt: string; // Keep as required string

  /** The initial SUDS score recorded at the start of the treatment session. */
  initialSuds: number; // Added this field based on its use in RecordingContext
}


/**
 * Defines the shape of the data and functions provided by RecordingContext.
 * NOTE: This interface was provided for context but doesn't need changes itself
 * based on the errors. Ensure it matches the actual context implementation.
 */
export interface RecordingContextType {
  // Recording state
  isRecordingTarget: boolean;
  recordingTime: number;
  videoBlob: Blob | null; // Consider changing to audioBlobTarget if video isn't used
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
  // Consider removing separate transcript states if memory1/memory2 hold the final transcript
  memory1Transcript: string;
  setMemory1Transcript: (value: string) => void;
  memory2Transcript: string;
  setMemory2Transcript: (value: string) => void;
  tempMemory1Transcript: string;
  setTempMemory1Transcript: (value: string) => void;
  tempMemory2Transcript: string;
  setTempMemory2Transcript: (value: string) => void;
  // Treatment state
  completedTreatments: TreatmentResult[]; // Uses the updated TreatmentResult above
  setCompletedTreatments: (value: TreatmentResult[]) => void; // Or React.Dispatch<SetStateAction<TreatmentResult[]>>
  // UI state
  sudsLevel: number; // Consider if this is needed separate from calibrationSuds
  calibrationSuds: number;
  showsSidebar: boolean;
  memoriesSaved: boolean;
  // Actions
  setSudsLevel: (level: number) => void;
  setCalibrationSuds: (level: number) => void;
  setShowsSidebar: (show: boolean) => void;
  setMemoriesSaved: (saved: boolean) => void;
  completeTreatment: (treatmentName: string, sudsLevel: number) => void; // Should use finalSuds?
  // Add narrationAudios, updateNarrationAudio from your context implementation if needed
}

// Add other shared types below if necessary
export interface PredictionError {
  id: number;
  title: string;
  description: string;
}