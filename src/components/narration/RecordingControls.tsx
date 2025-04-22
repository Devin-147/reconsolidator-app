// src/components/narration/RecordingControls.tsx
import React from 'react'; // Import React
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RecordingControlsProps {
  isRecording: boolean;
  isPlaying: boolean; // To disable start while playing
  onStartClick: () => void; // Renamed prop
  onStopClick: () => void;  // Renamed prop
  disabled?: boolean; // Optional general disabled state
}

export const RecordingControls = ({
  isRecording,
  isPlaying,
  onStartClick, // Use renamed prop
  onStopClick,  // Use renamed prop
  disabled = false // Default to not disabled
}: RecordingControlsProps) => {

  // No internal state or media logic needed here anymore

  return (
    <>
      {isRecording ? (
        <Button
          variant="destructive"
          size="sm"
          onClick={onStopClick} // Call stop click handler
          className="flex items-center gap-2"
          disabled={disabled} // Use general disabled prop
        >
          <MicOff className="w-4 h-4" /> {/* Use MicOff for stop */}
          <Loader2 className="w-4 h-4 animate-spin" />
          Stop
        </Button>
      ) : (
        <Button
          variant="default"
          size="sm"
          onClick={onStartClick} // Call start click handler
          className="flex items-center gap-2"
          disabled={isPlaying || disabled} // Disable if playing OR generally disabled
        >
          <Mic className="w-4 h-4" />
          Record
        </Button>
      )}
    </>
  );
};