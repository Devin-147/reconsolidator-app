// FILE: src/pages/LOGOTESTPAGEANTIRETARD.tsx
// Displays all 11 animation variants side-by-side for isolated testing.

import React, { useState } from 'react';
import AnimatedLogoWithAudio from '@/components/AnimatedLogoWithAudio'; // This will be the NEW version
import { Button } from '@/components/ui/button';

const LOGOTESTPAGEANTIRETARD = () => {
  // State to ensure only one logo plays at a time on this page
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);

  const handleTogglePlay = (variantNumber: number) => {
    if (currentlyPlaying === variantNumber) {
      setCurrentlyPlaying(null); // Stop if it's already playing
    } else {
      setCurrentlyPlaying(variantNumber); // Play the new one
    }
  };

  return (
    <div className="p-4 md:p-8 bg-black min-h-screen text-white">
      <header className="text-center mb-10">
        <h1 className="text-4xl font-bold text-sky-400">ANIMATION TEST LAB (ANTI-RETARD v2)</h1>
        <p className="text-gray-400 mt-2">
          Each logo has a unique "Zap" animation layered on top of the CONSTANT Knight Rider blip.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {Array.from({ length: 11 }).map((_, index) => {
          const variantNumber = index + 1;
          const silentAudioUrl = "data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAAgAAANMYXZmNTUuMw==";

          return (
            <div key={variantNumber} className="p-4 bg-gray-900 border border-gray-700 rounded-lg flex flex-col items-center">
              <h2 className="text-lg font-semibold mb-4">Animation Variant {variantNumber}</h2>
              <AnimatedLogoWithAudio
                audioUrl={silentAudioUrl}
                width={200}
                height={200}
                playButtonText={`Test Variant ${variantNumber}`}
                animationVariant={variantNumber}
                forceIsPlaying={currentlyPlaying === variantNumber}
                onTogglePlay={() => handleTogglePlay(variantNumber)}
                // These props are not needed for this test page
                onPlaybackEnd={() => {}} 
                showLoadingText={false}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LOGOTESTPAGEANTIRETARD;