// src/hooks/useTargetRecording.ts
import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useRecording } from '@/contexts/RecordingContext'; // Import context hook

// Check for browser support once
const isBrowserSupported =
    typeof window !== 'undefined' &&
    navigator.mediaDevices &&
    typeof MediaRecorder !== 'undefined' &&
    (typeof window.SpeechRecognition !== 'undefined' || typeof (window as any).webkitSpeechRecognition !== 'undefined');
const SpeechRecognitionAPI = isBrowserSupported ? window.SpeechRecognition || (window as any).webkitSpeechRecognition : null;

const MAX_RECORDING_TIME_SECONDS = 180; // 3 minutes

export const useTargetRecording = () => {
  // Get relevant state and setters FROM CONTEXT
  const {
    isRecordingTarget, setIsRecordingTarget,
    targetEventTranscript, setTargetEventTranscript,
    audioBlobTarget, setAudioBlobTarget
  } = useRecording();

  // Local refs for media objects
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Local state ONLY for things specific to this hook's operation
  const [recordingTime, setRecordingTime] = useState(0); // Local timer display
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [liveTranscript, setLiveTranscript] = useState(""); // For live display during recording

  // Check support on initial load
  useEffect(() => {
    if (!isBrowserSupported || !SpeechRecognitionAPI) {
      console.error("Target Recording: Browser not fully supported.");
      setError("Browser recording features not fully supported.");
      setIsSupported(false);
    }
  }, []);

  // Timer effect
  useEffect(() => {
    if (isRecordingTarget) { // Depend on context state
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prevTime) => {
          const newTime = prevTime + 1;
          if (newTime >= MAX_RECORDING_TIME_SECONDS) {
            stopTargetRecording(); // Call the stop function from this hook
            toast.info("Recording automatically stopped at 3 minutes.");
          }
          return newTime;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); };
  }, [isRecordingTarget]); // Depend on context recording state

  // Cleanup effect
  useEffect(() => {
    return () => {
      stopMediaStreamsAndRecorders(); // Ensure cleanup on unmount
    };
  }, []);

  const stopMediaStreamsAndRecorders = useCallback(() => {
    console.log("useTargetRecording: Stopping media objects...");
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} recognitionRef.current = null; }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') { try { mediaRecorderRef.current.stop(); } catch {} }
    mediaRecorderRef.current = null;
    if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); streamRef.current = null; }
    audioChunksRef.current = [];
  }, []); // No dependencies needed?

  const startTargetRecording = useCallback(async () => {
    if (!isSupported || isRecordingTarget) return; // Use context state
    console.log("useTargetRecording: Starting...");
    setError(null); setLiveTranscript(''); setRecordingTime(0);
    // Clear context state for new recording
    setAudioBlobTarget(null);
    setTargetEventTranscript(''); // Clear final transcript too

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;
      console.log("useTargetRecording: Mic access granted.");

      // Setup MediaRecorder for AUDIO
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
      mediaRecorderRef.current.onstop = () => {
        console.log("useTargetRecording: MediaRecorder stopped.");
        if (audioChunksRef.current.length > 0) {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          console.log("useTargetRecording: Audio blob created, updating context. Size:", blob.size);
          setAudioBlobTarget(blob); // <<< UPDATE CONTEXT
        } else { console.warn("useTargetRecording: No audio chunks recorded."); setAudioBlobTarget(null); }
        // Stop stream tracks *after* processing blob
        if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); streamRef.current = null; }
      };

      // Setup SpeechRecognition
      if (SpeechRecognitionAPI) {
        recognitionRef.current = new SpeechRecognitionAPI();
        recognitionRef.current.continuous = true; recognitionRef.current.interimResults = true; recognitionRef.current.lang = 'en-US';
        let accumulatedFinal = ""; // Accumulate final results within this scope
        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
          let interim = ''; let final = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) { final += event.results[i][0].transcript; }
            else { interim += event.results[i][0].transcript; }
          }
          accumulatedFinal += final; // Add final parts as they come
          setLiveTranscript(accumulatedFinal + interim); // Update live display
        };
        recognitionRef.current.onerror = (event: Event) => { const err = event as any; console.error('Speech recognition error:', err.error, err.message); setError(`Speech error: ${err.error}`); /* Optionally stop recording */ };
        recognitionRef.current.onend = () => { console.log("useTargetRecording: Speech recognition ended."); /* If isRecordingTarget is still true here, it might be an unexpected stop */ };
        recognitionRef.current.start();
        console.log("useTargetRecording: Speech recognition started.");
      } else { toast.info("Live transcription not available."); }

      mediaRecorderRef.current.start();
      setIsRecordingTarget(true); // <<< UPDATE CONTEXT
      console.log("useTargetRecording: MediaRecorder started.");
      toast.success("Target Event recording started!");

    } catch (err) {
      console.error("Error starting target recording:", err);
      let message = "Failed to start recording."; // Generic message
       if (err instanceof Error) { // More specific messages
         if (err.name === 'NotAllowedError') message = "Microphone access denied.";
         else if (err.name === 'NotFoundError') message = "No microphone found.";
         else message = `Error: ${err.message}`;
       }
      setError(message); toast.error(message);
      stopMediaStreamsAndRecorders(); // Cleanup on error
      setIsRecordingTarget(false); // <<< UPDATE CONTEXT
    }
  }, [isSupported, isRecordingTarget, setIsRecordingTarget, setAudioBlobTarget, setTargetEventTranscript]); // Dependencies


  const stopTargetRecording = useCallback(() => {
    console.log("useTargetRecording: Stopping...");
    if (!isRecordingTarget) return; // Use context state

    stopMediaStreamsAndRecorders(); // Call unified cleanup function

    setIsRecordingTarget(false); // <<< UPDATE CONTEXT
    // Update context with the FINAL transcript from local state
    setTargetEventTranscript(liveTranscript); // <<< UPDATE CONTEXT
    console.log("useTargetRecording: Final transcript set in context:", liveTranscript);
    toast.success("Target Event recording stopped.");
    // Keep recordingTime display? setRecordingTime(0); // Optional: reset timer display

  }, [isRecordingTarget, setIsRecordingTarget, setTargetEventTranscript, liveTranscript, stopMediaStreamsAndRecorders]); // Dependencies


  // Return values needed by the component using the hook
  return {
    isRecordingTarget,      // Get from context
    recordingTime,          // Local state for display
    targetEventTranscript,  // Get from context (final value)
    liveTranscript,         // Local state for live display
    startTargetRecording,   // Function provided by hook
    stopTargetRecording,    // Function provided by hook
    error,                  // Local error state
    isSupported             // Local support state
    // Don't return audioBlobTarget directly unless component needs it
  };
};