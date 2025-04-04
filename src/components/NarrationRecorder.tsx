
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { RecordingControls } from '@/components/narration/RecordingControls';
import { PlaybackControls } from '@/components/narration/PlaybackControls';
import { RecordingProgress } from '@/components/narration/RecordingProgress';

interface NarrationRecorderProps {
  onRecordingComplete?: (audioUrl: string) => void;
  index: number;
}

export const NarrationRecorder = ({ onRecordingComplete, index }: NarrationRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [recordingTimer, setRecordingTimer] = useState(0);
  
  const timerIntervalRef = useRef<number | null>(null);
  
  // Maximum recording duration in seconds
  const MAX_RECORDING_DURATION = 45;
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
      }
    };
  }, []);
  
  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordingProgress(0);
    setRecordingTimer(0);
    
    // Clear previous recording if exists
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    
    // Start timer for recording progress
    timerIntervalRef.current = window.setInterval(() => {
      setRecordingTimer(prev => {
        const newTime = prev + 1;
        // Auto-stop recording if it reaches max duration
        if (newTime >= MAX_RECORDING_DURATION) {
          // This will be handled in handleStopRecording
          return MAX_RECORDING_DURATION;
        }
        setRecordingProgress((newTime / MAX_RECORDING_DURATION) * 100);
        return newTime;
      });
    }, 1000);
  };
  
  const handleStopRecording = (url: string | null) => {
    // Clear timer
    if (timerIntervalRef.current) {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    if (url) {
      setAudioUrl(url);
      
      if (onRecordingComplete) {
        onRecordingComplete(url);
      }
      
      toast.success(`Narration ${index + 1} recorded successfully`);
    }
    
    setIsRecording(false);
    setRecordingProgress(0);
  };
  
  const handlePlayToggle = (playing: boolean) => {
    setIsPlaying(playing);
  };
  
  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
      toast.info(`Narration ${index + 1} deleted`);
    }
  };
  
  return (
    <div className="space-y-2 mt-3">
      <div className="flex items-center gap-2">
        <RecordingControls 
          isRecording={isRecording}
          isPlaying={isPlaying}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
        />
        
        {audioUrl && (
          <PlaybackControls 
            audioUrl={audioUrl}
            isRecording={isRecording}
            isPlaying={isPlaying}
            onPlayToggle={handlePlayToggle}
            onDelete={deleteRecording}
          />
        )}
      </div>
      
      <RecordingProgress 
        isRecording={isRecording}
        recordingTimer={recordingTimer}
        maxDuration={MAX_RECORDING_DURATION}
      />
    </div>
  );
};
