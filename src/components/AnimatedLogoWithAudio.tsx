// FILE: src/components/AnimatedLogoWithAudio.tsx
// Corrected GSAP play/pause logic to ensure yoyo effect works correctly.

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
}

const zapSequences: string[][] = [
  ['s1', 's3', 's4', 's5', 's2', 's0', 's1', 's3', 's4', 's5', 's2', 's1', 's3', 's4', 's5', 's0', 's2', 's1', 's3', 's4'],
  ['s2', 's4', 's5', 's1', 's3', 's0', 's2', 's4', 's5', 's1', 's3', 's2', 's4', 's5', 's1', 's0', 's3', 's2', 's4', 's5'],
  ['s3', 's1', 's2', 's4', 's5', 's0', 's3', 's1', 's2', 's4', 's5', 's3', 's1', 's2', 's4', 's0', 's5', 's3', 's1', 's2'],
  ['s4', 's5', 's3', 's2', 's1', 's0', 's4', 's5', 's3', 's2', 's1', 's4', 's5', 's3', 's2', 's0', 's1', 's4', 's5', 's3'],
  ['s5', 's2', 's1', 's3', 's4', 's0', 's5', 's2', 's1', 's3', 's4', 's5', 's2', 's1', 's3', 's0', 's4', 's5', 's2', 's1'],
  ['s0', 's1', 's2', 's3', 's4', 's5', 's0', 's1', 's2', 's3', 's4', 's5', 's0', 's1', 's2', 's3', 's4', 's5', 's0', 's1'],
  ['s5', 's4', 's3', 's2', 's1', 's0', 's5', 's4', 's3', 's2', 's1', 's0', 's5', 's4', 's3', 's2', 's1', 's0', 's5', 's4'],
  ['s1', 's2', 's1', 's3', 's1', 's4', 's1', 's5', 's1', 's0', 's1', 's2', 's1', 's3', 's1', 's4', 's1', 's5', 's1', 's0'],
  ['s0', 's2', 's0', 's5', 's0', 's3', 's0', 's4', 's0', 's1', 's0', 's2', 's0', 's5', 's0', 's3', 's0', 's4', 's0', 's1'],
  ['s2', 's3', 's4', 's5', 's1', 's0', 's2', 's3', 's4', 's5', 's1', 's0', 's2', 's3', 's4', 's5', 's1', 's0', 's2', 's3'],
  ['s1', 's5', 's3', 's0', 's4', 's2', 's1', 's5', 's3', 's0', 's4', 's2', 's1', 's5', 's3', 's0', 's4', 's2', 's1', 's5']
];

