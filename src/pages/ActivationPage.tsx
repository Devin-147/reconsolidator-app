// src/pages/ActivationPage.tsx (Formerly Index.tsx)
import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Info, ArrowRight, Mic, Square, AlertCircle } from "lucide-react";
import SUDSScale from "../components/SUDSScale";
import AppSidebar from "../components/AppSidebar";
import { useRecording } from "@/contexts/RecordingContext";
import { type TreatmentResult } from "@/types/recording";
import { MemoryControls } from "../components/MemoryControls";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SetStateAction } from 'react';
import { useTargetRecording } from "@/hooks/useTargetRecording";
import { formatTime } from "@/utils/formatTime";

const ActivationPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const {
        memory1, memory2, targetEventTranscript, isRecording1, isRecording2,
        calibrationSuds, setCalibrationSuds, showsSidebar, setShowsSidebar,
        setMemoriesSaved, completedTreatments, setCompletedTreatments, memoriesSaved,
        audioBlobTarget, setTargetEventTranscript, setMemory1, setMemory2,
    } = useRecording();
    const { userEmail, checkAuthStatus, userStatus, isLoading } = useAuth();
    const {
        isRecordingTarget, recordingTime, liveTranscript, startTargetRecording,
        stopTargetRecording, error: recordingError, isSupported
    } = useTargetRecording();

    // Effect to check auth status
    useEffect(() => {
        console.log(`ActivationPage Effect: location=${location.pathname}, userStatus=${userStatus}, isLoading=${isLoading}`);
        if (userStatus === 'loading' || (userEmail && userStatus === 'none')) {
            console.log("ActivationPage Effect: Triggering checkAuthStatus."); checkAuthStatus();
        }
    }, [checkAuthStatus, userEmail, userStatus, isLoading]);

    // Effect to manage sidebar
    useEffect(() => { setShowsSidebar(true); }, [setShowsSidebar]);

    // Handler to Save Setup Data
    const handleSaveSetup = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        console.log("Attempting to save setup.", { audioBlobTarget: !!audioBlobTarget, memory1, memory2, targetEventTranscript, calibrationSuds });
        if (!targetEventTranscript || !memory1 || !memory2 || typeof calibrationSuds !== 'number' || calibrationSuds < 0 ) {
            toast.error("Please record Target Event, rate SUDS, and record both Positive Memories before saving."); return;
        }
        console.log("Saving prerequisites to context via setMemoriesSaved(true)...");
        setMemoriesSaved(true); toast.success("Activation Setup Complete! Ready for processing steps.");
    };

    // Handler for SUDS Scale component updates
    const handleSudsChange = (value: number) => { setCalibrationSuds(value); };

    if (isLoading) { return <div className="flex justify-center items-center min-h-screen">Loading User Data...</div>; }

    // Main Render
    return (
        <div className="min-h-screen flex w-full">
            <AppSidebar
                visible={showsSidebar} calibrationSuds={calibrationSuds} targetEvent={audioBlobTarget || undefined}
                memory1={memory1} memory2={memory2} completedTreatments={completedTreatments || []}
                memoriesSaved={memoriesSaved}
                setCompletedTreatments={setCompletedTreatments as React.Dispatch<SetStateAction<TreatmentResult[]>>}
                setMemoriesSaved={setMemoriesSaved as React.Dispatch<SetStateAction<boolean>>}
            />
            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-4xl mx-auto space-y-8 pb-16">
                    {/* Header Section */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3"> <img src="/images/logo.png" alt="Logo" className="h-8 w-auto" /> <h1 className="text-2xl font-bold text-white">The Reconsolidation Program</h1> </div>
                        {/* Tooltip for page info */}
                        <TooltipProvider><Tooltip><TooltipTrigger asChild><button className="p-1 rounded-full hover:bg-muted/50"><Info className="w-5 h-5 text-gray-400" /></button></TooltipTrigger><TooltipContent><p>Complete these steps to activate the memory.</p></TooltipContent></Tooltip></TooltipProvider>
                    </div>
                    <h2 className="text-xl font-semibold text-center text-primary mb-6">Treatment Activation</h2>

                    {/* === SECTION 1: Target Event Recording === */}
                    <section className="space-y-4 p-4 border-2 rounded-lg bg-card shadow-md" style={{ borderColor: '#4A1212' }}>
                        {/* --- CORRECTED HEADER 1 JSX --- */}
                        <h3 className="text-lg font-semibold flex items-center text-white">
                            <span>1. Record Target Event (Audio - Under 3 mins)</span>
                            <TooltipProvider delayDuration={100}>
                                <Tooltip>
                                    {/* Removed asChild, added basic styling */}
                                    <TooltipTrigger className="ml-2 cursor-help inline-flex items-center justify-center p-1 rounded-full hover:bg-muted/50">
                                        <Info size={16} className="text-muted-foreground"/>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Record audio describing the specific memory.</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </h3>
                        {/* --- END CORRECTION --- */}
                         {/* UI using the useTargetRecording hook */}
                         {!isSupported && ( <div className="text-red-500 flex items-center space-x-2"><AlertCircle className="w-5 h-5"/><span>Browser not fully supported...</span></div> )}
                         {recordingError && ( <div className="text-red-500 flex items-center space-x-2"><AlertCircle className="w-5 h-5"/><span>{recordingError}</span></div> )}
                         <div className="flex items-center justify-between">
                             {!isRecordingTarget ? ( <Button onClick={startTargetRecording} disabled={!isSupported || isRecordingTarget} size="sm"> <Mic className="w-4 h-4 mr-2" /> Start Target Recording </Button> )
                              : ( <Button onClick={stopTargetRecording} variant="destructive" disabled={!isRecordingTarget} size="sm"> <Square className="w-4 h-4 mr-2" /> Stop Recording ({formatTime(recordingTime)} / 180s) </Button> )}
                             {audioBlobTarget && !isRecordingTarget && ( <span className="text-sm text-green-500 ml-4">Audio Recorded</span> )}
                         </div>
                         {(isRecordingTarget || targetEventTranscript) && ( <div className="mt-4 p-3 bg-muted/50 rounded border border-border min-h-[60px]"><p className="text-sm text-muted-foreground italic">{isRecordingTarget ? "Live transcript..." : "Final transcript:"}</p><p className="text-sm">{isRecordingTarget ? liveTranscript : targetEventTranscript}</p></div> )}
                    </section>

                    {/* === SECTION 2: SUDS Calibration === */}
                    <section className="space-y-4 p-4 rounded-lg bg-card shadow-md"> {/* Removed border */}
                        {/* --- CORRECTED HEADER 2 JSX --- */}
                        <h3 className="text-lg font-semibold flex items-center text-white">
                            <span>2. Rate Initial Distress (SUDS)</span>
                             <TooltipProvider delayDuration={100}>
                                <Tooltip>
                                     {/* Removed asChild, added basic styling */}
                                    <TooltipTrigger className="ml-2 cursor-help inline-flex items-center justify-center p-1 rounded-full hover:bg-muted/50">
                                        <Info size={16} className="text-muted-foreground"/>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Rate distress (0-100) thinking about the Target Event you just recalled/recorded.</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </h3>
                         {/* --- END CORRECTION --- */}
                        <SUDSScale initialValue={calibrationSuds || 0} onValueChange={handleSudsChange} />
                    </section>

                    {/* === SECTION 3: Context Memories === */}
                    <section className="space-y-4 p-4 border border-yellow-500 rounded-lg bg-card shadow-md"> {/* Kept yellow border */}
                        <h3 className="text-lg font-semibold text-white">3. Record Positive Context Memories (Audio)</h3>
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-4"> <h4 className="font-medium text-muted-foreground">Positive Memory 1 (Before Event)</h4> <MemoryControls memoryNumber={1} isRecording={isRecording1} /> </div>
                            <div className="space-y-4"> <h4 className="font-medium text-muted-foreground">Positive Memory 2 (After Event)</h4> <MemoryControls memoryNumber={2} isRecording={isRecording2} /> </div>
                        </div>
                    </section>

                    {/* Save and Proceed Buttons */}
                    <div className="flex justify-end pt-4 space-x-4">
                        <button onClick={handleSaveSetup} disabled={!targetEventTranscript || !memory1 || !memory2 || typeof calibrationSuds !== 'number' || calibrationSuds < 0 || memoriesSaved} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{memoriesSaved ? "Activation Saved" : "Save Activation Setup"}</button>
                        <button onClick={() => navigate('/treatment-1')} disabled={!memoriesSaved} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center">Proceed to Processing <ArrowRight className="w-4 h-4 ml-2"/></button>
                    </div>
                </div>
            </main>
        </div>
    );
};
export default ActivationPage;