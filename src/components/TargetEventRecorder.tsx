// src/components/TargetEventRecorder.tsx
import { useEffect, useRef, useState } from "react";
import { Video, MicOff, MessageSquare } from "lucide-react";
import { useRecording } from "@/contexts/RecordingContext";
import { formatTime } from "@/utils/formatTime";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import SUDSScale from "./SUDSScale";

export const TargetEventRecorder = () => {
  const {
    isRecordingTarget,
    recordingTime,
    videoBlob,
    startTargetRecording,
    stopTargetRecording,
    targetEventTranscript,
    setTargetEventTranscript,
    setRecordingTime,
    setSudsLevel,
    setCalibrationSuds,
  } = useRecording();

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [permissionError, setPermissionError] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [currentSudsLevel, setCurrentSudsLevel] = useState(0);
  const timerRef = useRef<number | null>(null);

  // Listen for transcript updates
  useEffect(() => {
    const handleTargetTranscriptUpdate = (event: CustomEvent) => {
      const newTranscript = event.detail.transcript;
      setLiveTranscript(newTranscript);
      console.log("Transcript update received:", newTranscript);
    };

    window.addEventListener("targetTranscriptUpdate", handleTargetTranscriptUpdate as EventListener);

    return () => {
      window.removeEventListener("targetTranscriptUpdate", handleTargetTranscriptUpdate as EventListener);
    };
  }, []);

  // Timer for recording duration
  useEffect(() => {
    if (isRecordingTarget) {
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev: number) => {
          const maxDuration = 300; // 5 minutes in seconds
          if (prev >= maxDuration) {
            stopTargetRecording();
            return maxDuration;
          }
          return prev + 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecordingTarget, setRecordingTime, stopTargetRecording]);

  // Check permissions
  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPermissionError("Your browser doesn't support media recording");
      setHasPermission(false);
      return;
    }

    if (videoBlob) {
      setHasPermission(true);
      return;
    }

    const checkPermissions = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        stream.getTracks().forEach((track) => track.stop()); // Clean up immediately
        setHasPermission(true);
        setPermissionError("");
      } catch (error) {
        console.error("Permission error:", error);
        setPermissionError("Please allow camera and microphone access");
        setHasPermission(false);
      }
    };

    if (hasPermission === null) {
      checkPermissions();
    }
  }, [videoBlob, hasPermission]);

  const handleStartRecording = () => {
    try {
      setLiveTranscript("");
      setTargetEventTranscript("");
      console.log("Starting target recording");
      startTargetRecording();
    } catch (error) {
      console.error("Failed to start recording:", error);
      setPermissionError("Failed to start recording. Please check permissions.");
      toast.error("Recording failed to start.");
    }
  };

  const handleStopRecording = () => {
    try {
      console.log("Stopping target recording");
      stopTargetRecording();
      const finalTranscript = liveTranscript.trim();
      console.log("Final live transcript:", finalTranscript);
      setTargetEventTranscript(finalTranscript || "Transcription failed to capture speech.");
    } catch (error) {
      console.error("Failed to stop recording:", error);
      toast.error("Failed to stop recording.");
    }
  };

  const handleTranscriptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTargetEventTranscript(e.target.value);
  };

  const handleSudsChange = (value: number) => {
    setCurrentSudsLevel(value);
    setSudsLevel(value);
    setCalibrationSuds(value); // Set the calibration SUDS when user adjusts the slider
  };

  return (
    <div className="p-6 rounded-xl bg-black/30 backdrop-blur-sm border border-white/10 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-white">Record Target Event</h3>
          <p className="text-sm text-white/70">Maximum duration: 5 minutes</p>
        </div>
        <Button
          onClick={isRecordingTarget ? handleStopRecording : handleStartRecording}
          className={`p-3 rounded-full transition-all duration-300 ${
            isRecordingTarget
              ? "bg-red-500/20 hover:bg-red-500/30"
              : "bg-primary/20 hover:bg-primary/30"
          }`}
        >
          {isRecordingTarget ? (
            <div className="flex items-center space-x-2">
              <MicOff className="w-6 h-6 text-red-500" />
              <span className="text-red-500">{formatTime(recordingTime)}</span>
            </div>
          ) : (
            <Video className="w-6 h-6 text-primary" />
          )}
        </Button>
      </div>

      <div className="relative aspect-video bg-black/50 rounded-lg overflow-hidden">
        {permissionError && !isRecordingTarget && !videoBlob && (
          <div className="absolute inset-0 flex items-center justify-center text-center p-4">
            <p className="text-red-400">{permissionError}</p>
          </div>
        )}

        {videoBlob && !isRecordingTarget && (
          <video controls className="w-full h-full" src={URL.createObjectURL(videoBlob)} />
        )}

        {isRecordingTarget && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
            <div className="animate-pulse text-red-500 flex flex-col items-center gap-2 mb-4">
              <div className="w-4 h-4 rounded-full bg-red-500 animate-ping"></div>
              <p>Recording in progress...</p>
              <p className="text-xl font-mono">{formatTime(recordingTime)}</p>
            </div>

            {liveTranscript && (
              <div className="bg-black/60 p-3 rounded-lg max-w-lg max-h-40 overflow-y-auto mt-4 text-white/90">
                <div className="flex items-center gap-1 mb-1">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <span className="text-xs text-primary">Transcribing...</span>
                </div>
                <p className="text-sm">{liveTranscript}</p>
              </div>
            )}
          </div>
        )}

        {!videoBlob && !isRecordingTarget && !permissionError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-white/50">Click the camera icon to start recording</p>
          </div>
        )}
      </div>

      {videoBlob && !isRecordingTarget && (
        <>
          <div className="mt-3 p-4 bg-black/20 rounded-lg">
            <h4 className="text-sm font-medium text-white mb-2">Target Event Description:</h4>
            <Textarea
              value={targetEventTranscript}
              onChange={handleTranscriptChange}
              placeholder="Describe your target event..."
              className="text-white/80 text-sm min-h-[100px]"
            />
          </div>

          <div className="mt-6 space-y-4">
            <h4 className="text-lg font-medium text-white">Rate Your Distress Level</h4>
            <p className="text-sm text-white/70">
              Please rate your current level of distress after recalling the target event.
              This will be your calibration SUDS score for all future treatments.
            </p>
            <SUDSScale
              onValueChange={handleSudsChange}
              initialValue={currentSudsLevel}
              readOnly={false}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default TargetEventRecorder;