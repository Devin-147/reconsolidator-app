// src/components/narration/NarrationRecorder.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react'; // Added React, useCallback
import { toast } from 'sonner';
import { RecordingControls } from '@/components/narration/RecordingControls';
import { PlaybackControls } from '@/components/narration/PlaybackControls';
import { RecordingProgress } from '@/components/narration/RecordingProgress';
import { formatTime } from '@/utils/formatTime'; // Assuming you have this utility

interface NarrationRecorderProps {
  onRecordingComplete?: (audioUrl: string | null) => void; // Allow null on failure/cancel
  index: number;
  // Add existingAudioUrl prop if you want to load a previously recorded audio
  existingAudioUrl?: string | null;
}

// Check for browser support
const isBrowserSupported = typeof window !== 'undefined' && navigator.mediaDevices && typeof MediaRecorder !== 'undefined';
const MAX_RECORDING_DURATION = 45; // 45 seconds

export const NarrationRecorder = ({ onRecordingComplete, index, existingAudioUrl }: NarrationRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  // Initialize with existing URL if provided
  const [audioUrl, setAudioUrl] = useState<string | null>(existingAudioUrl || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTimer, setRecordingTimer] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const stopTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Ref for auto-stop timeout

  // Effect for timer logic
  useEffect(() => {
    if (isRecording) {
      timerIntervalRef.current = setInterval(() => {
        setRecordingTimer(prev => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); };
  }, [isRecording]);

  // Effect for auto-stop logic
   useEffect(() => {
     if (isRecording) {
       // Clear any existing stop timeout
       if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
       // Set a new timeout to stop recording after MAX_RECORDING_DURATION
       stopTimeoutRef.current = setTimeout(() => {
         console.log(`Narration ${index + 1}: Reached max duration. Stopping.`);
         handleStopRecording(); // Call the stop handler
         toast.info(`Narration ${index + 1} stopped at ${MAX_RECORDING_DURATION}s limit.`);
       }, MAX_RECORDING_DURATION * 1000);
     } else {
       // Clear timeout if recording stops early
       if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
       stopTimeoutRef.current = null;
     }
     // Cleanup timeout on unmount or if isRecording changes
     return () => { if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current); };
   }, [isRecording]); // Rerun when isRecording changes


  // Cleanup streams/recorders on unmount
  useEffect(() => {
    return () => {
      console.log(`NarrationRecorder ${index + 1}: Cleaning up.`);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
         try { mediaRecorderRef.current.stop(); } catch {}
      }
      if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); }
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
       // Revoke old URL if component unmounts while URL exists but isn't saved externally yet?
       // Be careful if URL is passed back up to context / parent state
       // if (audioUrl) { URL.revokeObjectURL(audioUrl); }
    };
  }, []); // Empty array: run only on unmount

  // Unified stop logic
  const stopMedia = useCallback(() => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
      timerIntervalRef.current = null;
      stopTimeoutRef.current = null;

      let stoppedBlob: Blob | null = null;
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop(); // This will trigger onstop below
          // We don't process chunks here, wait for onstop
      } else {
           // If not recording, ensure streams are stopped anyway (e.g., error case)
           if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); streamRef.current = null; }
      }
       mediaRecorderRef.current = null;
       setIsRecording(false); // Set state immediately
  }, []); // No dependencies needed as it uses refs


  const handleStartRecording = useCallback(async () => {
    if (!isBrowserSupported || isRecording || isPlaying) return;

    setError(null);
    setRecordingTimer(0);
    // Clear previous recording URL before starting new one
    if (audioUrl) { URL.revokeObjectURL(audioUrl); setAudioUrl(null); }
    audioChunksRef.current = []; // Reset chunks

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        console.log(`Narration ${index + 1}: MediaRecorder stopped.`);
        let finalUrl: string | null = null;
        if (audioChunksRef.current.length > 0) {
           const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
           finalUrl = URL.createObjectURL(blob);
           setAudioUrl(finalUrl); // Update state with new URL
           console.log(`Narration ${index + 1}: Blob created - ${finalUrl.substring(0, 50)}...`);
        } else {
           console.warn(`Narration ${index + 1}: No audio chunks recorded.`);
           setAudioUrl(null);
        }
         // Call the callback prop with the result (URL or null)
         onRecordingComplete?.(finalUrl);
        // Stop stream tracks *after* processing blob
        if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); streamRef.current = null; }
      };

      mediaRecorderRef.current.onerror = (event) => {
         console.error("MediaRecorder error:", event);
         setError("Recording error occurred.");
         stopMedia(); // Stop everything on recorder error
         onRecordingComplete?.(null); // Notify parent of failure
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast.success(`Narration ${index + 1} recording started...`);

    } catch (err) {
      console.error("Error starting recording:", err);
      let message = "Failed to start recording.";
      if (err instanceof Error) { /* ... Permission/Device checks ... */ message = `Error: ${err.message}`; }
      setError(message); toast.error(message);
      stopMedia(); // Ensure cleanup
      setIsRecording(false); // Ensure state is correct
      onRecordingComplete?.(null); // Notify parent
    }
  }, [isRecording, isPlaying, audioUrl, onRecordingComplete, index, stopMedia]); // Dependencies

  // Stop handler called by button or timer
  const handleStopRecording = useCallback(() => {
      if (!isRecording) return;
      console.log(`Narration ${index + 1}: Stop requested.`);
      stopMedia(); // Call unified stop logic
      toast.success(`Narration ${index + 1} recording stopped.`);
  }, [isRecording, stopMedia, index]);


  const handlePlayToggle = useCallback((playing: boolean) => {
    setIsPlaying(playing);
  }, []);

  const deleteRecording = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
      onRecordingComplete?.(null); // Notify parent that audio is gone
      toast.info(`Narration ${index + 1} deleted`);
      setRecordingTimer(0); // Reset timer display
    }
  }, [audioUrl, index, onRecordingComplete]);

  // Calculate progress for display
  const recordingProgress = isRecording ? (recordingTimer / MAX_RECORDING_DURATION) * 100 : 0;

  return (
    <div className="space-y-2 mt-3 p-3 border rounded-md bg-muted/30">
      {/* Display Error */}
      {error && <div className="text-xs text-red-500">{error}</div>}

      {/* Controls Row */}
      <div className="flex items-center gap-2">
        {/* Pass click handlers directly */}
        <RecordingControls
          isRecording={isRecording}
          isPlaying={isPlaying}
          onStartClick={handleStartRecording}
          onStopClick={handleStopRecording}
          disabled={!isBrowserSupported} // Disable if browser not supported
        />

        {/* Show playback only if URL exists and not currently recording */}
        {audioUrl && !isRecording && (
          <PlaybackControls
            audioUrl={audioUrl}
            // isRecording={isRecording} // Playback shouldn't know about recording state
            isPlaying={isPlaying}
            onPlayToggle={handlePlayToggle}
            onDelete={deleteRecording}
          />
        )}
      </div>

      {/* Progress Display */}
      <RecordingProgress
        isRecording={isRecording}
        recordingTimer={recordingTimer}
        maxDuration={MAX_RECORDING_DURATION}
      />
       {/* Add Max Duration Info Text */}
       {!isRecording && !audioUrl && <p className="text-xs text-muted-foreground mt-1">Max duration: {MAX_RECORDING_DURATION} seconds.</p>}
    </div>
  );
};