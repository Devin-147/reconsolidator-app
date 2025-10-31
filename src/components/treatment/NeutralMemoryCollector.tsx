// FILE: src/components/treatment/NeutralMemoryCollector.tsx
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface NeutralMemoryCollectorProps {
  neutralMemories: string[];
  setNeutralMemories: React.Dispatch<React.SetStateAction<string[]>>;
}

export const NeutralMemoryCollector: React.FC<NeutralMemoryCollectorProps> = ({ neutralMemories, setNeutralMemories }) => {
  const [currentMemory, setCurrentMemory] = useState('');

  const addMemory = () => {
    if (currentMemory.trim() && neutralMemories.length < 3) {
      setNeutralMemories([...neutralMemories, currentMemory.trim()]);
      setCurrentMemory('');
    }
  };

  const removeMemory = (index: number) => {
    setNeutralMemories(neutralMemories.filter((_, i) => i !== index));
  };

  return (
    <section className="space-y-4 p-4 rounded-lg bg-card shadow-md">
      <h3 className="text-lg font-semibold flex items-center text-white">
        4. List 1-3 Neutral or Pleasant Memories
        <TooltipProvider><Tooltip>
          <TooltipTrigger className="ml-2 cursor-help"><Info size={16} className="text-muted-foreground"/></TooltipTrigger>
          <TooltipContent><p>List simple, safe activities (e.g., "Gardening", "Cooking dinner", "Walking the dog").<br/>These will be used for a warm-up exercise.</p></TooltipContent>
        </Tooltip></TooltipProvider>
      </h3>
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="e.g., Going for a walk"
          value={currentMemory}
          onChange={(e) => setCurrentMemory(e.target.value)}
          disabled={neutralMemories.length >= 3}
          onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); addMemory(); } }}
        />
        <Button onClick={addMemory} disabled={neutralMemories.length >= 3 || !currentMemory.trim()} size="sm">
          <PlusCircle className="w-4 h-4 mr-2" /> Add
        </Button>
      </div>
      <div className="space-y-2">
        {neutralMemories.map((memory, index) => (
          <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
            <p className="text-sm text-foreground">{memory}</p>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeMemory(index)}>
              <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
            </Button>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-right">{neutralMemories.length} / 3 listed</p>
    </section>
  );
};
