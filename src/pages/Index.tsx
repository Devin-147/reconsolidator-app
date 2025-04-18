// src/pages/Index.tsx
import { Upload, ArrowLeft, Info, MessageSquare } from "lucide-react"; // Check usage
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";
import SUDSScale from "../components/SUDSScale"; // Import the component
import AppSidebar from "../components/AppSidebar";
import { useRecording } from "@/contexts/RecordingContext";
import { type TreatmentResult } from "@/types/recording";
import { TargetEventRecorder } from "../components/TargetEventRecorder";
import { MemoryControls } from "../components/MemoryControls";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SetStateAction } from 'react';

const MemoryForm = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const {
        videoBlob, memory1, memory2, isRecording1, isRecording2,
        setMemory1, setMemory2, targetEventTranscript,
        calibrationSuds, setCalibrationSuds, // Get getter and setter
        showsSidebar, setShowsSidebar,
        setMemoriesSaved, completedTreatments, setCompletedTreatments,
        memoriesSaved,
    } = useRecording();
    const { userEmail, checkAuthStatus, userStatus, isLoading } = useAuth();

    // Effect to check auth status when landing here after signup
    useEffect(() => {
        const state = location.state as { newlySignedUpEmail?: string };
        const signupEmail = state?.newlySignedUpEmail;
        if (signupEmail || (!isLoading && userStatus === 'loading')) {
            console.log(`MemoryForm: Detected signup email or loading state. Triggering checkAuthStatus.`);
            if(signupEmail) navigate(location.pathname, { replace: true, state: {} });
            checkAuthStatus(); // No argument
        }
    }, [location, navigate, checkAuthStatus, isLoading, userStatus]);

    // Effect to manage sidebar
    useEffect(() => { setShowsSidebar(true); }, [setShowsSidebar]);

    const handleSaveMemories = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        console.log("Attempting to save memories.", { videoBlob: !!videoBlob, memory1, memory2, calibrationSuds });
        if (!videoBlob || !memory1 || !memory2 || typeof calibrationSuds !== 'number' || calibrationSuds < 0) {
            toast.error("Please record Target Event, Memory 1, Memory 2, and set initial SUDS before saving.");
            return;
        }
        console.log("Saving prerequisites to context...");
        setMemoriesSaved(true); // Set the flag
        toast.success("Memory Setup Complete! You can now proceed.");
    };

    // This handler correctly updates the context state via setCalibrationSuds
    const handleSudsChange = (value: number) => {
        setCalibrationSuds(value);
    };

    if (isLoading) { return <div className="flex justify-center items-center min-h-screen">Loading User Data...</div>; }

    return (
        <div className="min-h-screen flex w-full">
            <AppSidebar
                visible={showsSidebar}
                calibrationSuds={calibrationSuds}
                targetEvent={videoBlob || undefined}
                memory1={memory1}
                memory2={memory2}
                completedTreatments={completedTreatments || []}
                memoriesSaved={memoriesSaved}
                setCompletedTreatments={setCompletedTreatments as React.Dispatch<SetStateAction<TreatmentResult[]>>}
                setMemoriesSaved={setMemoriesSaved as React.Dispatch<SetStateAction<boolean>>}
                // userEmail prop removed based on previous error
            />
            <main className="flex-1 p-8">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="flex items-center justify-between"><h1 className="text-2xl font-bold">Treatment Setup</h1>{/* Tooltip */}</div>
                    <section className="space-y-4 p-4 border rounded-lg"><h2 className="text-xl font-semibold flex items-center">1. Target Event Recording {/* Tooltip */}</h2><TargetEventRecorder /></section>
                    <section className="space-y-4 p-4 border rounded-lg"><h2 className="text-xl font-semibold">2. Context Memories</h2><div className="grid gap-6 md:grid-cols-2"><div className="space-y-4"><h3 className="text-lg font-medium">Memory 1</h3><MemoryControls memoryNumber={1} isRecording={isRecording1} /></div><div className="space-y-4"><h3 className="text-lg font-medium">Memory 2</h3><MemoryControls memoryNumber={2} isRecording={isRecording2} /></div></div></section>
                    <section className="space-y-4 p-4 border rounded-lg"><h2 className="text-xl font-semibold flex items-center">3. Initial Distress Level (SUDS) {/* Tooltip */}</h2>
                        {/* --- CORRECTED SUDSScale Props --- */}
                        <SUDSScale
                           initialValue={calibrationSuds || 0} // Pass current SUDS as initialValue
                           onValueChange={handleSudsChange}    // Pass handler to onValueChange
                           // readOnly={memoriesSaved} // Optional: make read-only after saving?
                        />
                         {/* --- END CORRECTION --- */}
                    </section>
                    <div className="flex justify-end pt-4 space-x-4">
                        <button onClick={handleSaveMemories} disabled={!videoBlob || !memory1 || !memory2 || typeof calibrationSuds !== 'number' || calibrationSuds < 0 || memoriesSaved} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{memoriesSaved ? "Setup Saved" : "Save Setup"}</button>
                        <button onClick={() => navigate('/treatment-1')} disabled={!memoriesSaved} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">Proceed to Treatment 1 Phases</button>
                    </div>
                </div>
            </main>
        </div>
    );
};
export default MemoryForm;