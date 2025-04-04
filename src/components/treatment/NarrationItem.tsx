
import { NarrationRecorder } from "@/components/NarrationRecorder";

interface NarrationItemProps {
  script: string;
  index: number;
  onRecordingComplete: (index: number, audioUrl: string) => void;
}

export const NarrationItem = ({ 
  script, 
  index, 
  onRecordingComplete 
}: NarrationItemProps) => {
  return (
    <div className="space-y-3 p-4 bg-black/10 rounded-lg">
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Narration {index + 1} of 11</h3>
        <div className="bg-accent/50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Narration Script (Maximum time: 45 seconds)</h4>
          <div className="text-sm whitespace-pre-wrap border p-3 rounded bg-background">
            {script || "Loading script..."}
          </div>
        </div>
      </div>
      
      <div className="mt-4">
        <h4 className="text-sm font-medium mb-2">Record yourself narrating the script above (45 seconds max)</h4>
        <NarrationRecorder 
          index={index} 
          onRecordingComplete={(audioUrl) => onRecordingComplete(index, audioUrl)} 
        />
      </div>
    </div>
  );
};
