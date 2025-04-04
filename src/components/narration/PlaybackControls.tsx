
import { useRef, useEffect } from 'react';
import { Play, Pause, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PlaybackControlsProps {
  audioUrl: string | null;
  isRecording: boolean;
  isPlaying: boolean;
  onPlayToggle: (isPlaying: boolean) => void;
  onDelete: () => void;
}

export const PlaybackControls = ({
  audioUrl,
  isRecording,
  isPlaying,
  onPlayToggle,
  onDelete
}: PlaybackControlsProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      const handleEnded = () => onPlayToggle(false);
      audioRef.current.addEventListener('ended', handleEnded);
      
      return () => {
        audioRef.current?.removeEventListener('ended', handleEnded);
      };
    }
  }, [onPlayToggle]);

  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      onPlayToggle(false);
    } else {
      audioRef.current.play()
        .catch(error => {
          console.error('Error playing audio:', error);
          onPlayToggle(false);
        });
      onPlayToggle(true);
    }
  };

  if (!audioUrl) return null;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={togglePlayback}
        disabled={isRecording}
        className="flex items-center gap-2"
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        {isPlaying ? 'Pause' : 'Play'}
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onDelete}
        disabled={isRecording || isPlaying}
        className="flex items-center gap-2"
      >
        <Trash className="w-4 h-4" />
      </Button>
      
      <audio 
        ref={audioRef}
        src={audioUrl}
        className="hidden"
      />
    </>
  );
};
