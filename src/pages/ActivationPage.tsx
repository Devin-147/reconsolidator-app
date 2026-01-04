// FILE: src/pages/ActivationPage.tsx
// FINAL CORRECTED VERSION

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { motion, Variants } from 'framer-motion';
import { Info, ArrowRight, Mic, Square, AlertCircle, PartyPopper, Upload, XCircle, Sparkles, Lock } from "lucide-react";
import { AnimatedSection } from "@/components/treatment/AnimatedSection";
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
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

const ActivationPage = () => {
  const navigate = useNavigate();
  const { treatmentNumber: treatmentNumberString } = useParams<{ treatmentNumber: string }>();
  const currentTreatmentNumber = parseInt(treatmentNumberString || "1", 10);
  const [searchParams] = useSearchParams();

  const {
    memory1: initialMemory1, memory2: initialMemory2,
    isRecording1: isCtxRecording1, isRecording2: isCtxRecording2,
    targetEventTranscript: sessionTargetTranscriptFromCtx,
    setShowsSidebar, calibrationSuds, setCalibrationSuds,
  } = useRecording();

  const { userEmail, accessLevel, checkAuthStatus } = useAuth();
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
  
  useEffect(() => {
    if (searchParams.get('payment_success') === 'true' && userEmail) {
      toast.success("Payment successful!", { description: "Your premium features are now unlocked." });
      checkAuthStatus(userEmail);
    }
  }, [searchParams, userEmail, checkAuthStatus]);

  const handleSessionSudsChange = useCallback((value: number) => {
    setSessionSuds(value); 
    setCalibrationSuds?.(value); 
  }, [setCalibrationSuds]);
  
  const handlePredictionErrorsComplete = useCallback((errors: PredictionError[]) => { setSelectedErrors(errors); }, []);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userEmail || !isPremium) return;
    setSelfieFile(file);
    setIsUploadingSelfie(true);
    toast.info("Uploading and analyzing your selfie...");
    const formData = new FormData();
    formData.append('action', 'analyzeSelfie');
    formData.append('selfie', file);
    formData.append('userEmail', userEmail);
    try {
      const response = await fetch('/api/user', { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to analyze selfie.");
      toast.success("Analysis complete! Your description is saved.");
      setSelfieAnalysisComplete(true);
    } catch (error: any) {
      toast.error(error.message || "An error occurred during upload.");
      setSelfieFile(null);
    } finally {
      setIsUploadingSelfie(false);
    }
  };

  const clearFile = () => {
    setSelfieFile(null);
    setSelfieAnalysisComplete(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFinishCalibration = async () => {
    if (!sessionTargetTranscriptFromCtx || selectedErrors.length !== 11 || neutralMemories.length < 1) {
      toast.error("Please complete all calibration steps."); return;
    }
    setIsSaving(true);
    toast.info("Saving your calibration and preparing your session...");
    try {
        const response = await fetch('/api/treatment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'saveAndGenerate', payload: { userEmail, narratives: selectedErrors, treatmentNumber: currentTreatmentNumber } }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to save calibration.");
        toast.success("Calibration complete! Your session is ready.");
        setIsCalibrationComplete(true);
    } catch (error: any) {
        toast.error(error.message || "An error occurred while saving.");
    } finally {
        setIsSaving(false);
    }
  };
  
  const startTreatment = () => {
    navigate(`/treatment-${currentTreatmentNumber}`, { state: {
      treatmentNumber: currentTreatmentNumber,
      sessionTargetEvent: sessionTargetTranscriptFromCtx,
      sessionSuds: sessionSuds,
      neutralMemories: neutralMemories,
      selectedErrors: selectedErrors,
    }});
  };

  const needsToRecordM1M2 = currentTreatmentNumber === 1;

  if (isSaving) { return ( <div className="flex flex-col items-center justify-center min-h-[60vh]"><NeuralSpinner className="h-24 w-24" /><p className="mt-6">Saving...</p></div> ); }
  if (isCalibrationComplete) { return ( <div className="flex flex-col items-center justify-center min-h-[60vh] text-center"><PartyPopper className="w-16 h-16" /><h2 className="text-2xl">Calibration Complete!</h2><Button onClick={startTreatment} size="lg">Begin Treatment <ArrowRight /></Button></div> ); }

  return (
    <motion.div className="w-full space-y-8" variants={containerVariants} initial="hidden" animate="visible">
      <motion.h2 variants={itemVariants} className="text-xl font-semibold text-center text-primary mb-6">
        Calibration for Treatment {currentTreatmentNumber}
      </motion.h2>

      <AnimatedSection className="space-y-4">
        <h3 className="text-lg font-semibold text-white">1. Re-activate & Record Target Event</h3>
        <div className="flex items-center justify-between">
          {!isRecordingSessionTarget ? (<Button onClick={startTargetRecording} size="sm"><Mic className="w-4 h-4 mr-2" /> Start</Button>) 
          : (<Button onClick={stopTargetRecording} variant="destructive" size="sm"><Square className="w-4 h-4 mr-2" /> Stop ({formatTime(sessionTargetRecordingTime)})</Button>)}
        </div>
        {(isRecordingSessionTarget || sessionTargetTranscriptFromCtx) && (
          <div className="mt-4 p-3 bg-muted/50 rounded border"><p className="text-sm">{isRecordingSessionTarget ? sessionTargetLiveTranscript : sessionTargetTranscriptFromCtx}</p></div>
        )}
      </AnimatedSection>

      <AnimatedSection className="space-y-4">
        <h3 className="text-lg font-semibold text-white">2. Rate Current Distress (SUDS)</h3>
        <SUDSScale initialValue={sessionSuds} onValueChange={handleSessionSudsChange} />
      </AnimatedSection>

      <AnimatedSection className={`space-y-4 ${needsToRecordM1M2 ? 'border-yellow-500/50' : 'border-transparent'}`}>
        <h3 className="text-lg font-semibold text-white">3. Positive Context Memories (Audio)</h3>
        <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2"><h4 className="font-medium text-muted-foreground">M1 (Before)</h4><MemoryControls memoryNumber={1} isRecording={isCtxRecording1} /></div>
            <div className="space-y-2"><h4 className="font-medium text-muted-foreground">M2 (After)</h4><MemoryControls memoryNumber={2} isRecording={isCtxRecording2} /></div>
        </div>
      </AnimatedSection>
      
      <AnimatedSection className={`space-y-4 border ${isPremium ? 'border-yellow-500/50' : 'border-transparent'}`}>
        <h3 className="text-lg font-semibold text-white flex items-center">
          4. Personalized Visuals (Premium)
          {isPremium ? <Sparkles size={18} className="ml-2 text-yellow-400"/> : <Lock size={18} className="ml-2 text-muted-foreground"/>}
        </h3>
        {isPremium ? (
          <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">Upload a selfie to personalize your cinematic narratives.</p>
              <label htmlFor="selfie-upload" className={`flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer ${isUploadingSelfie || selfieAnalysisComplete ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted/50'}`}>
                  <Upload className="w-8 h-8 text-primary mb-2"/>
                  <span className="font-semibold text-primary">{selfieAnalysisComplete ? 'Analysis Complete' : 'Upload Selfie'}</span>
              </label>
              <input id="selfie-upload" type="file" className="hidden" accept="image/*" ref={fileInputRef} onChange={handleFileChange} disabled={isUploadingSelfie || selfieAnalysisComplete} />
              {(selfieFile || isUploadingSelfie) && (
                  <div className="mt-3 flex items-center justify-center bg-muted/50 p-2 rounded-md">
                      {isUploadingSelfie ? (
                        <><NeuralSpinner className="w-6 h-6 mr-2" /><span className="text-sm truncate">Analyzing...</span></>
                      ) : (
                        <><Sparkles className="w-4 h-4 mr-2 text-yellow-400"/><span className="text-sm truncate">{selfieFile?.name}</span><Button variant="ghost" size="sm" onClick={clearFile} className="ml-2 p-1 h-auto"><XCircle className="w-4 h-4"/></Button></>
                      )}
                  </div>
              )}
          </div>
        ) : (
          <div className="text-center p-4 bg-muted/20 rounded-lg">
              <p className="text-sm text-muted-foreground mb-4">Unlock cinematic videos featuring your likeness.</p>
              <Button onClick={() => navigate('/upgrade')}>Upgrade to Premium</Button>
          </div>
        )}
      </AnimatedSection>

      <AnimatedSection>
        <h3 className="text-lg font-semibold text-white mb-2">5. List Neutral Memories</h3>
        <NeutralMemoryCollector neutralMemories={neutralMemories} setNeutralMemories={setNeutralMemories} />
      </AnimatedSection>
      
      <AnimatedSection>
        <h3 className="text-lg font-semibold text-white mb-4">6. Select 11 Prediction Errors</h3>
        <PredictionErrorSelector onComplete={handlePredictionErrorsComplete} />
      </AnimatedSection>

      <motion.div variants={itemVariants} className="flex justify-end pt-4">
        <Button onClick={handleFinishCalibration} size="lg">
          Finish Calibration & Prepare Session <ArrowRight />
        </Button>
      </motion.div>
    </motion.div>
  );
};
export default ActivationPage;
