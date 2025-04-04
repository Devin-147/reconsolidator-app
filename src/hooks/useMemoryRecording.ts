
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { initSpeechRecognition } from '@/utils/speechRecognition';

export const useMemoryRecording = () => {
  const [memory1, setMemory1] = useState('');
  const [memory2, setMemory2] = useState('');
  const [isRecording1, setIsRecording1] = useState(false);
  const [isRecording2, setIsRecording2] = useState(false);
  const [tempMemory1Transcript, setTempMemory1Transcript] = useState('');
  const [tempMemory2Transcript, setTempMemory2Transcript] = useState('');
  const recognitionRef = useRef<any | null>(null);

  // Load saved memories from localStorage on initialization
  useEffect(() => {
    const savedState = localStorage.getItem('recordingState');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        if (state.memory1) setMemory1(state.memory1);
        if (state.memory2) setMemory2(state.memory2);
        console.log("Restored memories from localStorage:", {
          memory1: state.memory1 ? state.memory1.substring(0, 30) + "..." : "none",
          memory2: state.memory2 ? state.memory2.substring(0, 30) + "..." : "none"
        });
      } catch (error) {
        console.error('Error loading saved memories:', error);
      }
    }
  }, []);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startRecording = (memoryNumber: 1 | 2) => {
    if (memoryNumber === 1) {
      setTempMemory1Transcript('');
    } else {
      setTempMemory2Transcript('');
    }
    
    const onTranscriptChange = (transcript: string) => {
      if (memoryNumber === 1) {
        setTempMemory1Transcript(transcript);
      } else {
        setTempMemory2Transcript(transcript);
      }
    };

    const onError = () => {
      toast.error("There was an error with speech recognition");
    };

    recognitionRef.current = initSpeechRecognition(onTranscriptChange, onError, memoryNumber);
    
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
    
    if (memoryNumber === 1) {
      setIsRecording1(true);
    } else {
      setIsRecording2(true);
    }
    console.log(`Starting recording for memory ${memoryNumber}`);
  };

  const stopRecording = (memoryNumber: 1 | 2) => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (memoryNumber === 1) {
      setIsRecording1(false);
      if (tempMemory1Transcript) {
        setMemory1(tempMemory1Transcript);
        // Also update localStorage directly for immediate persistence
        const savedState = localStorage.getItem('recordingState');
        if (savedState) {
          try {
            const state = JSON.parse(savedState);
            state.memory1 = tempMemory1Transcript;
            localStorage.setItem('recordingState', JSON.stringify(state));
          } catch (error) {
            console.error('Error updating memory1 in localStorage:', error);
          }
        }
        toast.success("Pre-target memory recorded");
      }
    } else {
      setIsRecording2(false);
      if (tempMemory2Transcript) {
        setMemory2(tempMemory2Transcript);
        // Also update localStorage directly for immediate persistence
        const savedState = localStorage.getItem('recordingState');
        if (savedState) {
          try {
            const state = JSON.parse(savedState);
            state.memory2 = tempMemory2Transcript;
            localStorage.setItem('recordingState', JSON.stringify(state));
          } catch (error) {
            console.error('Error updating memory2 in localStorage:', error);
          }
        }
        toast.success("Post-target memory recorded");
      }
    }
    
    console.log(`Stopped recording for memory ${memoryNumber}`);
  };

  return {
    memory1,
    memory2,
    isRecording1,
    isRecording2,
    tempMemory1Transcript,
    tempMemory2Transcript,
    setMemory1,
    setMemory2,
    startRecording,
    stopRecording
  };
};
