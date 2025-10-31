// FILE: src/components/treatment/PracticeBooth.tsx
// NEW: A guided exercise to act as our video generation time buffer.

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, Film, Rewind } from 'lucide-react';

interface PracticeBoothProps {
  neutralMemory: string;
  onComplete: () => void;
}

export const PracticeBooth: React.FC<PracticeBoothProps> = ({ neutralMemory, onComplete }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Step 1: The Full Color Movie",
      instruction: `First, let's practice with the safe memory you provided: "${neutralMemory}". Take a moment, close your eyes if you're comfortable, and IMAGINE watching a movie of this memory in full color. See it play from the beginning to the end, from a safe seat in your imaginal movie theater.`,
      buttonText: "I've watched the color movie",
      icon: Film,
    },
    {
      title: "Step 2: The Black & White Movie",
      instruction: `Well done. Now, IMAGINE watching that same movie of "${neutralMemory}" again, but this time, drain all the color from the screen. See it play from beginning to end in grainy black and white.`,
      buttonText: "I've watched the B&W movie",
      icon: Film,
    },
    {
      title: "Step 3: The Reversal",
      instruction: `Excellent. For the final practice, we will run the movie in reverse. From the end point of the memory, IMAGINE SEEING the movie run backwards in just 1-2 seconds, all the way back to the very start. Do this a few times until it feels easy.`,
      buttonText: "I've practiced the reversal",
      icon: Rewind,
    },
    {
      title: "Practice Complete",
      instruction: "You have successfully practiced the core mental techniques of the RTM protocol. You are now fully prepared to begin the main treatment.",
      buttonText: "Begin Main Treatment",
      icon: CheckCircle,
    },
  ];

  const currentStep = steps[step];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="p-6 border rounded-lg bg-card shadow-lg space-y-6 animate-fadeIn">
      <div className="flex items-center space-x-4">
        <currentStep.icon className="w-8 h-8 text-primary flex-shrink-0" />
        <div>
          <h3 className="text-xl font-semibold text-primary">{currentStep.title}</h3>
          <p className="text-sm text-muted-foreground">A guided warm-up exercise.</p>
        </div>
      </div>
      <p className="text-foreground leading-relaxed">
        {currentStep.instruction}
      </p>
      <Button onClick={handleNext} className="w-full">
        {currentStep.buttonText} <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
};
