// FILE: src/components/treatment/PersonalizedVideoPlayer.tsx
// CORRECTED: Uses the custom NeuralSpinner for the loading state.

import React from 'react';
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { NeuralSpinner } from '@/components/ui/NeuralSpinner'; // <<< CORRECTED: Import NeuralSpinner
import { AlertTriangle } from 'lucide-react';

interface PersonalizedVideoPlayerProps {
  videoUrl: string | null | undefined;
  title?: string;
}

export const PersonalizedVideoPlayer: React.FC<PersonalizedVideoPlayerProps> = ({ videoUrl, title }) => {
  // --- State 1: Loading ---
  if (!videoUrl) {
    return (
      <AspectRatio ratio={16 / 9} className="bg-muted/50 rounded-lg flex flex-col items-center justify-center">
        {/* <<< CORRECTED: Use the NeuralSpinner component >>> */}
        <NeuralSpinner className="h-20 w-20" /> 
        <p className="mt-4 text-sm text-muted-foreground">Loading your personalized video...</p>
      </AspectRatio>
    );
  }

  // --- State 2: Error ---
  const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error("Video player error:", e);
    const videoElement = e.currentTarget;
    const parent = videoElement.parentElement;
    if (parent) {
      videoElement.style.display = 'none';
      const errorDiv = document.createElement('div');
      errorDiv.className = 'w-full h-full flex flex-col items-center justify-center text-destructive';
      // Simple error display using Lucide's AlertTriangle SVG path data
      errorDiv.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg><p class="mt-2 text-sm">Error loading video.</p>`;
      parent.appendChild(errorDiv);
    }
  };

  // --- State 3: Success ---
  return (
    <div className="space-y-2">
      {title && <p className="text-sm font-medium text-center text-muted-foreground">{title}</p>}
      <AspectRatio ratio={16 / 9} className="bg-black rounded-lg overflow-hidden shadow-2xl">
        <video
          key={videoUrl}
          controls
          autoPlay
          className="w-full h-full object-contain"
          onError={handleError}
        >
          <source src={videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </AspectRatio>
    </div>
  );
};
