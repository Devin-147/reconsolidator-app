// FILE: src/pages/ActivationPage.tsx
// UPGRADED: Adds framer-motion animations and "glass-card" styling.

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { motion } from 'framer-motion'; // <<< 1. IMPORT motion
import { Info, ArrowRight, Mic, Square, AlertCircle, PartyPopper, Upload, XCircle, Sparkles, Lock } from "lucide-react";
import { NeuralSpinner } from "@/components/ui/NeuralSpinner";
import SUDSScale from "../components/SUDSScale";
import { useRecording } from "@/contexts/RecordingContext";
import { MemoryControls } from "../components/MemoryControls";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { PredictionErrorSelector, type PredictionError } from "@/components/PredictionErrorSelector"; 
import { NeutralMemoryCollector } from "@/components/treatment/NeutralMemoryCollector";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTargetRecording } from "@/hooks/useTargetRecording";
import { formatTime } from "@/utils/formatTime";

// --- vvv 2. DEFINE ANIMATION VARIANTS vvv ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};
// --- ^^^ END OF ANIMATION VARIANTS ^^^ ---

const ActivationPage = () => {
  const navigate = useNavigate();
  // ... (All your existing state and hooks are unchanged)
  const { userEmail, accessLevel } = useAuth();
  const isPremium = accessLevel === 'premium_lifetime';
  const [isSaving, setIsSaving] = useState(false);
  const [isCalibrationComplete, setIsCalibrationComplete] = useState(false);
  
  // ... (All your existing handler functions are unchanged)
  const handleFinishCalibration = async () => { /* ... */ };
  const startTreatment = () => { /* ... */ };

  // ... (isSaving and isCalibrationComplete return JSX is unchanged) ...

  return (
    // --- vvv 3. APPLY THE ANIMATION CONTAINER AND NEW STYLING vvv ---
    <motion.div 
      className="w-full space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h2 
        className="text-xl font-semibold text-center text-primary mb-6"
        variants={itemVariants}
      >
        Calibration for Treatment {currentTreatmentNumber}
      </motion.h2>

      <motion.section variants={itemVariants} className="space-y-4 p-4 rounded-lg glass-card">
        <h3 className="text-lg font-semibold flex items-center text-white">1. Re-activate & Record Target Event</h3>
        {/* ... (rest of this section's JSX is unchanged) ... */}
      </motion.section>

      <motion.section variants={itemVariants} className="space-y-4 p-4 rounded-lg glass-card">
        <h3 className="text-lg font-semibold text-white">2. Rate Current Distress (SUDS)</h3>
        {/* ... (rest of this section's JSX is unchanged) ... */}
      </motion.section>

      <motion.section variants={itemVariants} className={`space-y-4 p-4 rounded-lg glass-card ${needsToRecordM1M2 ? 'border-yellow-500/50' : 'border-transparent'}`}>
        <h3 className="text-lg font-semibold text-white">3. Positive Context Memories (Audio)</h3>
        {/* ... (rest of this section's JSX is unchanged) ... */}
      </motion.section>
      
      <motion.section variants={itemVariants} className={`space-y-4 p-4 rounded-lg glass-card border ${isPremium ? 'border-yellow-500/50' : 'border-transparent'}`}>
        <h3 className="text-lg font-semibold flex items-center text-white">
          4. Personalized Visuals (Premium)
          {/* ... (icon logic is unchanged) ... */}
        </h3>
        {/* ... (rest of this section's JSX is unchanged) ... */}
      </motion.section>

      <motion.section variants={itemVariants}>
        <div className="p-4 rounded-lg glass-card">
          <h3 className="text-lg font-semibold text-white">5. List Neutral Memories</h3>
          <NeutralMemoryCollector neutralMemories={neutralMemories} setNeutralMemories={setNeutralMemories} />
        </div>
      </motion.section>
      
      <motion.section variants={itemVariants} className="p-4 rounded-lg glass-card">
        <h3 className="text-lg font-semibold text-white mb-4">6. Select 11 Prediction Errors</h3>
        <PredictionErrorSelector onComplete={handlePredictionErrorsComplete} />
      </motion.section>

      <motion.div variants={itemVariants} className="flex justify-end pt-4">
        <Button onClick={handleFinishCalibration} size="lg">
          Finish Calibration & Prepare Session <ArrowRight className="w-5 h-5 ml-2"/>
        </Button>
      </motion.div>
    </motion.div>
    // --- ^^^ END OF ANIMATION AND STYLING CHANGES ^^^ ---
  );
};
export default ActivationPage;
