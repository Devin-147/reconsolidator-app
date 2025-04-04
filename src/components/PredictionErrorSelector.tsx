
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check } from "lucide-react";
import { toast } from "sonner";

export interface PredictionError {
  id: number;
  title: string;
  description: string;
}

const predictionErrors: PredictionError[] = [
  { id: 1, title: "The Superheroes Arrive", description: "A team of superheroes swoops in to save the day and rescue the entire situation in a cosmically impressive way." },
  { id: 2, title: "It Was a Movie Set", description: "I then realize it's all part of an elaborate film scene, and everyone is congratulated for their stellar acting." },
  { id: 3, title: "The Lottery Win", description: "After the experience, I win the lottery in many different ways and my life improves with ease, joy and glory." },
  { id: 4, title: "A Magical Intervention", description: "A mysterious stranger reveals themselves to be a magician, using their powers to undo some of the event and make everything right." },
  { id: 5, title: "A Hidden Hero", description: "An unknown hero, previously unnoticed, saves the day and turns the tides in my favor." },
  { id: 6, title: "Alien Rescue", description: "Friendly aliens land and use advanced technology to reverse all the negative effects and provide a new start." },
  { id: 7, title: "A Kind Stranger", description: "A stranger offers help at the most unexpected moment, providing the perfect solution to everything that went wrong." },
  { id: 8, title: "The Secret Society", description: "The person is revealed to be part of a secret society with immense resources and influence, helping them recover from the bad experience." },
  { id: 9, title: "The Great Invention", description: "A new invention or piece of technology is introduced that solves all the person's problems in an instant." },
  { id: 10, title: "A Heroic Animal", description: "A heroic animal, such as a loyal dog or a trained bird, comes to their rescue and helps them overcome the situation." },
  { id: 11, title: "A New Power Awakens", description: "You discover a new power or skill, allowing you to overcome the difficulties they faced." },
  { id: 12, title: "The Power of Friendship", description: "A group of close friends appears to support me, making sure they get back on their feet and reclaim their happiness." },
  { id: 13, title: "A Hidden Fortune", description: "I stumble upon a hidden treasure or fortune that not only fixes the situation but transforms life for the better." },
  { id: 14, title: "A Family Legacy", description: "I realize I come from a long line of heroes or powerful figures who help them overcome their problems." },
  { id: 15, title: "Divine Intervention", description: "A higher power intervenes, providing guidance or assistance that changes the course of the experience." },
  { id: 16, title: "The Justice League", description: "A group of iconic superheroes arrives on the scene, battling the antagonist and restoring peace to the situation." },
  { id: 17, title: "A Heartfelt Apology", description: "Those who wronged you realize their mistake, apologize, and work together to fix the situation, leaving everyone satisfied and settled." },
  { id: 18, title: "Writing a Bestseller", description: "After the experience, I write an incredibly popular book about overcoming adversity, which becomes a bestseller and inspires millions worldwide." },
  { id: 19, title: "Winning an Oscar", description: "The person decides to turn their bad experience into a film or play and wins an Academy Award for Best Picture, Director, or Actor, making history in Hollywood." },
  { id: 20, title: "Building an Empire", description: "I use the lessons learned from the bad experience to create a successful business empire, eventually becoming a self-made billionaire and philanthropist." },
  { id: 21, title: "Global Humanitarian", description: "I become the founder of a global charity, changing the lives of millions and earning worldwide recognition for their selfless work." },
  { id: 22, title: "Winning a Nobel Prize", description: "Through their persistence and innovation, they make a breakthrough discovery that wins them the Nobel Prize in Science, Peace, or Literature." },
  { id: 23, title: "Becoming a National Hero", description: "I am honored with a national award or recognition for their courage and resilience, becoming a role model for generations to come." },
  { id: 24, title: "Building a Successful Startup", description: "What started as a failed venture turns into the launch of a tech startup that gets acquired for billions, and they become a Silicon Valley mogul." },
  { id: 25, title: "Starting a Trend", description: "They turn their struggle into a fashion or lifestyle brand that becomes a global trend, with celebrities endorsing it and millions of followers." },
  { id: 26, title: "A Ted Talk Phenomenon", description: "I see that my personal journey inspires me to deliver a TED Talk that goes viral, landing a prestigious speaking career and global influence." },
  { id: 27, title: "Political Leader", description: "They transform their tough experience into a platform for change, eventually running for office and becoming a highly respected political figure who reforms an entire nation." },
  { id: 28, title: "Becoming a Top Chef", description: "In the next scene I become a renowned chef and open multiple Michelin-starred restaurants worldwide, even writing cookbooks and hosting cooking shows." },
  { id: 29, title: "Unveiling a Masterpiece", description: "After the bad experience, I become a renowned artist, unveiling a collection of paintings or sculptures that become famous in galleries around the world, securing global art fame." },
  { id: 30, title: "Becoming a Legendary Rock Star", description: "After facing adversity, I become a world-famous musician, releasing albums that top the charts and earning international fame and acclaim, eventually being inducted into the Rock & Roll Hall of Fame." }
];

