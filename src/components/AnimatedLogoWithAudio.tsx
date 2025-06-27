// FILE: src/components/AnimatedLogoWithAudio.tsx
// CORRECTED: Uses a single master timeline to ensure constant base animations + layered Zaps.

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
  audioUrl, onPlaybackEnd, width = 180, height = 180, 
  playButtonText = "Play Narration", showLoadingText = false, animationVariant, 
  forceIsPlaying, onTogglePlay
}) => {
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const svgContainerRef = useRef<HTMLDivElement | null>(null); 
  const masterTimelineRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    if (!svgContainerRef.current || animationVariant === undefined || animationVariant < 1 || animationVariant > zapSequences.length) return;
    
    const svgElement = svgContainerRef.current.firstChild as SVGSVGElement | null;
    if (!svgElement || typeof svgElement.querySelector !== 'function') return;

    masterTimelineRef.current?.kill();
    const masterTl = gsap.timeline({ paused: true, repeat: -1 });
    masterTimelineRef.current = masterTl;

    console.log(`AnimatedLogo: Building master timeline for variant ${animationVariant}`);
    
    const innerBackground = svgElement.querySelector('#Inner-background');
    const scanBlip = svgElement.querySelector('#scanBlip');
    const knightRiderPathElement = svgElement.querySelector('#Knight-rider');

    if (innerBackground) {
      masterTl.to(innerBackground, { opacity: 0.8, duration: 2.5, ease: 'sine.inOut', yoyo: true }, 0);
    }
    if (scanBlip && knightRiderPathElement) {
        gsap.set(knightRiderPathElement, { opacity: 1 });
        const scanPathX_Start = 453; const scanPathWidth = 304;
        const blipWidth = Math.floor(scanPathWidth * 0.20);
        const blipScanStartPos = scanPathX_Start;
        const blipScanEndPos = scanPathX_Start + scanPathWidth - blipWidth;
        gsap.set(scanBlip, { attr: { x: blipScanStartPos, width: blipWidth } });
        masterTl.to(scanBlip, { attr: { x: blipScanEndPos }, duration: 0.7, ease: "none", yoyo: true }, 0);
    }

    const currentZapSequence = zapSequences[animationVariant - 1];
    if (currentZapSequence) {
        let zapTime = 0.2; 
        currentZapSequence.forEach((className) => {
          const filteredElements = Array.from(svgElement.querySelectorAll(`.${className}`)).filter(el => el.id !== 'Inner-background' && el.id !== 'Knight-rider' && el.id !== 'scanBlip');
          if (filteredElements.length > 0) { 
            masterTl.to(filteredElements, { opacity: 0.5, duration: 1.2, ease: 'power1.inOut', yoyo: true, stagger: 0.08 }, zapTime); 
          }
          zapTime += 0.6;
        });
    }
    return () => { masterTimelineRef.current?.kill(); };
  }, [animationVariant]); 

  useEffect(() => {
    const masterTl = masterTimelineRef.current;
    const audioElement = audioRef.current;
    if (!masterTl || !audioElement) return;

    if (forceIsPlaying) {
      if (masterTl.paused()) masterTl.play();
      if (audioElement.paused) audioElement.play().catch(console.error);
    } else {
      if (masterTl.isActive()) masterTl.pause();
      if (!audioElement.paused) audioElement.pause();
    }
  }, [forceIsPlaying]);

  useEffect(() => {
    const audioElement = audioRef.current; if (!audioElement) return;
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
    const audioElement = audioRef.current; if (!audioElement) return;
    const handleCanPlayThrough = () => setIsAudioLoaded(true);
    const handleAudioEnded = () => { if (onTogglePlay) onTogglePlay(); }; // Call parent's toggle to set currently playing to null
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
        <Button 
            onClick={onTogglePlay} 
            disabled={!isAudioLoaded} 
            variant="secondary" 
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold shadow-lg px-6 py-3 text-base rounded-md"
        >
          {forceIsPlaying ? 'Pause AI Narration' : playButtonText}
        </Button>
      )}
      {showLoadingText && audioUrl && !isAudioLoaded && <p className="text-sm text-primary animate-pulse mt-2">Preparing audio...</p>}
    </div>
  );
};
export default AnimatedLogoWithAudio;