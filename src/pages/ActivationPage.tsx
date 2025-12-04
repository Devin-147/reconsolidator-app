// FILE: src/pages/ActivationPage.tsx
// REFACTORED: Cleaned up with AnimatedSection component.

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { motion, Variants } from 'framer-motion';
import { Info, ArrowRight, /*...other icons...*/ } from "lucide-react";
import { AnimatedSection } from "@/components/treatment/AnimatedSection"; // <<< IMPORT
// ... (all other imports are the same)

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants: Variants = { // Keep this for the title and button
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

const ActivationPage = () => {
  // ... (All your state and handler functions remain exactly the same) ...
  const navigate = useNavigate();
  const { treatmentNumber: treatmentNumberString } = useParams<{ treatmentNumber: string }>();
  const currentTreatmentNumber = parseInt(treatmentNumberString || "1", 10);
  const [sessionSuds, setSessionSuds] = useState<number>(0);
  const needsToRecordM1M2 = currentTreatmentNumber === 1;
  const isPremium = true; // Example
  // ... etc.

  // ... (isSaving and isCalibrationComplete returns are the same) ...

  return (
    <motion.div 
      className="w-full space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h2 variants={itemVariants} className="text-xl font-semibold text-center text-primary mb-6">
        Calibration for Treatment {currentTreatmentNumber}
      </motion.h2>

      <AnimatedSection className="space-y-4">
        <h3 className="text-lg font-semibold text-white">1. Re-activate & Record Target Event</h3>
        {/* ... (Your JSX for the recorder button and transcript) ... */}
      </AnimatedSection>

      <AnimatedSection className="space-y-4">
        <h3 className="text-lg font-semibold text-white">2. Rate Current Distress (SUDS)</h3>
        <SUDSScale initialValue={sessionSuds} onValueChange={() => {}} />
      </AnimatedSection>

      <AnimatedSection className={`space-y-4 ${needsToRecordM1M2 ? 'border-yellow-500/50' : 'border-transparent'}`}>
        <h3 className="text-lg font-semibold text-white">3. Positive Context Memories (Audio)</h3>
        {/* ... (Your JSX for the two MemoryControls) ... */}
      </AnimatedSection>
      
      <AnimatedSection className={`space-y-4 border ${isPremium ? 'border-yellow-500/50' : 'border-transparent'}`}>
        <h3 className="text-lg font-semibold text-white">4. Personalized Visuals (Premium)</h3>
        {/* ... (Your JSX for the selfie uploader/upsell) ... */}
      </AnimatedSection>

      <AnimatedSection>
        <h3 className="text-lg font-semibold text-white mb-2">5. List Neutral Memories</h3>
        <NeutralMemoryCollector neutralMemories={[]} setNeutralMemories={() => {}} />
      </AnimatedSection>
      
      <AnimatedSection>
        <h3 className="text-lg font-semibold text-white mb-4">6. Select 11 Prediction Errors</h3>
        <PredictionErrorSelector onComplete={() => {}} />
      </AnimatedSection>

      <motion.div variants={itemVariants} className="flex justify-end pt-4">
        <Button onClick={() => {}} size="lg">
          Finish Calibration & Prepare Session <ArrowRight />
        </Button>
      </motion.div>
    </motion.div>
  );
};
export default ActivationPage;
