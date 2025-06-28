// FILE: src/components/AnimatedLogoWithAudio.tsx
// Corrected logic with three separate timelines for Base, Zap, and Particles.
// Inner background is now static. Knight Rider blip is constant.

import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { toast } from "sonner"; 
import { Button } from '@/components/ui/button'; 
import MyActualLogo from '@/components/MyActualLogo'; 

interface AnimatedLogoWithAudioProps {
  audioUrl: string | null;
  onPlaybackEnd?: () => void;
  width?: number | string;
  height?: number | string;
  playButtonText?: string;
  showLoadingText?: boolean;
  animationVariant: number; 
  forceIsPlaying: boolean; 
  onTogglePlay: () => void; 
}

const zapSequences: string[][] = [
  ['s1','s3','s4','s5','s2','s0','s1','s3','s4','s5','s2','s1','s3','s4','s5','s0','s2','s1','s3','s4'],
  ['s2','s4','s5','s1','s3','s0','s2','s4','s5','s1','s3','s2','s4','s5','s1','s0','s3','s2','s4','s5'],
  ['s3','s1','s2','s4','s5','s0','s3','s1','s2','s4','s5','s3','s1','s2','s4','s0','s5','s3','s1','s2'],
  ['s4','s5','s3','s2','s1','s0','s4','s5','s3','s2','s1','s4','s5','s3','s2','s0','s1','s4','s5','s3'],
  ['s5','s2','s1','s3','s4','s0','s5','s2','s1','s3','s4','s5','s2','s1','s3','s0','s4','s5','s2','s1'],
  ['s0','s1','s2','s3','s4','s5','s0','s1','s2','s3','s4','s5','s0','s1','s2','s3','s4','s5','s0','s1'],
  ['s5','s4','s3','s2','s1','s0','s5','s4','s3','s2','s1','s0','s5','s4','s3','s2','s1','s0','s5','s4'],
  ['s1','s2','s1','s3','s1','s4','s1','s5','s1','s0','s1','s2','s1','s3','s1','s4','s1','s5','s1','s0'],
  ['s0','s2','s0','s5','s0','s3','s0','s4','s0','s1','s0','s2','s0','s5','s0','s3','s0','s4','s0','s1'],
  ['s2','s3','s4','s5','s1','s0','s2','s3','s4','s5','s1','s0','s2','s3','s4','s5','s1','s0','s2','s3'],
  ['s1','s5','s3','s0','s4','s2','s1','s5','s3','s0','s4','s2','s1','s5','s3','s0','s4','s2','s1','s5']
];

