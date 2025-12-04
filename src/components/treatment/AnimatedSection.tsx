// FILE: src/components/treatment/AnimatedSection.tsx
import React from 'react';
import { motion, Variants } from 'framer-motion';

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
}

export const AnimatedSection: React.FC<AnimatedSectionProps> = ({ children, className }) => {
  return (
    <motion.section variants={itemVariants} className={`p-4 rounded-lg glass-card ${className}`}>
      {children}
    </motion.section>
  );
};