interface PredictionErrorSelectorProps {
  onComplete: (selectedErrors: PredictionError[]) => void;
}

export const PredictionErrorSelector = ({ onComplete }: PredictionErrorSelectorProps) => {
  const [selectedErrors, setSelectedErrors] = useState<PredictionError[]>([]);
  const [customError, setCustomError] = useState("");

  const toggleError = (error: PredictionError) => {
    if (selectedErrors.find(e => e.id === error.id)) {
      setSelectedErrors(selectedErrors.filter(e => e.id !== error.id));
    } else if (selectedErrors.length < 11) {
      setSelectedErrors([...selectedErrors, error]);
    } else {
      toast.error("You can only select 11 prediction errors");
    }
  };

  const addCustomError = () => {
    if (!customError.trim()) {
      toast.error("Please enter a custom prediction error");
      return;
    }
    if (selectedErrors.length >= 11) {
      toast.error("You can only select 11 prediction errors");
      return;
    }
    const newError: PredictionError = {
      id: Date.now(),
      title: "Custom Error",
      description: customError
    };
    setSelectedErrors([...selectedErrors, newError]);
    setCustomError("");
  };

  const handleComplete = () => {
    if (selectedErrors.length !== 11) {
      toast.error("Please select exactly 11 prediction errors");
      return;
    }
    onComplete(selectedErrors);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Select Prediction Errors</h2>
        <p className="text-muted-foreground">
          Choose 11 alternative endings for your retelling sessions. You can select from the list or create your own.
        </p>
      </div>

      <div className="flex gap-4 items-end">
        <textarea
          value={customError}
          onChange={(e) => setCustomError(e.target.value)}
          placeholder="Enter your own prediction error..."
          className="flex-1 min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <Button onClick={addCustomError}>Add Custom</Button>
      </div>

      <ScrollArea className="h-[400px] rounded-md border p-4">
        <div className="space-y-2">
          {predictionErrors.map((error) => (
            <div
              key={error.id}
              className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                selectedErrors.find(e => e.id === error.id)
                  ? "bg-primary/10 border-primary"
                  : "hover:bg-accent"
              }`}
              onClick={() => toggleError(error)}
            >
              <div className="flex items-start gap-2">
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                  selectedErrors.find(e => e.id === error.id)
                    ? "bg-primary border-primary"
                    : "border-input"
                }`}>
                  {selectedErrors.find(e => e.id === error.id) && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium">{error.title}</h3>
                  <p className="text-sm text-muted-foreground">{error.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Selected: {selectedErrors.length} / 11
        </p>
        <Button onClick={handleComplete} disabled={selectedErrors.length !== 11}>
          Continue to Treatment
        </Button>
      </div>
    </div>
  );
};