const AnimatedLogoWithAudio: React.FC<AnimatedLogoWithAudioProps> = ({
  audioUrl, onPlaybackEnd, width = 180, height = 180, 
  playButtonText = "Play Narration", showLoadingText = false, animationVariant, 
  forceIsPlaying, onTogglePlay
}) => {
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const svgContainerRef = useRef<HTMLDivElement | null>(null); 
  
  const baseTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const zapTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const particleTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const svgElementRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (svgContainerRef.current) {
      svgElementRef.current = svgContainerRef.current.firstChild as SVGSVGElement | null;
    }
  }, []);

  // Effect to build/re-build ALL timelines when variant changes
  useEffect(() => {
    const svgElement = svgElementRef.current;
    if (!svgElement || typeof svgElement.querySelector !== 'function' || animationVariant === undefined) return;
    
    // Kill all previous timelines
    baseTimelineRef.current?.kill();
    zapTimelineRef.current?.kill();
    particleTimelineRef.current?.kill();

    // --- Create BASE Timeline (Knight Rider ONLY) ---
    const baseTl = gsap.timeline({ paused: true });
    baseAnimationTimelineRef.current = baseTl;
    const scanBlip = svgElement.querySelector('#scanBlip');
    const knightRiderPathElement = svgElement.querySelector('#Knight-rider');
    if (scanBlip && knightRiderPathElement) {
        gsap.set(knightRiderPathElement, { opacity: 1 });
        const scanPathX_Start = 453; const scanPathWidth = 304;
        const blipWidth = Math.floor(scanPathWidth * 0.20);
        const blipScanStartPos = scanPathX_Start;
        const blipScanEndPos = scanPathX_Start + scanPathWidth - blipWidth;
        gsap.set(scanBlip, { attr: { x: blipScanStartPos, width: blipWidth } });
        baseTl.to(scanBlip, { attr: { x: blipScanEndPos }, duration: 0.6, ease: "none", yoyo: true, repeat: -1 });
    }

    // --- Create ZAP Timeline (Internal opacity pulses) ---
    const zapTl = gsap.timeline({ paused: true });
    zapAnimationTimelineRef.current = zapTl;
    const currentZapSequence = zapSequences[animationVariant - 1];
    if (currentZapSequence) {
        let zapTime = 0;
        currentZapSequence.forEach((className) => {
            const filteredElements = Array.from(svgElement.querySelectorAll(`.${className}`)).filter(el => el.id !== 'Inner-background' && el.id !== 'Knight-rider' && el.id !== 'scanBlip');
            if (filteredElements.length > 0) {
                zapTl.fromTo(filteredElements, { opacity: 1 }, { opacity: 0.4, duration: 1.0, yoyo: true, repeat: 1, stagger: 0.05 }, zapTime);
            }
            zapTime += 0.2; // Tightly packed zaps
        });
        zapTl.duration(10); // Stretch the whole sequence over 10 seconds before it repeats
    }

    // --- Create PARTICLE Timeline (External starfield) ---
    const particleTl = gsap.timeline({ paused: true });
    particleTimelineRef.current = particleTl;
    const particles = svgElement.querySelectorAll('.particle');
    if (particles.length > 0) {
        particleTl.fromTo(particles, 
            { opacity: 0, scale: 0 }, 
            { 
                opacity: () => Math.random() * 0.7 + 0.2, // Random opacity
                scale: () => Math.random() * 1 + 0.5,   // Random scale
                duration: 2, 
                ease: 'power1.inOut',
                yoyo: true,
                repeat: -1,
                stagger: {
                    each: 0.1,
                    from: "random",
                    repeat: -1,
                    yoyo: true
                }
            }
        );
    }

    return () => { // Cleanup
      baseAnimationTimelineRef.current?.kill();
      zapAnimationTimelineRef.current?.kill();
      particleTimelineRef.current?.kill();
    }
  }, [animationVariant]);

  // Master Play/Pause Control based on forceIsPlaying prop from parent
  useEffect(() => {
    const masterPlay = () => {
      baseAnimationTimelineRef.current?.play(0);
      zapAnimationTimelineRef.current?.play(0);
      particleTimelineRef.current?.play(0);
    };
    const masterPause = () => {
      baseAnimationTimelineRef.current?.pause();
      zapAnimationTimelineRef.current?.pause();
      particleTimelineRef.current?.pause();
    };

    const audioElement = audioRef.current;
    if (!audioElement) return;

    if (forceIsPlaying) {
      masterPlay();
      if (audioElement.paused) audioElement.play().catch(console.error);
    } else {
      masterPause();
      if (!audioElement.paused) audioElement.pause();
    }
  }, [forceIsPlaying]);

  // Audio URL and Event Listener handling (no GSAP logic here)
  useEffect(() => {
    const audioElement = audioRef.current; if (!audioElement) return;
    if (audioUrl) { if (audioElement.src !== audioUrl) { audioElement.src = audioUrl; setIsAudioLoaded(false); } } 
    else { audioElement.src = ""; setIsAudioLoaded(false); }
  }, [audioUrl]);

  useEffect(() => {
    const audioElement = audioRef.current; if (!audioElement) return;
    const handleCanPlayThrough = () => setIsAudioLoaded(true);
    const handleAudioEnded = () => { if (onTogglePlay) onTogglePlay(); };
    audioElement.addEventListener('canplaythrough', handleCanPlayThrough);
    audioElement.addEventListener('ended', handleAudioEnded);
    return () => { 
      audioElement.removeEventListener('canplaythrough', handleCanPlayThrough);
      audioElement.removeEventListener('ended', handleAudioEnded);
    };
  }, [onTogglePlay]);

  return (
    <div className="flex flex-col items-center space-y-4 my-4">
      <div ref={svgContainerRef} style={{ width: typeof width === 'number' ? `${width}px` : width, height: typeof height === 'number' ? `${height}px` : height, overflow: 'visible' }}>
        <MyActualLogo width="100%" height="100%" /> 
      </div>
      <audio ref={audioRef} /> 
      {audioUrl && (
        <Button onClick={onTogglePlay} disabled={!isAudioLoaded} variant="secondary" className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold shadow-lg px-6 py-3 text-base rounded-md">
          {forceIsPlaying ? 'Pause AI Narration' : playButtonText}
        </Button>
      )}
      {showLoadingText && audioUrl && !isAudioLoaded && <p className="text-sm text-primary animate-pulse mt-2">Preparing audio...</p>}
    </div>
  );
};
export default AnimatedLogoWithAudio;