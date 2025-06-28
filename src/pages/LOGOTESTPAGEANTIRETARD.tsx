// FILE: src/pages/LOGOTESTPAGEANTIRETARD.tsx
// Displays all 11 animation variants for testing.

import React, { useState, useEffect } from 'react';
import AnimatedLogoWithAudio from '@/components/AnimatedLogoWithAudio';
import { Button } from '@/components/ui/button';

const LOGOTESTPAGEANTIRETARD = () => {
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);

  const handleTogglePlay = (index: number) => {
    if (currentlyPlaying === index) {
      setCurrentlyPlaying(null); // If clicking the one that's playing, stop it
    } else {
      setCurrentlyPlaying(index); // Play the new one
    }
  };

  return (
    <div className="p-4 md:p-8 bg-gray-900 min-h-screen text-white">
      <header className="text-center mb-10">
        <h1 className="text-4xl font-bold text-primary">LOGOTESTPAGEANTIRETARD</h1>
        <p className="text-muted-foreground mt-2">
          Testing all 11 AI Narration Animation Variants. Only one animation/audio can play at a time.
        </p>
        <p className="text-sm text-amber-500 mt-1">
          (This page uses a placeholder silent audio track for testing visuals.)
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {Array.from({ length: 11 }).map((_, index) => {
          const variantNumber = index + 1;
          // A silent, short base64 encoded MP3 to act as a placeholder audio track
          const silentAudioUrl = "data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAAgAAANMYXZmNTUuMw==";

          return (
            <div key={variantNumber} className="p-4 bg-card border border-border rounded-lg flex flex-col items-center">
              <h2 className="text-lg font-semibold mb-4">Animation Variant {variantNumber}</h2>
              <AnimatedLogoWithAudio
                // Using a dummy silent audio URL so the player can load and function
                audioUrl={silentAudioUrl}
                width={200}
                height={200}
                playButtonText={`Play Variant ${variantNumber}`}
                showLoadingText={true}
                animationVariant={variantNumber}
                forceIsPlaying={currentlyPlaying === variantNumber}
                onTogglePlay={() => handleTogglePlay(variantNumber)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LOGOTESTPAGEANTIRETARD;