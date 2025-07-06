// FILE: src/components/AnimatedLogoWithAudio.tsx
// Corrects animation control logic to ensure only one logo animates at a time.

import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Button } from '@/components/ui/button'; 
import MyActualLogo from '@/components/MyActualLogo'; 

interface AnimatedLogoWithAudioProps {
  audioUrl: string | null;
  width?: number | string;
  height?: number | string;
  playButtonText?: string;
  showLoadingText?: boolean;
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
  playButtonText = "Play Narration", showLoadingText = false, animationVariant, 
  forceIsPlaying, onTogglePlay
}) => {
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const svgContainerRef = useRef<HTMLDivElement | null>(null); 
  
  const knightRiderTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const zapTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const particleTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const svgElementRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (svgContainerRef.current) { svgElementRef.current = svgContainerRef.current.firstChild as SVGSVGElement | null; }
  }, []);

  // This effect runs ONCE to create the timelines.
  useEffect(() => {
    knightRiderTimelineRef.current = gsap.timeline({ paused: true });
    zapAnimationTimelineRef.current = gsap.timeline({ paused: true });
    particleTimelineRef.current = gsap.timeline({ paused: true });

    return () => {
      knightRiderTimelineRef.current?.kill();
      zapAnimationTimelineRef.current?.kill();
      particleTimelineRef.current?.kill();
    };
  }, []); 

  // This effect re-builds the animations when the variant changes.
  useEffect(() => {
    const svgElement = svgElementRef.current; 
    if (!svgElement || animationVariant === undefined) return;
    
    const blipTl = knightRiderTimelineRef.current;
    const zapTl = zapAnimationTimelineRef.current;
    const particleTl = particleTimelineRef.current;

    if (!blipTl || !zapTl || !particleTl) return;

    // Clear previous animations from timelines before adding new ones
    blipTl.clear();
    zapTl.clear();
    particleTl.clear();

    // 1. Re-build Knight Rider Animation
    const scanBlip = svgElement.querySelector('#scanBlip');
    const knightRiderPathElement = svgElement.querySelector('#Knight-rider');
    if (scanBlip && knightRiderPathElement) {
        gsap.set(knightRiderPathElement, { opacity: 0.9 });
        const scanPathX_Start = 453; const scanPathWidth = 304;
        const blipWidth = Math.floor(scanPathWidth * 0.20);
        gsap.set(scanBlip, { attr: { x: scanPathX_Start, width: blipWidth } });
        blipTl.to(scanBlip, { attr: { x: scanPathX_Start + scanPathWidth - blipWidth }, duration: 0.6, ease: "sine.inOut", yoyo: true, repeat: -1, repeatDelay: 0.15 });
    }
    
    // 2. Re-build Zap Animation
    const currentZapSequence = zapSequences[animationVariant - 1] || zapSequences[0];
    let zapTime = 0;
    zapTl.repeat(-1).repeatDelay(1.5);
    currentZapSequence.forEach(className => {
        const elements = Array.from(svgElement.querySelectorAll(`.${className}`)).filter(el => el.id !== 'Inner-background');
        if (elements.length > 0) { zapTl.fromTo(elements, { opacity: 1 }, { opacity: 0.2, duration: 0.4, yoyo: true, repeat: 1, stagger: 0.1 }, zapTime); }
        zapTime += 0.3;
    });

    // 3. Re-build Particle Animation
    const particles = svgElement.querySelectorAll('.particle');
    particleTl.repeat(-1);
    if (particles.length > 0) {
        particleTl.to(particles, {
            opacity: () => Math.random() * 0.9, scale: () => Math.random() * 1.5,
            duration: 1, ease: 'power1.inOut', yoyo: true,
            stagger: { each: 0.05, from: "random", repeat: -1, yoyo: true }
        });
    }
  }, [animationVariant]);

  // Master Play/Pause Control based on forceIsPlaying prop
  useEffect(() => {
    const timelines = [knightRiderTimelineRef.current, zapAnimationTimelineRef.current, particleTimelineRef.current];
    if (forceIsPlaying) {
      timelines.forEach(tl => tl?.play());
      audioRef.current?.play().catch(console.error);
    } else {
      // When pausing, pause and reset the progress of the animations to the beginning.
      timelines.forEach(tl => tl?.pause().progress(0));
      audioRef.current?.pause();
    }
  }, [forceIsPlaying]);

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
    <div className="flex flex-col items-center space-y-4 my-2">
      <div ref={svgContainerRef} style={{ width: typeof width === 'number' ? `${width}px` : width, height: typeof height === 'number' ? `${height}px` : height, overflow: 'visible' }}>
        <MyActualLogo width="100%" height="100%" /> 
      </div>
      <audio ref={audioRef} /> 
      <Button onClick={onTogglePlay} disabled={!isAudioLoaded} variant="secondary" className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold">
        {forceIsPlaying ? `Pause: ${playButtonText}` : `Play: ${playButtonText}`}
      </Button>
    </div>
  );
};
export default AnimatedLogoWithAudio;