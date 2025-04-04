// src/components/AppSidebar.tsx
import { Sidebar, SidebarContent, SidebarGroup, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { ChevronRight, Mic, FileText, CheckCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TreatmentResult } from "@/types/recording"; // Ensure this is correctly defined
import { useRecording } from '@/contexts/RecordingContext';
import { useEffect } from "react";
import { toast } from 'react-hot-toast';

interface AppSidebarProps {
  visible: boolean;
  calibrationSuds: number;
  targetEvent: Blob | undefined;
  memory1: string; // Memory before the target event
  memory2: string; // Memory after the target event
  completedTreatments: TreatmentResult[]; // Ensure this is defined
  setCompletedTreatments: React.Dispatch<React.SetStateAction<TreatmentResult[]>>; // Ensure this is defined
  memoriesSaved: boolean;
  setMemoriesSaved: React.Dispatch<React.SetStateAction<boolean>>;
}

const AppSidebar = ({
  visible,
  calibrationSuds,
  targetEvent,
  memory1,
  memory2,
  completedTreatments, // Ensure this is passed correctly
  setCompletedTreatments, // Ensure this is passed correctly
  memoriesSaved,
  setMemoriesSaved
}: AppSidebarProps) => {
  const navigate = useNavigate();
  const { setMemory1, setMemory2 } = useRecording();

  const completeTreatment = (treatmentName: string, sudsScore: number) => {
    // Extract the treatment number from the name (e.g., "Treatment 2" -> 2)
    const treatmentNumber = parseInt(treatmentName.replace(/[^0-9]/g, ''));
    
    // Check if this treatment is already completed
    const treatmentIndex = completedTreatments.findIndex(t => t.treatmentNumber === treatmentNumber);

    if (treatmentIndex >= 0) {
      // Update existing treatment
      const updatedTreatments = [...completedTreatments];
      updatedTreatments[treatmentIndex] = {
        treatmentNumber,
        finalSuds: sudsScore,
        improvementPercentage: calibrationSuds > 0 ? ((calibrationSuds - sudsScore) / calibrationSuds) * 100 : 0,
        isImprovement: sudsScore < calibrationSuds,
        completedAt: new Date().toISOString(),
      };
      setCompletedTreatments(updatedTreatments);
    } else {
      // Add new treatment
      setCompletedTreatments(prev => [
        ...prev,
        {
          treatmentNumber,
          finalSuds: sudsScore,
          improvementPercentage: calibrationSuds > 0 ? ((calibrationSuds - sudsScore) / calibrationSuds) * 100 : 0,
          isImprovement: sudsScore < calibrationSuds,
          completedAt: new Date().toISOString(),
        }
      ]);
    }

    console.log(`Completed Treatment ${treatmentNumber} with SUDS score: ${sudsScore}`);
  };

  // Load saved memories from localStorage on initialization
  useEffect(() => {
    const savedState = localStorage.getItem('recordingState');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        if (state.memory1) setMemory1(state.memory1);
        if (state.memory2) setMemory2(state.memory2);
      } catch (error) {
        console.error('Error loading saved memories:', error);
      }
    }
  }, [setMemory1, setMemory2]);

  if (!visible) return null;

  // Get unique treatments and sort them by number
  const uniqueTreatments = Array.from(new Map(
    completedTreatments.map(t => [t.treatmentNumber, t])
  ).values()).sort((a, b) => a.treatmentNumber - b.treatmentNumber);

  // Find the next treatment number
  const nextTreatmentNumber = uniqueTreatments.length > 0 
    ? Math.max(...uniqueTreatments.map(t => t.treatmentNumber)) + 1 
    : 1;

  const treatmentDescriptions = [
    "Two nights after Treatment 1",
    "Two nights after Treatment 2",
    "Two nights after Treatment 3",
    "Two nights after Treatment 4",
    "6 weeks after Treatment 5"
  ];

  const isReadyForTreatment1 = calibrationSuds > 0 && !!memory1 && !!memory2 && !!targetEvent && memoriesSaved;

  return (
    <Sidebar className="border-r bg-gray-900 text-white" style={{ display: visible ? 'block' : 'none' }}>
      <SidebarHeader className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold">Treatment Protocol</h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <div className="flex items-center justify-between w-full px-2">
                  <span>Calibration</span>
                  {calibrationSuds > 0 && <span>{calibrationSuds}</span>}
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4" />
                    <span>Target Event</span>
                  </div>
                  {targetEvent && <CheckCircle className="w-4 h-4 text-green-500" />}
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>Memory 1 (Pre-Target Event)</span>
                  </div>
                  {memory1 && <CheckCircle className="w-4 h-4 text-green-500" />}
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>Memory 2 (Post-Target Event)</span>
                  </div>
                  {memory2 && <CheckCircle className="w-4 h-4 text-green-500" />}
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Treatment Schedule */}
        <SidebarGroup>
          <SidebarMenu>
            {uniqueTreatments.map((treatment) => (
              <SidebarMenuItem key={treatment.treatmentNumber}>
                <SidebarMenuButton asChild onClick={() => navigate(`/treatment-${treatment.treatmentNumber}`)}>
                  <div className="flex items-center justify-between w-full text-white cursor-pointer hover:bg-gray-800 px-2">
                    <span>Treatment {treatment.treatmentNumber}</span>
                    <div className="flex items-center gap-4">
                      <span>{treatment.finalSuds}</span>
                      <span className={treatment.improvementPercentage > 0 ? 'text-green-500' : 'text-red-500'}>
                        {treatment.improvementPercentage > 0 ? '+' : '-'}{Math.abs(treatment.improvementPercentage).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            {/* Show next available treatment */}
            {nextTreatmentNumber <= 5 && (
              isReadyForTreatment1 ? (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild onClick={() => navigate(`/treatment-${nextTreatmentNumber}`)}>
                    <div className="flex items-center justify-between w-full text-white cursor-pointer hover:bg-gray-800 px-2">
                      <span>Treatment {nextTreatmentNumber}</span>
                      <span className="text-gray-400">(Ready)</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : nextTreatmentNumber === 1 ? null : (
                <SidebarMenuItem>
                  <div className="flex items-center justify-between w-full text-gray-500 px-2">
                    <span>Treatment {nextTreatmentNumber}</span>
                    <span>(Locked)</span>
                  </div>
                </SidebarMenuItem>
              )
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;