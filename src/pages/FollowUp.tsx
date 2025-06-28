// FILE: src/pages/FollowUp.tsx
// Corrected completeTreatment call.

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { useRecording } from "@/contexts/RecordingContext";
import SUDSScale from "@/components/SUDSScale"; // Corrected relative path assumption
import { useNavigate } from 'react-router-dom';

const FollowUp = () => {
  const navigate = useNavigate();
  const {
    targetEventTranscript,
    calibrationSuds: initialOverallSuds, // The very first SUDS score from T1 calibration
    completeTreatment,
  } = useRecording();

  const [currentSuds, setCurrentSuds] = useState<number>(0);
  const [finalComments, setFinalComments] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSudsChange = (value: number) => {
    setCurrentSuds(value);
  };

  const handleSubmit = () => {
    if (typeof currentSuds !== 'number') {
      toast.error("Please provide a final SUDS rating."); return;
    }
    
    if (completeTreatment && typeof initialOverallSuds === 'number') {
      // Pass initialOverallSuds as the third argument
      completeTreatment("Follow-Up", currentSuds, initialOverallSuds);
      toast.success("Follow-up submitted successfully! Thank you.");
      setIsSubmitted(true);
    } else {
      toast.error("Could not submit follow-up. Initial SUDS data is missing from context.");
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center p-8 space-y-6 animate-fadeIn">
        <h1 className="text-3xl font-bold text-primary">Thank You!</h1>
        <p className="text-lg text-muted-foreground">Your follow-up has been recorded. We appreciate you completing the program.</p>
        <Button onClick={() => navigate('/')}>Back to Main</Button>
      </div>
    )
  }
  
  return (
    <div className="space-y-8 p-4 md:p-6 animate-fadeIn">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Follow-Up Assessment</h1>
        <p className="text-muted-foreground mt-2">Please provide your final feedback and ratings for the original target memory.</p>
      </div>
      
      <div className="p-6 border rounded-lg bg-card space-y-4 shadow-md">
        <h2 className="text-xl font-semibold">Original Target Memory Review</h2>
        <p className="text-sm text-muted-foreground italic p-4 bg-muted/50 border rounded-md">
          {targetEventTranscript || "No target event transcript available. Please ensure you have completed at least one treatment."}
        </p>
        <p className="text-sm">
          Thinking about this original event now, please rate your current level of distress.
        </p>
        <SUDSScale onValueChange={handleSudsChange} initialValue={currentSuds} />
      </div>

      <div className="p-6 border rounded-lg bg-card space-y-4 shadow-md">
        <h2 className="text-xl font-semibold">Final Comments (Optional)</h2>
        <p className="text-sm text-muted-foreground">
          Please share any final thoughts on your experience with the program.
        </p>
        <Textarea
          value={finalComments}
          onChange={(e) => setFinalComments(e.target.value)}
          placeholder="Your feedback is valuable..."
          rows={6}
          className="bg-background focus:ring-primary focus:border-primary"
        />
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSubmit} size="lg" disabled={typeof currentSuds !== 'number'}>
          Submit Final Assessment
        </Button>
      </div>
    </div>
  );
};

export default FollowUp;