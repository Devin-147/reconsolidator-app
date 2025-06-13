// src/components/NarrationRecorder.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { RecordingControls } from '@/components/narration/RecordingControls';
import { PlaybackControls } from '@/components/narration/PlaybackControls';
import { RecordingProgress } from '@/components/narration/RecordingProgress';
import { formatTime } from '@/utils/formatTime';

interface NarrationRecorderProps {
  onRecordingComplete?: (audioUrl: string | null) => void;
  index: number;
  existingAudioUrl?: string | null;
}

const isBrowserSupported = typeof window !== 'undefined' && navigator.mediaDevices && typeof MediaRecorder !== 'undefined';
const MAX_RECORDING_DURATION = 45;

export const NarrationRecorder = ({ onRecordingComplete, index, existingAudioUrl }: NarrationRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(existingAudioUrl || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTimer, setRecordingTimer] = useState(0);
  const [error, setError] = useState<string | null>(null); // Keep error state

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const stopTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- Define Callbacks FIRST ---

  // Unified stop logic - useCallback ensures stable identity
  const stopMedia = useCallback(() => {
      console.log(`NarrationRecorder ${index + 1}: stopMedia called.`);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
      timerIntervalRef.current = null; stopTimeoutRef.current = null;

      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          console.log(`NarrationRecorder ${index + 1}: Stopping MediaRecorder.`);
          try { mediaRecorderRef.current.stop(); } catch(e){ console.error("Error stopping media recorder:", e); }
          // onstop handler will process chunks and call onRecordingComplete
      } else {
           if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); streamRef.current = null; }
           setIsRecording(false); // Ensure state is false if stopped prematurely/externally
      }
       mediaRecorderRef.current = null;
  }, [index]); // Include index in dependencies for logging clarity

  // Stop handler called by button or timer - Also useCallback
  const handleStopRecording = useCallback(() => {
      if (!isRecording) return; // Avoid stopping if already stopped
      console.log(`Narration ${index + 1}: handleStopRecording called.`);
      stopMedia(); // Call unified stop logic
      toast.success(`Narration ${index + 1} recording stopped.`);
      // NOTE: setTargetEventTranscript was removed - NarrationItem calls the context update now
  }, [isRecording, stopMedia, index]); // Dependencies

   // Start handler - useCallback
   const handleStartRecording = useCallback(async () => {
    if (!isBrowserSupported || isRecording || isPlaying) return;
    setError(null); setRecordingTimer(0);

    // Revoke OLD URL before creating NEW one
    if (audioUrl && audioUrl.startsWith('blob:')) {
        console.log(`NarrationRecorder ${index + 1}: Revoking previous URL before new recording: ${audioUrl.substring(0,50)}...`);
        URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null); onRecordingComplete?.(null); audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };

      mediaRecorderRef.current.onstop = () => {
        console.log(`Narration ${index + 1}: MediaRecorder stopped (onstop).`);
        let finalUrl: string | null = null;
        if (audioChunksRef.current.length > 0) {
           const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
           finalUrl = URL.createObjectURL(blob);
           setAudioUrl(finalUrl); console.log(`Narration ${index + 1}: New Blob URL created.`);
        } else { console.warn(`Narration ${index + 1}: No chunks.`); setAudioUrl(null); }
         onRecordingComplete?.(finalUrl);
         if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); streamRef.current = null; console.log("Stream stopped in onstop.");}
         setIsRecording(false);
      };

      mediaRecorderRef.current.onerror = (event) => { console.error("MediaRecorder error:", event); setError("Recording error."); stopMedia(); onRecordingComplete?.(null); };
      mediaRecorderRef.current.start(); setIsRecording(true); toast.success(`Narration ${index + 1} recording started...`);
    } catch (err) {
      console.error("Error starting recording:", err);
      let message = "Failed to start recording.";
      if (err instanceof Error) { /* ... Permission/Device checks ... */ message = `Error: ${err.message}`; }
      setError(message); toast.error(message);
      stopMedia(); setIsRecording(false); onRecordingComplete?.(null);
    }
  }, [isRecording, isPlaying, audioUrl, onRecordingComplete, index, stopMedia]);


  // Playback toggle
  const handlePlayToggle = useCallback((playing: boolean) => { setIsPlaying(playing); }, []);

  // Delete handler - Revoke URL here
  const deleteRecording = useCallback(() => {
    if (audioUrl) {
      if (audioUrl.startsWith('blob:')) { console.log(`NarrationRecorder ${index + 1}: Revoking Object URL on delete: ${audioUrl.substring(0,50)}...`); URL.revokeObjectURL(audioUrl); }
      setAudioUrl(null); onRecordingComplete?.(null); toast.info(`Narration ${index + 1} deleted`); setRecordingTimer(0);
    }
  }, [audioUrl, index, onRecordingComplete]);


  // --- Define Effects AFTER Callbacks ---

  // Effect for timer logic
  useEffect(() => {
    if (isRecording) { timerIntervalRef.current = setInterval(() => { setRecordingTimer(prev => prev + 1); }, 1000); }
    else { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
    return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); };
  }, [isRecording]);

  // Effect for auto-stop logic
   useEffect(() => {
     if (isRecording) {
       if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
       stopTimeoutRef.current = setTimeout(() => {
         console.log(`Narration ${index + 1}: Reached max duration. Stopping.`);
         handleStopRecording(); // <<< Now handleStopRecording is defined above
         toast.info(`Narration ${index + 1} stopped at ${MAX_RECORDING_DURATION}s limit.`);
       }, MAX_RECORDING_DURATION * 1000);
     } else {
       if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current); stopTimeoutRef.current = null;
     }
     return () => { if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current); };
   }, [isRecording, handleStopRecording, index]); // Added handleStopRecording dependency


  // Cleanup effect - Stop media on unmount
  useEffect(() => {
    // stopMedia is stable due to useCallback, so this runs only on unmount
    return () => {
      console.log(`NarrationRecorder ${index + 1}: Cleaning up media streams/recorders on unmount.`);
      stopMedia(); // <<< Now stopMedia is defined above
    };
  }, [stopMedia, index]); // Added stopMedia and index


  // --- Render Logic ---
  const recordingProgress = isRecording ? (recordingTimer / MAX_RECORDING_DURATION) * 100 : 0;
  return (
    <div className="space-y-2 mt-3 p-3 border rounded-md bg-muted/30">
       {error && <div className="text-xs text-red-500">{error}</div>}
       <div className="flex items-center gap-2">
           <RecordingControls isRecording={isRecording} isPlaying={isPlaying} onStartClick={handleStartRecording} onStopClick={handleStopRecording} disabled={!isBrowserSupported} />
           {audioUrl && !isRecording && ( <PlaybackControls audioUrl={audioUrl} isPlaying={isPlaying} onPlayToggle={handlePlayToggle} onDelete={deleteRecording} /> )}
       </div>
       <RecordingProgress isRecording={isRecording} recordingTimer={recordingTimer} maxDuration={MAX_RECORDING_DURATION} />
       {!isRecording && !audioUrl && <p className="text-xs text-muted-foreground mt-1">Max duration: {MAX_RECORDING_DURATION} seconds.</p>}
    </div>
   );
};