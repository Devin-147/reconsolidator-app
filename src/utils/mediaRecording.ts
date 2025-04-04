
import { toast } from 'sonner';

export const startMediaRecording = async (): Promise<{ 
  mediaRecorder: MediaRecorder, 
  chunks: Blob[], 
  stream: MediaStream 
} | null> => {
  try {
    const chunks: Blob[] = [];
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: true, 
      video: true 
    });

    const mediaRecorder = new MediaRecorder(stream);
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    mediaRecorder.start(1000);
    console.log('Starting target event recording');

    return { mediaRecorder, chunks, stream };
  } catch (error) {
    console.error('Error starting recording:', error);
    toast.error("Failed to access camera or microphone");
    return null;
  }
};

export const stopMediaRecording = (
  mediaRecorder: MediaRecorder | null,
  chunks: Blob[]
): Blob | null => {
  if (!mediaRecorder || mediaRecorder.state === 'inactive') {
    return null;
  }
  
  try {
    // First stop the recorder
    mediaRecorder.stop();
    
    // Explicitly stop all tracks in the stream
    const stream = mediaRecorder.stream;
    if (stream) {
      const tracks = stream.getTracks();
      tracks.forEach(track => {
        track.stop();
        console.log(`Track stopped: ${track.kind}`);
      });
    }
    
    // Create the blob if we have chunks
    if (chunks.length > 0) {
      const blob = new Blob(chunks, {
        type: 'video/webm'
      });
      
      // Verify that all tracks are actually stopped
      const allTracks = document.querySelectorAll('video, audio');
      allTracks.forEach(element => {
        if (element instanceof HTMLMediaElement && element.srcObject) {
          const mediaStream = element.srcObject as MediaStream;
          mediaStream.getTracks().forEach(track => {
            track.stop();
            console.log('Stopped track:', track.kind, track);
          });
          element.srcObject = null;
        }
      });
      
      return blob;
    }
  } catch (error) {
    console.error('Error stopping media recording:', error);
    toast.error('There was an error stopping the recording');
  }
  
  return null;
};
