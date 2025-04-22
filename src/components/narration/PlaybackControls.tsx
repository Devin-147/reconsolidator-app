// src/components/narration/PlaybackControls.tsx
import React, { useState, useRef, useEffect } from 'react'; // Added React import
import { Button } from '@/components/ui/button';
import { Play, Pause, Trash2 } from 'lucide-react';

// Define the props the component accepts
interface PlaybackControlsProps {
  audioUrl: string; // URL of the audio blob to play
  // isRecording: boolean; // <<< REMOVED THIS PROP
  isPlaying: boolean; // Is audio currently playing? (Managed by parent/NarrationRecorder)
  onPlayToggle: (shouldPlay: boolean) => void; // Callback when play/pause is clicked
  onDelete: () => void; // Callback when delete is clicked
  disabled?: boolean; // Optional general disabled state
}

export const PlaybackControls = ({
  audioUrl,
  // isRecording, // <<< REMOVED from destructuring
  isPlaying,
  onPlayToggle,
  onDelete,
  disabled = false
}: PlaybackControlsProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Effect to handle playing/pausing the audio element when isPlaying prop changes
  useEffect(() => {
    if (!audioUrl) return;

    if (!audioRef.current) {
      // Create audio element if it doesn't exist
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => {
         console.log("Playback ended");
         onPlayToggle(false); // Notify parent that playback stopped naturally
      };
       audioRef.current.onerror = (e) => {
         console.error("Audio playback error:", e);
         onPlayToggle(false); // Stop state on error
      };
    } else {
       // Update src if URL changes (e.g., new recording deleted then old one restored?)
       // This might not be needed if audioUrl only changes when non-null -> null -> non-null
       if (audioRef.current.src !== audioUrl) {
          audioRef.current.src = audioUrl;
       }
    }

    // Control playback based on isPlaying prop
    if (isPlaying) {
      audioRef.current.play().catch(err => {
         console.error("Error starting playback:", err);
         onPlayToggle(false); // Reset state if play fails
      });
    } else {
      audioRef.current.pause();
      // Optional: Reset playback position on pause?
      // if (audioRef.current.currentTime > 0) { audioRef.current.currentTime = 0; }
    }

    // Cleanup: Pause audio and remove event listeners when component unmounts or audioUrl changes
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.onended = null; // Remove listener
        audioRef.current.onerror = null; // Remove listener
        // Don't nullify audioRef here if we want to reuse the element
      }
    };
  }, [audioUrl, isPlaying, onPlayToggle]);


  const handlePlayPauseClick = () => {
    if (!audioUrl || disabled) return;
    onPlayToggle(!isPlaying); // Toggle the playing state via the callback
  };

  const handleDeleteClick = () => {
     if (disabled) return;
     // Stop playback before deleting
     if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = ""; // Clear source
     }
     onPlayToggle(false); // Ensure parent knows playback stopped
     onDelete(); // Call the delete handler passed from parent
  };

  return (
    <div className="flex items-center gap-2">
      {/* Play/Pause Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handlePlayPauseClick}
        // Disable button if no audio URL or if explicitly disabled
        disabled={!audioUrl || disabled}
        className="flex items-center gap-1.5"
      >
        {isPlaying ? (
          <> <Pause className="w-4 h-4" /> Pause </>
        ) : (
          <> <Play className="w-4 h-4" /> Play </>
        )}
      </Button>

      {/* Delete Button */}
      <Button
        variant="ghost" // Use ghost for less emphasis
        size="sm"
        onClick={handleDeleteClick}
        disabled={!audioUrl || isPlaying || disabled} // Disable if no audio, playing, or generally disabled
        className="text-red-500 hover:text-red-600 hover:bg-red-500/10 px-2" // Added padding
        title="Delete Recording"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
};