// src/pages/FollowUp.tsx
import React, { useState, useEffect } from "react"; // Added React import
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { useRecording } from "@/contexts/RecordingContext"; // Import context hook
import SUDSScale from "../components/SUDSScale"; // Import SUDS scale for final rating

const FollowUp = () => {
  const navigate = useNavigate();
  // --- CORRECTED Context Destructuring ---
  // Removed videoBlob and sudsLevel
  // Added calibrationSuds if needed for context, or just use local state for final rating
  // Added setCalibrationSuds if SUDS scale needs to update it
  const { memory1, memory2, completeTreatment, memoriesSaved, setCalibrationSuds, calibrationSuds } = useRecording();
  // --- END CORRECTION ---

  const [response, setResponse] = useState("");
  // State to hold the SUDS rating for *this* follow-up session
  const [followUpSuds, setFollowUpSuds] = useState<number>(calibrationSuds ?? 50); // Initialize with calibration or a default

  // Check if prerequisite memories exist (memoriesSaved flag is crucial)
  useEffect(() => {
    // Redirect if memory setup wasn't completed in a previous session
    if (!memoriesSaved) { // Rely on the flag set during initial setup
      toast.error("Initial memory setup not completed. Please start from the beginning.");
      navigate("/");
    } else {
      console.log("FollowUp: Prerequisites (memoriesSaved) met.");
      // Optionally load previous response if stored?
      // Set initial SUDS for this page based on last calibration or default
      setFollowUpSuds(calibrationSuds ?? 50);
    }
    // Only check on mount or if memoriesSaved status changes (e.g., context reloads)
  }, [memoriesSaved, navigate, calibrationSuds]); // Added calibrationSuds

  const handleSave = () => {
    // Require both text response AND a SUDS rating
    if (!response || typeof followUpSuds !== 'number') {
      toast.error("Please enter your reflections and rate your current SUDS level.");
      return;
    }

    // Call context function to record completion, passing "Follow-Up" and the SUDS score from this page
    completeTreatment("Follow-Up", followUpSuds);
    toast.success("Follow-Up assessment saved successfully. Thank you!");
    // Navigate somewhere else? Back home? Or to a dashboard?
    navigate("/"); // Navigate home after completion for now
  };

  const handleSudsChange = (value: number) => {
      setFollowUpSuds(value); // Update local state for this page's SUDS rating
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate("/")} // Navigate back to setup/home
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Main Setup
      </Button>

      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Follow-Up Assessment</h1>
          <p className="text-muted-foreground">Six weeks after Treatment 5</p>
        </div>

        <div className="space-y-6 bg-card p-6 rounded-lg border border-border shadow-md"> {/* Changed background */}
          <h2 className="text-xl font-semibold">Follow-Up Instructions</h2>
          <p className="text-muted-foreground">
            This is your Follow-Up assessment, ideally completed around six weeks after finishing Treatment 5.
            The purpose is to evaluate the long-term effectiveness of the treatment protocol on the memory you originally targeted.
          </p>

          {/* Reflection Input */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Your Reflections</h3>
            <Textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Please enter your reflections here. Consider how the targeted memory affects you now compared to before starting the program. Have the emotional responses changed? How often do you think about it? Describe your overall progress and any lasting changes."
              className="min-h-[200px] bg-background/50" // Adjusted background
              rows={8}
            />
          </div>

          {/* Final SUDS Rating for Follow-up */}
           <div className="space-y-4">
             <h3 className="text-lg font-medium">Current Distress Level (SUDS)</h3>
             <p className="text-sm text-muted-foreground">
               Please rate your current level of distress (0-100) specifically when thinking about the original Target Event *now*.
             </p>
             <SUDSScale
               initialValue={followUpSuds} // Use local state for this page's SUDS
               onValueChange={handleSudsChange} // Update local state
             />
           </div>

          {/* Save Button */}
          <Button
            className="w-full mt-4"
            onClick={handleSave}
            // Disable if text or SUDS is missing
            disabled={!response || typeof followUpSuds !== 'number'}
          >
            <Save className="w-4 h-4 mr-2" />
            Complete & Save Follow-Up
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FollowUp;