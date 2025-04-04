import { useRecording } from "@/contexts/RecordingContext";

interface RecordingAnalyzerProps {
  audioBlob: Blob;
}

const RecordingAnalyzer = ({ audioBlob }: RecordingAnalyzerProps) => {
  const { targetEventTranscript } = useRecording();
  console.log("RecordingAnalyzer - targetEventTranscript:", targetEventTranscript);
  const analysis = {
    voiceTremors: "0.03",
    breathingPattern: "0.05",
    speechRate: "0.08",
    pauses: "multiple points",
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-gray-400 uppercase">Description:</h3>
        <p className="mt-2 text-white">{targetEventTranscript || "No transcription available."}</p>
      </div>
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-gray-400 uppercase">Autonomic Arousal Analysis</h3>
        <ul className="mt-2 space-y-1 text-white">
          <li>Voice tremors detected at {analysis.voiceTremors}</li>
          <li>Breathing pattern changes noted at {analysis.breathingPattern}</li>
          <li>Speech rate increased at {analysis.speechRate}</li>
          <li>Pauses in speech observed at {analysis.pauses}</li>
        </ul>
      </div>
    </div>
  );
};

export default RecordingAnalyzer;