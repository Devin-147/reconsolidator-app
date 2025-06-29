// FILE: src/pages/Treatment1.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
// ... all other imports ...
import { PhaseOne } from "@/components/treatment/PhaseOne";
import { PhaseTwo } from "@/components/treatment/PhaseTwo";
import { PhaseThree } from "@/components/treatment/PhaseThree";
// ...
const Treatment1 = () => {
  // ... all state and functions up to handlePhase6Complete ...
  const handlePhase6Complete = useCallback((finalSudsFromPhaseSix: number) => {
    if (completeTreatment && typeof sessionSuds === 'number') {
      completeTreatment(`Treatment ${THIS_TREATMENT_NUMBER}`, finalSudsFromPhaseSix, sessionSuds); // <<< CORRECTED
      let impPct: number | null = null;
      if (sessionSuds > 0) { const calcImp = ((sessionSuds - finalSudsFromPhaseSix) / sessionSuds) * 100; if (!isNaN(calcImp)) impPct = calcImp; }
      setFinalSudsResult(finalSudsFromPhaseSix); setImprovementResult(impPct);
      setShowResultsView(true); toast.success(`T${THIS_TREATMENT_NUMBER} complete!`);
    } else { toast.error(`Error saving results for T${THIS_TREATMENT_NUMBER}.`); }
  }, [completeTreatment, sessionSuds]);
  
  return (
    // ... JSX from last full version, ensuring PhaseOne/Two/Three get response/onResponseChange props ...
    <>
        {currentProcessingStep === 1 && <PhaseOne isCurrentPhase={true} response={phase1Response} onResponseChange={setPhase1Response} onComplete={handlePhase1Complete} />}
        {currentProcessingStep === 2 && <PhaseTwo isCurrentPhase={true} response={phase2Response} onResponseChange={setPhase2Response} onComplete={handlePhase2Complete} />}
        {currentProcessingStep === 3 && <PhaseThree isCurrentPhase={true} response={phase3Response} onResponseChange={setPhase3Response} onComplete={handlePhase3Complete} />}
        {/* ... other phases ... */}
    </>
  );
};
export default Treatment1;