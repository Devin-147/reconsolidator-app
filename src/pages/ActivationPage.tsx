// FILE: src/pages/ActivationPage.tsx
// FINAL CORRECTED VERSION

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
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
      const response = await fetch('/api/user', {
        method: 'POST',
        body: formData,
      });
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
            body: JSON.stringify({ 
                action: 'saveAndGenerate',
                payload: {
                    userEmail, 
                    narratives: selectedErrors, 
                    treatmentNumber: currentTreatmentNumber 
                }
            }),
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

  if (isSaving) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <NeuralSpinner className="h-24 w-24" />
            <p className="mt-6 text-lg text-muted-foreground">Saving and preparing your personalized session...</p>
        </div>
    );
  }

  if (isCalibrationComplete) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
            <PartyPopper className="w-16 h-16 text-green-500" />
            <h2 className="text-2xl font-bold">Calibration Complete!</h2>
            <p className="text-muted-foreground max-w-md">All your session materials are prepared. When you are ready, begin the experiential part of your treatment.</p>
            <Button onClick={startTreatment} size="lg" className="px-8 py-4 text-lg">
                Begin Treatment {currentTreatmentNumber} <ArrowRight className="w-5 h-5 ml-2"/>
            </Button>
        </div>
    );
  }

  return (
    <div className="w-full space-y-8 animate-fadeIn">
      <h2 className="text-xl font-semibold text-center text-primary mb-6">
        Calibration for Treatment {currentTreatmentNumber}
      </h2>

      <section className="space-y-4 p-4 border rounded-lg bg-card shadow-md">
        <h3 className="text-lg font-semibold flex items-center text-white">1. Re-activate & Record Target Event</h3>
        <div className="flex items-center justify-between">
          {!isRecordingSessionTarget ? (<Button onClick={startTargetRecording} size="sm"><Mic className="w-4 h-4 mr-2" /> Start Target Recording</Button>) 
          : (<Button onClick={stopTargetRecording} variant="destructive" size="sm"><Square className="w-4 h-4 mr-2" /> Stop Recording ({formatTime(sessionTargetRecordingTime)})</Button>)}
        </div>
        {(isRecordingSessionTarget || sessionTargetTranscriptFromCtx) && (
          <div className="mt-4 p-3 bg-muted/50 rounded border"><p className="text-sm">{isRecordingSessionTarget ? sessionTargetLiveTranscript : sessionTargetTranscriptFromCtx}</p></div>
        )}
      </section>

      <section className="space-y-4 p-4 rounded-lg bg-card shadow-md">
        <h3 className="text-lg font-semibold text-white">2. Rate Current Distress (SUDS)</h3>
        <SUDSScale initialValue={sessionSuds} onValueChange={handleSessionSudsChange} />
      </section>

      <section className={`space-y-4 p-4 border rounded-lg bg-card shadow-md ${needsToRecordM1M2 ? 'border-yellow-500' : 'border-gray-700 opacity-70'}`}>
        <h3 className="text-lg font-semibold text-white">3. Positive Context Memories (Audio)</h3>
        <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2"><h4 className="font-medium text-muted-foreground">Positive Memory 1 (Before Event)</h4><MemoryControls memoryNumber={1} isRecording={isCtxRecording1} /></div>
            <div className="space-y-2"><h4 className="font-medium text-muted-foreground">Positive Memory 2 (After Event)</h4><MemoryControls memoryNumber={2} isRecording={isCtxRecording2} /></div>
        </div>
      </section>
      
      <section className={`space-y-4 p-4 rounded-lg bg-card shadow-md border ${isPremium ? 'border-yellow-500' : 'border-gray-700'}`}>
        <h3 className="text-lg font-semibold flex items-center text-white">
          4. Personalized Visuals (Premium)
          {isPremium ? <Sparkles size={18} className="ml-2 text-yellow-400"/> : <Lock size={18} className="ml-2 text-muted-foreground"/>}
        </h3>
        {isPremium ? (
          <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">Upload a clear, forward-facing selfie to personalize your cinematic narratives.</p>
              <label htmlFor="selfie-upload" className={`flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer ${isUploadingSelfie || selfieAnalysisComplete ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted/50'}`}>
                  <Upload className="w-8 h-8 text-primary mb-2"/>
                  <span className="font-semibold text-primary">{selfieAnalysisComplete ? 'Analysis Complete' : 'Upload Selfie'}</span>
              </label>
              <input id="selfie-upload" type="file" className="hidden" accept="image/*" ref={fileInputRef} onChange={handleFileChange} disabled={isUploadingSelfie || selfieAnalysisComplete} />
              {(selfieFile || isUploadingSelfie) && (
                  <div className="mt-3 flex items-center justify-center bg-muted/50 p-2 rounded-md">
                      {isUploadingSelfie ? (
                        <>
                          <NeuralSpinner className="w-6 h-6 mr-2" />
                          <span className="text-sm text-foreground truncate">Analyzing...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2 text-yellow-400"/>
                          <span className="text-sm text-foreground truncate">{selfieFile?.name}</span>
                          <Button variant="ghost" size="sm" onClick={clearFile} className="ml-2 p-1 h-auto"><XCircle className="w-4 h-4 text-muted-foreground hover:text-destructive"/></Button>
                        </>
                      )}
                  </div>
              )}
          </div>
        ) : (
          <div className="text-center p-4 bg-muted/20 rounded-lg">
              <p className="text-sm text-muted-foreground mb-4">Unlock a deeper therapeutic immersion with cinematic videos featuring your likeness.</p>
              <Button onClick={() => navigate('/upgrade')}>Upgrade to Premium</Button>
          </div>
        )}
      </section>

      <section>
        <h3 className="text-lg font-semibold text-white">5. List Neutral Memories</h3>
        <NeutralMemoryCollector neutralMemories={neutralMemories} setNeutralMemories={setNeutralMemories} />
      </section>
      
      <section className="p-4 rounded-lg bg-card shadow-md">
        <h3 className="text-lg font-semibold text-white mb-4">6. Select 11 Prediction Errors</h3>
        <PredictionErrorSelector onComplete={handlePredictionErrorsComplete} />
      </section>

      <div className="flex justify-end pt-4">
        <Button onClick={handleFinishCalibration} size="lg">
          Finish Calibration & Prepare Session <ArrowRight className="w-5 h-5 ml-2"/>
        </Button>
      </div>
    </div>
  );
};
export default ActivationPage;
