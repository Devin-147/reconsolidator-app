// src/components/AppSidebar.tsx
import { Sidebar, SidebarContent, SidebarGroup, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { CheckCircle, FileText, Mic } from "lucide-react"; // Removed unused icons
import { useNavigate } from "react-router-dom";
import { TreatmentResult } from "@/types/recording"; // Ensure this path is correct
import React from "react"; // Import React if using JSX implicitly

// Interface defines props received FROM parent (e.g., Index.tsx)
export interface AppSidebarProps { // Exporting the interface is good practice
  visible: boolean;
  calibrationSuds: number | undefined | null; // Allow null/undefined
  targetEvent: Blob | undefined; // Blob for target audio/video
  memory1: string; // Memory before the target event transcript
  memory2: string; // Memory after the target event transcript
  completedTreatments: TreatmentResult[]; // Array of results using corrected type
  memoriesSaved: boolean; // Flag indicating if setup is done
  // Setters are required by the type definition for parent component usage checks
  setCompletedTreatments: React.Dispatch<React.SetStateAction<TreatmentResult[]>>;
  setMemoriesSaved: React.Dispatch<React.SetStateAction<boolean>>;
  // userEmail prop removed as it caused errors previously
}

const AppSidebar = ({
  visible,
  calibrationSuds,
  targetEvent,
  memory1,
  memory2,
  completedTreatments, // Received from context via parent
  memoriesSaved,
  // Setters received but likely not used directly IN the sidebar display logic
  // setCompletedTreatments,
  // setMemoriesSaved
}: AppSidebarProps) => {
  const navigate = useNavigate();

  // --- REMOVED completeTreatment function ---
  // This logic should reside in RecordingContext, not the display component.
  // --- END REMOVED ---

  // --- REMOVED useEffect loading from localStorage ---
  // Context should handle loading/persistence. Sidebar just displays current state.
  // --- END REMOVED ---

  if (!visible) return null;

  // Sort treatments for display (already sorted in context, but safe to re-sort)
  const sortedTreatments = [...completedTreatments].sort((a, b) => a.treatmentNumber - b.treatmentNumber);

  // Determine next treatment number based on completed ones
  const lastCompletedNumber = sortedTreatments.length > 0 ? sortedTreatments[sortedTreatments.length - 1].treatmentNumber : 0;
  const nextTreatmentNumber = lastCompletedNumber + 1;

  // Determine if prerequisites for starting Treatment 1 (or next) are met
  // Using memoriesSaved flag set by the Activation/Setup page
  const isReadyForProcessing = memoriesSaved; // Primary flag

  return (
    <Sidebar className="border-r bg-gray-900 text-white w-64" style={{ display: visible ? 'block' : 'none' }}> {/* Added fixed width example */}
      <SidebarHeader className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold">Treatment Progress</h2> {/* Changed Title */}
      </SidebarHeader>
      <SidebarContent className="p-4"> {/* Added padding */}
        {/* Setup Steps Section */}
        <SidebarGroup>
          <SidebarMenu className="space-y-1"> {/* Added spacing */}
            <SidebarMenuItem className="opacity-80 text-sm px-2 mb-1">Setup Steps</SidebarMenuItem> {/* Section Header */}
            <SidebarMenuItem>
              <div className="flex items-center justify-between w-full px-2 py-1">
                <span>Initial SUDS</span>
                {/* Display calibration SUDS if available */}
                <span>{typeof calibrationSuds === 'number' ? calibrationSuds : 'N/A'}</span>
              </div>
            </SidebarMenuItem>
            <SidebarMenuItem>
               <div className="flex items-center justify-between w-full px-2 py-1">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 flex-shrink-0" /> {/* Added shrink */}
                    <span className="truncate">Target Event</span> {/* Added truncate */}
                  </div>
                  {/* Check if targetEvent blob exists */}
                  {targetEvent ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> : <div className="w-4 h-4 flex-shrink-0"></div>}
               </div>
            </SidebarMenuItem>
             <SidebarMenuItem>
               <div className="flex items-center justify-between w-full px-2 py-1">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">Memory 1 (Positive, Before)</span> {/* Added Positive */}
                  </div>
                  {/* Check if memory1 transcript exists */}
                  {memory1 ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> : <div className="w-4 h-4 flex-shrink-0"></div>}
               </div>
            </SidebarMenuItem>
             <SidebarMenuItem>
                <div className="flex items-center justify-between w-full px-2 py-1">
                    <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">Memory 2 (Positive, After)</span> {/* Added Positive */}
                    </div>
                    {/* Check if memory2 transcript exists */}
                    {memory2 ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> : <div className="w-4 h-4 flex-shrink-0"></div>}
                </div>
             </SidebarMenuItem>
             <SidebarMenuItem>
                <div className={`flex items-center justify-between w-full px-2 py-1 ${memoriesSaved ? 'text-green-400' : 'text-gray-500'}`}>
                    <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">Setup Saved</span>
                    </div>
                    {memoriesSaved ? <span className="text-xs">(Ready)</span> : <span className="text-xs">(Pending)</span>}
                </div>
             </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Treatment Results Section */}
        <SidebarGroup className="mt-4"> {/* Added margin top */}
           <SidebarMenu className="space-y-1">
             <SidebarMenuItem className="opacity-80 text-sm px-2 mb-1">Completed Treatments</SidebarMenuItem> {/* Section Header */}
            {sortedTreatments.length === 0 && <SidebarMenuItem><div className="px-2 py-1 text-gray-500 text-sm italic">None yet</div></SidebarMenuItem>}
            {sortedTreatments.map((treatment) => {
                // --- FIX: Check for null improvementPercentage ---
                const improvementDisplay = treatment.improvementPercentage !== null
                    ? `${treatment.improvementPercentage > 0 ? '+' : ''}${treatment.improvementPercentage.toFixed(0)}%`
                    : 'N/A';
                const improvementColor = treatment.improvementPercentage === null || treatment.improvementPercentage === 0
                    ? 'text-gray-400' // Neutral for null or zero
                    : treatment.improvementPercentage > 0
                    ? 'text-green-500' // Green for improvement
                    : 'text-red-500';   // Red for decline
                // --- END FIX ---

                // Determine if the corresponding treatment page is the next logical step
                const isNext = treatment.treatmentNumber + 1 === nextTreatmentNumber && memoriesSaved;

                return (
                  <SidebarMenuItem key={treatment.treatmentNumber}>
                    {/* Make button navigable only if prerequisites met for next step */}
                    <SidebarMenuButton
                       asChild={isNext} // Only make it a navigable button if it's the path to the NEXT treatment
                       onClick={isNext ? () => navigate(`/treatment-${treatment.treatmentNumber + 1}`) : undefined} // Navigate only if it's the next one
                       className={`flex items-center justify-between w-full text-white ${isNext ? 'cursor-pointer hover:bg-gray-800' : 'cursor-default opacity-70'} px-2 py-1`}
                    >
                      <div> {/* Wrap content */}
                        <span>Treatment {treatment.treatmentNumber}</span>
                        <span className="text-xs text-gray-400 ml-2">(Final SUDS: {treatment.finalSuds})</span>
                      </div>
                      <span className={`text-sm font-semibold ${improvementColor}`}>
                        {improvementDisplay}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
            })}

            {/* Show Button for Next Treatment if prerequisites are met */}
            {nextTreatmentNumber <= 5 && isReadyForProcessing && (
              <SidebarMenuItem className="mt-2"> {/* Added margin */}
                  <SidebarMenuButton asChild onClick={() => navigate(`/treatment-${nextTreatmentNumber}`)}>
                    <div className="flex items-center justify-center w-full text-white cursor-pointer hover:bg-green-700 bg-green-600 px-2 py-1.5 rounded">
                      <span>Start Treatment {nextTreatmentNumber}</span>
                      {/* Optionally add icon */}
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
            )}
            {/* Indicate locked state if applicable */}
             {nextTreatmentNumber <= 5 && !isReadyForProcessing && (
                 <SidebarMenuItem>
                    <div className="flex items-center justify-between w-full text-gray-500 px-2 py-1 text-sm italic">
                        <span>Treatment {nextTreatmentNumber}</span>
                        <span>(Setup Pending)</span>
                    </div>
                 </SidebarMenuItem>
            )}
             {nextTreatmentNumber > 5 && sortedTreatments.length >= 5 && (
                 <SidebarMenuItem>
                    <div className="px-2 py-1 text-green-400 text-sm font-semibold">All treatments complete!</div>
                 </SidebarMenuItem>
             )}

          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;