// src/components/MemoryControls.tsx
import { Button } from "@/components/ui/button";
import { Mic, StopCircle } from "lucide-react";
import { useRecording } from "@/contexts/RecordingContext";
import { useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";

interface MemoryControlsProps {
  memoryNumber: number;
  isRecording: boolean;
}

export const MemoryControls = ({ memoryNumber, isRecording }: MemoryControlsProps) => {
  const {
    setIsRecording1,
    setIsRecording2,
    setTempMemory1Transcript,
    setTempMemory2Transcript,
    setMemory1Transcript,
    setMemory2Transcript,
    setMemory1,
    setMemory2,
    memory1,
    memory2,
    tempMemory1Transcript,
    tempMemory2Transcript,
  } = useRecording();

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [localTranscript, setLocalTranscript] = useState("");

  const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;

  const startRecording = () => {
    if (!SpeechRecognition) {
      console.error("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join("");
      console.log(`Memory ${memoryNumber} live transcript:`, transcript);
      setLocalTranscript(transcript);
      window.dispatchEvent(
        new CustomEvent("transcriptUpdate", {
          detail: { memoryNumber, transcript },
        })
      );
      if (memoryNumber === 1) {
        setTempMemory1Transcript(transcript);
      } else if (memoryNumber === 2) {
        setTempMemory2Transcript(transcript);
      }
    };

    recognition.onerror = (event) => {
      console.error(`Speech recognition error for Memory ${memoryNumber}:`, event.error);
    };

    recognition.onend = () => {
      console.log(`Speech recognition ended for Memory ${memoryNumber}`);
      if (memoryNumber === 1) {
        setIsRecording1(false);
      } else if (memoryNumber === 2) {
        setIsRecording2(false);
      }
    };

    recognition.start();
    console.log(`Starting recording for Memory ${memoryNumber}`);
    setLocalTranscript("");
    if (memoryNumber === 1) {
      setIsRecording1(true);
    } else if (memoryNumber === 2) {
      setIsRecording2(true);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    console.log(`Stopping recording for Memory ${memoryNumber}`);
    console.log(`Final transcript for Memory ${memoryNumber}:`, localTranscript);
    if (memoryNumber === 1) {
      setIsRecording1(false);
      setMemory1(localTranscript);
      setMemory1Transcript(localTranscript);
    } else if (memoryNumber === 2) {
      setIsRecording2(false);
      setMemory2(localTranscript);
      setMemory2Transcript(localTranscript);
    }
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const currentTranscript = memoryNumber === 1 ? memory1 : memory2;
  const currentTempTranscript = memoryNumber === 1 ? tempMemory1Transcript : tempMemory2Transcript;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          variant={isRecording ? "destructive" : "default"}
          className="flex items-center gap-2"
        >
          {isRecording ? (
            <>
              <StopCircle className="w-4 h-4" />
              <span>Stop</span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              <span>Record</span>
            </>
          )}
        </Button>
      </div>
      
      <div className="space-y-2">
        <Textarea
          value={isRecording ? currentTempTranscript : currentTranscript}
          onChange={(e) => {
            if (memoryNumber === 1) {
              setMemory1(e.target.value);
              setMemory1Transcript(e.target.value);
            } else {
              setMemory2(e.target.value);
              setMemory2Transcript(e.target.value);
            }
          }}
          placeholder={`Enter or record Memory ${memoryNumber}...`}
          className="min-h-[100px] text-sm"
          readOnly={isRecording}
        />
        {isRecording && (
          <p className="text-xs text-gray-500">Recording in progress...</p>
        )}
      </div>
    </div>
  );
};