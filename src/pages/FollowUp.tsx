
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { useRecording } from "@/contexts/RecordingContext";

const FollowUp = () => {
  const navigate = useNavigate();
  const { memory1, memory2, videoBlob, sudsLevel, completeTreatment } = useRecording();
  const [response, setResponse] = useState("");
  
  // Check if memories are saved before continuing
  useEffect(() => {
    if (!memory1 || !memory2 || !videoBlob) {
      toast.error("Please record your memories and target event before starting the Follow-Up");
      navigate("/");
    } else {
      console.log("Memories and video are available, ready for Follow-Up");
    }
  }, [memory1, memory2, videoBlob, navigate]);

  const handleSave = () => {
    if (!response) {
      toast.error("Please complete the follow-up assessment before proceeding");
      return;
    }
    
    // Save completion with SUDS score
    completeTreatment("Follow-Up", sudsLevel);
    toast.success("Follow-Up responses saved successfully");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate("/")}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Main
      </Button>

      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Follow-Up Assessment</h1>
          <p className="text-muted-foreground">Six weeks after Treatment 5</p>
        </div>

        <div className="space-y-6 bg-accent/20 p-6 rounded-lg">
          <h2 className="text-xl font-semibold">Follow-Up Instructions</h2>
          <p className="text-muted-foreground">
            This is your Follow-Up assessment, scheduled six weeks after completing Treatment 5.
            The purpose is to evaluate the long-term effectiveness of the treatment protocol.
          </p>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Your Reflections</h3>
            <Textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Enter your reflections about your progress since completing the treatment sequence..."
              className="min-h-[200px]"
            />
          </div>
          
          <Button 
            className="w-full mt-4"
            onClick={handleSave}
            disabled={!response}
          >
            <Save className="w-4 h-4 mr-2" />
            Complete Follow-Up Assessment
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FollowUp;
