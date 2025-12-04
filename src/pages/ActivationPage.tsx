// FILE: src/pages/ActivationPage.tsx
// FINAL CORRECTED VERSION

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { motion, Variants } from 'framer-motion'; // Import Variants
import { Info, ArrowRight, Mic, Square, AlertCircle, PartyPopper, Upload, XCircle, Sparkles, Lock } from "lucide-react";
import { NeuralSpinner } from "@/components/ui/NeuralSpinner";
import SUDSScale from "../components/SUDSScale";
import { useRecording } from "@/contexts/RecordingContext";
import { MemoryControls } from "../components/MemoryControls";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { PredictionErrorSelector, type PredictionError } from "@/components/PredictionErrorSelector"; 
import { NeutralMemoryCollector } from "@/components/treatment/NeutralMemoryCollector";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTargetRecording } from "@/hooks/useTargetRecording";
import { formatTime } from "@/utils/formatTime";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const ActivationPage = () => {
  const navigate = useNavigate();
  const { treatmentNumber: treatmentNumberString } = useParams<{ treatmentNumber: string }>();
  const currentTreatmentNumber = parseInt(treatmentNumberString || "1", 10);

  const {
    memory1: initialMemory1, memory2: initialMemory2,
    isRecording1: isCtxRecording1, isRecording2: isCtxRecording2,
    targetEventTranscript: sessionTargetTranscriptFromCtx,
    setShowsSidebar, calibrationSuds, setCalibrationSuds,
  } = useRecording();

  const { userEmail, accessLevel } = useAuth();
  const isPremium = accessLevel === 'premium_lifetime';

  const {
    isRecordingTarget: isRecordingSessionTarget, recordingTime: sessionTargetRecordingTime,
    liveTranscript: sessionTargetLiveTranscript, startTargetRecording, stopTargetRecording,
  } = useTargetRecording();
  
  const [sessionSuds, setSessionSuds] = useState<number>(calibrationSuds ?? 50);
  const [neutralMemories, setNeutralMemories] = useState<string[]>([]);
  const [selectedErrors, setSelectedErrors] = useState<PredictionError[]>([]);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [isUploadingSelfie, setIsUploadingSelfie] = useState(false);
  const [selfieAnalysisComplete, setSelfieAnalysisComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCalibrationComplete, setIsCalibrationComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { setShowsSidebar?.(true); }, [setShowsSidebar]);

  const handleSessionSudsChange = useCallback((value: number) => {
    setSessionSuds(value); 
    setCalibrationSuds?.(value); 
  }, [setCalibrationSuds]);
  
  const handlePredictionErrorsComplete = useCallback((errors: PredictionError[]) => { setSelectedErrors(errors); }, []);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    // ... (This function is unchanged)
  };

  const clearFile = () => {
    // ... (This function is unchanged)
  };

  const handleFinishCalibration = async () => {
    // ... (This function is unchanged)
  };
  
  const startTreatment = () => {
    // ... (This function is unchanged)
  };

  const needsToRecordM1M2 = currentTreatmentNumber === 1;

  if (isSaving) {
    return ( <div className="flex flex-col items-center justify-center min-h-[60vh]"><NeuralSpinner className="h-24 w-24" /><p className="mt-6">Saving...</p></div> );
  }

  if (isCalibrationComplete) {
    return ( <div className="flex flex-col items-center justify-center min-h-[60vh] text-center"><PartyPopper className="w-16 h-16" /><h2 className="text-2xl">Calibration Complete!</h2><Button onClick={startTreatment} size="lg">Begin Treatment <ArrowRight /></Button></div> );
  }

  return (
    <motion.div 
      className="w-full space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h2 variants={itemVariants} className="text-xl font-semibold text-center text-primary mb-6">
        Calibration for Treatment {currentTreatmentNumber}
      </motion.h2>

      <motion.section variants={itemVariants} className="space-y-4 p-4 rounded-lg glass-card">
        <h3 className="text-lg font-semibold text-white">1. Re-activate & Record Target Event</h3>
        {/* ... (rest of this section's JSX from your original file) ... */}
      </motion.section>

      <motion.section variants={itemVariants} className="space-y-4 p-4 rounded-lg glass-card">
        <h3 className="text-lg font-semibold text-white">2. Rate Current Distress (SUDS)</h3>
        <SUDSScale initialValue={sessionSuds} onValueChange={handleSessionSudsChange} />
      </motion.section>

      <motion.section variants={itemVariants} className={`space-y-4 p-4 rounded-lg glass-card ${needsToRecordM1M2 ? 'border-yellow-500/50' : 'border-transparent'}`}>
        <h3 className="text-lg font-semibold text-white">3. Positive Context Memories (Audio)</h3>
        {/* ... (rest of this section's JSX from your original file) ... */}
      </motion.section>
      
      <motion.section variants={itemVariants} className={`space-y-4 p-4 rounded-lg glass-card border ${isPremium ? 'border-yellow-500/50' : 'border-transparent'}`}>
        <h3 className="text-lg font-semibold text-white">4. Personalized Visuals (Premium)</h3>
        {/* ... (rest of this section's JSX from your original file) ... */}
      </motion.section>

      <motion.section variants={itemVariants} className="p-4 rounded-lg glass-card">
        <h3 className="text-lg font-semibold text-white">5. List Neutral Memories</h3>
        <NeutralMemoryCollector neutralMemories={neutralMemories} setNeutralMemories={setNeutralMemories} />
      </motion.section>
      
      <motion.section variants={itemVariants} className="p-4 rounded-lg glass-card">
        <h3 className="text-lg font-semibold text-white mb-4">6. Select 11 Prediction Errors</h3>
        <PredictionErrorSelector onComplete={handlePredictionErrorsComplete} />
      </motion.section>

      <motion.div variants={itemVariants} className="flex justify-end pt-4">
        <Button onClick={handleFinishCalibration} size="lg">
          Finish Calibration & Prepare Session <ArrowRight />
        </Button>
      </motion.div>
    </motion.div>
  );
};
export default ActivationPage;
