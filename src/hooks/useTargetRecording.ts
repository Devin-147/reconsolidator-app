
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { startMediaRecording, stopMediaRecording } from '@/utils/mediaRecording';
import { initSpeechRecognition } from '@/utils/speechRecognition';

export const useTargetRecording = () => {
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [isRecordingTarget, setIsRecordingTarget] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [targetEventTranscript, setTargetEventTranscript] = useState('');
  const [tempTargetTranscript, setTempTargetTranscript] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const speechRecognitionRef = useRef<any | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Load target event transcript from localStorage on init
  useEffect(() => {
    const savedState = localStorage.getItem('recordingState');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        if (state.targetEventTranscript) {
          setTargetEventTranscript(state.targetEventTranscript);
          console.log("Restored target event from localStorage:", 
            state.targetEventTranscript.substring(0, 30) + "...");
        }
      } catch (error) {
        console.error('Error loading saved target event:', error);
      }
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }

      // Ensure we clean up any active media streams
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, []);

  const startTargetRecording = async () => {
    try {
      // Ensure any previous stream is stopped
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }

      recordedChunksRef.current = [];
      setRecordingTime(0);
      setTempTargetTranscript('');
      setIsRecordingTarget(true);

      // Start video recording
      const recording = await startMediaRecording();
      if (recording) {
        const { mediaRecorder, chunks, stream } = recording;
        mediaRecorderRef.current = mediaRecorder;
        recordedChunksRef.current = chunks;
        mediaStreamRef.current = stream;
      } else {
        setIsRecordingTarget(false);
        return;
      }

      // Start speech recognition in parallel
      const onTranscriptChange = (transcript: string) => {
        setTempTargetTranscript(transcript);
      };

      const onError = () => {
        toast.error("There was an error with speech recognition");
      };

      speechRecognitionRef.current = initSpeechRecognition(onTranscriptChange, onError);
      
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.start();
      }

      timerRef.current = window.setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecordingTarget(false);
    }
  };

  const stopTargetRecording = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Stop speech recognition
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      speechRecognitionRef.current = null;
    }

    // Stop video recording
    const blob = stopMediaRecording(mediaRecorderRef.current, recordedChunksRef.current);
    
    if (blob) {
      setVideoBlob(blob);
      const finalTranscript = tempTargetTranscript || "My target event recording";
      setTargetEventTranscript(finalTranscript);
      
      // Update localStorage immediately
      const savedState = localStorage.getItem('recordingState');
      if (savedState) {
        try {
          const state = JSON.parse(savedState);
          state.targetEventTranscript = finalTranscript;
          localStorage.setItem('recordingState', JSON.stringify(state));
        } catch (error) {
          console.error('Error updating target event in localStorage:', error);
        }
      }
      
      toast.success("Target event recorded successfully");
    }

    // Ensure we stop all tracks in the media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped track: ${track.kind}`, track);
      });
      mediaStreamRef.current = null;
    }

    setIsRecordingTarget(false);
    console.log('Stopped target event recording');
  };

  return {
    videoBlob,
    isRecordingTarget,
    recordingTime,
    targetEventTranscript,
    tempTargetTranscript,
    setTargetEventTranscript,
    startTargetRecording,
    stopTargetRecording
  };
};
