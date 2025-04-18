// src/pages/Index.tsx
import { Upload, ArrowLeft, Info, MessageSquare } from "lucide-react"; // Check usage
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";
import SUDSScale from "../components/SUDSScale";
import AppSidebar from "../components/AppSidebar";
import { useRecording } from "@/contexts/RecordingContext";
import { type TreatmentResult } from "@/types/recording"; // Ensure this type is correct
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
import type { SetStateAction } from 'react'; // Import if needed for type assertions

const MemoryForm = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const {
        videoBlob, memory1, memory2, isRecording1, isRecording2,
        setMemory1, setMemory2, targetEventTranscript, setTargetEventTranscript, // Added setter for TargetEvent
        calibrationSuds, setCalibrationSuds,
        showsSidebar, setShowsSidebar,
        setMemoriesSaved, completedTreatments, setCompletedTreatments,
        memoriesSaved,
    } = useRecording();
    const { userEmail, checkAuthStatus, userStatus, isLoading } = useAuth();

    // Effect to Check Auth Status After Potential Signup Redirect
    useEffect(() => {
        console.log(`MemoryForm Effect: location.pathname=${location.pathname}, userStatus=${userStatus}, isLoading=${isLoading}`);
        // Check auth status if loading or if status is unexpectedly 'none' while email exists
        if (userStatus === 'loading' || (userEmail && userStatus === 'none')) {
            console.log("MemoryForm Effect: Triggering checkAuthStatus.");
            checkAuthStatus(); // checkAuthStatus uses context/localStorage email
        }
        // No need to check location.state anymore, rely on localStorage/context state
    }, [checkAuthStatus, userEmail, userStatus, isLoading]); // Rerun if these change


    // Effect to manage sidebar visibility
    useEffect(() => {
        setShowsSidebar(true);
        // Optional cleanup function to hide sidebar when leaving this page
        // return () => setShowsSidebar(false);
    }, [setShowsSidebar]);

    const handleSaveMemories = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        console.log("Attempting to save memories.", { videoBlob: !!videoBlob, memory1, memory2, calibrationSuds });
        // Ensure all components have updated context state BEFORE saving
        if (!videoBlob || !memory1 || !memory2 || !targetEventTranscript || typeof calibrationSuds !== 'number' || calibrationSuds < 0) {
            toast.error("Please record Target Event, Memory 1, Memory 2, and set initial SUDS before saving.");
            console.log("Missing:", { videoBlob:!videoBlob, memory1:!memory1, memory2:!memory2, target:!targetEventTranscript, suds: !(typeof calibrationSuds === 'number')});
            return;
        }

        // --- PERSISTENCE (Highly Recommended: Replace localStorage with Supabase save) ---
        console.log("Saving prerequisites to context via setMemoriesSaved(true)...");
        // This flag tells Treatment1 page that setup is done
        setMemoriesSaved(true);
        // You should ALSO save memory1, memory2, targetEventTranscript, calibrationSuds
        // to your Supabase 'users' table (or a related 'treatments' table) here,
        // associated with the userEmail.
        // Example (needs async/await and error handling):
        // const { error } = await supabaseAdmin.from('users').update({
        //    last_memory1: memory1, last_memory2: memory2, last_target: targetEventTranscript, last_calib_suds: calibrationSuds
        // }).eq('email', userEmail);
        // --- End Persistence ---

        toast.success("Memory Setup Complete! You can now proceed to Treatment 1 phases.");
    };

    // Handler for SUDS Scale component
    const handleSudsChange = (value: number) => {
        setCalibrationSuds(value); // Update context state directly
    };

    // Show loading indicator while auth status is being determined
    if (isLoading) {
        return <div className="flex justify-center items-center min-h-screen">Loading User Data...</div>;
    }

    // If auth check completes and user still doesn't have trial/paid status, ProtectedRoute should handle redirect,
    // but this could be a fallback (though might cause infinite loop if route '/' is protected).
    // Consider removing this if ProtectedRoute is reliable.
    // if (!isLoading && userStatus === 'none') {
    //    return <div className="flex justify-center items-center min-h-screen">Access Denied. Redirecting...</div>;
    // }


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
                // Pass required setters from context
                setCompletedTreatments={setCompletedTreatments as React.Dispatch<SetStateAction<TreatmentResult[]>>}
                setMemoriesSaved={setMemoriesSaved as React.Dispatch<SetStateAction<boolean>>}
                // userEmail prop removed
            />
            <main className="flex-1 p-8 overflow-y-auto"> {/* Added overflow */}
                <div className="max-w-4xl mx-auto space-y-8 pb-16"> {/* Added padding-bottom */}
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold">Treatment Setup</h1>
                        <TooltipProvider><Tooltip><TooltipTrigger asChild><Info className="w-5 h-5 text-gray-400" /></TooltipTrigger><TooltipContent><p>Record target event, memories, and initial distress (SUDS).</p></TooltipContent></Tooltip></TooltipProvider>
                    </div>

                    <section className="space-y-4 p-4 border rounded-lg bg-card">
                        <h2 className="text-xl font-semibold flex items-center">1. Record Target Event (Under 3 mins) <TooltipProvider delayDuration={100}><Tooltip><TooltipTrigger className="ml-2"><Info size={16} className="text-muted-foreground"/></TooltipTrigger><TooltipContent><p>Record yourself describing the specific memory.</p></TooltipContent></Tooltip></TooltipProvider></h2>
                        {/* TargetEventRecorder needs to update videoBlob and targetEventTranscript in context */}
                        <TargetEventRecorder />
                    </section>

                    <section className="space-y-4 p-4 border rounded-lg bg-card">
                        <h2 className="text-xl font-semibold">2. Record Context Memories</h2>
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">Memory 1 (Before Event)</h3>
                                {/* MemoryControls needs to update memory1 in context */}
                                <MemoryControls memoryNumber={1} isRecording={isRecording1} />
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">Memory 2 (After Event)</h3>
                                {/* MemoryControls needs to update memory2 in context */}
                                <MemoryControls memoryNumber={2} isRecording={isRecording2} />
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4 p-4 border rounded-lg bg-card">
                        <h2 className="text-xl font-semibold flex items-center">3. Rate Initial Distress (SUDS) <TooltipProvider delayDuration={100}><Tooltip><TooltipTrigger className="ml-2"><Info size={16} className="text-muted-foreground"/></TooltipTrigger><TooltipContent><p>Rate distress thinking about the Target Event (0-100).</p></TooltipContent></Tooltip></TooltipProvider></h2>
                        {/* Pass initialValue and onValueChange */}
                        <SUDSScale
                           initialValue={calibrationSuds || 0}
                           onValueChange={handleSudsChange}
                        />
                    </section>

                    <div className="flex justify-end pt-4 space-x-4">
                        <button
                            onClick={handleSaveMemories}
                            // Disable if missing any required data OR if already saved
                            disabled={!videoBlob || !memory1 || !memory2 || !targetEventTranscript || typeof calibrationSuds !== 'number' || calibrationSuds < 0 || memoriesSaved}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={memoriesSaved ? "Setup already saved" : (!videoBlob || !memory1 || !memory2 || !targetEventTranscript || typeof calibrationSuds !== 'number' || calibrationSuds < 0) ? "Complete all steps above" : "Save setup data"}
                        >
                            {memoriesSaved ? "Setup Saved" : "Save Setup"}
                        </button>
                        <button
                            onClick={() => navigate('/treatment-1')}
                            disabled={!memoriesSaved} // Enable only after saving
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={memoriesSaved ? "Proceed to Treatment 1 Processing Phases" : "Complete and save setup first"}
                        >
                            Proceed to Treatment 1 Phases
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};
export default MemoryForm;