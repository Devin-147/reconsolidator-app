// FILE: src/pages/FollowUp.tsx

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { useRecording } from "@/contexts/RecordingContext";
import SUDSScale from "../components/SUDSScale";
import { useNavigate } from 'react-router-dom';

const FollowUp = () => {
  const navigate = useNavigate();
  const {
    memory1,
    memory2,
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
      toast.error("Please provide a final SUDS rating.");
      return;
    }
    
    // When completing the follow-up, the 'initialSudsForSession' for calculating improvement
    // should be the very first SUDS score recorded for the program.
    if (completeTreatment && typeof initialOverallSuds === 'number') {
      // <<< CORRECTED: Pass initialOverallSuds as the third argument >>>
      completeTreatment("Follow-Up", currentSuds, initialOverallSuds);
      toast.success("Follow-up submitted successfully! Thank you.");
      setIsSubmitted(true);
    } else {
      toast.error("Could not submit follow-up. Initial SUDS data is missing.");
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center p-8 space-y-6">
        <h1 className="text-3xl font-bold text-primary">Thank You!</h1>
        <p className="text-lg text-muted-foreground">Your follow-up has been recorded. We appreciate you completing the program.</p>
        <Button onClick={() => navigate('/')}>Back to Main</Button>
      </div>
    )
  }
  
  return (
    <div className="space-y-8 p-4 md:p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Follow-Up Assessment</h1>
        <p className="text-muted-foreground mt-2">Please provide your final feedback and ratings.</p>
      </div>
      
      <div className="p-6 border rounded-lg bg-card space-y-4">
        <h2 className="text-xl font-semibold">Original Target Memory Review</h2>
        <p className="text-sm text-muted-foreground italic p-4 bg-muted/50 border rounded-md">
          {targetEventTranscript || "No target event transcript available."}
        </p>
        <p className="text-sm">
          Thinking about this original event now, please rate your current level of distress.
        </p>
        <SUDSScale onValueChange={handleSudsChange} initialValue={currentSuds} />
      </div>

      <div className="p-6 border rounded-lg bg-card space-y-4">
        <h2 className="text-xl font-semibold">Final Comments (Optional)</h2>
        <p className="text-sm text-muted-foreground">
          Please share any final thoughts on your experience with the program.
        </p>
        <Textarea
          value={finalComments}
          onChange={(e) => setFinalComments(e.target.value)}
          placeholder="Your feedback is valuable..."
          rows={6}
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} size="lg">
          Submit Final Assessment
        </Button>
      </div>
    </div>
  );
};

export default FollowUp;