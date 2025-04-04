
import { useState } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { startAudioRecording, stopAudioRecording } from '@/utils/audioRecording';
import { toast } from 'sonner';

interface RecordingControlsProps {
  isRecording: boolean;
  isPlaying: boolean;
  onStartRecording: () => void;
  onStopRecording: (audioUrl: string | null) => void;
}

export const RecordingControls = ({
  isRecording,
  isPlaying,
  onStartRecording,
  onStopRecording
}: RecordingControlsProps) => {
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  const handleStartRecording = async () => {
    try {
      onStartRecording();
      
      const recording = await startAudioRecording();
      if (recording) {
        const { mediaRecorder, chunks } = recording;
        setMediaRecorder(mediaRecorder);
        setAudioChunks(chunks);
      } else {
        // Failed to start recording
        onStopRecording(null);
        return;
      }
    } catch (error) {
      console.error('Error starting audio recording:', error);
      onStopRecording(null);
    }
  };
  
  const handleStopRecording = () => {
    const blob = stopAudioRecording(mediaRecorder, audioChunks);
    if (blob) {
      const url = URL.createObjectURL(blob);
      onStopRecording(url);
    } else {
      onStopRecording(null);
    }
  };

  return (
    <>
      {isRecording ? (
        <Button
          variant="destructive"
          size="sm"
          onClick={handleStopRecording}
          className="flex items-center gap-2"
        >
          <MicOff className="w-4 h-4" />
          <Loader2 className="w-4 h-4 animate-spin" />
          Stop
        </Button>
      ) : (
        <Button
          variant="default"
          size="sm"
          onClick={handleStartRecording}
          className="flex items-center gap-2"
          disabled={isPlaying}
        >
          <Mic className="w-4 h-4" />
          Record
        </Button>
      )}
    </>
  );
};
