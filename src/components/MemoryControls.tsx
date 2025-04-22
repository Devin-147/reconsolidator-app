// src/components/MemoryControls.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react'; // Added React, useCallback
import { Button } from "@/components/ui/button";
import { Mic, StopCircle } from "lucide-react";
import { useRecording } from "@/contexts/RecordingContext";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner'; // Import toast for feedback

interface MemoryControlsProps {
  memoryNumber: number; // 0 for Target, 1 for Memory1, 2 for Memory2
  isRecording: boolean; // Pass the specific isRecording state (isRecordingTarget, isRecording1, isRecording2)
  // Removed unnecessary props if component uses context directly
}

// Check for browser support (run this check once)
const isBrowserSupported =
    typeof window !== 'undefined' &&
    (typeof window.SpeechRecognition !== 'undefined' || typeof (window as any).webkitSpeechRecognition !== 'undefined');
const SpeechRecognition = isBrowserSupported ? window.SpeechRecognition || (window as any).webkitSpeechRecognition : null;


export const MemoryControls = ({ memoryNumber, isRecording }: MemoryControlsProps) => {
  // Get only the necessary setters and final transcript values from context
  const {
    setIsRecordingTarget, // Setter for Target recording status
    setIsRecording1,      // Setter for Memory 1 recording status
    setIsRecording2,      // Setter for Memory 2 recording status
    setTargetEventTranscript, // Setter for Target final transcript
    setMemory1,             // Setter for Memory 1 final transcript
    setMemory2,             // Setter for Memory 2 final transcript
    targetEventTranscript,  // Final value for display
    memory1,                // Final value for display
    memory2,                // Final value for display
    // setAudioBlobTarget, // Add if this component should also handle audio blobs
    // setAudioBlobM1,
    // setAudioBlobM2,
  } = useRecording();

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  // Local state for the transcript *during* recording and for display fallback
  const [liveTranscript, setLiveTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(true);

  // Determine which context state/setter to use based on memoryNumber
  const setIsRecording = memoryNumber === 0 ? setIsRecordingTarget : (memoryNumber === 1 ? setIsRecording1 : setIsRecording2);
  const setFinalTranscript = memoryNumber === 0 ? setTargetEventTranscript : (memoryNumber === 1 ? setMemory1 : setMemory2);
  const finalTranscriptValue = memoryNumber === 0 ? targetEventTranscript : (memoryNumber === 1 ? memory1 : memory2);

  // Check support on mount
   useEffect(() => {
        if (!isBrowserSupported || !SpeechRecognition) {
            console.error("Speech recognition not supported in this browser.");
            setIsSupported(false);
            toast.error("Speech recognition not supported. You can type instead.");
        }
    }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, []);

  const startRecording = useCallback(() => {
    if (!isSupported || isRecording) return; // Don't start if not supported or already recording

    if (!SpeechRecognition) {
      console.error("Speech recognition not supported.");
      toast.error("Speech recognition not supported.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    setLiveTranscript(""); // Clear previous live transcript
    let accumulatedFinalTranscript = ""; // Accumulate final results

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          accumulatedFinalTranscript += event.results[i][0].transcript; // Add final part
        } else {
          interimTranscript += event.results[i][0].transcript; // Update interim part
        }
      }
      // Show combined live view
      setLiveTranscript(accumulatedFinalTranscript + interimTranscript);
    };

    recognition.onerror = (event: Event) => {
        const errorEvent = event as any;
        console.error(`Speech recognition error for Memory ${memoryNumber}:`, errorEvent.error, errorEvent.message);
        toast.error(`Speech Error: ${errorEvent.error}`);
        // Consider stopping recording on error?
        stopRecordingInternal(accumulatedFinalTranscript); // Try to save what we got
    };

    recognition.onend = () => {
      console.log(`Speech recognition ended for Memory ${memoryNumber}`);
      // Check if still in recording state - if so, it ended unexpectedly
      if (isRecording) {
          setIsRecording(false); // Update context state via specific setter
          toast.info("Recording stopped.");
          // Set final transcript even if ended unexpectedly
           setFinalTranscript(accumulatedFinalTranscript || liveTranscript); // Use accumulated or last live
           console.log(`Final transcript (unexpected end) Memory ${memoryNumber}:`, accumulatedFinalTranscript || liveTranscript);
      }
    };

    try {
        recognition.start();
        console.log(`Starting recording for Memory ${memoryNumber}`);
        setIsRecording(true); // Update context state via specific setter
        toast.success("Recording started...");
    } catch (err) {
        console.error("Error starting speech recognition:", err);
        toast.error("Could not start recording.");
        setIsRecording(false);
    }
  }, [isSupported, isRecording, memoryNumber, setIsRecording, setFinalTranscript, liveTranscript]); // Added liveTranscript?

  const stopRecordingInternal = (transcriptToSave: string) => {
     if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
      }
      console.log(`Stopping recording for Memory ${memoryNumber}`);
      setIsRecording(false); // Update context state via specific setter
      // Save the accumulated transcript to the correct context state
      setFinalTranscript(transcriptToSave);
      console.log(`Final transcript for Memory ${memoryNumber}:`, transcriptToSave);
      toast.success("Recording stopped.");
  }

  const stopRecording = useCallback(() => {
    stopRecordingInternal(liveTranscript); // Use the latest live transcript when stopped manually
  }, [liveTranscript, stopRecordingInternal]); // Dependency


  // Allow manual editing of the final transcript when NOT recording
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (!isRecording) {
          setFinalTranscript(e.target.value);
      }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          variant={isRecording ? "destructive" : "default"}
          size="sm" // Smaller button
          className="flex items-center gap-1.5" // Reduced gap
          disabled={!isSupported} // Disable if not supported
        >
          {isRecording ? (
            <> <StopCircle className="w-4 h-4" /> Stop </>
          ) : (
            <> <Mic className="w-4 h-4" /> Record </>
          )}
        </Button>
         {isRecording && <span className="text-xs text-muted-foreground animate-pulse">Recording...</span>}
      </div>

      <Textarea
        // Display live transcript while recording, final stored value otherwise
        value={isRecording ? liveTranscript : finalTranscriptValue}
        // Allow editing only when not recording
        onChange={handleTextChange}
        readOnly={isRecording}
        placeholder={`Click Record or type Positive Memory ${memoryNumber === 0 ? 'Target Event' : memoryNumber}...`} // Dynamic placeholder
        className="min-h-[120px] text-sm bg-background/50" // Slightly taller
        rows={5} // Suggest rows
      />

    </div>
  );
};