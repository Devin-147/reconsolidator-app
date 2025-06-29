// FILE: src/pages/FollowUp.tsx
// Corrected completeTreatment call.

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { useRecording } from "@/contexts/RecordingContext";
import SUDSScale from "@/components/SUDSScale";
import { useNavigate } from 'react-router-dom';

const FollowUp = () => {
  const navigate = useNavigate();
  const { targetEventTranscript, calibrationSuds: initialOverallSuds, completeTreatment } = useRecording();
  const [currentSuds, setCurrentSuds] = useState<number>(0);
  const [finalComments, setFinalComments] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSudsChange = (value: number) => { setCurrentSuds(value); };

  const handleSubmit = () => {
    if (typeof currentSuds !== 'number') { toast.error("Please provide a final SUDS rating."); return; }
    if (completeTreatment && typeof initialOverallSuds === 'number') {
      completeTreatment("Follow-Up", currentSuds, initialOverallSuds);
      toast.success("Follow-up submitted! Thank you.");
      setIsSubmitted(true);
    } else {
      toast.error("Could not submit follow-up. Initial SUDS data missing.");
    }
  };

  if (isSubmitted) {
    return ( <div className="text-center p-8 space-y-6"> <h1 className="text-3xl">Thank You!</h1> <p>Your follow-up has been recorded.</p> <Button onClick={() => navigate('/')}>Back to Main</Button> </div> )
  }
  
  return (
    <div className="space-y-8 p-4 md:p-6">
      <div className="text-center"> <h1 className="text-3xl font-bold">Follow-Up Assessment</h1> <p className="mt-2">Final feedback and ratings.</p> </div>
      <div className="p-6 border rounded-lg bg-card space-y-4"> <h2 className="text-xl">Original Target Memory Review</h2> <p className="text-sm italic p-4 bg-muted/50 border rounded-md">{targetEventTranscript || "N/A"}</p> <p className="text-sm">Thinking about this original event now, rate your distress.</p> <SUDSScale onValueChange={handleSudsChange} initialValue={currentSuds} /> </div>
      <div className="p-6 border rounded-lg bg-card space-y-4"> <h2 className="text-xl">Final Comments (Optional)</h2> <Textarea value={finalComments} onChange={(e) => setFinalComments(e.target.value)} placeholder="Your feedback is valuable..." rows={6} /> </div>
      <div className="flex justify-end"> <Button onClick={handleSubmit} size="lg" disabled={typeof currentSuds !== 'number'}>Submit Final Assessment</Button> </div>
    </div>
  );
};
export default FollowUp;