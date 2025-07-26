// FILE: src/components/AnimatedLogoWithAudio.tsx
// MODIFIED TO SUPPORT A DEFAULT "ACTIVE" ANIMATION STATE

import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Button } from '@/components/ui/button'; 
import MyActualLogo from '@/components/MyActualLogo'; 

interface AnimatedLogoWithAudioProps {
  audioUrl: string | null;
  width?: number | string;
  height?: number | string;
  playButtonText?: string;
  animationVariant: number; 
  forceIsPlaying: boolean; 
  onTogglePlay: () => void;
  // New optional prop to control the default idle animation state
  isAnimationActive?: boolean;
}

const zapSequences: string[][] = [
  ['s1','s3','s4'],['s2','s4','s5'],['s3','s1','s2'],['s4','s5','s3'],['s5','s2','s1'],
  ['s0','s1','s2'],['s5','s4','s3'],['s1','s2','s3'],['s0','s2','s4'],['s2','s3','s5'],['s1','s5','s3']
];

const AnimatedLogoWithAudio: React.FC<AnimatedLogoWithAudioProps> = ({
  audioUrl, width = 180, height = 180, 
  playButtonText = "Play Narration", animationVariant, 
  forceIsPlaying, onTogglePlay, isAnimationActive = false
}) => {
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const svgContainerRef = useRef<HTMLDivElement | null>(null); 
  
  const knightRiderTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const zapAnimationTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const particleTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const svgElementRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (svgContainerRef.current) {
      svgElementRef.current = svgContainerRef.current.firstChild as SVGSVGElement | null;
    }
  }, []);

  // Knight Rider (Blip) Animation Setup
  useEffect(() => {
    const svgElement = svgElementRef.current;
    if (!svgElement) return;
    
    knightRiderTimelineRef.current?.kill();
    const scanBlip = svgElement.querySelector('#scanBlip');
    const knightRiderPathElement = svgElement.querySelector('#Knight-rider');

    if (scanBlip && knightRiderPathElement) {
      const blipTl = gsap.timeline({ paused: true });
      knightRiderTimelineRef.current = blipTl;

      gsap.set(knightRiderPathElement, { opacity: 0.9 });
      const scanPathX_Start = 453;
      const scanPathWidth = 304;
      const blipWidth = Math.floor(scanPathWidth * 0.20);
      gsap.set(scanBlip, { attr: { x: scanPathX_Start, width: blipWidth } });
      
      blipTl.to(scanBlip, {
        attr: { x: scanPathX_Start + scanPathWidth - blipWidth },
        duration: 0.6,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        repeatDelay: 0.15
      });

      // --- NEW LOGIC ---
      // Control visibility and play state based on active status
      if (isAnimationActive) {
        gsap.set(scanBlip, { opacity: 1 });
        blipTl.play();
      } else {
        gsap.set(scanBlip, { opacity: 0 });
        blipTl.pause();
      }
    }
    
    return () => { knightRiderTimelineRef.current?.kill(); };
  }, [isAnimationActive]); // Rerun this effect if active status changes

  // Zap and Particle Animation Setup (only runs when variant changes)
  useEffect(() => {
    const svgElement = svgElementRef.current;
    if (!svgElement || animationVariant === undefined) return;
    
    zapAnimationTimelineRef.current?.kill();
    particleTimelineRef.current?.kill();

    const zapTl = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 1.5 });
    zapAnimationTimelineRef.current = zapTl;

    const currentZapSequence = zapSequences[animationVariant - 1] || zapSequences[0];
    let zapTime = 0;
    currentZapSequence.forEach(className => {
      const elements = Array.from(svgElement.querySelectorAll(`.${className}`)).filter(el => el.id !== 'Inner-background');
      if (elements.length > 0) {
        zapTl.fromTo(elements, { opacity: 1 }, { opacity: 0.2, duration: 0.4, yoyo: true, repeat: 1, stagger: 0.1 }, zapTime);
      }
      zapTime += 0.3;
    });
    
    const particleTl = gsap.timeline({ paused: true, repeat: -1 });
    particleTimelineRef.current = particleTl;
    const particles = svgElement.querySelectorAll('.particle');
    if (particles.length > 0) {
      particleTl.to(particles, {
        opacity: () => Math.random() * 0.9,
        scale: () => Math.random() * 1.5,
        duration: 1, ease: 'power1.inOut', yoyo: true,
        stagger: { each: 0.05, from: "random", repeat: -1, yoyo: true }
      });
    }

    return () => { 
      zapAnimationTimelineRef.current?.kill();
      particleTimelineRef.current?.kill(); 
    };
  }, [animationVariant]);

  // Master Play/Pause Controller
  useEffect(() => {
    // Play animations only when explicitly forced (i.e., audio is playing)
    if (forceIsPlaying) {
      // The blip is already handled by isAnimationActive, but we ensure it plays here too
      knightRiderTimelineRef.current?.play();
      zapAnimationTimelineRef.current?.play();
      particleTimelineRef.current?.play();
      audioRef.current?.play().catch(console.error);
    } else {
      // If not forced to play, pause everything EXCEPT the Knight Rider blip if it's supposed to be idle
      zapAnimationTimelineRef.current?.pause();
      particleTimelineRef.current?.pause();
      audioRef.current?.pause();
      
      // Let the idle animation continue if active and not being forced to play
      if (isAnimationActive) {
        knightRiderTimelineRef.current?.play();
      } else {
        knightRiderTimelineRef.current?.pause();
      }
    }
  }, [forceIsPlaying, isAnimationActive]);

  // Audio URL and Loading Logic
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;
    if (audioUrl) {
      if (audioElement.src !== audioUrl) {
        audioElement.src = audioUrl;
        setIsAudioLoaded(false);
      }
    } else {
      audioElement.src = "";
      setIsAudioLoaded(false);
    }
  }, [audioUrl]);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;
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
    <div className="flex flex-col items-center space-y-4 my-2">
      <div
        ref={svgContainerRef}
        style={{ width: typeof width === 'number' ? `${width}px` : width, height: typeof height === 'number' ? `${height}px` : height, overflow: 'visible' }}
      >
        <MyActualLogo width="100%" height="100%" /> 
      </div>
      <audio ref={audioRef} /> 
      
      {audioUrl && (
        <Button
          onClick={onTogglePlay}
          disabled={!isAudioLoaded}
          variant="secondary"
          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold mt-2"
        >
          {isAudioLoaded ? (forceIsPlaying ? `Pause: ${playButtonText}` : `Play: ${playButtonText}`) : 'Loading Audio...'}
        </Button>
      )}
    </div>
  );
};

export default AnimatedLogoWithAudio;