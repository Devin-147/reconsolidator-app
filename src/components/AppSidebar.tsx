// FILE: src/components/AppSidebar.tsx
// FINAL CORRECTED VERSION

import React, { useEffect } from 'react';
import { Sidebar, SidebarContent, SidebarGroup, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { CheckCircle, FileText, Mic } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { type TreatmentResult } from "@/types/recording";
import { useRecording } from '@/contexts/RecordingContext';

const AppSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    showsSidebar,
    calibrationSuds, 
    audioBlobTarget,
    memory1,
    memory2,
    completedTreatments,
    memoriesSaved,
  } = useRecording();

  const isLandingPage = location.pathname === '/';
  if (isLandingPage || !showsSidebar) {
     return null; 
  }

  const sortedTreatments = [...(completedTreatments || [])].sort((a, b) => a.treatmentNumber - b.treatmentNumber);
  const lastCompletedNumber = sortedTreatments.length > 0 ? sortedTreatments[sortedTreatments.length - 1].treatmentNumber : 0;
  const nextTreatmentNumber = lastCompletedNumber < 5 ? lastCompletedNumber + 1 : null;
  const isReadyForProcessing = memoriesSaved; 

  return (
    <Sidebar className="fixed left-0 top-0 bottom-0 h-full w-64 border-r bg-gray-900 text-white z-30 overflow-y-auto transition-transform duration-300 ease-in-out md:translate-x-0 print:hidden">
      <SidebarHeader className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold">Treatment Progress</h2>
      </SidebarHeader>
      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarMenu className="space-y-1">
            <SidebarMenuItem className="opacity-80 text-sm px-2 mb-1 text-gray-400">Activation Setup</SidebarMenuItem>
            <SidebarMenuItem>
              <div className="flex items-center justify-between w-full px-2 py-1">
                <span>Initial SUDS</span>
                <span>{typeof calibrationSuds === 'number' ? calibrationSuds : '--'}</span>
              </div>
            </SidebarMenuItem>
            <SidebarMenuItem><div className="flex items-center justify-between w-full px-2 py-1"><div className="flex items-center gap-2"><Mic className="w-4 h-4 flex-shrink-0" /><span className="truncate">Target Event</span></div>{audioBlobTarget ? <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" /> : <div className="w-4 h-4 flex-shrink-0 opacity-50 border border-dashed rounded-full"></div>}</div></SidebarMenuItem>
            <SidebarMenuItem><div className="flex items-center justify-between w-full px-2 py-1"><div className="flex items-center gap-2"><FileText className="w-4 h-4 flex-shrink-0" /><span className="truncate">Memory 1 (Positive)</span></div>{memory1 && memory1.trim().length > 0 ? <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" /> : <div className="w-4 h-4 flex-shrink-0 opacity-50 border border-dashed rounded-full"></div>}</div></SidebarMenuItem>
            <SidebarMenuItem><div className="flex items-center justify-between w-full px-2 py-1"><div className="flex items-center gap-2"><FileText className="w-4 h-4 flex-shrink-0" /><span className="truncate">Memory 2 (Positive)</span></div>{memory2 && memory2.trim().length > 0 ? <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" /> : <div className="w-4 h-4 flex-shrink-0 opacity-50 border border-dashed rounded-full"></div>}</div></SidebarMenuItem>
            <SidebarMenuItem><div className={`flex items-center justify-between w-full px-2 py-1 ${memoriesSaved ? 'text-green-400' : 'text-amber-400'}`}><div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 flex-shrink-0" /><span className="truncate">Setup Saved</span></div>{memoriesSaved ? <span className="text-xs">(Ready for Treatments)</span> : <span className="text-xs">(Pending)</span>}</div></SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
           <SidebarMenu className="space-y-1">
             <SidebarMenuItem className="opacity-80 text-sm px-2 mb-1 text-gray-400">Completed Treatments</SidebarMenuItem>
            {sortedTreatments.length === 0 && <SidebarMenuItem><div className="px-2 py-1 text-gray-500 text-sm italic">None yet</div></SidebarMenuItem>}
            {sortedTreatments.map((treatment) => {
                const improvementDisplay = treatment.improvementPercentage !== null ? `${treatment.improvementPercentage > 0 ? '+' : ''}${treatment.improvementPercentage.toFixed(0)}%` : 'N/A';
                const improvementColor = treatment.improvementPercentage === null || treatment.improvementPercentage === 0 ? 'text-gray-400' : treatment.improvementPercentage > 0 ? 'text-green-500' : 'text-red-500';
                
                return (
                  <SidebarMenuItem key={treatment.treatmentNumber}>
                    <div className={`flex items-center justify-between w-full text-white px-2 py-1`}>
                      <div>
                        <span>Treatment {treatment.treatmentNumber}</span>
                        <span className="text-xs text-gray-400 ml-2">(Final SUDS: {treatment.finalSuds})</span>
                      </div>
                      <span className={`text-sm font-semibold ${improvementColor}`}>
                        {improvementDisplay}
                      </span>
                    </div>
                  </SidebarMenuItem>
                );
            })}

            {nextTreatmentNumber && nextTreatmentNumber <= 5 && (
              <SidebarMenuItem className="mt-3">
                  <SidebarMenuButton asChild onClick={() => navigate(`/calibrate/${nextTreatmentNumber}`)} disabled={!isReadyForProcessing}> 
                    <div 
                        className={`flex items-center justify-center w-full text-white text-sm font-medium rounded-md transition-colors px-2 py-2 ${isReadyForProcessing 
                                    ? 'bg-green-600 hover:bg-green-700 cursor-pointer' 
                                    : 'bg-gray-600 opacity-60 cursor-not-allowed'
                                }`}
                        title={isReadyForProcessing ? `Start Calibration for Treatment ${nextTreatmentNumber}`: "Complete initial Activation Setup first"}
                    >
                      <span>{isReadyForProcessing ? `Start Calibration for Treatment ${nextTreatmentNumber}` : `Treatment ${nextTreatmentNumber} (Locked)`}</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
            )}
             {lastCompletedNumber >= 5 && (
                 <SidebarMenuItem className="mt-3">
                    <div className="px-2 py-1 text-green-400 text-sm font-semibold text-center">All 5 treatments complete!</div>
                     <SidebarMenuButton asChild onClick={() => navigate(`/follow-up`)} className="mt-1">
                       <div className="flex items-center justify-center w-full text-white text-sm font-medium cursor-pointer bg-blue-600 hover:bg-blue-700 px-2 py-2 rounded-md">
                         Go to Follow-Up
                       </div>
                     </SidebarMenuButton>
                 </SidebarMenuItem>
             )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
export default AppSidebar;