const AnimatedLogoWithAudio: React.FC<AnimatedLogoWithAudioProps> = ({
  audioUrl, onPlaybackEnd, width = 200, height = 200, 
  playButtonText = "Play Narration", showLoadingText = false, animationVariant, 
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const svgContainerRef = useRef<HTMLDivElement | null>(null); 
  
  const baseAnimationTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const zapAnimationTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const svgElementRef = useRef<SVGSVGElement | null>(null);

  // Effect to initialize GSAP timelines ONCE
  useEffect(() => {
    if (!svgContainerRef.current) return;
    svgElementRef.current = svgContainerRef.current.firstChild as SVGSVGElement | null;
    const svgElement = svgElementRef.current;
    if (!svgElement || typeof svgElement.querySelector !== 'function') return;

    // --- Create BASE Timeline ---
    baseAnimationTimelineRef.current?.kill();
    const baseTl = gsap.timeline({ paused: true, repeat: -1 });
    baseAnimationTimelineRef.current = baseTl;
    const innerBackground = svgElement.querySelector('#Inner-background');
    const scanBlip = svgElement.querySelector('#scanBlip');
    const knightRiderPathElement = svgElement.querySelector('#Knight-rider');

    if (innerBackground) { baseTl.to(innerBackground, { opacity: 0.85, duration: 2.5, ease: 'sine.inOut', yoyo: true }, 0); }
    if (scanBlip && knightRiderPathElement) {
      gsap.set(knightRiderPathElement, { opacity: 1 });
      const scanPathX_Start = 453; const scanPathWidth = 304;
      const blipWidth = Math.floor(scanPathWidth * 0.15);
      const blipScanStartPos = scanPathX_Start;
      const blipScanEndPos = scanPathX_Start + scanPathWidth - blipWidth;
      gsap.set(scanBlip, { attr: { x: blipScanStartPos, width: blipWidth } });
      baseTl.to(scanBlip, { attr: { x: blipScanEndPos }, duration: 0.7, ease: "sine.inOut", yoyo: true }, 0);
    }
    
    return () => { baseAnimationTimelineRef.current?.kill(); zapAnimationTimelineRef.current?.kill(); };
  }, []); // Runs only once on mount

  // Effect to create/recreate ZAP timeline ONLY when variant changes
  useEffect(() => {
    const svgElement = svgElementRef.current;
    if (!svgElement || animationVariant === undefined || animationVariant < 1 || animationVariant > zapSequences.length) return;
    
    zapAnimationTimelineRef.current?.kill(); // Kill previous
    const currentZapSequence = zapSequences[animationVariant - 1];
    if (!currentZapSequence) return;

    const zapTl = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 1.0 });
    zapAnimationTimelineRef.current = zapTl;
    let currentTime = 0;
    currentZapSequence.forEach((className, classIndex) => {
      const elementsToAnimate = svgElement.querySelectorAll(`.${className}`);
      if (elementsToAnimate.length > 0) {
        zapTl.to(elementsToAnimate, { opacity: 0.4, duration: 1.5, ease: 'power1.inOut', yoyo: true, stagger: 0.05 }, currentTime);
      }
      currentTime += 0.8;
    });
  }, [animationVariant]); // Re-run ONLY if animationVariant changes

  // Master Play/Pause Control useEffect
  useEffect(() => {
    const baseTl = baseAnimationTimelineRef.current;
    const zapTl = zapAnimationTimelineRef.current;
    if (isPlayingAudio) {
        if (baseTl && baseTl.paused()) baseTl.play();
        if (zapTl && zapTl.paused()) zapTl.play();
    } else {
        if (baseTl && baseTl.isActive()) baseTl.pause();
        if (zapTl && zapTl.isActive()) zapTl.pause();
    }
  }, [isPlayingAudio]);

  useEffect(() => {
    const audioElement = audioRef.current; if (!audioElement) return;
    if (audioUrl) { if (audioElement.src !== audioUrl) { audioElement.src = audioUrl; setIsAudioLoaded(false); setIsPlayingAudio(false); }
    } else { audioElement.pause(); audioElement.src = ""; setIsPlayingAudio(false); setIsAudioLoaded(false); }
  }, [audioUrl]);

  useEffect(() => {
    const audioElement = audioRef.current; if (!audioElement) return;
    const handleCanPlayThrough = () => setIsAudioLoaded(true);
    const handleAudioPlayEvent = () => { if (!isPlayingAudio) setIsPlayingAudio(true); };
    const handleAudioPauseEvent = () => { if (isPlayingAudio) setIsPlayingAudio(false); };
    const handleAudioEnded = () => { setIsPlayingAudio(false); if (onPlaybackEnd) onPlaybackEnd(); };
    audioElement.addEventListener('canplaythrough', handleCanPlayThrough);
    audioElement.addEventListener('play', handleAudioPlayEvent);
    audioElement.addEventListener('pause', handleAudioPauseEvent);
    audioElement.addEventListener('ended', handleAudioEnded);
    return () => { /* remove listeners */ };
  }, [onPlaybackEnd, isPlayingAudio]);

  const togglePlayPause = () => {
    if (!audioUrl || !isAudioLoaded) return;
    const audioElement = audioRef.current; 
    if (audioElement) { if (isPlayingAudio) audioElement.pause(); else audioElement.play().catch(console.error); }
  };

  return (
    <div className="flex flex-col items-center space-y-4 my-4">
      <div ref={svgContainerRef} style={{ width: typeof width === 'number' ? `${width}px` : width, height: typeof height === 'number' ? `${height}px` : height, overflow: 'visible' }}>
        <MyActualLogo width="100%" height="100%" /> 
      </div>
      <audio ref={audioRef} />
      {audioUrl && (
        <Button onClick={togglePlayPause} disabled={!isAudioLoaded} variant="secondary" className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold shadow-lg px-6 py-3 text-base rounded-md">
          {isPlayingAudio ? 'Pause AI Narration' : playButtonText}
        </Button>
      )}
      {showLoadingText && audioUrl && !isAudioLoaded && <p className="text-sm text-primary animate-pulse mt-2">Preparing audio...</p>}
    </div>
  );
};
export default AnimatedLogoWithAudio;