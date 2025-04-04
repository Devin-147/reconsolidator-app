
import { toast } from 'sonner';

export const initSpeechRecognition = (
  onTranscriptChange: (transcript: string) => void,
  onError: (error: any) => void,
  memoryNumber?: 1 | 2
) => {
  if (!('webkitSpeechRecognition' in window)) {
    toast.error("Speech recognition is not supported in this browser");
    return null;
  }
  
  try {
    const recognition = new window.webkitSpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      
      onTranscriptChange(transcript);
      
      // Dispatch a custom event with the transcript for real-time display
      if (memoryNumber) {
        const transcriptEvent = new CustomEvent('transcriptUpdate', {
          detail: { transcript, memoryNumber }
        });
        window.dispatchEvent(transcriptEvent);
      } else {
        // For target event recording
        const transcriptEvent = new CustomEvent('targetTranscriptUpdate', {
          detail: { transcript }
        });
        window.dispatchEvent(transcriptEvent);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event);
      onError(event);
    };

    return recognition;
  } catch (error) {
    console.error("Error initializing speech recognition:", error);
    toast.error("Failed to initialize speech recognition");
    return null;
  }
};
