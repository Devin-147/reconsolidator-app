// FILE: src/components/AnimatedLogoWithAudio.tsx
// FINAL, ROBUST ATTEMPT to guarantee constant, visible Knight Rider blip.

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
}

const zapSequences: string[][] = [
  ['s1','s3','s4'],['s2','s4','s5'],['s3','s1','s2'],['s4','s5','s3'],['s5','s2','s1'],
  ['s0','s1','s2'],['s5','s4','s3'],['s1','s2','s3'],['s0','s2','s4'],['s2','s3','s5'],['s1','s5','s3']
];

const AnimatedLogoWithAudio: React.FC<AnimatedLogoWithAudioProps> = ({
  audioUrl, width = 180, height = 180, 
  playButtonText = "Play Narration", animationVariant, 
  forceIsPlaying, onTogglePlay
}) => {
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const svgContainerRef = useRef<HTMLDivElement | null>(null); 
  
  const knightRiderTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const zapTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const particleTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const svgElementRef = useRef<SVGSVGElement | null>(null);

  // Initialize timelines on mount
  useEffect(() => {
    if (svgContainerRef.current) {
      svgElementRef.current = svgContainerRef.current.firstChild as SVGSVGElement | null;
    }
    
    // --- Create KNIGHT RIDER Timeline ---
    knightRiderTimelineRef.current?.kill();
    const blipTl = gsap.timeline({ paused: true });
    knightRiderTimelineRef.current = blipTl;

    const scanBlip = svgElementRef.current?.querySelector('#scanBlip');
    const knightRiderPathElement = svgElementRef.current?.querySelector('#Knight-rider');

    if (scanBlip && knightRiderPathElement) {
        gsap.set(knightRiderPathElement, { opacity: 0.9 });
        const scanPathX_Start = 453; const scanPathWidth = 304;
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
    }
    
    // --- Create ZAP and PARTICLE Timelines ---
    zapTimelineRef.current?.kill();
    particleTimelineRef.current?.kill();
    zapAnimationTimelineRef.current = gsap.timeline({ paused: true });
    particleTimelineRef.current = gsap.timeline({ paused: true, repeat: -1 });

    return () => {
      knightRiderTimelineRef.current?.kill();
      zapTimelineRef.current?.kill();
      particleTimelineRef.current?.kill();
    };
  }, []); // Runs once on mount

  // Re-build Zap/Particle animations ONLY when variant changes
  useEffect(() => {
    const svgElement = svgElementRef.current;
    if (!svgElement || animationVariant === undefined) return;
    
    const zapTl = zapAnimationTimelineRef.current;
    const particleTl = particleTimelineRef.current;
    if (!zapTl || !particleTl) return;

    zapTl.clear(); // Clear previous zap tweens
    particleTl.clear(); // Clear previous particle tweens

    const currentZapSequence = zapSequences[animationVariant - 1] || zapSequences[0];
    let zapTime = 0;
    currentZapSequence.forEach(className => {
        const elements = Array.from(svgElement.querySelectorAll(`.${className}`)).filter(el => el.id !== 'Inner-background');
        if (elements.length > 0) { zapTl.fromTo(elements, { opacity: 1 }, { opacity: 0.2, duration: 0.4, yoyo: true, repeat: 1, stagger: 0.1 }, zapTime); }
        zapTime += 0.3;
    });
    zapTl.repeat(-1).repeatDelay(1.5);
    
    const particles = svgElement.querySelectorAll('.particle');
    if (particles.length > 0) {
        particleTl.to(particles, {
            opacity: () => Math.random() * 0.9, scale: () => Math.random() * 1.5,
            duration: 1, ease: 'power1.inOut', yoyo: true,
            stagger: { each: 0.05, from: "random", repeat: -1, yoyo: true }
        });
    }
  }, [animationVariant]);

  // Master Play/Pause Control
  useEffect(() => {
    const timelines = [knightRiderTimelineRef.current, zapAnimationTimelineRef.current, particleTimelineRef.current];
    if (forceIsPlaying) {
      timelines.forEach(tl => tl?.play());
      audioRef.current?.play().catch(console.error);
    } else {
      timelines.forEach(tl => tl?.pause());
      audioRef.current?.pause();
    }
  }, [forceIsPlaying]);

  // Audio Event Handlers
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
    return () => { audioElement.removeEventListener('canplaythrough', handleCanPlayThrough); audioElement.removeEventListener('ended', handleAudioEnded); };
  }, [onTogglePlay]);

  return (
    <div className="flex flex-col items-center space-y-4 my-2">
      <div ref={svgContainerRef} style={{ width: typeof width === 'number' ? `${width}px` : width, height: typeof height === 'number' ? `${height}px` : height, overflow: 'visible' }}>
        <MyActualLogo width="100%" height="100%" /> 
      </div>
      <audio ref={audioRef} /> 
      {audioUrl && (
        <Button onClick={onTogglePlay} disabled={!isAudioLoaded} variant="secondary" className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold">
          {forceIsPlaying ? `Pause: ${playButtonText}` : `Play: ${playButtonText}`}
        </Button>
      )}
    </div>
  );
};
export default AnimatedLogoWithAudio;