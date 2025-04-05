// src/pages/Index.tsx
import { Upload, ArrowLeft, Info, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import SUDSScale from "../components/SUDSScale";
import RecordingAnalyzer from "../components/RecordingAnalyzer";
import AppSidebar from "../components/AppSidebar";
import { useRecording } from "@/contexts/RecordingContext";
import { type TreatmentResult } from "@/types/recording";
import { TargetEventRecorder } from "../components/TargetEventRecorder";
import { MemoryControls } from "../components/MemoryControls";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEffect, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const MemoryForm = () => {
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const {
        videoBlob,
        memory1,
        memory2,
        isRecording1,
        isRecording2,
        setMemory1,
        setMemory2,
        sudsLevel,
        setSudsLevel,
        calibrationSuds,
        setCalibrationSuds,
        showsSidebar,
        setShowsSidebar,
        setMemoriesSaved,
        completedTreatments,
        memoriesSaved,
        setCompletedTreatments,
    } = useRecording();

    useEffect(() => {
        setShowsSidebar(true);
    }, [setShowsSidebar]);

    const handleSaveMemories = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();

        if (!videoBlob || !memory1 || !memory2) {
            toast.error("Please fill in all fields");
            return;
        }

        const memories = {
            memory1,
            memory2,
            targetEvent: videoBlob,
            sudsLevel,
            calibrationSuds,
        };
        localStorage.setItem('memories', JSON.stringify(memories));
        console.log("Saved memories to localStorage:", memories);

        setMemory1(memory1);
        setMemory2(memory2);
        setSudsLevel(sudsLevel);
        setMemoriesSaved(true);

        toast.success("Memories saved successfully! You can now proceed to Treatment 1 when ready.");
    };

    return (
        <div className="min-h-screen flex w-full">
            <AppSidebar
                visible={showsSidebar}
                calibrationSuds={calibrationSuds}
                targetEvent={videoBlob || undefined}
                memory1={memory1}
                memory2={memory2}
                completedTreatments={completedTreatments}
                setCompletedTreatments={setCompletedTreatments as React.Dispatch<React.SetStateAction<TreatmentResult[]>>}
                memoriesSaved={memoriesSaved}
                setMemoriesSaved={setMemoriesSaved as React.Dispatch<React.SetStateAction<boolean>>}
            />
            <main className="flex-1 p-8">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold">Record Your Memories</h1>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Info className="w-5 h-5 text-gray-400" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Record your target event and memories to begin treatment</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold">Target Event</h2>
                        <TargetEventRecorder />
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold">Memories</h2>
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">Memory 1 (Pre-Target Event)</h3>
                                <MemoryControls memoryNumber={1} isRecording={isRecording1} />
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">Memory 2 (Post-Target Event)</h3>
                                <MemoryControls memoryNumber={2} isRecording={isRecording2} />
                            </div>
                        </div>
                    </section>

                    <div className="flex justify-end">
                        <button
                            onClick={handleSaveMemories}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Save Memories
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default MemoryForm;