// FILE: src/components/AnimatedLogoWithAudio.tsx
// CORRECTED: Adds the new GSAP timeline to create the pulsing glow effect.

import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Button } from '@/components/ui/button'; 
import MyActualLogo from '@/components/MyActualLogo'; 

interface AnimatedLogoWithAudioProps {
  audioUrl?: string | null;
  width?: number | string;
  height?: number | string;
  playButtonText?: string;
  isAnimationActive?: boolean;
  forceIsPlaying: boolean; 
  onTogglePlay: () => void; 
  animationVariant: number;
}

const zapSequences: string[][] = [
  ['s1','s3','s4'],['s2','s4','s5'],['s3','s1','s2'],['s4','s5','s3'],['s5','s2','s1'],
  ['s0','s1','s2'],['s5','s4','s3'],['s1','s2','s3'],['s0','s2','s4'],['s2','s3','s5'],['s1','s5','s3']
];

const AnimatedLogoWithAudio: React.FC<AnimatedLogoWithAudioProps> = ({
  audioUrl, width = 180, height = 180, 
  playButtonText = "Play Narration", isAnimationActive = false,
  forceIsPlaying, onTogglePlay,
  animationVariant
}) => {
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const svgContainerRef = useRef<HTMLDivElement | null>(null); 
  
  const knightRiderTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const zapAnimationTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const particleTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const glowTimelineRef = useRef<gsap.core.Timeline | null>(null); // <<< NEW: Ref for the glow timeline
  const svgElementRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (svgContainerRef.current) { svgElementRef.current = svgContainerRef.current.firstChild as SVGSVGElement | null; }
  }, []);
  
  // --- vvv NEW: Effect for the pulsing glow animation vvv ---
  useEffect(() => {
    if (!isAnimationActive) return;
    const svgElement = svgElementRef.current;
    if (!svgElement) return;

    // Target the blur element within the SVG filter we created
    const glowBlur = svgElement.querySelector('#neonGlow feGaussianBlur');
    glowTimelineRef.current?.kill();

    if (glowBlur) {
      // Create a GSAP timeline that pulses the blurriness (stdDeviation)
      const glowTl = gsap.timeline({ repeat: -1, yoyo: true });
      glowTl.to(glowBlur, {
        attr: { stdDeviation: 25 }, // Pulse out to a wider glow
        duration: 2.5,
        ease: 'power1.inOut',
      }).to(glowBlur, {
        attr: { stdDeviation: 15 }, // Pulse back in to the base glow
        duration: 2.5,
        ease: 'power1.inOut',
      });
      glowTimelineRef.current = glowTl;
    }

    return () => { glowTimelineRef.current?.kill(); };
  }, [isAnimationActive]);
  // --- ^^^ END NEW EFFECT ^^^ ---

  // (This useEffect for Knight Rider is unchanged)
  useEffect(() => {
    if (!isAnimationActive) return;
    const svgElement = svgElementRef.current; if (!svgElement) return;
    const scanBlip = svgElement.querySelector('#scanBlip');
    const knightRiderPathElement = svgElement.querySelector('#Knight-rider');
    knightRiderTimelineRef.current?.kill();
    if (scanBlip && knightRiderPathElement) {
        gsap.set(knightRiderPathElement, { opacity: 0.9 });
        gsap.set(scanBlip, { opacity: 1 });
        const blipTl = gsap.timeline({ paused: true, repeat: -1 });
        knightRiderTimelineRef.current = blipTl;
        const scanPathX_Start = 453; const scanPathWidth = 304;
        const blipWidth = Math.floor(scanPathWidth * 0.20);
        gsap.set(scanBlip, { attr: { x: scanPathX_Start, width: blipWidth } });
        blipTl.to(scanBlip, { attr: { x: scanPathX_Start + scanPathWidth - blipWidth }, duration: 0.6, ease: "sine.inOut", yoyo: true, repeatDelay: 0.15 });
    }
    return () => { knightRiderTimelineRef.current?.kill(); };
  }, [isAnimationActive]); 

  // (This useEffect for zaps and particles is unchanged)
  useEffect(() => {
    if (!isAnimationActive) return;
    const svgElement = svgElementRef.current; if (!svgElement || animationVariant === undefined) return;
    zapAnimationTimelineRef.current?.kill();
    particleTimelineRef.current?.kill();
    const zapTl = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 1.5 });
    zapAnimationTimelineRef.current = zapTl;
    const currentZapSequence = zapSequences[animationVariant - 1] || zapSequences[0];
    currentZapSequence.forEach((className, index) => {
        const elements = Array.from(svgElement.querySelectorAll(`.${className}`)).filter(el => el.id !== 'Inner-background');
        if (elements.length > 0) {
            zapTl.fromTo(elements, { opacity: 1 }, { opacity: 0.2, duration: 0.4, yoyo: true, repeat: 1, stagger: 0.1 }, index * 0.3);
        }
    });
    const particleTl = gsap.timeline({ paused: true, repeat: -1 });
    particleTimelineRef.current = particleTl;
    const particles = svgElement.querySelectorAll('.particle');
    if (particles.length > 0) {
        particleTl.to(particles, {
            opacity: () => Math.random() * 0.9, scale: () => Math.random() * 1.5,
            duration: 1, ease: 'power1.inOut', yoyo: true,
            stagger: { each: 0.05, from: "random", repeat: -1, yoyo: true }
        });
    }
    return () => { 
        zapAnimationTimelineRef.current?.kill();
        particleTimelineRef.current?.kill(); 
    };
  }, [isAnimationActive, animationVariant]);

  // <<< UPGRADED: The master playback controller now also handles the glow >>>
  useEffect(() => {
    if (forceIsPlaying) {
      audioRef.current?.play().catch(console.error);
      if (isAnimationActive) {
        // When playing, we resume the glow from its current state
        glowTimelineRef.current?.resume();
        knightRiderTimelineRef.current?.play();
        zapAnimationTimelineRef.current?.play();
        particleTimelineRef.current?.play();
      }
    } else {
      audioRef.current?.pause();
      if (isAnimationActive) {
        // When pausing, we also pause the glow animation
        glowTimelineRef.current?.pause();
        knightRiderTimelineRef.current?.restart().pause();
        zapAnimationTimelineRef.current?.restart().pause();
        particleTimelineRef.current?.restart().pause();
      }
    }
  }, [forceIsPlaying, isAnimationActive]);

  // (The final two useEffects for audio are unchanged)
  useEffect(() => { /* ... */ }, [audioUrl]);
  useEffect(() => { /* ... */ }, [onTogglePlay]);

  return (
    // (The return JSX is unchanged)
    <div className="flex flex-col items-center space-y-4 my-2">
      <div ref={svgContainerRef} style={{ width, height, overflow: 'visible' }}>
        <MyActualLogo width="100%" height="100%" /> 
      </div>
      <audio ref={audioRef} /> 
      {audioUrl && (
        <Button onClick={onTogglePlay} disabled={!isAudioLoaded} variant="secondary" className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold">
          {forceIsPlaying ? `Pause: ${playButtonText}` : `Play: ${playButtonText}`}
        </Button>
      )}
      {audioUrl && !isAudioLoaded && <p className="text-sm text-primary animate-pulse mt-2">Preparing audio...</p>}
    </div>
  );
};

export default AnimatedLogoWithAudio;
