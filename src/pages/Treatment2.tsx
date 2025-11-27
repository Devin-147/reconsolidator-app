// FILE: src/pages/Treatment2.tsx
// CORRECTED: Fixed the missing return statement in getPhaseTitle.

import React, { useState, useEffect, useCallback } from "react";
// ... (all other imports are the same)
import { PhaseSix } from "@/components/treatment/PhaseSix";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { PersonalizedVideoPlayer } from "@/components/treatment/PersonalizedVideoPlayer";
import SUDSScale from "@/components/SUDSScale";

// ... (interfaces are the same)

const Treatment2 = () => {
  // ... (all state and hooks are the same)
  const [midSessionSuds, setMidSessionSuds] = useState<number | null>(null);

  // ... (all useEffects and handlers are the same)
  const handlePhase6Complete = useCallback((finalSuds: number) => { /* Identical to T1 */ }, [completeTreatment, sessionSuds]);

  // vvv THIS IS THE CORRECTED FUNCTION vvv
  const getPhaseTitle = () => {
    if (currentProcessingStep === 0) return "Practice Session";
    if (currentProcessingStep !== null && currentProcessingStep >= 1 && currentProcessingStep < 4) return `Processing Phase ${currentProcessingStep}`;
    if (currentProcessingStep === 4) return experienceMode === 'audio' ? "Guided Narrations (Audio)" : "Visual Narratives (Video)";
    if (currentProcessingStep === 4.5) return "Mid-Session Checkpoint";
    if (currentProcessingStep === 5) return "Reverse Integration";
    if (currentProcessingStep === 6) return "Final SUDS Rating";
    return "Loading Phase..."; // This return was missing
  };
  // ^^^ END OF CORRECTION ^^^

  if (isLoadingPage) { return <div>Loading...</div>; }

  return (
    // ... (The entire return JSX is unchanged)
    // It will now work correctly because getPhaseTitle returns a string.
    <div className="min-h-screen">
      {/* ... */}
    </div>
  );
};
export default Treatment2;
