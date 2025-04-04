
import { Progress } from '@/components/ui/progress';

interface RecordingProgressProps {
  isRecording: boolean;
  recordingTimer: number;
  maxDuration: number;
}

export const RecordingProgress = ({
  isRecording,
  recordingTimer,
  maxDuration
}: RecordingProgressProps) => {
  if (!isRecording) return null;
  
  const progress = (recordingTimer / maxDuration) * 100;
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span>{formatTime(recordingTimer)}</span>
        <span className={recordingTimer >= maxDuration - 5 ? "text-red-500 font-bold" : ""}>
          Max: {formatTime(maxDuration)}
        </span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
};
