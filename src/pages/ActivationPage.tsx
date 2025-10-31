// FILE: src/pages/ActivationPage.tsx
// UPGRADED: Includes selfie upload UI with premium access level checks.

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Info, ArrowRight, Mic, Square, AlertCircle, Loader2, PartyPopper, Upload, XCircle, Sparkles, Lock } from "lucide-react";
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
    targetEventTranscript: sessionTargetTranscriptFromCtx,
    setShowsSidebar, calibrationSuds, setCalibrationSuds,
  } = useRecording();

  const { userEmail, accessLevel } = useAuth(); // <<< Get accessLevel
  const isPremium = accessLevel === 'premium_lifetime'; // <<< Define our feature flag

  const {
    isRecordingTarget: isRecordingSessionTarget, recordingTime: sessionTargetRecordingTime,
    startTargetRecording, stopTargetRecording,
  } = useTargetRecording();

  // --- State for the full calibration flow ---
  const [sessionSuds, setSessionSuds] = useState<number>(calibrationSuds ?? 50);
  const [neutralMemories, setNeutralMemories] = useState<string[]>([]);
  const [selectedErrors, setSelectedErrors] = useState<PredictionError[]>([]);
  const [selfieFile, setSelfieFile] = useState<File | null>(null); // <<< State for selfie
  const [isUploadingSelfie, setIsUploadingSelfie] = useState(false); // <<< Loading state for upload
  const [selfieAnalysisComplete, setSelfieAnalysisComplete] = useState(false); // <<< Success state
  const fileInputRef = useRef<HTMLInputElement>(null); // <<< Ref for file input

  const [isCalibrationComplete, setIsCalibrationComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { setShowsSidebar?.(true); }, [setShowsSidebar]);

  const handleSessionSudsChange = useCallback((value: number) => {
    setSessionSuds(value); 
    setCalibrationSuds?.(value); 
  }, [setCalibrationSuds]);
  
  const handlePredictionErrorsComplete = useCallback((errors: PredictionError[]) => { setSelectedErrors(errors); }, []);

  // <<< NEW: Handler for selfie file selection and upload >>>
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userEmail || !isPremium) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (e.g., JPG, PNG).');
      return;
    }
    setSelfieFile(file);
    setIsUploadingSelfie(true);
    toast.info("Uploading and analyzing your selfie...");

    const formData = new FormData();
    formData.append('selfie', file);
    formData.append('userEmail', userEmail);

    try {
      const response = await fetch('/api/upload-and-analyze-selfie', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to analyze selfie.");
      
      toast.success("Analysis complete! Your description is saved.");
      setSelfieAnalysisComplete(true);
    } catch (error: any) {
      console.error("Selfie upload error:", error);
      toast.error(error.message || "An error occurred during upload.");
      setSelfieFile(null); // Clear file on error
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
    // ... (Validation logic is the same)
    setIsSaving(true);
    toast.info("Saving your calibration and preparing your session...");

    try {
        const response = await fetch('/api/save-and-generate-narratives', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userEmail, narratives: selectedErrors, }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to save calibration.");

        toast.success("Calibration complete! Your session is ready.");
        setIsCalibrationComplete(true);
    } catch (error: any) {
      // ... (error handling is the same)
    } finally {
        setIsSaving(false);
    }
  };
  
  const startTreatment = () => {
    // ... (This function is the same)
    navigate(`/treatment-${currentTreatmentNumber}`, { state: { /* ... */ } });
  };
  
  // (The rest of the component logic for isSaving, isCalibrationComplete, and the JSX returns is very similar,
  // but with the new Selfie Upload section added in the correct place.)
  
  // ... (Paste the full return JSX from the previous large message, but I will add the new section here for clarity)
  // --- This is the full return statement ---
  return (
    <div className="w-full space-y-8 animate-fadeIn">
      {/* ... (Existing JSX for loading, complete state, and title) ... */}
      { isSaving ? ( <div>Saving...</div> ) : isCalibrationComplete ? ( <div>Complete!...</div> ) : (
        <>
          <h2 className="text-xl font-semibold text-center text-primary mb-6">Calibration for Treatment {currentTreatmentNumber}</h2>

          {/* --- STEP 1, 2, 3 are unchanged (Target Event, SUDS, Bookends) --- */}
          <section>...</section>
          <section>...</section>
          <section>...</section>

          {/* <<< NEW STEP 4: PERSONALIZED VISUALS (SELFIE UPLOAD) >>> */}
          <section className={`space-y-4 p-4 rounded-lg bg-card shadow-md border ${isPremium ? 'border-yellow-500' : 'border-gray-700'}`}>
            <h3 className="text-lg font-semibold flex items-center text-white">
              4. Personalized Visuals (Premium)
              {isPremium ? <Sparkles size={18} className="ml-2 text-yellow-400"/> : <Lock size={18} className="ml-2 text-muted-foreground"/>}
            </h3>
            
            {isPremium ? (
              // --- UI for PREMIUM users ---
              <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">Upload a clear, forward-facing selfie. Your likeness will be used to create your personalized cinematic narratives.</p>
                  <label htmlFor="selfie-upload" className={`flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer ${isUploadingSelfie ? 'opacity-50' : 'hover:bg-muted/50'}`}>
                      <Upload className="w-8 h-8 text-primary mb-2"/>
                      <span className="font-semibold text-primary">Upload Selfie</span>
                  </label>
                  <input id="selfie-upload" type="file" className="hidden" accept="image/*" ref={fileInputRef} onChange={handleFileChange} disabled={isUploadingSelfie || selfieAnalysisComplete} />
                  
                  {(selfieFile || isUploadingSelfie) && (
                      <div className="mt-3 flex items-center justify-center bg-muted/50 p-2 rounded-md">
                          {isUploadingSelfie ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Sparkles className="w-4 h-4 mr-2 text-yellow-400"/>}
                          <span className="text-sm text-foreground truncate">{selfieFile?.name || 'Analyzing...'}</span>
                          {!isUploadingSelfie && (
                              <Button variant="ghost" size="sm" onClick={clearFile} className="ml-2 p-1 h-auto">
                                  <XCircle className="w-4 h-4 text-muted-foreground hover:text-destructive"/>
                              </Button>
                          )}
                      </div>
                  )}
              </div>
            ) : (
              // --- UI for NON-PREMIUM users (The "Upsell") ---
              <div className="text-center p-4 bg-muted/20 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-4">Transform your treatment with cinematic videos featuring a character based on your likeness. Unlock this powerful feature to deepen your therapeutic immersion.</p>
                  <Button onClick={() => navigate('/upgrade')}>Upgrade to Premium</Button>
              </div>
            )}
          </section>

          {/* --- Existing Steps are now re-numbered --- */}
          <section>
            <h3 className="text-lg font-semibold text-white">5. List Neutral Memories</h3>
            <NeutralMemoryCollector neutralMemories={neutralMemories} setNeutralMemories={setNeutralMemories} />
          </section>

          <section className="p-4 rounded-lg bg-card shadow-md">
            <h3 className="text-lg font-semibold text-white mb-4">6. Select 11 Prediction Errors</h3>
            <PredictionErrorSelector onComplete={handlePredictionErrorsComplete} />
          </section>

          <div className="flex justify-end pt-4">
            <Button onClick={handleFinishCalibration} className="px-6 py-3 text-base bg-green-600 hover:bg-green-700" size="lg">
              Finish Calibration & Prepare Session <ArrowRight className="w-5 h-5 ml-2"/>
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default ActivationPage;
