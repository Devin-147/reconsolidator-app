// FILE: src/components/ui/NeuralSpinner.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface NeuralSpinnerProps {
  className?: string;
}

export const NeuralSpinner: React.FC<NeuralSpinnerProps> = ({ className }) => {
  return (
    <div className={cn("relative flex h-16 w-16 items-center justify-center", className)}>
      {/* Central Neuron */}
      <span className="absolute h-4 w-4 rounded-full bg-primary opacity-90"></span>
      {/* Pulsing Synapse Rings */}
      <span className="absolute inline-flex h-full w-full animate-pulse-slow rounded-full bg-primary/70 opacity-75"></span>
      <span className="absolute inline-flex h-full w-full animate-pulse-delay rounded-full bg-primary/50 opacity-50"></span>
    </div>
  );
};
